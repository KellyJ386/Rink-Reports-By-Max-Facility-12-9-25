import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a tab submission
const createSubmissionSchema = z.object({
  sessionId: z.string(),
  tabId: z.string(),
  formSubmissionId: z.string().optional().nullable(),
  checklistData: z.record(z.unknown()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'REVIEWED']).default('COMPLETED'),
});

// Schema for updating a tab submission
const updateSubmissionSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'REVIEWED']).optional(),
  checklistData: z.record(z.unknown()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  reviewNotes: z.string().max(2000).optional().nullable(),
});

// GET - Get tab submissions for a session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const tabId = searchParams.get('tabId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = { sessionId };
    if (tabId) {
      where.tabId = tabId;
    }

    const submissions = await prisma.dailyReportTabSubmission.findMany({
      where,
      include: {
        tab: {
          select: {
            id: true,
            name: true,
            category: true,
            icon: true,
            color: true,
            formTemplateId: true,
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
          select: {
            id: true,
            status: true,
            submittedAt: true,
          },
        },
      },
      orderBy: {
        tab: { orderIndex: 'asc' },
      },
    });

    return NextResponse.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error('Error fetching tab submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST - Create or update a tab submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSubmissionSchema.parse(body);

    // Verify session exists and is in progress
    const dailySession = await prisma.dailyReportSession.findUnique({
      where: { id: validatedData.sessionId },
      select: { id: true, status: true, facilityId: true },
    });

    if (!dailySession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (dailySession.status === 'COMPLETED' || dailySession.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Cannot submit to a completed or archived session' },
        { status: 400 }
      );
    }

    // Verify tab exists and user has permission
    const tab = await prisma.dailyReportTab.findUnique({
      where: { id: validatedData.tabId },
      include: {
        roleAssignments: {
          where: { role: session.user.role },
        },
      },
    });

    if (!tab || tab.facilityId !== dailySession.facilityId) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    // Check if user has submit permission for this tab
    const roleAssignment = tab.roleAssignments[0];
    if (roleAssignment && !roleAssignment.canSubmit) {
      return NextResponse.json(
        { error: 'You do not have permission to submit to this tab' },
        { status: 403 }
      );
    }

    // Check for existing submission
    const existingSubmission = await prisma.dailyReportTabSubmission.findFirst({
      where: {
        sessionId: validatedData.sessionId,
        tabId: validatedData.tabId,
      },
    });

    let submission;

    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.dailyReportTabSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          formSubmissionId: validatedData.formSubmissionId,
          checklistData: validatedData.checklistData,
          notes: validatedData.notes,
          status: validatedData.status,
          submittedAt: new Date(),
        },
        include: {
          tab: {
            select: { id: true, name: true, category: true },
          },
          submittedBy: {
            select: { id: true, name: true },
          },
        },
      });
    } else {
      // Create new submission
      submission = await prisma.dailyReportTabSubmission.create({
        data: {
          sessionId: validatedData.sessionId,
          tabId: validatedData.tabId,
          submittedById: session.user.id,
          formSubmissionId: validatedData.formSubmissionId,
          checklistData: validatedData.checklistData,
          notes: validatedData.notes,
          status: validatedData.status,
          submittedAt: new Date(),
        },
        include: {
          tab: {
            select: { id: true, name: true, category: true },
          },
          submittedBy: {
            select: { id: true, name: true },
          },
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: existingSubmission ? 'UPDATE' : 'CREATE',
        entityType: 'DailyReportTabSubmission',
        entityId: submission.id,
        newValues: {
          tabName: submission.tab.name,
          status: submission.status,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: submission,
        isUpdate: !!existingSubmission,
      },
      { status: existingSubmission ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating tab submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

// PUT - Update a tab submission
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('id');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSubmissionSchema.parse(body);

    // Get existing submission
    const existingSubmission = await prisma.dailyReportTabSubmission.findUnique({
      where: { id: submissionId },
      include: {
        session: { select: { status: true } },
        tab: { select: { name: true } },
      },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (existingSubmission.session.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Cannot update submission in an archived session' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;

      if (validatedData.status === 'REVIEWED') {
        updateData.reviewedById = session.user.id;
        updateData.reviewedAt = new Date();
      }
    }

    if (validatedData.checklistData !== undefined) {
      updateData.checklistData = validatedData.checklistData;
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    if (validatedData.reviewNotes !== undefined) {
      updateData.reviewNotes = validatedData.reviewNotes;
    }

    // Update submission
    const submission = await prisma.dailyReportTabSubmission.update({
      where: { id: submissionId },
      data: updateData,
      include: {
        tab: {
          select: { id: true, name: true, category: true },
        },
        submittedBy: {
          select: { id: true, name: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'DailyReportTabSubmission',
        entityId: submission.id,
        oldValues: {
          status: existingSubmission.status,
        },
        newValues: updateData,
      },
    });

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating tab submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
