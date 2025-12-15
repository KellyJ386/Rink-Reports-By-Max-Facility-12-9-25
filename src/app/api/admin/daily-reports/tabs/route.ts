import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';

// Schema for creating a new tab
const createTabSchema = z.object({
  facilityId: z.string(),
  name: z.string().min(1).max(50),
  category: z.enum([
    'FRONT_DESK',
    'CUSTODIAL',
    'PRO_SHOP',
    'CONCESSIONS',
    'LEARN_TO_SKATE',
    'PUBLIC_SESSIONS',
    'SAFETY_EMERGENCY',
    'GENERAL_FACILITY',
    'LOCKER_ROOMS',
    'MAINTENANCE',
    'EVENTS',
    'HOCKEY_PROGRAMS',
    'FIGURE_SKATING',
    'RENTALS',
    'CUSTOM',
  ]),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  formTemplateId: z.string().optional().nullable(),
  requiresCompletion: z.boolean().optional(),
  allowMultipleSubmissions: z.boolean().optional(),
  roleAssignments: z
    .array(
      z.object({
        role: z.enum([
          'SUPER_ADMIN',
          'FACILITY_ADMIN',
          'MANAGER',
          'SUPERVISOR',
          'ICE_TECHNICIAN',
          'STAFF',
        ]),
        canView: z.boolean().optional(),
        canSubmit: z.boolean().optional(),
        canReview: z.boolean().optional(),
      })
    )
    .optional(),
});

// GET - List all tabs for a facility
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    if (!hasPermission(session.user.role, 'admin', 'read')) {
      return NextResponse.json(
        { error: 'You do not have permission to access this resource' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!facilityId) {
      return NextResponse.json(
        { error: 'facilityId is required' },
        { status: 400 }
      );
    }

    const tabs = await prisma.dailyReportTab.findMany({
      where: {
        facilityId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            category: true,
            isPublished: true,
          },
        },
        roleAssignments: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: tabs,
    });
  } catch (error) {
    console.error('Error fetching daily report tabs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tabs' },
      { status: 500 }
    );
  }
}

// POST - Create a new tab
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    if (!hasPermission(session.user.role, 'admin', 'write')) {
      return NextResponse.json(
        { error: 'You do not have permission to create tabs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTabSchema.parse(body);

    // Check if facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: validatedData.facilityId },
    });

    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      );
    }

    // Count existing tabs
    const existingTabCount = await prisma.dailyReportTab.count({
      where: { facilityId: validatedData.facilityId },
    });

    // Max 15 tabs
    if (existingTabCount >= 15) {
      return NextResponse.json(
        { error: 'Maximum of 15 tabs allowed per facility' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingTab = await prisma.dailyReportTab.findFirst({
      where: {
        facilityId: validatedData.facilityId,
        name: validatedData.name,
      },
    });

    if (existingTab) {
      return NextResponse.json(
        { error: 'A tab with this name already exists' },
        { status: 400 }
      );
    }

    // Create the tab
    const tab = await prisma.dailyReportTab.create({
      data: {
        facilityId: validatedData.facilityId,
        name: validatedData.name,
        category: validatedData.category,
        description: validatedData.description,
        icon: validatedData.icon,
        color: validatedData.color,
        orderIndex: existingTabCount, // Add at the end
        formTemplateId: validatedData.formTemplateId,
        requiresCompletion: validatedData.requiresCompletion ?? false,
        allowMultipleSubmissions: validatedData.allowMultipleSubmissions ?? true,
        roleAssignments: validatedData.roleAssignments
          ? {
              create: validatedData.roleAssignments.map((ra) => ({
                role: ra.role,
                canView: ra.canView ?? true,
                canSubmit: ra.canSubmit ?? true,
                canReview: ra.canReview ?? false,
              })),
            }
          : undefined,
      },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        roleAssignments: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'DailyReportTab',
        entityId: tab.id,
        newValues: {
          name: tab.name,
          category: tab.category,
          facilityId: tab.facilityId,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: tab,
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
    console.error('Error creating daily report tab:', error);
    return NextResponse.json(
      { error: 'Failed to create tab' },
      { status: 500 }
    );
  }
}
