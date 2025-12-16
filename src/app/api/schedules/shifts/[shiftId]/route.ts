import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/types';

// Schema for shift update
const updateShiftSchema = z.object({
  userId: z.string().optional(),
  shiftDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED']).optional(),
});

// GET - Get a single shift
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId } = await params;

    const shift = await prisma.scheduleShift.findUnique({
      where: { id: shiftId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        schedule: {
          select: {
            id: true,
            name: true,
            facility: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Staff can only see their own shifts
    if (!hasPermission(session.user.role, 'schedule:manage') && shift.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: shift });
  } catch (error) {
    console.error('Error fetching shift:', error);
    return NextResponse.json({ error: 'Failed to fetch shift' }, { status: 500 });
  }
}

// PATCH - Update a shift
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'schedule:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to update shifts' },
        { status: 403 }
      );
    }

    const { shiftId } = await params;
    const body = await request.json();
    const validatedData = updateShiftSchema.parse(body);

    // Check if shift exists
    const existingShift = await prisma.scheduleShift.findUnique({
      where: { id: shiftId },
    });

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.userId) updateData.userId = validatedData.userId;
    if (validatedData.shiftDate) updateData.shiftDate = new Date(validatedData.shiftDate);
    if (validatedData.startTime) updateData.startTime = new Date(validatedData.startTime);
    if (validatedData.endTime) updateData.endTime = new Date(validatedData.endTime);
    if (validatedData.position !== undefined) updateData.position = validatedData.position;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.status) updateData.status = validatedData.status;

    // If changing date/time, check for conflicts
    if (validatedData.shiftDate || validatedData.startTime || validatedData.endTime) {
      const userId = validatedData.userId || existingShift.userId;
      const shiftDate = validatedData.shiftDate ? new Date(validatedData.shiftDate) : existingShift.shiftDate;
      const startTime = validatedData.startTime ? new Date(validatedData.startTime) : existingShift.startTime;
      const endTime = validatedData.endTime ? new Date(validatedData.endTime) : existingShift.endTime;

      const startOfDay = new Date(shiftDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(shiftDate);
      endOfDay.setHours(23, 59, 59, 999);

      const conflictingShifts = await prisma.scheduleShift.findMany({
        where: {
          id: { not: shiftId },
          userId,
          shiftDate: { gte: startOfDay, lte: endOfDay },
          status: { notIn: ['CANCELLED'] },
        },
      });

      for (const existing of conflictingShifts) {
        if (
          startTime.getTime() < existing.endTime.getTime() &&
          endTime.getTime() > existing.startTime.getTime()
        ) {
          return NextResponse.json(
            { error: 'Shift conflicts with existing shift' },
            { status: 409 }
          );
        }
      }
    }

    const shift = await prisma.scheduleShift.update({
      where: { id: shiftId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: shift });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating shift:', error);
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
  }
}

// DELETE - Delete a shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'schedule:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete shifts' },
        { status: 403 }
      );
    }

    const { shiftId } = await params;

    // Check if shift exists
    const existingShift = await prisma.scheduleShift.findUnique({
      where: { id: shiftId },
    });

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    await prisma.scheduleShift.delete({
      where: { id: shiftId },
    });

    return NextResponse.json({ success: true, message: 'Shift deleted' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
  }
}
