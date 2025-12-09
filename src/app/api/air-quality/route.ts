import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Configurable thresholds (could be stored in DB per facility)
const THRESHOLDS = {
  CO2_WARNING: 800,
  CO2_DANGER: 1000,
  CO_WARNING: 9,
  CO_DANGER: 35,
  TEMP_LOW: 55,
  TEMP_HIGH: 75,
  HUMIDITY_HIGH: 70,
};

// Schema for air quality log
const airQualityLogSchema = z.object({
  facilityId: z.string(),
  location: z.string().min(1),
  co2Level: z.number().optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  coLevel: z.number().optional(),
  notes: z.string().optional(),
});

// GET - List air quality logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const location = searchParams.get('location');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const thresholdExceeded = searchParams.get('thresholdExceeded');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};

    if (facilityId) where.facilityId = facilityId;
    if (location) where.location = location;
    if (thresholdExceeded !== null) {
      where.thresholdExceeded = thresholdExceeded === 'true';
    }

    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) (where.recordedAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.recordedAt as Record<string, Date>).lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.airQualityLog.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.airQualityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching air quality logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch air quality logs' },
      { status: 500 }
    );
  }
}

// POST - Create a new air quality log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = airQualityLogSchema.parse(body);

    // Check thresholds
    const thresholdExceeded = checkThresholds(validatedData);
    const alerts = generateAlerts(validatedData);

    // Create the log
    const log = await prisma.airQualityLog.create({
      data: {
        facilityId: validatedData.facilityId,
        recordedById: session.user.id,
        location: validatedData.location,
        co2Level: validatedData.co2Level,
        temperature: validatedData.temperature,
        humidity: validatedData.humidity,
        coLevel: validatedData.coLevel,
        thresholdExceeded,
        alertSent: alerts.length > 0,
        notes: validatedData.notes,
      },
    });

    // Create alerts if thresholds exceeded
    for (const alert of alerts) {
      await prisma.alert.create({
        data: {
          facilityId: validatedData.facilityId,
          alertType: alert.type,
          severity: alert.severity,
          message: alert.message,
          threshold: alert.threshold,
          actualValue: alert.actualValue,
        },
      });
    }

    // If CO2 or CO is at danger levels, send notification to managers
    if (alerts.some((a) => a.severity === 'SERIOUS' || a.severity === 'CRITICAL')) {
      await createNotificationsForManagers(validatedData.facilityId, alerts);
    }

    return NextResponse.json({
      success: true,
      data: log,
      alerts: alerts.length > 0 ? alerts : undefined,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating air quality log:', error);
    return NextResponse.json(
      { error: 'Failed to create air quality log' },
      { status: 500 }
    );
  }
}

function checkThresholds(data: z.infer<typeof airQualityLogSchema>): boolean {
  if (data.co2Level && data.co2Level > THRESHOLDS.CO2_WARNING) return true;
  if (data.coLevel && data.coLevel > THRESHOLDS.CO_WARNING) return true;
  if (data.temperature && (data.temperature < THRESHOLDS.TEMP_LOW || data.temperature > THRESHOLDS.TEMP_HIGH)) return true;
  if (data.humidity && data.humidity > THRESHOLDS.HUMIDITY_HIGH) return true;
  return false;
}

interface AlertInfo {
  type: string;
  severity: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  message: string;
  threshold: number;
  actualValue: number;
}

function generateAlerts(data: z.infer<typeof airQualityLogSchema>): AlertInfo[] {
  const alerts: AlertInfo[] = [];

  if (data.co2Level) {
    if (data.co2Level > THRESHOLDS.CO2_DANGER) {
      alerts.push({
        type: 'CO2_HIGH',
        severity: 'SERIOUS',
        message: `CO₂ level is dangerously high at ${data.co2Level} ppm in ${data.location}. Threshold: ${THRESHOLDS.CO2_DANGER} ppm. Immediate ventilation required.`,
        threshold: THRESHOLDS.CO2_DANGER,
        actualValue: data.co2Level,
      });
    } else if (data.co2Level > THRESHOLDS.CO2_WARNING) {
      alerts.push({
        type: 'CO2_ELEVATED',
        severity: 'MODERATE',
        message: `CO₂ level is elevated at ${data.co2Level} ppm in ${data.location}. Threshold: ${THRESHOLDS.CO2_WARNING} ppm.`,
        threshold: THRESHOLDS.CO2_WARNING,
        actualValue: data.co2Level,
      });
    }
  }

  if (data.coLevel) {
    if (data.coLevel > THRESHOLDS.CO_DANGER) {
      alerts.push({
        type: 'CO_CRITICAL',
        severity: 'CRITICAL',
        message: `CRITICAL: Carbon monoxide at ${data.coLevel} ppm in ${data.location}. EVACUATE AREA. Call emergency services.`,
        threshold: THRESHOLDS.CO_DANGER,
        actualValue: data.coLevel,
      });
    } else if (data.coLevel > THRESHOLDS.CO_WARNING) {
      alerts.push({
        type: 'CO_HIGH',
        severity: 'SERIOUS',
        message: `Carbon monoxide elevated at ${data.coLevel} ppm in ${data.location}. Investigate source immediately.`,
        threshold: THRESHOLDS.CO_WARNING,
        actualValue: data.coLevel,
      });
    }
  }

  return alerts;
}

async function createNotificationsForManagers(
  facilityId: string,
  alerts: AlertInfo[]
) {
  // Get all managers and admins for this facility
  const facilityUsers = await prisma.facilityUser.findMany({
    where: {
      facilityId,
      role: { in: ['FACILITY_ADMIN', 'MANAGER', 'SUPER_ADMIN'] },
      isActive: true,
    },
    select: { userId: true },
  });

  const criticalAlert = alerts.find(
    (a) => a.severity === 'CRITICAL' || a.severity === 'SERIOUS'
  );

  if (criticalAlert) {
    await prisma.notification.createMany({
      data: facilityUsers.map((fu) => ({
        userId: fu.userId,
        type: 'ALERT' as const,
        title: `Air Quality Alert: ${criticalAlert.type.replace('_', ' ')}`,
        message: criticalAlert.message,
        link: '/dashboard/air-quality',
      })),
    });
  }
}
