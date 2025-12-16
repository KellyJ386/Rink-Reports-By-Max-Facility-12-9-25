import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from 'date-fns';

// GET - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');

    // Date ranges
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const yesterday = subDays(today, 1);
    const lastWeekStart = subDays(weekStart, 7);

    // Build facility filter
    const facilityFilter = facilityId ? { facilityId } : {};

    // Parallel queries for all stats
    const [
      // Form submissions
      totalSubmissions,
      weekSubmissions,
      lastWeekSubmissions,
      todaySubmissions,

      // Incidents
      openIncidents,
      yesterdayIncidents,
      weekIncidents,

      // Ice depth readings
      weekIceReadings,
      todayIceReadings,

      // Active alerts
      activeAlerts,
      urgentAlerts,

      // Schedule stats
      weekShifts,
      todayShifts,

      // Recent activity
      recentActivity,
    ] = await Promise.all([
      // Form submissions total
      prisma.formSubmission.count({
        where: facilityFilter,
      }),

      // Week submissions
      prisma.formSubmission.count({
        where: {
          ...facilityFilter,
          submittedAt: { gte: weekStart, lte: weekEnd },
        },
      }),

      // Last week submissions
      prisma.formSubmission.count({
        where: {
          ...facilityFilter,
          submittedAt: { gte: lastWeekStart, lt: weekStart },
        },
      }),

      // Today submissions
      prisma.formSubmission.count({
        where: {
          ...facilityFilter,
          submittedAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      // Open incidents
      prisma.incident.count({
        where: {
          ...facilityFilter,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),

      // Yesterday incidents
      prisma.incident.count({
        where: {
          ...facilityFilter,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
          createdAt: { lt: todayStart },
        },
      }),

      // Week incidents
      prisma.incident.count({
        where: {
          ...facilityFilter,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),

      // Week ice readings
      prisma.iceDepthReading.count({
        where: {
          ...facilityFilter,
          recordedAt: { gte: weekStart, lte: weekEnd },
        },
      }),

      // Today ice readings
      prisma.iceDepthReading.count({
        where: {
          ...facilityFilter,
          recordedAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      // Active alerts
      prisma.alert.count({
        where: {
          ...facilityFilter,
          status: 'ACTIVE',
        },
      }),

      // Urgent alerts
      prisma.alert.count({
        where: {
          ...facilityFilter,
          status: 'ACTIVE',
          severity: { in: ['CRITICAL', 'HIGH'] },
        },
      }),

      // Week shifts
      prisma.scheduleShift.count({
        where: {
          schedule: facilityFilter,
          shiftDate: { gte: weekStart, lte: weekEnd },
          status: { notIn: ['CANCELLED'] },
        },
      }),

      // Today shifts
      prisma.scheduleShift.count({
        where: {
          schedule: facilityFilter,
          shiftDate: { gte: todayStart, lte: todayEnd },
          status: { notIn: ['CANCELLED'] },
        },
      }),

      // Recent activity (combined from multiple tables)
      getRecentActivity(facilityFilter, 10),
    ]);

    // Calculate changes
    const submissionChange = lastWeekSubmissions > 0
      ? Math.round(((weekSubmissions - lastWeekSubmissions) / lastWeekSubmissions) * 100)
      : 0;

    const incidentChange = yesterdayIncidents - openIncidents;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          formsSubmitted: {
            value: totalSubmissions,
            weekValue: weekSubmissions,
            change: submissionChange > 0 ? `+${submissionChange}%` : `${submissionChange}%`,
            changeType: submissionChange >= 0 ? 'positive' : 'negative',
          },
          iceReadings: {
            value: weekIceReadings,
            todayValue: todayIceReadings,
            description: 'This week',
          },
          openIncidents: {
            value: openIncidents,
            change: incidentChange !== 0
              ? `${incidentChange > 0 ? '+' : ''}${incidentChange} from yesterday`
              : 'No change',
            changeType: incidentChange < 0 ? 'positive' : incidentChange > 0 ? 'negative' : 'neutral',
          },
          scheduledShifts: {
            value: weekShifts,
            todayValue: todayShifts,
            description: 'This week',
          },
        },
        alerts: {
          active: activeAlerts,
          urgent: urgentAlerts,
        },
        activity: recentActivity,
        weekSummary: {
          submissions: weekSubmissions,
          incidents: weekIncidents,
          iceReadings: weekIceReadings,
          shifts: weekShifts,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

// Helper to get recent activity across modules
async function getRecentActivity(
  facilityFilter: { facilityId?: string },
  limit: number
) {
  const activities: Array<{
    id: string;
    type: string;
    title: string;
    user: string;
    time: string;
    status: string;
  }> = [];

  // Get recent form submissions
  const submissions = await prisma.formSubmission.findMany({
    where: facilityFilter,
    include: {
      formTemplate: { select: { name: true } },
      submittedBy: { select: { name: true } },
    },
    orderBy: { submittedAt: 'desc' },
    take: 5,
  });

  submissions.forEach((s) => {
    activities.push({
      id: s.id,
      type: 'form',
      title: s.formTemplate?.name || 'Form Submission',
      user: s.submittedBy?.name || 'Unknown',
      time: s.submittedAt.toISOString(),
      status: 'completed',
    });
  });

  // Get recent incidents
  const incidents = await prisma.incident.findMany({
    where: facilityFilter,
    include: {
      reportedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  incidents.forEach((i) => {
    activities.push({
      id: i.id,
      type: 'incident',
      title: `${i.severity} Incident - ${i.incidentType}`,
      user: i.reportedBy?.name || 'Unknown',
      time: i.createdAt.toISOString(),
      status: i.status.toLowerCase(),
    });
  });

  // Get recent ice depth readings
  const readings = await prisma.iceDepthReading.findMany({
    where: facilityFilter,
    include: {
      recordedBy: { select: { name: true } },
    },
    orderBy: { recordedAt: 'desc' },
    take: 5,
  });

  readings.forEach((r) => {
    activities.push({
      id: r.id,
      type: 'ice_depth',
      title: `Ice Depth Reading - ${r.rinkId}`,
      user: r.recordedBy?.name || 'Unknown',
      time: r.recordedAt.toISOString(),
      status: 'completed',
    });
  });

  // Sort by time and return top N
  return activities
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit);
}
