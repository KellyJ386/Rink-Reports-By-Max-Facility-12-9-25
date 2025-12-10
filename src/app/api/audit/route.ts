import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuditLogs, getAuditStats, createAuditLog } from '@/lib/audit/service';
import type { AuditLogFilter, CreateAuditLogInput } from '@/lib/audit/types';

// GET /api/audit - Get audit logs
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const filter: AuditLogFilter = {
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const actions = searchParams.get('actions');
    if (actions) {
      filter.actions = actions.split(',') as AuditLogFilter['actions'];
    }

    const resources = searchParams.get('resources');
    if (resources) {
      filter.resources = resources.split(',') as AuditLogFilter['resources'];
    }

    const severity = searchParams.get('severity');
    if (severity) {
      filter.severity = severity.split(',') as AuditLogFilter['severity'];
    }

    const userId = searchParams.get('userId');
    if (userId) filter.userId = userId;

    const facilityId = searchParams.get('facilityId');
    if (facilityId) filter.facilityId = facilityId;

    const resourceId = searchParams.get('resourceId');
    if (resourceId) filter.resourceId = resourceId;

    const outcome = searchParams.get('outcome');
    if (outcome) filter.outcome = outcome as AuditLogFilter['outcome'];

    const searchTerm = searchParams.get('search');
    if (searchTerm) filter.searchTerm = searchTerm;

    const startDate = searchParams.get('startDate');
    if (startDate) filter.startDate = new Date(startDate);

    const endDate = searchParams.get('endDate');
    if (endDate) filter.endDate = new Date(endDate);

    const logs = await getAuditLogs(filter);
    const stats = await getAuditStats({ facilityId });

    return NextResponse.json({
      logs,
      stats,
      pagination: {
        offset: filter.offset,
        limit: filter.limit,
        total: stats.total,
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

// POST /api/audit - Create audit log entry (for client-side logging)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input: CreateAuditLogInput = {
      action: body.action,
      resource: body.resource,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      userId: session.user.id,
      facilityId: body.facilityId,
      description: body.description,
      metadata: body.metadata,
      changes: body.changes,
      outcome: body.outcome || 'SUCCESS',
      errorMessage: body.errorMessage,
      ipAddress: request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    const entry = await createAuditLog(input);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}
