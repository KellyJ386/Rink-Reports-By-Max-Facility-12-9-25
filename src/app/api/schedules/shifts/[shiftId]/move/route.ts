import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/types';

// Schema for move request
const moveShiftSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// POST - Move a shift to a new date
export async function POST(
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
        { error: 'You do not have permission to move shifts' },
        { status: 403 }
      );
    }

    const { shiftId } = await params;
    const body = await request.json();
    const { newDate } = moveShiftSchema.parse(body);

    // Get the existing shift
    const existingShift = await prisma.scheduleShift.findUnique({
      where: { id: shiftId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Cannot move completed or cancelled shifts
    if (existingShift.status === 'COMPLETED' || existingShift.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot move completed or cancelled shifts' },
        { status: 400 }
      );
    }

    // Calculate new start and end times (preserve the time portion)
    const oldStartTime = existingShift.startTime;
    const oldEndTime = existingShift.endTime;

    const startHours = oldStartTime.getHours();
    const startMinutes = oldStartTime.getMinutes();
    const endHours = oldEndTime.getHours();
    const endMinutes = oldEndTime.getMinutes();

    const newDateObj = new Date(newDate);

    const newStartTime = new Date(newDateObj);
    newStartTime.setHours(startHours, startMinutes, 0, 0);

    const newEndTime = new Date(newDateObj);
    newEndTime.setHours(endHours, endMinutes, 0, 0);

    // Check for conflicts on the new date
    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(newDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingShifts = await prisma.scheduleShift.findMany({
      where: {
        id: { not: shiftId },
        userId: existingShift.userId,
        shiftDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED'] },
      },
    });

    for (const existing of conflictingShifts) {
      if (
        newStartTime.getTime() < existing.endTime.getTime() &&
        newEndTime.getTime() > existing.startTime.getTime()
      ) {
        return NextResponse.json(
          {
            error: 'Shift conflicts with existing shift',
            conflict: {
              existingShiftId: existing.id,
              existingStart: existing.startTime,
              existingEnd: existing.endTime,
            },
          },
          { status: 409 }
        );
      }
    }

    // Check for approved time-off on the new date
    const timeOff = await prisma.timeOffRequest.findFirst({
      where: {
        userId: existingShift.userId,
        status: 'APPROVED',
        startDate: { lte: newDateObj },
        endDate: { gte: newDateObj },
      },
    });

    if (timeOff) {
      return NextResponse.json(
        {
          error: 'Employee has approved time off for this date',
          timeOff: {
            startDate: timeOff.startDate,
            endDate: timeOff.endDate,
            type: timeOff.type,
          },
        },
        { status: 409 }
      );
    }

    // Update the shift
    const updatedShift = await prisma.scheduleShift.update({
      where: { id: shiftId },
      data: {
        shiftDate: newDateObj,
        startTime: newStartTime,
        endTime: newEndTime,
      },
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'ScheduleShift',
        entityId: shiftId,
        oldValues: {
          shiftDate: existingShift.shiftDate,
          startTime: existingShift.startTime,
          endTime: existingShift.endTime,
        },
        newValues: {
          shiftDate: updatedShift.shiftDate,
          startTime: updatedShift.startTime,
          endTime: updatedShift.endTime,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedShift,
      message: `Shift moved to ${newDate}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error moving shift:', error);
    return NextResponse.json({ error: 'Failed to move shift' }, { status: 500 });
  }
}
