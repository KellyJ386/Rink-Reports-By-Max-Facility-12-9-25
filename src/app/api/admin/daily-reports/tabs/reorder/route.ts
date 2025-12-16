import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

// Schema for reordering tabs
const reorderSchema = z.object({
  facilityId: z.string(),
  tabOrder: z.array(z.string()).min(1).max(15), // Array of tab IDs in new order
});

// POST - Reorder tabs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    if (!hasPermission(session.user.role, 'admin', 'write')) {
      return NextResponse.json(
        { error: 'You do not have permission to reorder tabs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

    // Verify all tabs exist and belong to the facility
    const existingTabs = await prisma.dailyReportTab.findMany({
      where: {
        facilityId: validatedData.facilityId,
        id: { in: validatedData.tabOrder },
      },
      select: { id: true, name: true, orderIndex: true },
    });

    if (existingTabs.length !== validatedData.tabOrder.length) {
      return NextResponse.json(
        { error: 'Some tabs not found or do not belong to this facility' },
        { status: 400 }
      );
    }

    // Store old order for audit log
    type ExistingTab = (typeof existingTabs)[number];
    const oldOrder = existingTabs
      .sort((a: ExistingTab, b: ExistingTab) => a.orderIndex - b.orderIndex)
      .map((t: ExistingTab) => ({ id: t.id, name: t.name, orderIndex: t.orderIndex }));

    // Update all tabs with new order indices
    await prisma.$transaction(
      validatedData.tabOrder.map((tabId, index) =>
        prisma.dailyReportTab.update({
          where: { id: tabId },
          data: { orderIndex: index },
        })
      )
    );

    // Get updated tabs
    const updatedTabs = await prisma.dailyReportTab.findMany({
      where: {
        facilityId: validatedData.facilityId,
      },
      include: {
        formTemplate: {
          select: { id: true, name: true, category: true },
        },
        roleAssignments: true,
      },
      orderBy: { orderIndex: 'asc' },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'DailyReportTab',
        entityId: validatedData.facilityId,
        oldValues: { tabOrder: oldOrder },
        newValues: {
          tabOrder: validatedData.tabOrder.map((id, index) => ({
            id,
            orderIndex: index,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTabs,
      message: 'Tabs reordered successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error reordering daily report tabs:', error);
    return NextResponse.json(
      { error: 'Failed to reorder tabs' },
      { status: 500 }
    );
  }
}
