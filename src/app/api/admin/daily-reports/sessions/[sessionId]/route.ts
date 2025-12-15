import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// Schema for updating a session
const updateSessionSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'ARCHIVED']).optional(),
  handoffSummary: z.string().max(5000).optional().nullable(),
  handoffNotes: z.string().max(2000).optional().nullable(),
  reviewStatus: z.enum(['PENDING', 'APPROVED', 'NEEDS_ATTENTION', 'REJECTED']).optional(),
  reviewNotes: z.string().max(2000).optional().nullable(),
});

// GET - Get a specific session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    const dailySession = await prisma.dailyReportSession.findUnique({
      where: { id: sessionId },
      include: {
        facility: {
          select: { id: true, name: true },
        },
        startedBy: {
          select: { id: true, name: true, email: true },
        },
        completedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
        tabSubmissions: {
          include: {
            tab: {
              select: {
                id: true,
                name: true,
                category: true,
                icon: true,
                color: true,
                requiresCompletion: true,
              },
            },
            submittedBy: {
              select: { id: true, name: true, email: true },
            },
            reviewedBy: {
              select: { id: true, name: true, email: true },
            },
            formSubmission: {
              include: {
                fieldResponses: {
                  include: {
                    formField: {
                      select: { id: true, label: true, fieldType: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            tab: { orderIndex: 'asc' },
          },
        },
      },
    });

    if (!dailySession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Calculate completion stats
    type TabSubmission = (typeof dailySession.tabSubmissions)[number];
    const totalTabs = dailySession.tabSubmissions.length;
    const completedTabs = dailySession.tabSubmissions.filter(
      (ts: TabSubmission) => ts.status === 'COMPLETED' || ts.status === 'REVIEWED'
    ).length;
    const requiredTabs = dailySession.tabSubmissions.filter(
      (ts: TabSubmission) => ts.tab.requiresCompletion
    ).length;
    const requiredCompleted = dailySession.tabSubmissions.filter(
      (ts: TabSubmission) => ts.tab.requiresCompletion && (ts.status === 'COMPLETED' || ts.status === 'REVIEWED')
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        ...dailySession,
        stats: {
          totalTabs,
          completedTabs,
          requiredTabs,
          requiredCompleted,
          completionPercentage: totalTabs > 0 ? Math.round((completedTabs / totalTabs) * 100) : 0,
          allRequiredComplete: requiredTabs === requiredCompleted,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching daily report session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT - Update a session (complete, add handoff notes, review)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await request.json();
    const validatedData = updateSessionSchema.parse(body);

    // Get existing session
    const existingSession = await prisma.dailyReportSession.findUnique({
      where: { id: sessionId },
      include: {
        tabSubmissions: {
          include: {
            tab: { select: { requiresCompletion: true } },
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.status !== undefined) {
      // Validate status transitions
      if (validatedData.status === 'COMPLETED') {
        // Check if all required tabs are completed
        type TabSub = (typeof existingSession.tabSubmissions)[number];
        const incompletedRequired = existingSession.tabSubmissions.filter(
          (ts: TabSub) => ts.tab.requiresCompletion && ts.status !== 'COMPLETED' && ts.status !== 'REVIEWED'
        );

        if (incompletedRequired.length > 0) {
          return NextResponse.json(
            {
              error: 'Cannot complete session: some required tabs are not completed',
              incompleteTabs: incompletedRequired.length,
            },
            { status: 400 }
          );
        }

        updateData.status = 'COMPLETED';
        updateData.completedById = session.user.id;
        updateData.completedAt = new Date();
      } else if (validatedData.status === 'REVIEWED') {
        // Only managers+ can review
        if (!hasPermission(session.user.role, 'admin', 'read')) {
          return NextResponse.json(
            { error: 'You do not have permission to review sessions' },
            { status: 403 }
          );
        }

        updateData.status = 'REVIEWED';
        updateData.reviewedById = session.user.id;
        updateData.reviewedAt = new Date();
      } else {
        updateData.status = validatedData.status;
      }
    }

    if (validatedData.handoffSummary !== undefined) {
      updateData.handoffSummary = validatedData.handoffSummary;
    }

    if (validatedData.handoffNotes !== undefined) {
      updateData.handoffNotes = validatedData.handoffNotes;
    }

    if (validatedData.reviewStatus !== undefined) {
      updateData.reviewStatus = validatedData.reviewStatus;
    }

    if (validatedData.reviewNotes !== undefined) {
      updateData.reviewNotes = validatedData.reviewNotes;
    }

    // Update the session
    const updatedSession = await prisma.dailyReportSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        facility: {
          select: { id: true, name: true },
        },
        startedBy: {
          select: { id: true, name: true, email: true },
        },
        completedBy: {
          select: { id: true, name: true, email: true },
        },
        tabSubmissions: {
          include: {
            tab: {
              select: { id: true, name: true, category: true, icon: true },
            },
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'DailyReportSession',
        entityId: sessionId,
        oldValues: {
          status: existingSession.status,
          handoffSummary: existingSession.handoffSummary,
        },
        newValues: updateData,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating daily report session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
