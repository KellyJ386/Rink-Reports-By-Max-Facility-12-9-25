import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuditStats } from '@/lib/audit/service';

// GET /api/audit/stats - Get audit log statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view audit stats
    const userRole = (session.user as { role?: string }).role;
    if (!['SUPER_ADMIN', 'FACILITY_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const stats = await getAuditStats({
      facilityId,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit stats' },
      { status: 500 }
    );
  }
}
