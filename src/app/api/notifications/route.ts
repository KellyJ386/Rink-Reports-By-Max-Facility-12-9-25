import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  sendEmailNotification,
  sendIncidentNotification,
  sendThinIceAlert,
  sendRefrigerationAlert,
  sendAirQualityAlert,
  AlertNotification,
  NotificationRecipient,
} from '@/lib/notifications';

// POST - Send notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    // Get base URL for action links
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

    // Get facility to determine recipients
    const facilityId = data.facilityId;
    if (!facilityId) {
      return NextResponse.json({ error: 'Facility ID required' }, { status: 400 });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        users: {
          where: {
            role: { in: ['SUPER_ADMIN', 'FACILITY_ADMIN', 'MANAGER'] },
          },
          select: {
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }

    const recipients: NotificationRecipient[] = facility.users.map((u) => ({
      email: u.email,
      name: u.name || undefined,
      phone: u.phone || undefined,
    }));

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recipients configured for this facility' },
        { status: 400 }
      );
    }

    let result: { success: boolean; error?: string };

    switch (type) {
      case 'INCIDENT':
        result = await sendIncidentNotification(
          recipients,
          {
            id: data.incidentId,
            type: data.incidentType,
            severity: data.severity,
            facilityName: facility.name,
            rinkName: data.rinkName,
            description: data.description,
            occurredAt: new Date(data.occurredAt),
            location: data.location,
          },
          baseUrl
        );
        break;

      case 'ICE_THIN':
        result = await sendThinIceAlert(
          recipients,
          {
            facilityName: facility.name,
            rinkName: data.rinkName,
            minDepth: data.minDepth,
            threshold: data.threshold || 0.75,
            affectedPoints: data.affectedPoints || [],
          },
          baseUrl
        );
        break;

      case 'REFRIGERATION':
        result = await sendRefrigerationAlert(
          recipients,
          {
            facilityName: facility.name,
            metric: data.metric,
            value: data.value,
            threshold: data.threshold,
            unit: data.unit || '',
          },
          baseUrl
        );
        break;

      case 'AIR_QUALITY':
        result = await sendAirQualityAlert(
          recipients,
          {
            facilityName: facility.name,
            rinkName: data.rinkName,
            metric: data.metric,
            value: data.value,
            threshold: data.threshold,
            unit: data.unit || 'ppm',
          },
          baseUrl
        );
        break;

      case 'CUSTOM':
        const alert: AlertNotification = {
          type: data.alertType || 'INFO',
          severity: data.severity || 'INFO',
          facilityName: facility.name,
          rinkName: data.rinkName,
          message: data.message,
          details: data.details,
          actionUrl: data.actionUrl,
        };
        result = await sendEmailNotification(recipients, alert);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    // Log notification in database
    await prisma.notificationLog.create({
      data: {
        facilityId,
        type,
        severity: data.severity || 'INFO',
        message: data.message || data.description || `${type} notification`,
        recipientCount: recipients.length,
        success: result.success,
        error: result.error,
        sentBy: session.user.id,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// GET - Get notification history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (facilityId) where.facilityId = facilityId;

    const notifications = await prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        facility: { select: { name: true } },
        sentByUser: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
