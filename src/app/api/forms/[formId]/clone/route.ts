import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canAccessFormBuilder } from '@/types';

const cloneSchema = z.object({
  name: z.string().optional(),
});

// POST - Clone a form
export async function POST(
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
        { error: 'You do not have permission to clone forms' },
        { status: 403 }
      );
    }

    const { formId } = await params;
    const body = await request.json();
    const { name: customName } = cloneSchema.parse(body);

    // Fetch the original form with all fields
    const originalForm = await prisma.formTemplate.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!originalForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Create the cloned form
    const clonedForm = await prisma.formTemplate.create({
      data: {
        facilityId: originalForm.facilityId,
        createdById: session.user.id,
        name: customName || `${originalForm.name} (Copy)`,
        description: originalForm.description,
        category: originalForm.category,
        isPublished: false, // Cloned forms start as drafts
        includeWeather: originalForm.includeWeather,
        includeTimestamp: originalForm.includeTimestamp,
        includeUser: originalForm.includeUser,
        includeFacility: originalForm.includeFacility,
        fields: {
          create: originalForm.fields.map((field, index) => ({
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
            options: field.options as { value: string; label: string }[] | undefined,
            orderIndex: field.orderIndex ?? index,
            sectionId: field.sectionId,
            width: field.width,
            conditionalLogic: field.conditionalLogic as Record<string, unknown> | undefined,
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
        entityId: clonedForm.id,
        newValues: {
          name: clonedForm.name,
          clonedFrom: originalForm.id,
          originalName: originalForm.name,
        },
      },
    });

    return NextResponse.json({ success: true, data: clonedForm }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error cloning form:', error);
    return NextResponse.json(
      { error: 'Failed to clone form' },
      { status: 500 }
    );
  }
}
