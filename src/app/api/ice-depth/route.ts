import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for ice depth reading
const iceDepthReadingSchema = z.object({
  rinkId: z.string(),
  pointsConfig: z.number().refine((val) => [25, 35, 47].includes(val)),
  readingPoints: z.array(z.object({
    pointId: z.string(),
    x: z.number(),
    y: z.number(),
    depth: z.number().nullable(),
  })),
  ambientTemp: z.number().optional(),
  iceTemp: z.number().optional(),
  humidity: z.number().optional(),
  notes: z.string().optional(),
});

// GET - List ice depth readings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rinkId = searchParams.get('rinkId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeAnalysis = searchParams.get('includeAnalysis') === 'true';

    const where: Record<string, unknown> = {};

    if (rinkId) where.rinkId = rinkId;

    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) (where.recordedAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.recordedAt as Record<string, Date>).lte = new Date(endDate);
    }

    const readings = await prisma.iceDepthReading.findMany({
      where,
      include: {
        rink: {
          select: {
            id: true,
            name: true,
            facility: {
              select: { id: true, name: true },
            },
          },
        },
        recordedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });

    // If analysis requested, filter to only those with AI analysis
    const result = includeAnalysis
      ? readings.filter((r) => r.aiAnalysis !== null)
      : readings;

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching ice depth readings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ice depth readings' },
      { status: 500 }
    );
  }
}

// POST - Create a new ice depth reading
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = iceDepthReadingSchema.parse(body);

    // Calculate statistics from reading points
    const measuredPoints = validatedData.readingPoints.filter((p) => p.depth !== null);
    const depths = measuredPoints.map((p) => p.depth!);

    let stats = {
      averageDepth: null as number | null,
      minDepth: null as number | null,
      maxDepth: null as number | null,
      variance: null as number | null,
    };

    if (depths.length > 0) {
      const avg = depths.reduce((a, b) => a + b, 0) / depths.length;
      stats = {
        averageDepth: Math.round(avg * 100) / 100,
        minDepth: Math.min(...depths),
        maxDepth: Math.max(...depths),
        variance: Math.round(
          (depths.reduce((acc, d) => acc + Math.pow(d - avg, 2), 0) / depths.length) * 1000
        ) / 1000,
      };
    }

    // Create the reading
    const reading = await prisma.iceDepthReading.create({
      data: {
        rinkId: validatedData.rinkId,
        recordedById: session.user.id,
        pointsConfig: validatedData.pointsConfig,
        readingPoints: validatedData.readingPoints,
        averageDepth: stats.averageDepth,
        minDepth: stats.minDepth,
        maxDepth: stats.maxDepth,
        variance: stats.variance,
        ambientTemp: validatedData.ambientTemp,
        iceTemp: validatedData.iceTemp,
        humidity: validatedData.humidity,
        notes: validatedData.notes,
        status: 'RECORDED',
      },
      include: {
        rink: {
          select: { id: true, name: true },
        },
        recordedBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Check for thin ice alerts (< 0.75 inches)
    if (stats.minDepth !== null && stats.minDepth < 0.75) {
      const rink = await prisma.rink.findUnique({
        where: { id: validatedData.rinkId },
        include: { facility: true },
      });

      if (rink) {
        await prisma.alert.create({
          data: {
            facilityId: rink.facilityId,
            alertType: 'ICE_THIN',
            severity: stats.minDepth < 0.5 ? 'CRITICAL' : 'SERIOUS',
            message: `Thin ice detected on ${rink.name}. Minimum depth: ${stats.minDepth}" at point(s) below safe threshold.`,
            threshold: 0.75,
            actualValue: stats.minDepth,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: reading }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating ice depth reading:', error);
    return NextResponse.json(
      { error: 'Failed to create ice depth reading' },
      { status: 500 }
    );
  }
}
