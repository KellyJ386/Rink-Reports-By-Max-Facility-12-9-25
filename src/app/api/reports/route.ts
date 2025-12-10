import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generateReport,
  getReports,
  createScheduledReport,
  getScheduledReports,
} from '@/lib/reports/generator';
import type { GenerateReportInput, CreateScheduledReportInput } from '@/lib/reports/types';

// GET /api/reports - Get reports for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId') || undefined;
    const includeScheduled = searchParams.get('includeScheduled') === 'true';

    const reports = await getReports(session.user.id, facilityId);

    let scheduled: Awaited<ReturnType<typeof getScheduledReports>> = [];
    if (includeScheduled) {
      scheduled = await getScheduledReports(session.user.id, facilityId);
    }

    return NextResponse.json({
      reports,
      scheduled: includeScheduled ? scheduled : undefined,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Generate a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schedule, ...reportData } = body;

    if (schedule) {
      // Create scheduled report
      const input: CreateScheduledReportInput = {
        templateId: reportData.templateId,
        name: reportData.name,
        frequency: schedule.frequency,
        format: reportData.format,
        filters: reportData.filters,
        recipients: schedule.recipients || [session.user.email],
        facilityId: reportData.facilityId,
      };

      const scheduled = await createScheduledReport(input, session.user.id);
      return NextResponse.json({ scheduled }, { status: 201 });
    } else {
      // Generate report immediately
      const input: GenerateReportInput = {
        templateId: reportData.templateId,
        name: reportData.name,
        type: reportData.type,
        format: reportData.format || 'pdf',
        filters: reportData.filters || {},
        facilityId: reportData.facilityId,
      };

      if (!input.name || !input.type) {
        return NextResponse.json(
          { error: 'Name and type are required' },
          { status: 400 }
        );
      }

      const report = await generateReport(input, session.user.id);
      return NextResponse.json({ report }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
