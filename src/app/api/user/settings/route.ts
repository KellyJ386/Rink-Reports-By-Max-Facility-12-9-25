import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * User Settings API
 * GET - Fetch user profile and settings
 * PUT - Update user profile and settings
 */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse preferences or use defaults
    const preferences = (user.preferences as Record<string, unknown>) || {};
    const defaultPreferences = {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        incidents: true,
        maintenance: true,
        scheduleChanges: true,
        reports: false,
      },
      dashboard: {
        defaultView: 'overview',
        refreshInterval: 30,
        showWeatherWidget: true,
      },
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    };

    return NextResponse.json({
      data: {
        ...user,
        preferences: { ...defaultPreferences, ...preferences },
      },
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, preferences } = body;

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.length < 2)) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    if (preferences !== undefined) {
      // Merge with existing preferences
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { preferences: true },
      });

      const existingPrefs = (existingUser?.preferences as Record<string, unknown>) || {};
      updateData.preferences = { ...existingPrefs, ...preferences };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        preferences: true,
        updatedAt: true,
      },
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'USER_SETTINGS',
        entityId: session.user.id,
        newValues: updateData,
        facilityId: session.user.facilityId,
      },
    });

    return NextResponse.json({
      data: updatedUser,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
