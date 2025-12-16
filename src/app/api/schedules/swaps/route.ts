import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/types';

// Schema for creating a shift swap request
const createSwapSchema = z.object({
  originalShiftId: z.string(),
  targetShiftId: z.string().optional(), // Optional - null if just giving away
  reason: z.string().optional(),
  expiresAt: z.string().optional(), // ISO date string
});

// GET - List shift swap requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const facilityId = searchParams.get('facilityId');
    const myRequests = searchParams.get('myRequests') === 'true';
    const pendingApproval = searchParams.get('pendingApproval') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const isManager = hasPermission(session.user.role, 'schedule:manage');

    // Build query
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    // If user is not a manager, they can only see their own requests
    // or requests targeting their shifts
    if (!isManager || myRequests) {
      where.OR = [
        { requesterId: session.user.id },
        { targetUserId: session.user.id },
      ];
    }

    // For managers viewing pending approvals, show pending swaps for their facility
    if (pendingApproval && isManager) {
      where.status = 'PENDING';
      // We'll filter by facility through the originalShift relation
    }

    // Get swaps with related data
    const [swaps, total] = await Promise.all([
      prisma.shiftSwapRequest.findMany({
        where,
        include: {
          // Include requester info
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.shiftSwapRequest.count({ where }),
    ]);

    // Fetch related shift and user data
    const enrichedSwaps = await Promise.all(
      swaps.map(async (swap) => {
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

        // Filter by facility if specified
        if (facilityId && originalShift?.schedule?.facility?.id !== facilityId) {
          return null;
        }

        return {
          ...swap,
          originalShift,
          targetShift,
          requester,
          targetUser,
          reviewer,
        };
      })
    );

    // Filter out nulls (facility filtering)
    const filteredSwaps = enrichedSwaps.filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        items: filteredSwaps,
        total: facilityId ? filteredSwaps.length : total,
        page,
        pageSize,
        totalPages: Math.ceil((facilityId ? filteredSwaps.length : total) / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching shift swap requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift swap requests' },
      { status: 500 }
    );
  }
}

// POST - Create a new shift swap request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSwapSchema.parse(body);

    // Get the original shift and verify ownership
    const originalShift = await prisma.scheduleShift.findUnique({
      where: { id: validatedData.originalShiftId },
      include: {
        schedule: {
          select: {
            facilityId: true,
            status: true,
          },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!originalShift) {
      return NextResponse.json(
        { error: 'Original shift not found' },
        { status: 404 }
      );
    }

    // Verify user owns this shift
    if (originalShift.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only request swaps for your own shifts' },
        { status: 403 }
      );
    }

    // Check shift is in the future
    if (originalShift.shiftDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot swap past shifts' },
        { status: 400 }
      );
    }

    // Check shift is not already cancelled or swapped
    if (originalShift.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot swap a cancelled shift' },
        { status: 400 }
      );
    }

    // Check for existing pending swap request for this shift
    const existingRequest = await prisma.shiftSwapRequest.findFirst({
      where: {
        originalShiftId: validatedData.originalShiftId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A swap request already exists for this shift' },
        { status: 409 }
      );
    }

    let targetShift = null;
    let targetUserId = null;

    // If targeting a specific shift
    if (validatedData.targetShiftId) {
      targetShift = await prisma.scheduleShift.findUnique({
        where: { id: validatedData.targetShiftId },
        include: {
          schedule: { select: { facilityId: true } },
          user: { select: { id: true, name: true } },
        },
      });

      if (!targetShift) {
        return NextResponse.json(
          { error: 'Target shift not found' },
          { status: 404 }
        );
      }

      // Verify same facility
      if (targetShift.schedule.facilityId !== originalShift.schedule.facilityId) {
        return NextResponse.json(
          { error: 'Can only swap shifts within the same facility' },
          { status: 400 }
        );
      }

      // Verify target is not owned by requester
      if (targetShift.userId === session.user.id) {
        return NextResponse.json(
          { error: 'Cannot swap with your own shift' },
          { status: 400 }
        );
      }

      // Check target shift is also in the future
      if (targetShift.shiftDate < new Date()) {
        return NextResponse.json(
          { error: 'Target shift must be in the future' },
          { status: 400 }
        );
      }

      // Verify same position/role if positions are defined
      if (originalShift.position && targetShift.position &&
          originalShift.position !== targetShift.position) {
        return NextResponse.json(
          { error: 'Can only swap shifts with the same position/role' },
          { status: 400 }
        );
      }

      targetUserId = targetShift.userId;
    }

    // Calculate expiration (default 7 days or shift date, whichever is sooner)
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    const shiftDateExpiry = new Date(originalShift.shiftDate);
    shiftDateExpiry.setDate(shiftDateExpiry.getDate() - 1); // Day before shift

    let expiresAt = defaultExpiry < shiftDateExpiry ? defaultExpiry : shiftDateExpiry;
    if (validatedData.expiresAt) {
      const customExpiry = new Date(validatedData.expiresAt);
      if (customExpiry < expiresAt) {
        expiresAt = customExpiry;
      }
    }

    // Create the swap request
    const swapRequest = await prisma.shiftSwapRequest.create({
      data: {
        requesterId: session.user.id,
        originalShiftId: validatedData.originalShiftId,
        targetShiftId: validatedData.targetShiftId || null,
        targetUserId,
        reason: validatedData.reason,
        expiresAt,
      },
    });

    // Create notification for target user if this is a direct swap request
    if (targetUserId) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'SHIFT',
          title: 'Shift Swap Request',
          message: `${originalShift.user.name} has requested to swap shifts with you.`,
          link: '/dashboard/schedule?tab=swaps',
        },
      });
    }

    // Notify facility managers of new swap request
    const facilityManagers = await prisma.facilityUser.findMany({
      where: {
        facilityId: originalShift.schedule.facilityId,
        role: { in: ['FACILITY_ADMIN', 'MANAGER', 'SUPER_ADMIN'] },
        isActive: true,
      },
      select: { userId: true },
    });

    if (facilityManagers.length > 0) {
      await prisma.notification.createMany({
        data: facilityManagers.map((fm) => ({
          userId: fm.userId,
          type: 'SHIFT' as const,
          title: 'New Shift Swap Request',
          message: `${originalShift.user.name} has submitted a shift swap request for review.`,
          link: '/dashboard/schedule?tab=swaps',
        })),
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...swapRequest,
          originalShift: {
            ...originalShift,
            schedule: undefined,
          },
          targetShift: targetShift
            ? {
                ...targetShift,
                schedule: undefined,
              }
            : null,
        },
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
    console.error('Error creating shift swap request:', error);
    return NextResponse.json(
      { error: 'Failed to create shift swap request' },
      { status: 500 }
    );
  }
}
