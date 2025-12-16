import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for Zamboni circle check
const zamboniCheckSchema = z.object({
  rinkId: z.string(),
  equipmentId: z.string(),
  oilLevel: z.enum(['OK', 'LOW', 'NEEDS_ATTENTION', 'CRITICAL']),
  waterLevel: z.enum(['OK', 'LOW', 'NEEDS_ATTENTION', 'CRITICAL']),
  bladesCondition: z.enum(['OK', 'LOW', 'NEEDS_ATTENTION', 'CRITICAL']),
  towelCondition: z.enum(['OK', 'LOW', 'NEEDS_ATTENTION', 'CRITICAL']),
  tiresCondition: z.enum(['OK', 'LOW', 'NEEDS_ATTENTION', 'CRITICAL']),
  lightsWorking: z.boolean(),
  hornWorking: z.boolean(),
  hoursAtCheck: z.number().optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  issuesFound: z.string().optional(),
  maintenanceNeeded: z.boolean().default(false),
  notes: z.string().optional(),
});

// Schema for blade change
const bladeChangeSchema = z.object({
  equipmentId: z.string(),
  hoursOnOldBlade: z.number(),
  bladeType: z.string().optional(),
  reason: z.enum(['SCHEDULED', 'DAMAGE', 'PERFORMANCE', 'OTHER']),
  notes: z.string().optional(),
});

// Schema for ice make log
const iceMakeLogSchema = z.object({
  rinkId: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  waterTemp: z.number().optional(),
  floodCount: z.number().default(1),
  iceThickness: z.number().optional(),
  notes: z.string().optional(),
});

// GET - List ice operations logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'zamboni', 'blade', 'icemake'
    const rinkId = searchParams.get('rinkId');
    const equipmentId = searchParams.get('equipmentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let data: unknown;

    switch (type) {
      case 'zamboni':
        data = await prisma.zamboniLog.findMany({
          where: {
            ...(rinkId && { rinkId }),
            ...(equipmentId && { equipmentId }),
            ...(startDate && {
              checkTime: {
                gte: new Date(startDate),
                ...(endDate && { lte: new Date(endDate) }),
              },
            }),
          },
          include: {
            equipment: {
              select: { id: true, name: true, model: true, currentHours: true },
            },
            rink: {
              select: { id: true, name: true },
            },
          },
          orderBy: { checkTime: 'desc' },
          take: 50,
        });
        break;

      case 'blade':
        data = await prisma.bladeChangeLog.findMany({
          where: {
            ...(equipmentId && { equipmentId }),
            ...(startDate && {
              changeTime: {
                gte: new Date(startDate),
                ...(endDate && { lte: new Date(endDate) }),
              },
            }),
          },
          include: {
            equipment: {
              select: { id: true, name: true, model: true, currentHours: true },
            },
          },
          orderBy: { changeTime: 'desc' },
          take: 50,
        });
        break;

      case 'icemake':
        data = await prisma.iceMakeLog.findMany({
          where: {
            ...(rinkId && { rinkId }),
            ...(startDate && {
              startTime: {
                gte: new Date(startDate),
                ...(endDate && { lte: new Date(endDate) }),
              },
            }),
          },
          include: {
            rink: {
              select: { id: true, name: true },
            },
          },
          orderBy: { startTime: 'desc' },
          take: 50,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: zamboni, blade, or icemake' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching ice ops logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ice operations logs' },
      { status: 500 }
    );
  }
}

// POST - Create ice operations log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const body = await request.json();

    let data: unknown;

    switch (type) {
      case 'zamboni': {
        const validatedData = zamboniCheckSchema.parse(body);

        data = await prisma.zamboniLog.create({
          data: {
            rinkId: validatedData.rinkId,
            equipmentId: validatedData.equipmentId,
            operatorId: session.user.id,
            oilLevel: validatedData.oilLevel,
            waterLevel: validatedData.waterLevel,
            bladesCondition: validatedData.bladesCondition,
            towelCondition: validatedData.towelCondition,
            tiresCondition: validatedData.tiresCondition,
            lightsWorking: validatedData.lightsWorking,
            hornWorking: validatedData.hornWorking,
            hoursAtCheck: validatedData.hoursAtCheck,
            fuelLevel: validatedData.fuelLevel,
            issuesFound: validatedData.issuesFound,
            maintenanceNeeded: validatedData.maintenanceNeeded,
            notes: validatedData.notes,
          },
          include: {
            equipment: true,
            rink: true,
          },
        });

        // Update equipment hours if provided
        if (validatedData.hoursAtCheck) {
          await prisma.equipment.update({
            where: { id: validatedData.equipmentId },
            data: { currentHours: validatedData.hoursAtCheck },
          });
        }

        // Create alert if maintenance needed
        if (validatedData.maintenanceNeeded) {
          const equipment = await prisma.equipment.findUnique({
            where: { id: validatedData.equipmentId },
            include: { facility: true },
          });

          if (equipment) {
            await prisma.alert.create({
              data: {
                facilityId: equipment.facilityId,
                alertType: 'EQUIPMENT_MAINTENANCE',
                severity: 'MODERATE',
                message: `${equipment.name} requires maintenance: ${validatedData.issuesFound || 'Check required'}`,
              },
            });
          }
        }
        break;
      }

      case 'blade': {
        const validatedData = bladeChangeSchema.parse(body);

        data = await prisma.bladeChangeLog.create({
          data: {
            equipmentId: validatedData.equipmentId,
            changedById: session.user.id,
            hoursOnOldBlade: validatedData.hoursOnOldBlade,
            bladeType: validatedData.bladeType,
            reason: validatedData.reason,
            notes: validatedData.notes,
          },
          include: {
            equipment: true,
          },
        });

        // Reset equipment service hours
        await prisma.equipment.update({
          where: { id: validatedData.equipmentId },
          data: { lastServiceHours: validatedData.hoursOnOldBlade },
        });
        break;
      }

      case 'icemake': {
        const validatedData = iceMakeLogSchema.parse(body);

        data = await prisma.iceMakeLog.create({
          data: {
            rinkId: validatedData.rinkId,
            loggedById: session.user.id,
            startTime: new Date(validatedData.startTime),
            endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
            waterTemp: validatedData.waterTemp,
            floodCount: validatedData.floodCount,
            iceThickness: validatedData.iceThickness,
            notes: validatedData.notes,
          },
          include: {
            rink: true,
          },
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: zamboni, blade, or icemake' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating ice ops log:', error);
    return NextResponse.json(
      { error: 'Failed to create ice operations log' },
      { status: 500 }
    );
  }
}
