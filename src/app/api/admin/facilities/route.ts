import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canAccessFormBuilder } from '@/types';

// Schema for facility creation
const createFacilitySchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().default('America/New_York'),
});

// Schema for rink creation within facility
const createRinkSchema = z.object({
  facilityId: z.string(),
  name: z.string().min(1),
  rinkType: z.enum(['STANDARD', 'OLYMPIC', 'RECREATIONAL', 'CURLING', 'CUSTOM']).default('STANDARD'),
  length: z.number().optional(),
  width: z.number().optional(),
  icePointsConfig: z.number().refine((val) => [25, 35, 47].includes(val)).default(25),
});

// GET - List facilities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (organizationId) where.organizationId = organizationId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Non-admins only see facilities they have access to
    if (!canAccessFormBuilder(session.user.role)) {
      where.facilityUsers = {
        some: { userId: session.user.id, isActive: true },
      };
    }

    const facilities = await prisma.facility.findMany({
      where,
      include: {
        organization: {
          select: { id: true, name: true },
        },
        rinks: {
          select: {
            id: true,
            name: true,
            rinkType: true,
            icePointsConfig: true,
          },
        },
        _count: {
          select: {
            facilityUsers: true,
            formTemplates: true,
            formSubmissions: true,
            incidentReports: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: facilities });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    );
  }
}

// POST - Create a new facility or rink
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only super admins can create facilities' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'rink') {
      const validatedData = createRinkSchema.parse(data);

      const rink = await prisma.rink.create({
        data: {
          facilityId: validatedData.facilityId,
          name: validatedData.name,
          rinkType: validatedData.rinkType,
          length: validatedData.length,
          width: validatedData.width,
          surfaceArea: validatedData.length && validatedData.width
            ? validatedData.length * validatedData.width
            : null,
          icePointsConfig: validatedData.icePointsConfig,
        },
      });

      return NextResponse.json({ success: true, data: rink }, { status: 201 });
    }

    // Create facility
    const validatedData = createFacilitySchema.parse(data);

    // Check if slug is unique within organization
    const existingFacility = await prisma.facility.findFirst({
      where: {
        organizationId: validatedData.organizationId,
        slug: validatedData.slug,
      },
    });

    if (existingFacility) {
      return NextResponse.json(
        { error: 'A facility with this slug already exists' },
        { status: 409 }
      );
    }

    const facility = await prisma.facility.create({
      data: validatedData,
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Facility',
        entityId: facility.id,
        newValues: {
          name: facility.name,
          slug: facility.slug,
        },
      },
    });

    return NextResponse.json({ success: true, data: facility }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating facility:', error);
    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    );
  }
}

// PUT - Update a facility
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to update facilities' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { facilityId, ...updateData } = body;

    if (!facilityId) {
      return NextResponse.json({ error: 'Facility ID required' }, { status: 400 });
    }

    const facility = await prisma.facility.update({
      where: { id: facilityId },
      data: updateData,
      include: {
        organization: {
          select: { id: true, name: true },
        },
        rinks: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Facility',
        entityId: facility.id,
        newValues: updateData,
      },
    });

    return NextResponse.json({ success: true, data: facility });
  } catch (error) {
    console.error('Error updating facility:', error);
    return NextResponse.json(
      { error: 'Failed to update facility' },
      { status: 500 }
    );
  }
}
