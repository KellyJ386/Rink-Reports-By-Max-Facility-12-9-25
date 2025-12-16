import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/types';

// Schema for schedule creation
const createScheduleSchema = z.object({
  facilityId: z.string(),
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// Schema for shift creation
const createShiftSchema = z.object({
  scheduleId: z.string(),
  userId: z.string(),
  shiftDate: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  position: z.string().optional(),
  notes: z.string().optional(),
});

// GET - List schedules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Build query
    const where: Record<string, unknown> = {};

    if (facilityId) where.facilityId = facilityId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) (where.startDate as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.startDate as Record<string, Date>).lte = new Date(endDate);
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        facility: {
          select: { id: true, name: true },
        },
        shifts: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { shiftDate: 'asc' },
        },
        _count: {
          select: { shifts: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST - Create a new schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user.role, 'schedule:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage schedules' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createScheduleSchema.parse(body);

    const schedule = await prisma.schedule.create({
      data: {
        facilityId: validatedData.facilityId,
        name: validatedData.name,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        status: 'DRAFT',
      },
      include: {
        facility: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
