import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  facilityIds: z.array(z.string()).optional(),
});

interface RouteParams {
  params: Promise<{ groupId: string }>;
}

// GET /api/organization/groups/[groupId] - Get single group
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await prisma.facilityGroup.findUnique({
      where: { id: groupId },
      include: {
        facilities: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get facility details
    const facilityIds = group.facilities.map((f) => f.facilityId);
    const facilities = await prisma.facility.findMany({
      where: { id: { in: facilityIds } },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      ...group,
      facilities,
    });
  } catch (error) {
    console.error('Error fetching facility group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facility group' },
      { status: 500 }
    );
  }
}

// PUT /api/organization/groups/[groupId] - Update group
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'admin', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { groupId } = await params;
    const body = await request.json();
    const validatedData = updateGroupSchema.parse(body);

    const existingGroup = await prisma.facilityGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check for duplicate name if changing
    if (validatedData.name && validatedData.name !== existingGroup.name) {
      const duplicate = await prisma.facilityGroup.findFirst({
        where: {
          organizationId: existingGroup.organizationId,
          name: validatedData.name,
          id: { not: groupId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A group with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update group and facilities in transaction
    const group = await prisma.$transaction(async (tx) => {
      // Update group details
      const updatedGroup = await tx.facilityGroup.update({
        where: { id: groupId },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          color: validatedData.color,
        },
      });

      // Update facility memberships if provided
      if (validatedData.facilityIds !== undefined) {
        // Remove all existing memberships
        await tx.facilityGroupMember.deleteMany({
          where: { facilityGroupId: groupId },
        });

        // Add new memberships
        if (validatedData.facilityIds.length > 0) {
          await tx.facilityGroupMember.createMany({
            data: validatedData.facilityIds.map((facilityId) => ({
              facilityGroupId: groupId,
              facilityId,
            })),
          });
        }
      }

      return updatedGroup;
    });

    // Get updated facilities
    const facilities = await prisma.facilityGroupMember.findMany({
      where: { facilityGroupId: groupId },
    });

    const facilityDetails = await prisma.facility.findMany({
      where: { id: { in: facilities.map((f) => f.facilityId) } },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      ...group,
      facilities: facilityDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating facility group:', error);
    return NextResponse.json(
      { error: 'Failed to update facility group' },
      { status: 500 }
    );
  }
}

// DELETE /api/organization/groups/[groupId] - Delete group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'admin', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { groupId } = await params;

    const existingGroup = await prisma.facilityGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    await prisma.facilityGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting facility group:', error);
    return NextResponse.json(
      { error: 'Failed to delete facility group' },
      { status: 500 }
    );
  }
}
