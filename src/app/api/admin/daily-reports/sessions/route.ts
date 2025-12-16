import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

// Schema for creating a session
const createSessionSchema = z.object({
  facilityId: z.string(),
  shiftDate: z.string().transform((str) => new Date(str)),
  shiftType: z.enum(['MORNING', 'AFTERNOON', 'NIGHT', 'ALL_DAY']).default('ALL_DAY'),
});

// GET - List sessions for a facility
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!facilityId) {
      return NextResponse.json(
        { error: 'facilityId is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = { facilityId };

    if (startDate || endDate) {
      where.shiftDate = {};
      if (startDate) (where.shiftDate as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.shiftDate as Record<string, Date>).lte = new Date(endDate);
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.dailyReportSession.count({ where });

    // Get sessions with pagination
    const sessions = await prisma.dailyReportSession.findMany({
      where,
      include: {
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
            submittedBy: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { tabSubmissions: true },
        },
      },
      orderBy: [{ shiftDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: sessions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching daily report sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST - Create or get today's session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    // Check if a session already exists for this date and shift
    const existingSession = await prisma.dailyReportSession.findFirst({
      where: {
        facilityId: validatedData.facilityId,
        shiftDate: validatedData.shiftDate,
        shiftType: validatedData.shiftType,
      },
      include: {
        startedBy: {
          select: { id: true, name: true, email: true },
        },
        tabSubmissions: {
          include: {
            tab: {
              select: { id: true, name: true, category: true, icon: true, color: true },
            },
          },
        },
      },
    });

    if (existingSession) {
      return NextResponse.json({
        success: true,
        data: existingSession,
        isExisting: true,
      });
    }

    // Create new session
    const newSession = await prisma.dailyReportSession.create({
      data: {
        facilityId: validatedData.facilityId,
        shiftDate: validatedData.shiftDate,
        shiftType: validatedData.shiftType,
        startedById: session.user.id,
        status: 'IN_PROGRESS',
      },
      include: {
        startedBy: {
          select: { id: true, name: true, email: true },
        },
        facility: {
          select: { id: true, name: true },
        },
        tabSubmissions: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'DailyReportSession',
        entityId: newSession.id,
        newValues: {
          facilityId: validatedData.facilityId,
          shiftDate: validatedData.shiftDate,
          shiftType: validatedData.shiftType,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newSession,
        isExisting: false,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating daily report session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
