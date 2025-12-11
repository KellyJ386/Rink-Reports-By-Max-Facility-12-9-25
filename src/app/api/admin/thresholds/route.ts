import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canAccessFormBuilder, DEFAULT_THRESHOLDS } from '@/types';

// Schema for threshold creation/update
const thresholdSchema = z.object({
  id: z.string().optional(),
  facilityId: z.string(),
  rinkId: z.string().nullish(),
  module: z.enum(['ICE_DEPTH', 'REFRIGERATION', 'AIR_QUALITY']),
  parameterName: z.string().min(1),
  minValue: z.number().nullish(),
  maxValue: z.number().nullish(),
  warningMin: z.number().nullish(),
  warningMax: z.number().nullish(),
  alertEnabled: z.boolean().default(true),
  alertSeverity: z.enum(['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL']).default('MODERATE'),
  isActive: z.boolean().default(true),
});

// Schema for bulk update
const bulkUpdateSchema = z.object({
  thresholds: z.array(thresholdSchema),
});

// GET - List thresholds for a facility
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const module = searchParams.get('module');
    const rinkId = searchParams.get('rinkId');
    const includeDefaults = searchParams.get('includeDefaults') === 'true';

    if (!facilityId) {
      return NextResponse.json({ error: 'Facility ID required' }, { status: 400 });
    }

    // Build query
    const where: Record<string, unknown> = { facilityId };
    if (module) where.module = module;
    if (rinkId) where.rinkId = rinkId;

    // Fetch existing thresholds
    const thresholds = await prisma.thresholdConfig.findMany({
      where,
      orderBy: [{ module: 'asc' }, { parameterName: 'asc' }],
    });

    // Fetch rinks for the facility (for rink names)
    const rinks = await prisma.rink.findMany({
      where: { facilityId },
      select: { id: true, name: true },
    });

    const rinkMap = new Map(rinks.map((r) => [r.id, r.name]));

    // Enrich thresholds with rink names
    const enrichedThresholds = thresholds.map((t) => ({
      ...t,
      rinkName: t.rinkId ? rinkMap.get(t.rinkId) : null,
    }));

    // If includeDefaults, merge with defaults for any missing parameters
    if (includeDefaults) {
      const existingKeys = new Set(
        thresholds.map((t) => `${t.module}:${t.parameterName}:${t.rinkId || 'facility'}`)
      );

      const defaultsToAdd: Array<{
        id: null;
        facilityId: string;
        rinkId: null;
        module: string;
        parameterName: string;
        minValue: number | null;
        maxValue: number | null;
        warningMin: number | null;
        warningMax: number | null;
        alertEnabled: boolean;
        alertSeverity: string;
        isActive: boolean;
        isDefault: boolean;
        label: string;
        unit: string;
      }> = [];

      for (const [moduleName, params] of Object.entries(DEFAULT_THRESHOLDS)) {
        for (const [paramName, defaults] of Object.entries(params)) {
          const key = `${moduleName}:${paramName}:facility`;
          if (!existingKeys.has(key)) {
            defaultsToAdd.push({
              id: null,
              facilityId,
              rinkId: null,
              module: moduleName,
              parameterName: paramName,
              minValue: defaults.min ?? null,
              maxValue: defaults.max ?? null,
              warningMin: defaults.warningMin ?? null,
              warningMax: defaults.warningMax ?? null,
              alertEnabled: true,
              alertSeverity: 'MODERATE',
              isActive: true,
              isDefault: true,
              label: defaults.label,
              unit: defaults.unit,
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          thresholds: enrichedThresholds,
          defaults: defaultsToAdd,
          rinks,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        thresholds: enrichedThresholds,
        rinks,
      },
    });
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thresholds' },
      { status: 500 }
    );
  }
}

// POST - Create new threshold(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to manage thresholds' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Handle bulk create
    if (body.thresholds && Array.isArray(body.thresholds)) {
      const validated = bulkUpdateSchema.parse(body);

      const created = await prisma.$transaction(
        validated.thresholds.map((t) =>
          prisma.thresholdConfig.upsert({
            where: {
              facilityId_rinkId_module_parameterName: {
                facilityId: t.facilityId,
                rinkId: t.rinkId || null,
                module: t.module,
                parameterName: t.parameterName,
              },
            },
            create: {
              facilityId: t.facilityId,
              rinkId: t.rinkId || null,
              module: t.module,
              parameterName: t.parameterName,
              minValue: t.minValue,
              maxValue: t.maxValue,
              warningMin: t.warningMin,
              warningMax: t.warningMax,
              alertEnabled: t.alertEnabled,
              alertSeverity: t.alertSeverity,
              isActive: t.isActive,
            },
            update: {
              minValue: t.minValue,
              maxValue: t.maxValue,
              warningMin: t.warningMin,
              warningMax: t.warningMax,
              alertEnabled: t.alertEnabled,
              alertSeverity: t.alertSeverity,
              isActive: t.isActive,
            },
          })
        )
      );

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'BULK_UPDATE',
          entityType: 'ThresholdConfig',
          entityId: body.thresholds[0]?.facilityId || 'unknown',
          newValues: { count: created.length },
        },
      });

      return NextResponse.json({ success: true, data: created }, { status: 201 });
    }

    // Single threshold create
    const validated = thresholdSchema.parse(body);

    const threshold = await prisma.thresholdConfig.create({
      data: {
        facilityId: validated.facilityId,
        rinkId: validated.rinkId || null,
        module: validated.module,
        parameterName: validated.parameterName,
        minValue: validated.minValue,
        maxValue: validated.maxValue,
        warningMin: validated.warningMin,
        warningMax: validated.warningMax,
        alertEnabled: validated.alertEnabled,
        alertSeverity: validated.alertSeverity,
        isActive: validated.isActive,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'ThresholdConfig',
        entityId: threshold.id,
        newValues: validated,
      },
    });

    return NextResponse.json({ success: true, data: threshold }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating threshold:', error);
    return NextResponse.json(
      { error: 'Failed to create threshold' },
      { status: 500 }
    );
  }
}

// PUT - Update threshold
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to manage thresholds' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Threshold ID required' }, { status: 400 });
    }

    const oldThreshold = await prisma.thresholdConfig.findUnique({
      where: { id },
    });

    if (!oldThreshold) {
      return NextResponse.json({ error: 'Threshold not found' }, { status: 404 });
    }

    const threshold = await prisma.thresholdConfig.update({
      where: { id },
      data: {
        minValue: updateData.minValue,
        maxValue: updateData.maxValue,
        warningMin: updateData.warningMin,
        warningMax: updateData.warningMax,
        alertEnabled: updateData.alertEnabled,
        alertSeverity: updateData.alertSeverity,
        isActive: updateData.isActive,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'ThresholdConfig',
        entityId: threshold.id,
        oldValues: oldThreshold,
        newValues: threshold,
      },
    });

    return NextResponse.json({ success: true, data: threshold });
  } catch (error) {
    console.error('Error updating threshold:', error);
    return NextResponse.json(
      { error: 'Failed to update threshold' },
      { status: 500 }
    );
  }
}

// DELETE - Delete threshold
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to manage thresholds' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Threshold ID required' }, { status: 400 });
    }

    const threshold = await prisma.thresholdConfig.findUnique({
      where: { id },
    });

    if (!threshold) {
      return NextResponse.json({ error: 'Threshold not found' }, { status: 404 });
    }

    await prisma.thresholdConfig.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'ThresholdConfig',
        entityId: id,
        oldValues: threshold,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting threshold:', error);
    return NextResponse.json(
      { error: 'Failed to delete threshold' },
      { status: 500 }
    );
  }
}
