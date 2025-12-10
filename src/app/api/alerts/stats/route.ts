import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get alert statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');

    if (!facilityId) {
      return NextResponse.json({ error: 'Facility ID required' }, { status: 400 });
    }

    // Get all alerts for the facility (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const alerts = await prisma.alert.findMany({
      where: {
        facilityId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Calculate statistics
    const stats = {
      total: alerts.length,
      unacknowledged: alerts.filter((a) => !a.isAcknowledged).length,
      bySeverity: {
        MINOR: alerts.filter((a) => a.severity === 'MINOR').length,
        MODERATE: alerts.filter((a) => a.severity === 'MODERATE').length,
        SERIOUS: alerts.filter((a) => a.severity === 'SERIOUS').length,
        CRITICAL: alerts.filter((a) => a.severity === 'CRITICAL').length,
      },
      byType: alerts.reduce((acc, alert) => {
        acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentCritical: alerts.filter(
        (a) => a.severity === 'CRITICAL' && !a.isAcknowledged
      ).length,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert stats' },
      { status: 500 }
    );
  }
}
