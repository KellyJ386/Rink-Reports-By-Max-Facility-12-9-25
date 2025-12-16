import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { canAccessFormBuilder } from '@/types';

// Schema for notification config creation/update
const notificationConfigSchema = z.object({
  id: z.string().optional(),
  facilityId: z.string(),
  module: z.enum(['ICE_DEPTH', 'REFRIGERATION', 'AIR_QUALITY']),
  alertSeverity: z.enum(['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL']),
  recipientRole: z.enum(['SUPER_ADMIN', 'FACILITY_ADMIN', 'MANAGER', 'SUPERVISOR', 'ICE_TECHNICIAN', 'STAFF']).nullish(),
  recipientUserId: z.string().nullish(),
  channels: z.array(z.enum(['EMAIL', 'SMS', 'IN_APP', 'PUSH'])),
  isEnabled: z.boolean().default(true),
  requiresAck: z.boolean().default(false),
});

// GET - List notification configs for a facility
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const module = searchParams.get('module');

    if (!facilityId) {
      return NextResponse.json({ error: 'Facility ID required' }, { status: 400 });
    }

    // Build query
    const where: Record<string, unknown> = { facilityId };
    if (module) where.module = module;

    // Fetch notification configs
    const configs = await prisma.notificationConfig.findMany({
      where,
      orderBy: [{ module: 'asc' }, { alertSeverity: 'asc' }],
    });

    // Fetch users for the facility (for recipient names)
    const facilityUsers = await prisma.facilityUser.findMany({
      where: { facilityId, isActive: true },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const userMap = new Map(
      facilityUsers.map((fu) => [fu.userId, fu.user.name || fu.user.email])
    );

    // Enrich configs with recipient names
    const enrichedConfigs = configs.map((c) => ({
      ...c,
      recipientName: c.recipientUserId ? userMap.get(c.recipientUserId) : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        configs: enrichedConfigs,
        users: facilityUsers.map((fu) => ({
          id: fu.userId,
          name: fu.user.name || fu.user.email,
          role: fu.role,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching notification configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification configs' },
      { status: 500 }
    );
  }
}

// POST - Create notification config
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to manage notification settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = notificationConfigSchema.parse(body);

    const config = await prisma.notificationConfig.create({
      data: {
        facilityId: validated.facilityId,
        module: validated.module,
        alertSeverity: validated.alertSeverity,
        recipientRole: validated.recipientRole || null,
        recipientUserId: validated.recipientUserId || null,
        channels: validated.channels,
        isEnabled: validated.isEnabled,
        requiresAck: validated.requiresAck,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'NotificationConfig',
        entityId: config.id,
        newValues: validated,
      },
    });

    return NextResponse.json({ success: true, data: config }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating notification config:', error);
    return NextResponse.json(
      { error: 'Failed to create notification config' },
      { status: 500 }
    );
  }
}

// PUT - Update notification config
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to manage notification settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Config ID required' }, { status: 400 });
    }

    const oldConfig = await prisma.notificationConfig.findUnique({
      where: { id },
    });

    if (!oldConfig) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    const config = await prisma.notificationConfig.update({
      where: { id },
      data: {
        recipientRole: updateData.recipientRole,
        recipientUserId: updateData.recipientUserId,
        channels: updateData.channels,
        isEnabled: updateData.isEnabled,
        requiresAck: updateData.requiresAck,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'NotificationConfig',
        entityId: config.id,
        oldValues: oldConfig,
        newValues: config,
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating notification config:', error);
    return NextResponse.json(
      { error: 'Failed to update notification config' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification config
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessFormBuilder(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to manage notification settings' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Config ID required' }, { status: 400 });
    }

    const config = await prisma.notificationConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    await prisma.notificationConfig.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'NotificationConfig',
        entityId: id,
        oldValues: config,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification config:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification config' },
      { status: 500 }
    );
  }
}
