import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

const reportTypes = [
  'ice_depth',
  'incidents',
  'air_quality',
  'refrigeration',
  'schedules',
  'forms',
  'alerts',
] as const;

const createScheduledReportSchema = z.object({
  facilityId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  reportType: z.enum(reportTypes),
  schedule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).default('06:00'),
  exportFormat: z.enum(['csv', 'json']).default('csv'),
  includeCharts: z.boolean().default(false),
  recipients: z.array(z.string().email()).min(1),
  emailSubject: z.string().max(200).optional(),
  emailBody: z.string().max(1000).optional(),
  dateRangeDays: z.number().min(1).max(365).default(7),
  isActive: z.boolean().default(true),
});

// GET /api/reports/scheduled - List scheduled reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user.role, 'reports', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const scheduledReports = await prisma.scheduledReport.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
          take: 5,
          orderBy: { generatedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(scheduledReports);
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports/scheduled - Create scheduled report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user.role, 'reports', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createScheduledReportSchema.parse(body);

    // Validate schedule-specific requirements
    if (validatedData.schedule === 'WEEKLY' && validatedData.dayOfWeek === undefined) {
      return NextResponse.json(
        { error: 'dayOfWeek is required for weekly reports' },
        { status: 400 }
      );
    }

    if (validatedData.schedule === 'MONTHLY' && validatedData.dayOfMonth === undefined) {
      return NextResponse.json(
        { error: 'dayOfMonth is required for monthly reports' },
        { status: 400 }
      );
    }

    // Verify facility access
    const facilityUser = await prisma.facilityUser.findFirst({
      where: {
        userId: session.user.id,
        facilityId: validatedData.facilityId,
      },
    });

    if (!facilityUser && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have access to this facility' },
        { status: 403 }
      );
    }

    const scheduledReport = await prisma.scheduledReport.create({
      data: {
        facilityId: validatedData.facilityId,
        createdById: session.user.id,
        name: validatedData.name,
        description: validatedData.description,
        reportType: validatedData.reportType,
        schedule: validatedData.schedule,
        dayOfWeek: validatedData.dayOfWeek,
        dayOfMonth: validatedData.dayOfMonth,
        timeOfDay: validatedData.timeOfDay,
        exportFormat: validatedData.exportFormat,
        includeCharts: validatedData.includeCharts,
        recipients: validatedData.recipients,
        emailSubject: validatedData.emailSubject,
        emailBody: validatedData.emailBody,
        dateRangeDays: validatedData.dateRangeDays,
        isActive: validatedData.isActive,
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(scheduledReport, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled report' },
      { status: 500 }
    );
  }
}
