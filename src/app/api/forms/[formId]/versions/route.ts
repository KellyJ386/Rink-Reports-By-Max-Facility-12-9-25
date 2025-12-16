import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canAccessFormBuilder } from '@/types';

// GET - List all versions of a form
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

    // Fetch all versions with submission counts
    const versions = await prisma.formVersion.findMany({
      where: { formTemplateId: formId },
      orderBy: { version: 'desc' },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    // Get the current form to include its info
    const currentForm = await prisma.formTemplate.findUnique({
      where: { id: formId },
      select: {
        id: true,
        name: true,
        version: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        currentVersion: currentForm?.version,
        versions: versions.map((v) => ({
          id: v.id,
          version: v.version,
          versionType: v.versionType,
          name: v.name,
          description: v.description,
          changeNotes: v.changeNotes,
          isActive: v.isActive,
          submissionCount: v._count.submissions,
          createdAt: v.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching form versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// Schema for creating a new version
const createVersionSchema = z.object({
  versionType: z.enum(['MAJOR', 'MINOR']).default('MINOR'),
  changeNotes: z.string().optional(),
});

// POST - Save current form state as a new version
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
        { error: 'You do not have permission to manage form versions' },
        { status: 403 }
      );
    }

    const { formId } = await params;
    const body = await request.json();
    const { versionType, changeNotes } = createVersionSchema.parse(body);

    // Fetch the current form with fields
    const form = await prisma.formTemplate.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Calculate new version number
    const latestVersion = await prisma.formVersion.findFirst({
      where: { formTemplateId: formId },
      orderBy: { version: 'desc' },
    });

    let newVersionNumber: number;
    if (versionType === 'MAJOR') {
      // Major version: 1.x -> 2.0, 2.x -> 3.0
      const currentMajor = Math.floor((latestVersion?.version || form.version) / 10);
      newVersionNumber = (currentMajor + 1) * 10; // e.g., 20 for v2.0
    } else {
      // Minor version: increment by 1
      newVersionNumber = (latestVersion?.version || form.version) + 1;
    }

    // Deactivate all existing versions
    await prisma.formVersion.updateMany({
      where: { formTemplateId: formId },
      data: { isActive: false },
    });

    // Create the new version with field snapshot
    const newVersion = await prisma.formVersion.create({
      data: {
        formTemplateId: formId,
        version: newVersionNumber,
        versionType,
        name: form.name,
        description: form.description,
        fieldsSnapshot: form.fields.map((f) => ({
          id: f.id,
          fieldType: f.fieldType,
          label: f.label,
          placeholder: f.placeholder,
          helpText: f.helpText,
          isRequired: f.isRequired,
          minValue: f.minValue,
          maxValue: f.maxValue,
          minLength: f.minLength,
          maxLength: f.maxLength,
          pattern: f.pattern,
          options: f.options,
          orderIndex: f.orderIndex,
          sectionId: f.sectionId,
          width: f.width,
          conditionalLogic: f.conditionalLogic,
          defaultValue: f.defaultValue,
        })),
        changeNotes,
        changedById: session.user.id,
        isActive: true,
      },
    });

    // Update form's version number
    await prisma.formTemplate.update({
      where: { id: formId },
      data: { version: newVersionNumber },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'FormVersion',
        entityId: newVersion.id,
        newValues: {
          formId,
          version: newVersionNumber,
          versionType,
          changeNotes,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newVersion.id,
        version: newVersion.version,
        versionType: newVersion.versionType,
        changeNotes: newVersion.changeNotes,
        createdAt: newVersion.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating form version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
