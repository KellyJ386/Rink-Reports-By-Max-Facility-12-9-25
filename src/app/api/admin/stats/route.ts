import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay } from 'date-fns';

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view admin stats
    const userRole = (session.user as { role?: string }).role;
    if (!['SUPER_ADMIN', 'FACILITY_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const weekAgo = subDays(today, 7);
    const twoWeeksAgo = subDays(today, 14);

    // Fetch all stats in parallel
    const [
      // User stats
      totalUsers,
      activeUsers,
      usersThisWeek,
      usersLastWeek,
      usersByRole,

      // Facility stats
      totalFacilities,
      facilitiesThisWeek,
      facilitiesLastWeek,

      // Form stats
      totalFormSubmissions,
      submissionsThisWeek,
      submissionsLastWeek,

      // Incident stats
      openIncidents,
      incidentsThisWeek,
      incidentsLastWeek,

      // Recent audit logs for activity
      recentAuditLogs,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users
      prisma.user.count({ where: { isActive: true } }),

      // Users created this week
      prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),

      // Users created last week
      prisma.user.count({
        where: {
          createdAt: { gte: twoWeeksAgo, lt: weekAgo },
        },
      }),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),

      // Total facilities
      prisma.facility.count(),

      // Facilities this week
      prisma.facility.count({
        where: { createdAt: { gte: weekAgo } },
      }),

      // Facilities last week
      prisma.facility.count({
        where: {
          createdAt: { gte: twoWeeksAgo, lt: weekAgo },
        },
      }),

      // Total form submissions
      prisma.formSubmission.count(),

      // Form submissions this week
      prisma.formSubmission.count({
        where: { submittedAt: { gte: weekAgo } },
      }),

      // Form submissions last week
      prisma.formSubmission.count({
        where: {
          submittedAt: { gte: twoWeeksAgo, lt: weekAgo },
        },
      }),

      // Open incidents
      prisma.incident.count({
        where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      }),

      // Incidents this week
      prisma.incident.count({
        where: { createdAt: { gte: weekAgo } },
      }),

      // Incidents last week
      prisma.incident.count({
        where: {
          createdAt: { gte: twoWeeksAgo, lt: weekAgo },
        },
      }),

      // Recent audit logs
      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          resource: true,
          resourceName: true,
          userName: true,
          timestamp: true,
          outcome: true,
        },
      }),
    ]);

    // Calculate changes
    const userChange = usersLastWeek > 0
      ? Math.round(((usersThisWeek - usersLastWeek) / usersLastWeek) * 100)
      : usersThisWeek > 0 ? 100 : 0;

    const facilityChange = facilitiesThisWeek - facilitiesLastWeek;

    const submissionChange = submissionsLastWeek > 0
      ? Math.round(((submissionsThisWeek - submissionsLastWeek) / submissionsLastWeek) * 100)
      : submissionsThisWeek > 0 ? 100 : 0;

    const incidentChange = incidentsLastWeek > 0
      ? Math.round(((incidentsThisWeek - incidentsLastWeek) / incidentsLastWeek) * 100)
      : incidentsThisWeek > 0 ? 100 : 0;

    // Transform users by role to object
    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        stats: [
          {
            name: 'Total Users',
            value: totalUsers.toLocaleString(),
            activeCount: activeUsers,
            change: userChange > 0 ? `+${userChange}%` : `${userChange}%`,
            changeType: userChange >= 0 ? 'positive' : 'negative',
          },
          {
            name: 'Active Facilities',
            value: totalFacilities.toString(),
            change: facilityChange > 0 ? `+${facilityChange}` : facilityChange.toString(),
            changeType: facilityChange >= 0 ? 'positive' : 'negative',
          },
          {
            name: 'Forms Submitted',
            value: totalFormSubmissions.toLocaleString(),
            weekValue: submissionsThisWeek,
            change: submissionChange > 0 ? `+${submissionChange}%` : `${submissionChange}%`,
            changeType: submissionChange >= 0 ? 'positive' : 'negative',
          },
          {
            name: 'Open Incidents',
            value: openIncidents.toString(),
            change: incidentChange < 0 ? `${incidentChange}%` : `+${incidentChange}%`,
            changeType: incidentChange <= 0 ? 'positive' : 'negative',
          },
        ],
        roleStats,
        recentActivity: recentAuditLogs.map((log) => ({
          id: log.id,
          action: formatAction(log.action, log.resource),
          user: log.userName || 'System',
          target: log.resourceName || log.resource,
          time: log.timestamp,
          outcome: log.outcome,
        })),
        systemHealth: {
          database: { status: 'healthy', label: 'Healthy' },
          api: { status: 'healthy', label: 'Operational' },
          jobs: { status: 'healthy', label: 'Running' },
          email: { status: 'healthy', label: 'Connected' },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}

function formatAction(action: string, resource: string): string {
  const actionMap: Record<string, string> = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
    LOGIN: 'Logged in',
    LOGOUT: 'Logged out',
    EXPORT: 'Exported',
    IMPORT: 'Imported',
    APPROVE: 'Approved',
    REJECT: 'Rejected',
    ENABLE: 'Enabled',
    DISABLE: 'Disabled',
  };
  return `${actionMap[action] || action} ${resource.toLowerCase()}`;
}
