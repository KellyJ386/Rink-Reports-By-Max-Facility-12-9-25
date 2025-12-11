import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  // Branding
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),

  // Default thresholds
  defaultIceDepthMin: z.number().min(0).max(5).optional().nullable(),
  defaultIceDepthMax: z.number().min(0).max(5).optional().nullable(),
  defaultCO2Threshold: z.number().min(0).max(5000).optional().nullable(),
  defaultCOThreshold: z.number().min(0).max(100).optional().nullable(),

  // Feature toggles
  enableScheduling: z.boolean().optional(),
  enableIncidents: z.boolean().optional(),
  enableForms: z.boolean().optional(),
  enableReports: z.boolean().optional(),
  enableAirQuality: z.boolean().optional(),
  enableRefrigeration: z.boolean().optional(),

  // Security settings
  requireMFA: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().min(15).max(1440).optional(),
  passwordMinLength: z.number().min(6).max(32).optional(),
  passwordRequireSpecial: z.boolean().optional(),

  // Data retention
  auditLogRetentionDays: z.number().min(30).max(3650).optional(),
  incidentRetentionYears: z.number().min(1).max(10).optional(),
  readingsRetentionDays: z.number().min(30).max(3650).optional(),

  // Notification defaults
  defaultEmailNotifications: z.boolean().optional(),
  defaultSMSNotifications: z.boolean().optional(),
});

// GET /api/organization/settings - Get organization settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'admin', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Get or create settings
    let settings = await prisma.organizationSettings.findUnique({
      where: { organizationId },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.organizationSettings.create({
        data: { organizationId },
      });
    }

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });

    return NextResponse.json({
      organization,
      settings,
    });
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization settings' },
      { status: 500 }
    );
  }
}

// PUT /api/organization/settings - Update organization settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'admin', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Ensure settings exist
    let settings = await prisma.organizationSettings.findUnique({
      where: { organizationId },
    });

    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: {
          organizationId,
          ...validatedData,
        },
      });
    } else {
      settings = await prisma.organizationSettings.update({
        where: { organizationId },
        data: validatedData,
      });
    }

    // Log the settings change
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'OrganizationSettings',
        entityId: settings.id,
        newValues: validatedData as object,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating organization settings:', error);
    return NextResponse.json(
      { error: 'Failed to update organization settings' },
      { status: 500 }
    );
  }
}
