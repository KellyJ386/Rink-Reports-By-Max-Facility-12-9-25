import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/organization/dashboard - Get organization-wide dashboard stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin or manager permission
    if (!hasPermission(session.user.role, 'admin', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Get facilities for this organization or all if admin
    const facilityWhere = organizationId
      ? { organizationId }
      : {};

    const facilities = await prisma.facility.findMany({
      where: { ...facilityWhere, isActive: true },
      select: { id: true, name: true, organizationId: true },
    });

    const facilityIds = facilities.map((f) => f.id);

    // Get time ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);

    // Parallel queries for all stats
    const [
      // Facility counts
      totalFacilities,
      activeFacilities,

      // User stats
      totalUsers,
      activeUsers,

      // Incident stats
      totalIncidents,
      openIncidents,
      incidentsThisMonth,

      // Alert stats
      totalAlerts,
      unacknowledgedAlerts,
      alertsThisWeek,

      // Form stats
      totalSubmissions,
      pendingSubmissions,
      submissionsThisMonth,

      // Ice depth readings
      iceDepthReadingsToday,
      iceDepthAverages,

      // Air quality alerts
      airQualityAlerts,

      // Schedule stats
      shiftsThisWeek,
      pendingTimeOff,

      // Per-facility stats for comparison
      facilityStats,
    ] = await Promise.all([
      // Facility counts
      prisma.facility.count({
        where: organizationId ? { organizationId } : {},
      }),
      prisma.facility.count({
        where: { ...(organizationId ? { organizationId } : {}), isActive: true },
      }),

      // User stats
      prisma.facilityUser.count({
        where: { facilityId: { in: facilityIds } },
      }),
      prisma.facilityUser.count({
        where: {
          facilityId: { in: facilityIds },
          user: { isActive: true },
        },
      }),

      // Incident stats
      prisma.incidentReport.count({
        where: { facilityId: { in: facilityIds } },
      }),
      prisma.incidentReport.count({
        where: {
          facilityId: { in: facilityIds },
          status: { in: ['OPEN', 'UNDER_INVESTIGATION'] },
        },
      }),
      prisma.incidentReport.count({
        where: {
          facilityId: { in: facilityIds },
          createdAt: { gte: thisMonthStart },
        },
      }),

      // Alert stats
      prisma.alert.count({
        where: { facilityId: { in: facilityIds } },
      }),
      prisma.alert.count({
        where: {
          facilityId: { in: facilityIds },
          isAcknowledged: false,
        },
      }),
      prisma.alert.count({
        where: {
          facilityId: { in: facilityIds },
          createdAt: { gte: thisWeekStart },
        },
      }),

      // Form stats
      prisma.formSubmission.count({
        where: { facilityId: { in: facilityIds } },
      }),
      prisma.formSubmission.count({
        where: {
          facilityId: { in: facilityIds },
          status: 'PENDING',
        },
      }),
      prisma.formSubmission.count({
        where: {
          facilityId: { in: facilityIds },
          createdAt: { gte: thisMonthStart },
        },
      }),

      // Ice depth readings today
      prisma.iceDepthReading.count({
        where: {
          rink: { facilityId: { in: facilityIds } },
          recordedAt: { gte: today },
        },
      }),

      // Ice depth averages by facility
      prisma.iceDepthReading.groupBy({
        by: ['rinkId'],
        where: {
          rink: { facilityId: { in: facilityIds } },
          recordedAt: { gte: last30Days },
        },
        _avg: { averageDepth: true },
      }),

      // Air quality threshold exceeded
      prisma.airQualityReading.count({
        where: {
          facilityId: { in: facilityIds },
          createdAt: { gte: thisWeekStart },
          OR: [
            { co2Level: { gt: 1000 } },
            { coLevel: { gt: 25 } },
          ],
        },
      }),

      // Schedule shifts this week
      prisma.scheduleShift.count({
        where: {
          schedule: { facilityId: { in: facilityIds } },
          shiftDate: { gte: thisWeekStart, lte: new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Pending time off requests
      prisma.timeOffRequest.count({
        where: {
          status: 'PENDING',
        },
      }),

      // Per-facility breakdown
      Promise.all(
        facilities.map(async (facility) => {
          const [incidents, alerts, submissions, users] = await Promise.all([
            prisma.incidentReport.count({
              where: {
                facilityId: facility.id,
                status: { in: ['OPEN', 'UNDER_INVESTIGATION'] },
              },
            }),
            prisma.alert.count({
              where: {
                facilityId: facility.id,
                isAcknowledged: false,
              },
            }),
            prisma.formSubmission.count({
              where: {
                facilityId: facility.id,
                status: 'PENDING',
              },
            }),
            prisma.facilityUser.count({
              where: { facilityId: facility.id },
            }),
          ]);

          return {
            id: facility.id,
            name: facility.name,
            openIncidents: incidents,
            unacknowledgedAlerts: alerts,
            pendingSubmissions: submissions,
            totalUsers: users,
          };
        })
      ),
    ]);

    return NextResponse.json({
      summary: {
        facilities: {
          total: totalFacilities,
          active: activeFacilities,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        incidents: {
          total: totalIncidents,
          open: openIncidents,
          thisMonth: incidentsThisMonth,
        },
        alerts: {
          total: totalAlerts,
          unacknowledged: unacknowledgedAlerts,
          thisWeek: alertsThisWeek,
        },
        forms: {
          total: totalSubmissions,
          pending: pendingSubmissions,
          thisMonth: submissionsThisMonth,
        },
        iceDepth: {
          readingsToday: iceDepthReadingsToday,
          facilitiesWithReadings: iceDepthAverages.length,
        },
        airQuality: {
          alertsThisWeek: airQualityAlerts,
        },
        scheduling: {
          shiftsThisWeek,
          pendingTimeOff,
        },
      },
      facilityStats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching organization dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization dashboard' },
      { status: 500 }
    );
  }
}
