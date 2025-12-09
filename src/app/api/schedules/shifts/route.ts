import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/types';

// Schema for shift creation
const createShiftSchema = z.object({
  scheduleId: z.string(),
  userId: z.string(),
  shiftDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  position: z.string().optional(),
  notes: z.string().optional(),
});

// Schema for bulk shift creation
const bulkCreateSchema = z.object({
  scheduleId: z.string(),
  shifts: z.array(z.object({
    userId: z.string(),
    shiftDate: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    position: z.string().optional(),
    notes: z.string().optional(),
  })),
});

// GET - Get shifts (can filter by user, schedule, date range)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const where: Record<string, unknown> = {};

    if (scheduleId) where.scheduleId = scheduleId;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.shiftDate = {};
      if (startDate) (where.shiftDate as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.shiftDate as Record<string, Date>).lte = new Date(endDate);
    }

    // Staff can only see their own shifts
    if (!hasPermission(session.user.role, 'schedule:manage')) {
      where.userId = session.user.id;
    }

    const shifts = await prisma.scheduleShift.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        schedule: {
          select: {
            id: true,
            name: true,
            status: true,
            facility: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [
        { shiftDate: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}

// POST - Create a new shift or bulk create shifts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'schedule:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage schedules' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if bulk create
    if (body.shifts && Array.isArray(body.shifts)) {
      const validatedData = bulkCreateSchema.parse(body);

      // Check for conflicts
      const conflicts = await checkShiftConflicts(validatedData.shifts);
      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Shift conflicts detected',
            conflicts,
          },
          { status: 409 }
        );
      }

      const shifts = await prisma.scheduleShift.createMany({
        data: validatedData.shifts.map((shift) => ({
          scheduleId: validatedData.scheduleId,
          userId: shift.userId,
          shiftDate: new Date(shift.shiftDate),
          startTime: new Date(shift.startTime),
          endTime: new Date(shift.endTime),
          position: shift.position,
          notes: shift.notes,
        })),
      });

      return NextResponse.json(
        { success: true, data: { created: shifts.count } },
        { status: 201 }
      );
    }

    // Single shift creation
    const validatedData = createShiftSchema.parse(body);

    // Check for conflicts
    const conflicts = await checkShiftConflicts([{
      userId: validatedData.userId,
      shiftDate: validatedData.shiftDate,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
    }]);

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Shift conflict detected',
          conflicts,
        },
        { status: 409 }
      );
    }

    const shift = await prisma.scheduleShift.create({
      data: {
        scheduleId: validatedData.scheduleId,
        userId: validatedData.userId,
        shiftDate: new Date(validatedData.shiftDate),
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        position: validatedData.position,
        notes: validatedData.notes,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: shift }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    );
  }
}

// Helper function to check for shift conflicts
async function checkShiftConflicts(
  shifts: Array<{
    userId: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
  }>
): Promise<Array<{ userId: string; date: string; message: string }>> {
  const conflicts: Array<{ userId: string; date: string; message: string }> = [];

  for (const shift of shifts) {
    const shiftDate = new Date(shift.shiftDate);
    const startOfDay = new Date(shiftDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(shiftDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingShifts = await prisma.scheduleShift.findMany({
      where: {
        userId: shift.userId,
        shiftDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['CANCELLED'],
        },
      },
    });

    const newStart = new Date(shift.startTime).getTime();
    const newEnd = new Date(shift.endTime).getTime();

    for (const existing of existingShifts) {
      const existingStart = existing.startTime.getTime();
      const existingEnd = existing.endTime.getTime();

      // Check for overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        conflicts.push({
          userId: shift.userId,
          date: shift.shiftDate,
          message: 'User already has an overlapping shift',
        });
        break;
      }
    }

    // Also check for approved time-off
    const timeOff = await prisma.timeOffRequest.findFirst({
      where: {
        userId: shift.userId,
        status: 'APPROVED',
        startDate: { lte: shiftDate },
        endDate: { gte: shiftDate },
      },
    });

    if (timeOff) {
      conflicts.push({
        userId: shift.userId,
        date: shift.shiftDate,
        message: 'User has approved time off for this date',
      });
    }
  }

  return conflicts;
}
