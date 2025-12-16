import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/types';

// Schema for reviewing a swap request
const reviewSwapSchema = z.object({
  action: z.enum(['approve', 'deny']),
  notes: z.string().optional(),
});

// Schema for cancelling
const cancelSwapSchema = z.object({
  reason: z.string().optional(),
});

// GET - Get a specific swap request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ swapId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { swapId } = await params;

    const swap = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapId },
    });

    if (!swap) {
      return NextResponse.json(
        { error: 'Swap request not found' },
        { status: 404 }
      );
    }

    // Fetch related data
    const [originalShift, targetShift, requester, targetUser, reviewer] = await Promise.all([
      prisma.scheduleShift.findUnique({
        where: { id: swap.originalShiftId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          schedule: {
            select: {
              id: true,
              name: true,
              facility: { select: { id: true, name: true } },
            },
          },
        },
      }),
      swap.targetShiftId
        ? prisma.scheduleShift.findUnique({
            where: { id: swap.targetShiftId },
            include: {
              user: { select: { id: true, name: true, email: true } },
              schedule: { select: { id: true, name: true } },
            },
          })
        : null,
      prisma.user.findUnique({
        where: { id: swap.requesterId },
        select: { id: true, name: true, email: true },
      }),
      swap.targetUserId
        ? prisma.user.findUnique({
            where: { id: swap.targetUserId },
            select: { id: true, name: true, email: true },
          })
        : null,
      swap.reviewedById
        ? prisma.user.findUnique({
            where: { id: swap.reviewedById },
            select: { id: true, name: true },
          })
        : null,
    ]);

    const isManager = hasPermission(session.user.role, 'schedule:manage');

    // Check access - user must be involved or be a manager
    const isInvolved = swap.requesterId === session.user.id || swap.targetUserId === session.user.id;
    if (!isInvolved && !isManager) {
      return NextResponse.json(
        { error: 'You do not have access to this swap request' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...swap,
        originalShift,
        targetShift,
        requester,
        targetUser,
        reviewer,
      },
    });
  } catch (error) {
    console.error('Error fetching swap request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swap request' },
      { status: 500 }
    );
  }
}

