import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canAccessFormBuilder } from '@/types';

// Update form schema
const updateFormSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum([
    'ICE_OPERATIONS', 'INCIDENT_REPORTING', 'REFRIGERATION',
    'AIR_QUALITY', 'FACILITY_CHECKLIST', 'CUSTOM'
  ]).optional(),
  isPublished: z.boolean().optional(),
  includeWeather: z.boolean().optional(),
  includeTimestamp: z.boolean().optional(),
  includeUser: z.boolean().optional(),
  includeFacility: z.boolean().optional(),
  fields: z.array(z.object({
    id: z.string(),
    fieldType: z.string(),
    label: z.string(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    isRequired: z.boolean(),
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
    width: z.enum(['full', 'half', 'third']),
    conditionalLogic: z.object({
      showIf: z.object({
        fieldId: z.string(),
        operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
        value: z.union([z.string(), z.number(), z.boolean()]),
      }),
    }).optional(),
    defaultValue: z.string().optional(),
  })).optional(),
});

// GET - Get a single form by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId } = await params;

    const form = await prisma.formTemplate.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' },
        },
        facility: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check access: either admin, or form is published
    const hasAccess =
      canAccessFormBuilder(session.user.role) ||
      form.isPublished;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this form' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: form });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}

// PUT - Update a form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit forms' },
        { status: 403 }
      );
    }

    const { formId } = await params;
    const body = await request.json();
    const validatedData = updateFormSchema.parse(body);

    // Check if form exists
    const existingForm = await prisma.formTemplate.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Store old values for audit
    const oldValues = {
      name: existingForm.name,
      category: existingForm.category,
      isPublished: existingForm.isPublished,
    };

    // Update form in a transaction
    const updatedForm = await prisma.$transaction(async (tx) => {
      // If fields are provided, delete old and create new
      if (validatedData.fields) {
        await tx.formField.deleteMany({
          where: { formTemplateId: formId },
        });

        await tx.formField.createMany({
          data: validatedData.fields.map((field, index) => ({
            formTemplateId: formId,
            fieldType: field.fieldType as 'TEXT',
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
        });
      }

      // Update form template
      return tx.formTemplate.update({
        where: { id: formId },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          category: validatedData.category,
          isPublished: validatedData.isPublished,
          includeWeather: validatedData.includeWeather,
          includeTimestamp: validatedData.includeTimestamp,
          includeUser: validatedData.includeUser,
          includeFacility: validatedData.includeFacility,
          version: { increment: 1 },
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
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'FormTemplate',
        entityId: formId,
        oldValues,
        newValues: {
          name: updatedForm.name,
          category: updatedForm.category,
          isPublished: updatedForm.isPublished,
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedForm });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete forms' },
        { status: 403 }
      );
    }

    const { formId } = await params;

    // Check if form exists and has submissions
    const form = await prisma.formTemplate.findUnique({
      where: { id: formId },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Soft delete by marking as inactive if there are submissions
    if (form._count.submissions > 0) {
      await prisma.formTemplate.update({
        where: { id: formId },
        data: { isActive: false, isPublished: false },
      });
    } else {
      // Hard delete if no submissions
      await prisma.formTemplate.delete({
        where: { id: formId },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'FormTemplate',
        entityId: formId,
        oldValues: {
          name: form.name,
          category: form.category,
          hadSubmissions: form._count.submissions > 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: form._count.submissions > 0
        ? 'Form archived (has existing submissions)'
        : 'Form deleted'
    });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    );
  }
}
