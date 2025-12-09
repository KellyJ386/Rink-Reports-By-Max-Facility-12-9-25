import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canAccessFormBuilder } from '@/types';

// Schema for form creation/update
const formFieldSchema = z.object({
  id: z.string(),
  fieldType: z.enum([
    'TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'PHONE', 'DROPDOWN',
    'MULTI_SELECT', 'RADIO', 'CHECKBOX', 'TOGGLE', 'DATE', 'TIME',
    'DATETIME', 'FILE_UPLOAD', 'PHOTO', 'SIGNATURE', 'SECTION_HEADER',
    'INSTRUCTIONAL_TEXT', 'BODY_DIAGRAM', 'RINK_DIAGRAM'
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isRequired: z.boolean().default(false),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  orderIndex: z.number(),
  sectionId: z.string().optional(),
  width: z.enum(['full', 'half', 'third']).default('full'),
  conditionalLogic: z.object({
    showIf: z.object({
      fieldId: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
      value: z.union([z.string(), z.number(), z.boolean()]),
    }),
  }).optional(),
  defaultValue: z.string().optional(),
});

const createFormSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  category: z.enum([
    'ICE_OPERATIONS', 'INCIDENT_REPORTING', 'REFRIGERATION',
    'AIR_QUALITY', 'FACILITY_CHECKLIST', 'CUSTOM'
  ]),
  fields: z.array(formFieldSchema),
  includeWeather: z.boolean().default(true),
  includeTimestamp: z.boolean().default(true),
  includeUser: z.boolean().default(true),
  includeFacility: z.boolean().default(true),
});

// GET - List all forms for the user's facility
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const category = searchParams.get('category');
    const isPublished = searchParams.get('published');

    // Build query
    const where: Record<string, unknown> = {};

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (category) {
      where.category = category;
    }

    if (isPublished !== null) {
      where.isPublished = isPublished === 'true';
    }

    // For non-admin users, only show published forms
    if (!canAccessFormBuilder(session.user.role)) {
      where.isPublished = true;
    }

    const forms = await prisma.formTemplate.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            fields: true,
            submissions: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: forms });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}

// POST - Create a new form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create forms' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { facilityId, ...formData } = body;

    // Validate input
    const validatedData = createFormSchema.parse(formData);

    // Verify facility access
    const facilityAccess = await prisma.facilityUser.findFirst({
      where: {
        userId: session.user.id,
        facilityId,
        isActive: true,
      },
    });

    if (!facilityAccess && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'You do not have access to this facility' },
        { status: 403 }
      );
    }

    // Create the form with fields
    const form = await prisma.formTemplate.create({
      data: {
        facilityId,
        createdById: session.user.id,
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        includeWeather: validatedData.includeWeather,
        includeTimestamp: validatedData.includeTimestamp,
        includeUser: validatedData.includeUser,
        includeFacility: validatedData.includeFacility,
        fields: {
          create: validatedData.fields.map((field, index) => ({
            fieldType: field.fieldType,
            label: field.label,
            placeholder: field.placeholder,
            helpText: field.helpText,
            isRequired: field.isRequired,
            minValue: field.minValue,
            maxValue: field.maxValue,
            minLength: field.minLength,
            maxLength: field.maxLength,
            pattern: field.pattern,
            options: field.options,
            orderIndex: field.orderIndex ?? index,
            sectionId: field.sectionId,
            width: field.width,
            conditionalLogic: field.conditionalLogic,
            defaultValue: field.defaultValue,
          })),
        },
      },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' },
        },
        facility: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'FormTemplate',
        entityId: form.id,
        newValues: {
          name: form.name,
          category: form.category,
          fieldsCount: form.fields.length,
        },
      },
    });

    return NextResponse.json({ success: true, data: form }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    );
  }
}
