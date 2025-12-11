import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/types';

// Schema for updating recurring form
const updateRecurringFormSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional().nullable(),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  assignedRole: z.enum(['STAFF', 'MANAGER', 'FACILITY_ADMIN', 'SUPER_ADMIN']).optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
  reminderEnabled: z.boolean().optional(),
  reminderMinutes: z.number().min(0).optional(),
  dueInHours: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get a specific recurring form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recurringId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recurringId } = await params;

    const recurringForm = await prisma.recurringForm.findUnique({
      where: { id: recurringId },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            isActive: true,
            fields: {
              orderBy: { order: 'asc' },
            },
            facility: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!recurringForm) {
      return NextResponse.json(
        { error: 'Recurring form not found' },
        { status: 404 }
      );
    }

    // Get assigned user info if applicable
    let assignedUser = null;
    if (recurringForm.assignedUserId) {
      assignedUser = await prisma.user.findUnique({
        where: { id: recurringForm.assignedUserId },
        select: { id: true, name: true, email: true },
      });
    }

    // Get users with assigned role if applicable
    let assignedRoleUsers: Array<{ id: string; name: string; email: string }> = [];
    if (recurringForm.assignedRole) {
      const facilityUsers = await prisma.facilityUser.findMany({
        where: {
          facilityId: recurringForm.facilityId,
          role: recurringForm.assignedRole,
          isActive: true,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      assignedRoleUsers = facilityUsers.map((fu) => fu.user);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...recurringForm,
        assignedUser,
        assignedRoleUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching recurring form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring form' },
      { status: 500 }
    );
  }
}

// PUT - Update a recurring form schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ recurringId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'forms:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage forms' },
        { status: 403 }
      );
    }

    const { recurringId } = await params;
    const body = await request.json();
    const validatedData = updateRecurringFormSchema.parse(body);

    // Get existing recurring form
    const existing = await prisma.recurringForm.findUnique({
      where: { id: recurringId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Recurring form not found' },
        { status: 404 }
      );
    }

    // Verify assigned user exists if updating
    if (validatedData.assignedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: validatedData.assignedUserId },
      });
      if (!user) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 404 }
        );
      }
    }

    // Validate frequency-specific fields
    const frequency = validatedData.frequency || existing.frequency;
    const daysOfWeek = validatedData.daysOfWeek ?? existing.daysOfWeek;
    const dayOfMonth = validatedData.dayOfMonth ?? existing.dayOfMonth;

    if (frequency === 'WEEKLY' && daysOfWeek.length === 0) {
      return NextResponse.json(
        { error: 'Weekly frequency requires at least one day selected' },
        { status: 400 }
      );
    }

    if (frequency === 'MONTHLY' && !dayOfMonth) {
      return NextResponse.json(
        { error: 'Monthly frequency requires day of month' },
        { status: 400 }
      );
    }

    // Update the recurring form
    const recurringForm = await prisma.recurringForm.update({
      where: { id: recurringId },
      data: validatedData,
      include: {
        formTemplate: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: recurringForm });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating recurring form:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring form' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a recurring form schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recurringId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'forms:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage forms' },
        { status: 403 }
      );
    }

    const { recurringId } = await params;

    // Check if recurring form exists
    const existing = await prisma.recurringForm.findUnique({
      where: { id: recurringId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Recurring form not found' },
        { status: 404 }
      );
    }

    // Delete the recurring form
    await prisma.recurringForm.delete({
      where: { id: recurringId },
    });

    return NextResponse.json({
      success: true,
      message: 'Recurring form schedule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting recurring form:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring form' },
      { status: 500 }
    );
  }
}
