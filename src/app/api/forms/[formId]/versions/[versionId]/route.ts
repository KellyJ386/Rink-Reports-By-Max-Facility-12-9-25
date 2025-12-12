import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessFormBuilder } from '@/types';

// GET - Get a specific version's details (including field snapshot)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; versionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, versionId } = await params;

    const version = await prisma.formVersion.findFirst({
      where: {
        id: versionId,
        formTemplateId: formId,
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: version.id,
        version: version.version,
        versionType: version.versionType,
        name: version.name,
        description: version.description,
        fieldsSnapshot: version.fieldsSnapshot,
        changeNotes: version.changeNotes,
        isActive: version.isActive,
        submissionCount: version._count.submissions,
        createdAt: version.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}

// POST - Restore this version (creates a new version with old structure)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; versionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to restore form versions' },
        { status: 403 }
      );
    }

    const { formId, versionId } = await params;

    // Fetch the version to restore
    const versionToRestore = await prisma.formVersion.findFirst({
      where: {
        id: versionId,
        formTemplateId: formId,
      },
    });

    if (!versionToRestore) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Fetch current form
    const form = await prisma.formTemplate.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Get next version number
    const latestVersion = await prisma.formVersion.findFirst({
      where: { formTemplateId: formId },
      orderBy: { version: 'desc' },
    });

    const newVersionNumber = (latestVersion?.version || form.version) + 1;

    // Transaction: restore fields and create new version
    const result = await prisma.$transaction(async (tx) => {
      // Delete current fields
      await tx.formField.deleteMany({
        where: { formTemplateId: formId },
      });

      // Restore fields from snapshot
      const fieldsSnapshot = versionToRestore.fieldsSnapshot as Array<{
        fieldType: string;
        label: string;
        placeholder?: string;
        helpText?: string;
        isRequired: boolean;
        minValue?: number;
        maxValue?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        options?: unknown;
        orderIndex: number;
        sectionId?: string;
        width?: string;
        conditionalLogic?: unknown;
        defaultValue?: string;
      }>;

      // Create new fields from snapshot
      for (const field of fieldsSnapshot) {
        await tx.formField.create({
          data: {
            formTemplateId: formId,
            fieldType: field.fieldType as any,
            label: field.label,
            placeholder: field.placeholder,
            helpText: field.helpText,
            isRequired: field.isRequired,
            minValue: field.minValue,
            maxValue: field.maxValue,
            minLength: field.minLength,
            maxLength: field.maxLength,
            pattern: field.pattern,
            options: field.options as any,
            orderIndex: field.orderIndex,
            sectionId: field.sectionId,
            width: field.width || 'full',
            conditionalLogic: field.conditionalLogic as any,
            defaultValue: field.defaultValue,
          },
        });
      }

      // Update form name/description if they were different
      await tx.formTemplate.update({
        where: { id: formId },
        data: {
          name: versionToRestore.name,
          description: versionToRestore.description,
          version: newVersionNumber,
        },
      });

      // Deactivate all versions
      await tx.formVersion.updateMany({
        where: { formTemplateId: formId },
        data: { isActive: false },
      });

      // Create new "RESTORE" version
      const newVersion = await tx.formVersion.create({
        data: {
          formTemplateId: formId,
          version: newVersionNumber,
          versionType: 'RESTORE',
          name: versionToRestore.name,
          description: versionToRestore.description,
          fieldsSnapshot: versionToRestore.fieldsSnapshot,
          changeNotes: `Restored from version ${versionToRestore.version}`,
          changedById: session.user.id,
          isActive: true,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'RESTORE',
          entityType: 'FormVersion',
          entityId: newVersion.id,
          oldValues: { restoredFromVersion: versionToRestore.version },
          newValues: { newVersion: newVersionNumber },
        },
      });

      return newVersion;
    });

    return NextResponse.json({
      success: true,
      message: `Form restored to version ${versionToRestore.version}`,
      data: {
        id: result.id,
        version: result.version,
        versionType: result.versionType,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    );
  }
}
