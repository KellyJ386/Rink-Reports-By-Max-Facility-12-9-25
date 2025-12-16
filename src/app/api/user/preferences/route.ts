import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for user notification preferences
const preferencesSchema = z.object({
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dailyDigestEnabled: z.boolean().optional(),
  dailyDigestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  digestIncludeAlerts: z.boolean().optional(),
  digestIncludeForms: z.boolean().optional(),
  digestIncludeIncidents: z.boolean().optional(),
  digestIncludeReadings: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

// GET - Get current user's notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create preferences
    let prefs = await prisma.userNotificationPrefs.findUnique({
      where: { userId: session.user.id },
    });

    if (!prefs) {
      // Create default preferences
      prefs = await prisma.userNotificationPrefs.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update current user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = preferencesSchema.parse(body);

    // Upsert preferences
    const prefs = await prisma.userNotificationPrefs.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...validatedData,
      },
      update: validatedData,
    });

    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
