import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const comparisonSchema = z.object({
  facilityIds: z.array(z.string()).min(2).max(10),
  metric: z.enum([
    'ice_depth',
    'incidents',
    'air_quality',
    'refrigeration',
    'forms',
    'alerts',
    'schedules',
  ]),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});

// GET /api/organization/comparison - Compare metrics across facilities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'reports', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const facilityIdsParam = searchParams.get('facilityIds');
    const metric = searchParams.get('metric') || 'ice_depth';
    const period = searchParams.get('period') || 'month';

    if (!facilityIdsParam) {
      return NextResponse.json(
        { error: 'facilityIds parameter is required' },
        { status: 400 }
      );
    }

    const params = comparisonSchema.parse({
      facilityIds: facilityIdsParam.split(','),
      metric,
      period,
    });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (params.period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Get facility details
    const facilities = await prisma.facility.findMany({
      where: { id: { in: params.facilityIds } },
      select: { id: true, name: true },
    });

    const facilityMap = new Map(facilities.map((f) => [f.id, f.name]));

    // Get comparison data based on metric
    let comparisonData: Record<string, unknown>[];

    switch (params.metric) {
      case 'ice_depth':
        comparisonData = await getIceDepthComparison(params.facilityIds, startDate, endDate, facilityMap);
        break;
      case 'incidents':
        comparisonData = await getIncidentComparison(params.facilityIds, startDate, endDate, facilityMap);
        break;
      case 'air_quality':
        comparisonData = await getAirQualityComparison(params.facilityIds, startDate, endDate, facilityMap);
        break;
      case 'refrigeration':
        comparisonData = await getRefrigerationComparison(params.facilityIds, startDate, endDate, facilityMap);
        break;
      case 'forms':
        comparisonData = await getFormsComparison(params.facilityIds, startDate, endDate, facilityMap);
        break;
      case 'alerts':
        comparisonData = await getAlertsComparison(params.facilityIds, startDate, endDate, facilityMap);
        break;
      case 'schedules':
        comparisonData = await getSchedulesComparison(params.facilityIds, startDate, endDate, facilityMap);
        break;
      default:
        return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    return NextResponse.json({
      metric: params.metric,
      period: params.period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      facilities: facilities.map((f) => ({ id: f.id, name: f.name })),
      data: comparisonData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error generating comparison:', error);
    return NextResponse.json(
      { error: 'Failed to generate comparison' },
      { status: 500 }
    );
  }
}

async function getIceDepthComparison(
  facilityIds: string[],
  startDate: Date,
  endDate: Date,
  facilityMap: Map<string, string>
) {
  const readings = await prisma.iceDepthReading.groupBy({
    by: ['rinkId'],
    where: {
      rink: { facilityId: { in: facilityIds } },
      recordedAt: { gte: startDate, lte: endDate },
    },
    _avg: { averageDepth: true, minDepth: true, maxDepth: true },
    _count: true,
  });

  // Get rink to facility mapping
  const rinks = await prisma.rink.findMany({
    where: { id: { in: readings.map((r) => r.rinkId) } },
    select: { id: true, facilityId: true, name: true },
  });

  const rinkMap = new Map(rinks.map((r) => [r.id, r]));

  // Aggregate by facility
  const facilityData: Record<string, { avgDepth: number[]; count: number }> = {};
  for (const reading of readings) {
    const rink = rinkMap.get(reading.rinkId);
    if (!rink) continue;

    if (!facilityData[rink.facilityId]) {
      facilityData[rink.facilityId] = { avgDepth: [], count: 0 };
    }
    if (reading._avg.averageDepth) {
      facilityData[rink.facilityId].avgDepth.push(reading._avg.averageDepth);
    }
    facilityData[rink.facilityId].count += reading._count;
  }

  return facilityIds.map((facilityId) => {
    const data = facilityData[facilityId];
    const avgDepths = data?.avgDepth || [];
    return {
      facilityId,
      facilityName: facilityMap.get(facilityId) || 'Unknown',
      averageDepth: avgDepths.length > 0
        ? avgDepths.reduce((a, b) => a + b, 0) / avgDepths.length
        : null,
      totalReadings: data?.count || 0,
    };
  });
}

async function getIncidentComparison(
  facilityIds: string[],
  startDate: Date,
  endDate: Date,
  facilityMap: Map<string, string>
) {
  const incidents = await prisma.incidentReport.groupBy({
    by: ['facilityId', 'severityLevel'],
    where: {
      facilityId: { in: facilityIds },
      incidentTime: { gte: startDate, lte: endDate },
    },
    _count: true,
  });

  // Aggregate by facility
  const facilityData: Record<string, Record<string, number>> = {};
  for (const incident of incidents) {
    if (!facilityData[incident.facilityId]) {
      facilityData[incident.facilityId] = { MINOR: 0, MODERATE: 0, SERIOUS: 0, CRITICAL: 0 };
    }
    facilityData[incident.facilityId][incident.severityLevel] = incident._count;
  }

  return facilityIds.map((facilityId) => {
    const data = facilityData[facilityId] || { MINOR: 0, MODERATE: 0, SERIOUS: 0, CRITICAL: 0 };
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    return {
      facilityId,
      facilityName: facilityMap.get(facilityId) || 'Unknown',
      total,
      bySeverity: data,
    };
  });
}

async function getAirQualityComparison(
  facilityIds: string[],
  startDate: Date,
  endDate: Date,
  facilityMap: Map<string, string>
) {
  const readings = await prisma.airQualityReading.groupBy({
    by: ['facilityId'],
    where: {
      facilityId: { in: facilityIds },
      createdAt: { gte: startDate, lte: endDate },
    },
    _avg: { co2Level: true, coLevel: true, temperature: true, humidity: true },
    _max: { co2Level: true, coLevel: true },
    _count: true,
  });

  const readingMap = new Map(readings.map((r) => [r.facilityId, r]));

  return facilityIds.map((facilityId) => {
    const data = readingMap.get(facilityId);
    return {
      facilityId,
      facilityName: facilityMap.get(facilityId) || 'Unknown',
      avgCO2: data?._avg.co2Level || null,
      avgCO: data?._avg.coLevel || null,
      maxCO2: data?._max.co2Level || null,
      maxCO: data?._max.coLevel || null,
      avgTemperature: data?._avg.temperature || null,
      avgHumidity: data?._avg.humidity || null,
      totalReadings: data?._count || 0,
    };
  });
}

async function getRefrigerationComparison(
  facilityIds: string[],
  startDate: Date,
  endDate: Date,
  facilityMap: Map<string, string>
) {
  const readings = await prisma.refrigerationLog.groupBy({
    by: ['facilityId'],
    where: {
      facilityId: { in: facilityIds },
      recordedAt: { gte: startDate, lte: endDate },
    },
    _avg: {
      brineSupply: true,
      brineReturn: true,
      compressor1Suction: true,
      compressor1Discharge: true,
    },
    _count: true,
  });

  const readingMap = new Map(readings.map((r) => [r.facilityId, r]));

  return facilityIds.map((facilityId) => {
    const data = readingMap.get(facilityId);
    return {
      facilityId,
      facilityName: facilityMap.get(facilityId) || 'Unknown',
      avgBrineSupply: data?._avg.brineSupply || null,
      avgBrineReturn: data?._avg.brineReturn || null,
      avgSuctionPressure: data?._avg.compressor1Suction || null,
      avgDischargePressure: data?._avg.compressor1Discharge || null,
      totalReadings: data?._count || 0,
    };
  });
}

async function getFormsComparison(
  facilityIds: string[],
  startDate: Date,
  endDate: Date,
  facilityMap: Map<string, string>
) {
  const submissions = await prisma.formSubmission.groupBy({
    by: ['facilityId', 'status'],
    where: {
      facilityId: { in: facilityIds },
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
  });

  // Aggregate by facility
  const facilityData: Record<string, Record<string, number>> = {};
  for (const sub of submissions) {
    if (!facilityData[sub.facilityId]) {
      facilityData[sub.facilityId] = { PENDING: 0, APPROVED: 0, REJECTED: 0, DRAFT: 0 };
    }
    facilityData[sub.facilityId][sub.status] = sub._count;
  }

  return facilityIds.map((facilityId) => {
    const data = facilityData[facilityId] || { PENDING: 0, APPROVED: 0, REJECTED: 0, DRAFT: 0 };
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    return {
      facilityId,
      facilityName: facilityMap.get(facilityId) || 'Unknown',
      total,
      byStatus: data,
      completionRate: total > 0 ? ((data.APPROVED || 0) / total) * 100 : 0,
    };
  });
}

async function getAlertsComparison(
  facilityIds: string[],
  startDate: Date,
  endDate: Date,
  facilityMap: Map<string, string>
) {
  const alerts = await prisma.alert.groupBy({
    by: ['facilityId', 'severity'],
    where: {
      facilityId: { in: facilityIds },
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
  });

  // Aggregate by facility
  const facilityData: Record<string, Record<string, number>> = {};
  for (const alert of alerts) {
    if (!facilityData[alert.facilityId]) {
      facilityData[alert.facilityId] = { MINOR: 0, MODERATE: 0, SERIOUS: 0, CRITICAL: 0 };
    }
    facilityData[alert.facilityId][alert.severity] = alert._count;
  }

  // Get acknowledgment rates
  const ackRates = await prisma.alert.groupBy({
    by: ['facilityId'],
    where: {
      facilityId: { in: facilityIds },
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { _all: true, isAcknowledged: true },
  });

  const ackMap = new Map(ackRates.map((a) => [a.facilityId, a]));

  return facilityIds.map((facilityId) => {
    const data = facilityData[facilityId] || { MINOR: 0, MODERATE: 0, SERIOUS: 0, CRITICAL: 0 };
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    const ackData = ackMap.get(facilityId);
    return {
      facilityId,
      facilityName: facilityMap.get(facilityId) || 'Unknown',
      total,
      bySeverity: data,
      acknowledgedCount: ackData?._count.isAcknowledged || 0,
      acknowledgmentRate: total > 0
        ? ((ackData?._count.isAcknowledged || 0) / total) * 100
        : 0,
    };
  });
}

async function getSchedulesComparison(
  facilityIds: string[],
  startDate: Date,
  endDate: Date,
  facilityMap: Map<string, string>
) {
  const shifts = await prisma.scheduleShift.groupBy({
    by: ['status'],
    where: {
      schedule: { facilityId: { in: facilityIds } },
      shiftDate: { gte: startDate, lte: endDate },
    },
    _count: true,
  });

  // Get per-facility data
  const facilityShifts = await Promise.all(
    facilityIds.map(async (facilityId) => {
      const [total, filled, open] = await Promise.all([
        prisma.scheduleShift.count({
          where: {
            schedule: { facilityId },
            shiftDate: { gte: startDate, lte: endDate },
          },
        }),
        prisma.scheduleShift.count({
          where: {
            schedule: { facilityId },
            shiftDate: { gte: startDate, lte: endDate },
            status: 'ASSIGNED',
          },
        }),
        prisma.scheduleShift.count({
          where: {
            schedule: { facilityId },
            shiftDate: { gte: startDate, lte: endDate },
            status: 'OPEN',
          },
        }),
      ]);

      return {
        facilityId,
        facilityName: facilityMap.get(facilityId) || 'Unknown',
        totalShifts: total,
        filledShifts: filled,
        openShifts: open,
        fillRate: total > 0 ? (filled / total) * 100 : 0,
      };
    })
  );

  return facilityShifts;
}
