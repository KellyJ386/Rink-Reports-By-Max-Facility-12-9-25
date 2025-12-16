import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for incident report
const incidentReportSchema = z.object({
  facilityId: z.string(),
  incidentTime: z.string(),
  location: z.string().min(1),
  incidentType: z.string().min(1),
  description: z.string().min(10),
  severityLevel: z.enum(['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL']),
  ambulanceCalled: z.boolean().default(false),
  injuredName: z.string().optional(),
  injuredContact: z.string().optional(),
  injuredAge: z.number().optional(),
  bodyDiagramData: z.object({
    injuries: z.array(z.object({
      id: z.string(),
      bodyPart: z.string(),
      x: z.number(),
      y: z.number(),
      description: z.string(),
    })),
  }).optional(),
  witnesses: z.array(z.object({
    name: z.string(),
    contact: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
});

// GET - List incident reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const severityLevel = searchParams.get('severity');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};

    if (facilityId) where.facilityId = facilityId;
    if (severityLevel) where.severityLevel = severityLevel;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.incidentTime = {};
      if (startDate) (where.incidentTime as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.incidentTime as Record<string, Date>).lte = new Date(endDate);
    }

    const [incidents, total] = await Promise.all([
      prisma.incidentReport.findMany({
        where,
        include: {
          facility: {
            select: { id: true, name: true },
          },
          reportedBy: {
            select: { id: true, name: true, email: true },
          },
          attachments: true,
        },
        orderBy: { incidentTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.incidentReport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: incidents,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

// POST - Create a new incident report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = incidentReportSchema.parse(body);

    // Create the incident report
    const incident = await prisma.incidentReport.create({
      data: {
        facilityId: validatedData.facilityId,
        reportedById: session.user.id,
        incidentTime: new Date(validatedData.incidentTime),
        location: validatedData.location,
        incidentType: validatedData.incidentType,
        description: validatedData.description,
        severityLevel: validatedData.severityLevel,
        ambulanceCalled: validatedData.ambulanceCalled,
        injuredName: validatedData.injuredName,
        injuredContact: validatedData.injuredContact,
        injuredAge: validatedData.injuredAge,
        bodyDiagramData: validatedData.bodyDiagramData,
        witnesses: validatedData.witnesses,
      },
      include: {
        facility: true,
        reportedBy: {
          select: { id: true, name: true },
        },
      },
    });

    // If ambulance was called or severity is SERIOUS/CRITICAL, notify GM immediately
    if (
      validatedData.ambulanceCalled ||
      ['SERIOUS', 'CRITICAL'].includes(validatedData.severityLevel)
    ) {
      await sendGMNotification(incident);

      // Update incident to mark GM as notified
      await prisma.incidentReport.update({
        where: { id: incident.id },
        data: {
          gmNotified: true,
          gmNotifiedAt: new Date(),
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'IncidentReport',
        entityId: incident.id,
        newValues: {
          incidentType: incident.incidentType,
          severityLevel: incident.severityLevel,
          ambulanceCalled: incident.ambulanceCalled,
        },
      },
    });

    // Create alert for facility managers
    await prisma.alert.create({
      data: {
        facilityId: validatedData.facilityId,
        alertType: 'INCIDENT_REPORTED',
        severity: validatedData.severityLevel,
        message: `New ${validatedData.severityLevel.toLowerCase()} incident reported: ${validatedData.incidentType} at ${validatedData.location}${validatedData.ambulanceCalled ? ' (Ambulance called)' : ''}`,
      },
    });

    return NextResponse.json({ success: true, data: incident }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}

// Function to send SMS notification to GM
async function sendGMNotification(incident: {
  id: string;
  incidentType: string;
  severityLevel: string;
  location: string;
  ambulanceCalled: boolean;
  facility: { id: string; name: string };
}) {
  try {
    // Get facility admins/managers with phone numbers
    const managers = await prisma.facilityUser.findMany({
      where: {
        facilityId: incident.facility.id,
        role: { in: ['FACILITY_ADMIN', 'MANAGER'] },
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    // Create in-app notifications for all managers
    await prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.userId,
        type: 'INCIDENT' as const,
        title: `${incident.severityLevel} Incident at ${incident.facility.name}`,
        message: `${incident.incidentType} reported at ${incident.location}${incident.ambulanceCalled ? '. AMBULANCE CALLED.' : ''}`,
        link: `/dashboard/incidents/${incident.id}`,
      })),
    });

    // In production, this would send actual SMS via Twilio/SendGrid
    // For now, we'll log the intended notifications
    const phoneNumbers = managers
      .filter((m) => m.user.phone)
      .map((m) => m.user.phone);

    if (phoneNumbers.length > 0) {
      console.log('SMS Notification would be sent to:', phoneNumbers);
      console.log('Message:', generateSMSMessage(incident));

      // Example Twilio integration (would be enabled in production):
      // await sendTwilioSMS(phoneNumbers, generateSMSMessage(incident));
    }

    // Also send email notifications
    const emails = managers.map((m) => m.user.email).filter(Boolean);
    if (emails.length > 0) {
      console.log('Email notification would be sent to:', emails);
      // await sendEmailNotification(emails, incident);
    }
  } catch (error) {
    console.error('Error sending GM notification:', error);
    // Don't throw - we don't want notification failure to fail the incident creation
  }
}

function generateSMSMessage(incident: {
  incidentType: string;
  severityLevel: string;
  location: string;
  ambulanceCalled: boolean;
  facility: { name: string };
}): string {
  return `MFO ALERT: ${incident.severityLevel} incident at ${incident.facility.name}. ${incident.incidentType} at ${incident.location}.${incident.ambulanceCalled ? ' AMBULANCE CALLED.' : ''} Log in to view details.`;
}
