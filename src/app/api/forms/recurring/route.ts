import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/types';

// Schema for recurring form
const recurringFormSchema = z.object({
  facilityId: z.string(),
  formTemplateId: z.string(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional().default([]),
  dayOfMonth: z.number().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  assignedRole: z.enum(['STAFF', 'MANAGER', 'FACILITY_ADMIN', 'SUPER_ADMIN']).optional(),
  assignedUserId: z.string().optional(),
  reminderEnabled: z.boolean().default(true),
  reminderMinutes: z.number().min(0).default(60),
  dueInHours: z.number().min(1).default(24),
  isActive: z.boolean().default(true),
});

// GET - List recurring forms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const formTemplateId = searchParams.get('formTemplateId');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};

    if (facilityId) where.facilityId = facilityId;
    if (formTemplateId) where.formTemplateId = formTemplateId;
    if (isActive !== null) where.isActive = isActive === 'true';

    const recurringForms = await prisma.recurringForm.findMany({
      where,
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            category: true,
            isActive: true,
            facility: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with assigned user info if applicable
    const enriched = await Promise.all(
      recurringForms.map(async (rf) => {
        let assignedUser = null;
        if (rf.assignedUserId) {
          assignedUser = await prisma.user.findUnique({
            where: { id: rf.assignedUserId },
            select: { id: true, name: true, email: true },
          });
        }
        return { ...rf, assignedUser };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching recurring forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring forms' },
      { status: 500 }
    );
  }
}

// POST - Create a new recurring form schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'forms:manage')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage forms' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = recurringFormSchema.parse(body);

    // Verify form template exists and belongs to facility
    const formTemplate = await prisma.formTemplate.findFirst({
      where: {
        id: validatedData.formTemplateId,
        facilityId: validatedData.facilityId,
      },
    });

    if (!formTemplate) {
      return NextResponse.json(
        { error: 'Form template not found in this facility' },
        { status: 404 }
      );
    }

    // Verify assigned user exists if specified
    if (validatedData.assignedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: validatedData.assignedUserId },
      });
      if (!user) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 404 }
        );
      }
    }

    // Validate frequency-specific fields
    if (validatedData.frequency === 'WEEKLY' && validatedData.daysOfWeek.length === 0) {
      return NextResponse.json(
        { error: 'Weekly frequency requires at least one day selected' },
        { status: 400 }
      );
    }

    if (validatedData.frequency === 'MONTHLY' && !validatedData.dayOfMonth) {
      return NextResponse.json(
        { error: 'Monthly frequency requires day of month' },
        { status: 400 }
      );
    }

    // Create the recurring form
    const recurringForm = await prisma.recurringForm.create({
      data: {
        facilityId: validatedData.facilityId,
        formTemplateId: validatedData.formTemplateId,
        frequency: validatedData.frequency,
        daysOfWeek: validatedData.daysOfWeek,
        dayOfMonth: validatedData.dayOfMonth,
        timeOfDay: validatedData.timeOfDay,
        assignedRole: validatedData.assignedRole,
        assignedUserId: validatedData.assignedUserId,
        reminderEnabled: validatedData.reminderEnabled,
        reminderMinutes: validatedData.reminderMinutes,
        dueInHours: validatedData.dueInHours,
        isActive: validatedData.isActive,
      },
      include: {
        formTemplate: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: recurringForm },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating recurring form:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring form' },
      { status: 500 }
    );
  }
}
