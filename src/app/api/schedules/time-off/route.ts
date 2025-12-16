import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/types';

// Schema for time-off request
const timeOffSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});

// Schema for time-off approval
const approvalSchema = z.object({
  requestId: z.string(),
  status: z.enum(['APPROVED', 'DENIED']),
  reviewNotes: z.string().optional(),
});

// GET - List time-off requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const where: Record<string, unknown> = {};

    if (status) where.status = status;

    // Staff can only see their own requests
    if (!hasPermission(session.user.role, 'schedule:approve_timeoff')) {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) (where.startDate as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.startDate as Record<string, Date>).lte = new Date(endDate);
    }

    const requests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching time-off requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time-off requests' },
      { status: 500 }
    );
  }
}

// POST - Create or approve/deny time-off request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if this is an approval action
    if (body.requestId && body.status) {
      if (!hasPermission(session.user.role, 'schedule:approve_timeoff')) {
        return NextResponse.json(
          { error: 'You do not have permission to approve time-off requests' },
          { status: 403 }
        );
      }

      const validatedData = approvalSchema.parse(body);

      const updatedRequest = await prisma.timeOffRequest.update({
        where: { id: validatedData.requestId },
        data: {
          status: validatedData.status,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: validatedData.reviewNotes,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create notification for the user
      await prisma.notification.create({
        data: {
          userId: updatedRequest.userId,
          type: 'SCHEDULE',
          title: `Time Off Request ${validatedData.status.toLowerCase()}`,
          message: `Your time-off request for ${updatedRequest.startDate.toLocaleDateString()} - ${updatedRequest.endDate.toLocaleDateString()} has been ${validatedData.status.toLowerCase()}.`,
          link: '/dashboard/schedule/time-off',
        },
      });

      return NextResponse.json({ success: true, data: updatedRequest });
    }

    // Create new time-off request
    const validatedData = timeOffSchema.parse(body);

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for existing pending/approved requests in the same period
    const existingRequest = await prisma.timeOffRequest.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a time-off request for this period' },
        { status: 409 }
      );
    }

    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        userId: session.user.id,
        startDate,
        endDate,
        reason: validatedData.reason,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: timeOffRequest }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error processing time-off request:', error);
    return NextResponse.json(
      { error: 'Failed to process time-off request' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a time-off request
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
    });

    if (!timeOffRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Only the user or an admin can cancel
    if (
      timeOffRequest.userId !== session.user.id &&
      !hasPermission(session.user.role, 'schedule:approve_timeoff')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Can only cancel pending requests
    if (timeOffRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only cancel pending requests' },
        { status: 400 }
      );
    }

    await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, message: 'Request cancelled' });
  } catch (error) {
    console.error('Error cancelling time-off request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel time-off request' },
      { status: 500 }
    );
  }
}
