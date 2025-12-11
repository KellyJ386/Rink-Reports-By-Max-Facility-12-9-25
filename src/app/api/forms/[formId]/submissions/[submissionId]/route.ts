import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

interface RouteParams {
  params: Promise<{ formId: string; submissionId: string }>;
}

// Schema for updating submission (review)
const updateSubmissionSchema = z.object({
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED']).optional(),
  reviewNotes: z.string().max(2000).optional().nullable(),
});

// GET - Get a specific submission
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, submissionId } = await params;

    const submission = await prisma.formSubmission.findFirst({
      where: {
        id: submissionId,
        formTemplateId: formId,
      },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
          },
        },
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        facility: {
          select: { id: true, name: true },
        },
        fieldResponses: {
          include: {
            formField: {
              select: {
                id: true,
                label: true,
                fieldType: true,
                isRequired: true,
                orderIndex: true,
              },
            },
          },
          orderBy: {
            formField: { orderIndex: 'asc' },
          },
        },
        attachments: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Get reviewer info if reviewed
    let reviewer = null;
    if (submission.reviewedById) {
      reviewer = await prisma.user.findUnique({
        where: { id: submission.reviewedById },
        select: { id: true, name: true, email: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...submission,
        reviewer,
      },
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

// PUT - Update/review a submission
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, submissionId } = await params;
    const body = await request.json();
    const validatedData = updateSubmissionSchema.parse(body);

    // Check permission to review forms
    if (!hasPermission(session.user.role, 'forms', 'manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to review submissions' },
        { status: 403 }
      );
    }

    // Verify submission exists
    const existingSubmission = await prisma.formSubmission.findFirst({
      where: {
        id: submissionId,
        formTemplateId: formId,
      },
      include: {
        formTemplate: {
          select: { name: true, category: true },
        },
      },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;

      // Set reviewer info when status changes to review-related status
      if (['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(validatedData.status)) {
        updateData.reviewedById = session.user.id;
        updateData.reviewedAt = new Date();
      }
    }

    if (validatedData.reviewNotes !== undefined) {
      updateData.reviewNotes = validatedData.reviewNotes;
    }

    // Update the submission
    const submission = await prisma.formSubmission.update({
      where: { id: submissionId },
      data: updateData,
      include: {
        formTemplate: {
          select: { id: true, name: true, category: true },
        },
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        facility: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'FormSubmission',
        entityId: submission.id,
        oldValues: {
          status: existingSubmission.status,
          reviewNotes: existingSubmission.reviewNotes,
        },
        newValues: {
          status: validatedData.status,
          reviewNotes: validatedData.reviewNotes,
        },
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
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a submission
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, submissionId } = await params;

    // Check permission to delete
    if (!hasPermission(session.user.role, 'forms', 'delete')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete submissions' },
        { status: 403 }
      );
    }

    // Verify submission exists
    const existingSubmission = await prisma.formSubmission.findFirst({
      where: {
        id: submissionId,
        formTemplateId: formId,
      },
      include: {
        formTemplate: {
          select: { name: true },
        },
      },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Delete the submission (cascades to fieldResponses and attachments)
    await prisma.formSubmission.delete({
      where: { id: submissionId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'FormSubmission',
        entityId: submissionId,
        oldValues: {
          formName: existingSubmission.formTemplate.name,
          status: existingSubmission.status,
          submittedAt: existingSubmission.submittedAt,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    );
  }
}
