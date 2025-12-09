import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for refrigeration log
const refrigerationLogSchema = z.object({
  facilityId: z.string(),
  compressor1Suction: z.number().optional(),
  compressor1Discharge: z.number().optional(),
  compressor2Suction: z.number().optional(),
  compressor2Discharge: z.number().optional(),
  brineSupply: z.number().optional(),
  brineReturn: z.number().optional(),
  condenserIn: z.number().optional(),
  condenserOut: z.number().optional(),
  oilPressure: z.number().optional(),
  oilLevel: z.enum(['OK', 'LOW', 'NEEDS_ATTENTION', 'CRITICAL']).optional(),
  refrigerantLevel: z.enum(['OK', 'LOW', 'NEEDS_ATTENTION', 'CRITICAL']).optional(),
  alarmsPresent: z.boolean().default(false),
  alarmDetails: z.string().optional(),
  notes: z.string().optional(),
});

// GET - List refrigeration logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};

    if (facilityId) where.facilityId = facilityId;

    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) (where.recordedAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.recordedAt as Record<string, Date>).lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.refrigerationLog.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.refrigerationLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching refrigeration logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refrigeration logs' },
      { status: 500 }
    );
  }
}

// POST - Create a new refrigeration log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = refrigerationLogSchema.parse(body);

    // Create the log
    const log = await prisma.refrigerationLog.create({
      data: {
        facilityId: validatedData.facilityId,
        recordedById: session.user.id,
        compressor1Suction: validatedData.compressor1Suction,
        compressor1Discharge: validatedData.compressor1Discharge,
        compressor2Suction: validatedData.compressor2Suction,
        compressor2Discharge: validatedData.compressor2Discharge,
        brineSupply: validatedData.brineSupply,
        brineReturn: validatedData.brineReturn,
        condenserIn: validatedData.condenserIn,
        condenserOut: validatedData.condenserOut,
        oilPressure: validatedData.oilPressure,
        oilLevel: validatedData.oilLevel,
        refrigerantLevel: validatedData.refrigerantLevel,
        alarmsPresent: validatedData.alarmsPresent,
        alarmDetails: validatedData.alarmDetails,
        notes: validatedData.notes,
      },
    });

    // Check for critical conditions and create alerts
    if (
      validatedData.oilLevel === 'CRITICAL' ||
      validatedData.refrigerantLevel === 'CRITICAL' ||
      validatedData.alarmsPresent
    ) {
      await prisma.alert.create({
        data: {
          facilityId: validatedData.facilityId,
          alertType: 'REFRIGERATION_CRITICAL',
          severity: 'SERIOUS',
          message: `Critical refrigeration condition detected: ${
            validatedData.oilLevel === 'CRITICAL' ? 'Oil level critical. ' : ''
          }${validatedData.refrigerantLevel === 'CRITICAL' ? 'Refrigerant level critical. ' : ''}${
            validatedData.alarmsPresent ? `Alarms present: ${validatedData.alarmDetails}` : ''
          }`,
        },
      });
    }

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating refrigeration log:', error);
    return NextResponse.json(
      { error: 'Failed to create refrigeration log' },
      { status: 500 }
    );
  }
}
