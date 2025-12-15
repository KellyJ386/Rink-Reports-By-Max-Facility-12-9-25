import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

type TransactionClient = Prisma.TransactionClient;

interface RouteParams {
  params: Promise<{ tabId: string }>;
}

// Schema for updating a tab
const updateTabSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
  formTemplateId: z.string().optional().nullable(),
  requiresCompletion: z.boolean().optional(),
  allowMultipleSubmissions: z.boolean().optional(),
  roleAssignments: z
    .array(
      z.object({
        role: z.enum([
          'SUPER_ADMIN',
          'FACILITY_ADMIN',
          'MANAGER',
          'SUPERVISOR',
          'ICE_TECHNICIAN',
          'STAFF',
        ]),
        canView: z.boolean().optional(),
        canSubmit: z.boolean().optional(),
        canReview: z.boolean().optional(),
      })
    )
    .optional(),
});

// GET - Get a specific tab
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    if (!hasPermission(session.user.role, 'admin', 'read')) {
      return NextResponse.json(
        { error: 'You do not have permission to access this resource' },
        { status: 403 }
      );
    }

    const { tabId } = await params;

    const tab = await prisma.dailyReportTab.findUnique({
      where: { id: tabId },
      include: {
        facility: {
          select: { id: true, name: true },
        },
        formTemplate: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            isPublished: true,
            fields: {
              select: {
                id: true,
                label: true,
                fieldType: true,
                isRequired: true,
                orderIndex: true,
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        roleAssignments: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!tab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: tab,
    });
  } catch (error) {
    console.error('Error fetching daily report tab:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tab' },
      { status: 500 }
    );
  }
}

// PUT - Update a tab
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    if (!hasPermission(session.user.role, 'admin', 'write')) {
      return NextResponse.json(
        { error: 'You do not have permission to update tabs' },
        { status: 403 }
      );
    }

    const { tabId } = await params;
    const body = await request.json();
    const validatedData = updateTabSchema.parse(body);

    // Get existing tab
    const existingTab = await prisma.dailyReportTab.findUnique({
      where: { id: tabId },
      include: { roleAssignments: true },
    });

    if (!existingTab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    // Check for duplicate name if name is being changed
    if (validatedData.name && validatedData.name !== existingTab.name) {
      const duplicateTab = await prisma.dailyReportTab.findFirst({
        where: {
          facilityId: existingTab.facilityId,
          name: validatedData.name,
          id: { not: tabId },
        },
      });

      if (duplicateTab) {
        return NextResponse.json(
          { error: 'A tab with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update tab with role assignments
    const tab = await prisma.$transaction(async (tx: TransactionClient) => {
      // Delete existing role assignments if new ones provided
      if (validatedData.roleAssignments) {
        await tx.dailyReportTabRole.deleteMany({
          where: { tabId },
        });
      }

      // Update the tab
      const updatedTab = await tx.dailyReportTab.update({
        where: { id: tabId },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          icon: validatedData.icon,
          color: validatedData.color,
          isActive: validatedData.isActive,
          formTemplateId: validatedData.formTemplateId,
          requiresCompletion: validatedData.requiresCompletion,
          allowMultipleSubmissions: validatedData.allowMultipleSubmissions,
          roleAssignments: validatedData.roleAssignments
            ? {
                create: validatedData.roleAssignments.map((ra) => ({
                  role: ra.role,
                  canView: ra.canView ?? true,
                  canSubmit: ra.canSubmit ?? true,
                  canReview: ra.canReview ?? false,
                })),
              }
            : undefined,
        },
        include: {
          formTemplate: {
            select: {
              id: true,
              name: true,
              category: true,
              isPublished: true,
            },
          },
          roleAssignments: true,
        },
      });

      return updatedTab;
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'DailyReportTab',
        entityId: tab.id,
        oldValues: {
          name: existingTab.name,
          isActive: existingTab.isActive,
          formTemplateId: existingTab.formTemplateId,
        },
        newValues: {
          name: tab.name,
          isActive: tab.isActive,
          formTemplateId: tab.formTemplateId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: tab,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating daily report tab:', error);
    return NextResponse.json(
      { error: 'Failed to update tab' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a tab
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    if (!hasPermission(session.user.role, 'admin', 'delete')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete tabs' },
        { status: 403 }
      );
    }

    const { tabId } = await params;

    // Get existing tab with submission count
    const existingTab = await prisma.dailyReportTab.findUnique({
      where: { id: tabId },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!existingTab) {
      return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
    }

    // Prevent deletion if tab has submissions (soft delete instead)
    if (existingTab._count.submissions > 0) {
      // Soft delete by deactivating
      await prisma.dailyReportTab.update({
        where: { id: tabId },
        data: { isActive: false },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE',
          entityType: 'DailyReportTab',
          entityId: tabId,
          oldValues: { isActive: true },
          newValues: {
            isActive: false,
            reason: 'Tab deactivated instead of deleted due to existing submissions',
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Tab has been deactivated (has existing submissions)',
        softDeleted: true,
      });
    }

    // Hard delete if no submissions
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Delete role assignments first
      await tx.dailyReportTabRole.deleteMany({
        where: { tabId },
      });

      // Delete the tab
      await tx.dailyReportTab.delete({
        where: { id: tabId },
      });
    });

    // Reorder remaining tabs
    const remainingTabs = await prisma.dailyReportTab.findMany({
      where: { facilityId: existingTab.facilityId },
      orderBy: { orderIndex: 'asc' },
    });

    // Update order indices
    type TabItem = (typeof remainingTabs)[number];
    await Promise.all(
      remainingTabs.map((tab: TabItem, index: number) =>
        prisma.dailyReportTab.update({
          where: { id: tab.id },
          data: { orderIndex: index },
        })
      )
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'DailyReportTab',
        entityId: tabId,
        oldValues: {
          name: existingTab.name,
          category: existingTab.category,
          facilityId: existingTab.facilityId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tab deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting daily report tab:', error);
    return NextResponse.json(
      { error: 'Failed to delete tab' },
      { status: 500 }
    );
  }
}
