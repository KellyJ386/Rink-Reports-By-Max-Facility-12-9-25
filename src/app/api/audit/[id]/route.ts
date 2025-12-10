import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuditLog } from '@/lib/audit/service';

interface RouteParams {
  params: { id: string };
}

// GET /api/audit/[id] - Get a single audit log entry
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view audit logs
    const userRole = (session.user as { role?: string }).role;
    if (!['SUPER_ADMIN', 'FACILITY_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const entry = await getAuditLog(params.id);
    if (!entry) {
      return NextResponse.json(
        { error: 'Audit log entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error fetching audit log entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log entry' },
      { status: 500 }
    );
  }
}
