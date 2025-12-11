import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createGroupSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  facilityIds: z.array(z.string()).optional(),
});

// GET /api/organization/groups - List facility groups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'admin', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const where = organizationId ? { organizationId } : {};

    const groups = await prisma.facilityGroup.findMany({
      where,
      include: {
        facilities: {
          include: {
            facilityGroup: false,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get facility details for each group
    const groupsWithFacilities = await Promise.all(
      groups.map(async (group) => {
        const facilityIds = group.facilities.map((f) => f.facilityId);
        const facilities = await prisma.facility.findMany({
          where: { id: { in: facilityIds } },
          select: { id: true, name: true },
        });

        return {
          ...group,
          facilities,
        };
      })
    );

    return NextResponse.json(groupsWithFacilities);
  } catch (error) {
    console.error('Error fetching facility groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facility groups' },
      { status: 500 }
    );
  }
}

// POST /api/organization/groups - Create facility group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'admin', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createGroupSchema.parse(body);

    // Check for duplicate name
    const existing = await prisma.facilityGroup.findFirst({
      where: {
        organizationId: validatedData.organizationId,
        name: validatedData.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 409 }
      );
    }

    const group = await prisma.facilityGroup.create({
      data: {
        organizationId: validatedData.organizationId,
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        facilities: validatedData.facilityIds
          ? {
              create: validatedData.facilityIds.map((facilityId) => ({
                facilityId,
              })),
            }
          : undefined,
      },
      include: {
        facilities: true,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating facility group:', error);
    return NextResponse.json(
      { error: 'Failed to create facility group' },
      { status: 500 }
    );
  }
}
