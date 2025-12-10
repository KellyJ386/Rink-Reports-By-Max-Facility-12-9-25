import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types';

// GET - Get audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and above can view audit logs
    if (!hasPermission(session.user.role, 'audit:view')) {
      return NextResponse.json(
        { error: 'You do not have permission to view audit logs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = end;
      }
    }

    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const totalCount = await prisma.auditLog.count({ where });

    // Get audit logs with pagination
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get available filters
    const [actions, entityTypes, users] = await Promise.all([
      prisma.auditLog.findMany({
        select: { action: true },
        distinct: ['action'],
      }),
      prisma.auditLog.findMany({
        select: { entityType: true },
        distinct: ['entityType'],
      }),
      prisma.auditLog.findMany({
        where: { userId: { not: null } },
        select: {
          user: {
            select: { id: true, name: true },
          },
        },
        distinct: ['userId'],
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        actions: actions.map((a) => a.action),
        entityTypes: entityTypes.map((e) => e.entityType),
        users: users.map((u) => u.user).filter(Boolean),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// GET stats for audit logs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'audit:view')) {
      return NextResponse.json(
        { error: 'You do not have permission to view audit logs' },
        { status: 403 }
      );
    }

    const { action: requestAction } = await request.json();

    if (requestAction === 'stats') {
      // Get stats for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [totalLogs, actionCounts, entityCounts, dailyCounts] = await Promise.all([
        prisma.auditLog.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { action: true },
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.auditLog.groupBy({
          by: ['entityType'],
          _count: { entityType: true },
          where: { createdAt: { gte: thirtyDaysAgo } },
          orderBy: { _count: { entityType: 'desc' } },
          take: 10,
        }),
        prisma.$queryRaw`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM "AuditLog"
          WHERE created_at >= ${thirtyDaysAgo}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `,
      ]);

      return NextResponse.json({
        success: true,
        data: {
          totalLogs,
          byAction: actionCounts.reduce((acc, item) => {
            acc[item.action] = item._count.action;
            return acc;
          }, {} as Record<string, number>),
          byEntityType: entityCounts.map((e) => ({
            entityType: e.entityType,
            count: e._count.entityType,
          })),
          dailyActivity: dailyCounts,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit stats' },
      { status: 500 }
    );
  }
}
