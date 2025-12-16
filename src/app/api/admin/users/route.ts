import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canAccessFormBuilder } from '@/types';

// Schema for user creation
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'FACILITY_ADMIN', 'MANAGER', 'SUPERVISOR', 'ICE_TECHNICIAN', 'STAFF']),
  facilityId: z.string().optional(),
});

// Schema for user update
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'FACILITY_ADMIN', 'MANAGER', 'SUPERVISOR', 'ICE_TECHNICIAN', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
});

// GET - List users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can list users
    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to view users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};

    if (facilityId) {
      where.facilityUsers = {
        some: { facilityId },
      };
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          facilityUsers: {
            include: {
              facility: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: {
              formSubmissions: true,
              iceDepthReadings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        phone: validatedData.phone,
        role: validatedData.role,
        ...(validatedData.facilityId && {
          facilityUsers: {
            create: {
              facilityId: validatedData.facilityId,
              role: validatedData.role,
            },
          },
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'User',
        entityId: user.id,
        newValues: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT - Update a user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to update users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const validatedData = updateUserSchema.parse(updateData);

    // Prevent deactivating yourself
    if (userId === session.user.id && validatedData.isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        newValues: validatedData,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
