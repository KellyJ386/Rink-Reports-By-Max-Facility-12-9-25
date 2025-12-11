import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

const updateScheduledReportSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  schedule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  dayOfWeek: z.number().min(0).max(6).optional().nullable(),
  dayOfMonth: z.number().min(1).max(31).optional().nullable(),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  exportFormat: z.enum(['csv', 'json']).optional(),
  includeCharts: z.boolean().optional(),
  recipients: z.array(z.string().email()).min(1).optional(),
  emailSubject: z.string().max(200).optional().nullable(),
  emailBody: z.string().max(1000).optional().nullable(),
  dateRangeDays: z.number().min(1).max(365).optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ reportId: string }>;
}

// GET /api/reports/scheduled/[reportId] - Get single scheduled report
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Check permission
    if (!hasPermission(session.user.role, 'reports', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scheduledReport = await prisma.scheduledReport.findUnique({
      where: { id: reportId },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
          orderBy: { generatedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!scheduledReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 });
    }

    return NextResponse.json(scheduledReport);
  } catch (error) {
    console.error('Error fetching scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled report' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/scheduled/[reportId] - Update scheduled report
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Check permission
    if (!hasPermission(session.user.role, 'reports', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 });
    }

    // Check ownership or admin
    if (existingReport.createdById !== session.user.id && session.user.role !== 'ADMIN') {
      // Check if user is a manager at this facility
      const facilityUser = await prisma.facilityUser.findFirst({
        where: {
          userId: session.user.id,
          facilityId: existingReport.facilityId,
          role: { in: ['MANAGER', 'OWNER'] },
        },
      });

      if (!facilityUser) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const validatedData = updateScheduledReportSchema.parse(body);

    // Check schedule-specific requirements
    const schedule = validatedData.schedule || existingReport.schedule;
    if (schedule === 'WEEKLY' && validatedData.dayOfWeek === undefined && !existingReport.dayOfWeek) {
      return NextResponse.json(
        { error: 'dayOfWeek is required for weekly reports' },
        { status: 400 }
      );
    }

    if (schedule === 'MONTHLY' && validatedData.dayOfMonth === undefined && !existingReport.dayOfMonth) {
      return NextResponse.json(
        { error: 'dayOfMonth is required for monthly reports' },
        { status: 400 }
      );
    }

    const updatedReport = await prisma.scheduledReport.update({
      where: { id: reportId },
      data: validatedData,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/scheduled/[reportId] - Delete scheduled report
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Check permission
    if (!hasPermission(session.user.role, 'reports', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 });
    }

    // Check ownership or admin
    if (existingReport.createdById !== session.user.id && session.user.role !== 'ADMIN') {
      // Check if user is a manager at this facility
      const facilityUser = await prisma.facilityUser.findFirst({
        where: {
          userId: session.user.id,
          facilityId: existingReport.facilityId,
          role: { in: ['MANAGER', 'OWNER'] },
        },
      });

      if (!facilityUser) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await prisma.scheduledReport.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled report' },
      { status: 500 }
    );
  }
}