// PUT - Approve or deny a swap request (managers only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ swapId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'schedule:manage')) {
      return NextResponse.json(
        { error: 'Only managers can approve or deny swap requests' },
        { status: 403 }
      );
    }

    const { swapId } = await params;
    const body = await request.json();
    const validatedData = reviewSwapSchema.parse(body);

    // Get the swap request
    const swap = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapId },
    });

    if (!swap) {
      return NextResponse.json(
        { error: 'Swap request not found' },
        { status: 404 }
      );
    }

    if (swap.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot ${validatedData.action} a swap request that is ${swap.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check if swap has expired
    if (swap.expiresAt && swap.expiresAt < new Date()) {
      await prisma.shiftSwapRequest.update({
        where: { id: swapId },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        { error: 'This swap request has expired' },
        { status: 400 }
      );
    }

    // Get shift details
    const originalShift = await prisma.scheduleShift.findUnique({
      where: { id: swap.originalShiftId },
      include: { user: { select: { name: true } } },
    });

    if (!originalShift) {
      return NextResponse.json(
        { error: 'Original shift no longer exists' },
        { status: 404 }
      );
    }

    if (validatedData.action === 'approve') {
      // Perform the swap
      if (swap.targetShiftId && swap.targetUserId) {
        const targetShift = await prisma.scheduleShift.findUnique({
          where: { id: swap.targetShiftId },
          include: { user: { select: { name: true } } },
        });

        if (!targetShift) {
          return NextResponse.json(
            { error: 'Target shift no longer exists' },
            { status: 404 }
          );
        }

        // Swap the user assignments
        await prisma.$transaction([
          // Update original shift to target user
          prisma.scheduleShift.update({
            where: { id: swap.originalShiftId },
            data: { userId: swap.targetUserId },
          }),
          // Update target shift to requester
          prisma.scheduleShift.update({
            where: { id: swap.targetShiftId },
            data: { userId: swap.requesterId },
          }),
          // Update swap request status
          prisma.shiftSwapRequest.update({
            where: { id: swapId },
            data: {
              status: 'APPROVED',
              reviewedById: session.user.id,
              reviewedAt: new Date(),
              reviewNotes: validatedData.notes,
            },
          }),
        ]);

        // Notify both users
        await prisma.notification.createMany({
          data: [
            {
              userId: swap.requesterId,
              type: 'SHIFT',
              title: 'Shift Swap Approved',
              message: `Your shift swap request has been approved. Check your updated schedule.`,
              link: '/dashboard/schedule',
            },
            {
              userId: swap.targetUserId,
              type: 'SHIFT',
              title: 'Shift Swap Approved',
              message: `A shift swap involving you has been approved. Check your updated schedule.`,
              link: '/dashboard/schedule',
            },
          ],
        });
      } else {
        // Just releasing the shift (no target)
        await prisma.$transaction([
          prisma.scheduleShift.update({
            where: { id: swap.originalShiftId },
            data: { status: 'OPEN' },
          }),
          prisma.shiftSwapRequest.update({
            where: { id: swapId },
            data: {
              status: 'APPROVED',
              reviewedById: session.user.id,
              reviewedAt: new Date(),
              reviewNotes: validatedData.notes,
            },
          }),
        ]);

        // Notify requester
        await prisma.notification.create({
          data: {
            userId: swap.requesterId,
            type: 'SHIFT',
            title: 'Shift Release Approved',
            message: `Your request to release your shift has been approved.`,
            link: '/dashboard/schedule',
          },
        });
      }
    } else {
      // Deny the swap
      await prisma.shiftSwapRequest.update({
        where: { id: swapId },
        data: {
          status: 'DENIED',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: validatedData.notes,
        },
      });

      // Notify requester
      await prisma.notification.create({
        data: {
          userId: swap.requesterId,
          type: 'SHIFT',
          title: 'Shift Swap Denied',
          message: validatedData.notes
            ? `Your shift swap request was denied: ${validatedData.notes}`
            : 'Your shift swap request was denied.',
          link: '/dashboard/schedule',
        },
      });

      // Notify target user if applicable
      if (swap.targetUserId) {
        await prisma.notification.create({
          data: {
            userId: swap.targetUserId,
            type: 'SHIFT',
            title: 'Shift Swap Denied',
            message: `The shift swap request from ${originalShift.user.name} was denied by management.`,
            link: '/dashboard/schedule',
          },
        });
      }
    }

    // Fetch updated swap
    const updatedSwap = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapId },
    });

    return NextResponse.json({
      success: true,
      data: updatedSwap,
      message: `Swap request ${validatedData.action}d successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error reviewing swap request:', error);
    return NextResponse.json(
      { error: 'Failed to process swap request' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a swap request (only requester or manager)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ swapId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { swapId } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = cancelSwapSchema.parse(body);

    const swap = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapId },
    });

    if (!swap) {
      return NextResponse.json(
        { error: 'Swap request not found' },
        { status: 404 }
      );
    }

    const isManager = hasPermission(session.user.role, 'schedule:manage');
    const isRequester = swap.requesterId === session.user.id;

    if (!isRequester && !isManager) {
      return NextResponse.json(
        { error: 'Only the requester or a manager can cancel this swap request' },
        { status: 403 }
      );
    }

    if (swap.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel a swap request that is ${swap.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Cancel the swap request
    await prisma.shiftSwapRequest.update({
      where: { id: swapId },
      data: {
        status: 'CANCELLED',
        reviewNotes: reason ? `Cancelled: ${reason}` : 'Cancelled by user',
      },
    });

    // Notify affected parties
    const notifications = [];

    if (!isRequester) {
      // Manager cancelled - notify requester
      notifications.push({
        userId: swap.requesterId,
        type: 'SHIFT' as const,
        title: 'Shift Swap Cancelled',
        message: 'Your shift swap request was cancelled by management.',
        link: '/dashboard/schedule',
      });
    }

    if (swap.targetUserId) {
      notifications.push({
        userId: swap.targetUserId,
        type: 'SHIFT' as const,
        title: 'Shift Swap Cancelled',
        message: 'A shift swap request involving you has been cancelled.',
        link: '/dashboard/schedule',
      });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      success: true,
      message: 'Swap request cancelled successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error cancelling swap request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel swap request' },
      { status: 500 }
    );
  }
}
