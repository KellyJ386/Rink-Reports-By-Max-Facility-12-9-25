import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import {
  toCSV,
  CSVColumn,
  formatDateForCSV,
  formatDateOnlyForCSV,
  formatTimeForCSV,
  formatNumberForCSV,
  formatBooleanForCSV,
  generateExportFilename,
} from '@/lib/export/csv';

// Export types
const exportTypes = [
  'ice_depth',
  'incidents',
  'air_quality',
  'refrigeration',
  'schedules',
  'time_off',
  'forms',
  'alerts',
  'users',
] as const;

type ExportType = (typeof exportTypes)[number];

// Export request schema
const exportSchema = z.object({
  type: z.enum(exportTypes),
  format: z.enum(['csv', 'json']).default('csv'),
  facilityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  limit: z.number().min(1).max(10000).optional().default(1000),
});

// GET - Export data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse query params
    const params = {
      type: searchParams.get('type') as ExportType,
      format: (searchParams.get('format') || 'csv') as 'csv' | 'json',
      facilityId: searchParams.get('facilityId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '1000'),
    };

    const validated = exportSchema.parse(params);

    // Check permissions for sensitive exports
    if (validated.type === 'users' && !hasPermission(session.user.role, 'users:read')) {
      return NextResponse.json(
        { error: 'You do not have permission to export user data' },
        { status: 403 }
      );
    }

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (validated.startDate) dateFilter.gte = new Date(validated.startDate);
    if (validated.endDate) dateFilter.lte = new Date(validated.endDate);

    // Export data based on type
    let data: unknown[];
    let columns: CSVColumn<Record<string, unknown>>[];
    let filename: string;

    switch (validated.type) {
      case 'ice_depth':
        ({ data, columns, filename } = await exportIceDepth(validated, dateFilter));
        break;
      case 'incidents':
        ({ data, columns, filename } = await exportIncidents(validated, dateFilter));
        break;
      case 'air_quality':
        ({ data, columns, filename } = await exportAirQuality(validated, dateFilter));
        break;
      case 'refrigeration':
        ({ data, columns, filename } = await exportRefrigeration(validated, dateFilter));
        break;
      case 'schedules':
        ({ data, columns, filename } = await exportSchedules(validated, dateFilter));
        break;
      case 'time_off':
        ({ data, columns, filename } = await exportTimeOff(validated, dateFilter));
        break;
      case 'forms':
        ({ data, columns, filename } = await exportFormSubmissions(validated, dateFilter));
        break;
      case 'alerts':
        ({ data, columns, filename } = await exportAlerts(validated, dateFilter));
        break;
      case 'users':
        ({ data, columns, filename } = await exportUsers(validated));
        break;
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Return JSON format
    if (validated.format === 'json') {
      return NextResponse.json({
        success: true,
        count: data.length,
        data,
      });
    }

    // Return CSV format
    const csv = toCSV(data as Record<string, unknown>[], columns);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// Export functions for each type

async function exportIceDepth(
  params: z.infer<typeof exportSchema>,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {};
  if (params.facilityId) {
    where.rink = { facilityId: params.facilityId };
  }
  if (Object.keys(dateFilter).length > 0) {
    where.recordedAt = dateFilter;
  }

  const readings = await prisma.iceDepthReading.findMany({
    where,
    include: {
      rink: {
        select: { name: true, facility: { select: { name: true } } },
      },
      recordedBy: { select: { name: true } },
    },
    orderBy: { recordedAt: 'desc' },
    take: params.limit,
  });

  const columns: CSVColumn<Record<string, unknown>>[] = [
    { key: 'recordedAt', header: 'Date/Time', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'rink.facility.name', header: 'Facility' },
    { key: 'rink.name', header: 'Rink' },
    { key: 'averageDepth', header: 'Avg Depth (in)', formatter: (v) => formatNumberForCSV(v as number) },
    { key: 'minDepth', header: 'Min Depth (in)', formatter: (v) => formatNumberForCSV(v as number) },
    { key: 'maxDepth', header: 'Max Depth (in)', formatter: (v) => formatNumberForCSV(v as number) },
    { key: 'status', header: 'Status' },
    { key: 'recordedBy.name', header: 'Recorded By' },
    { key: 'notes', header: 'Notes' },
  ];

  return {
    data: readings,
    columns,
    filename: generateExportFilename('ice-depth-readings'),
  };
}

async function exportIncidents(
  params: z.infer<typeof exportSchema>,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {};
  if (params.facilityId) where.facilityId = params.facilityId;
  if (params.status) where.status = params.status;
  if (Object.keys(dateFilter).length > 0) {
    where.incidentTime = dateFilter;
  }

  const incidents = await prisma.incidentReport.findMany({
    where,
    include: {
      facility: { select: { name: true } },
      reportedBy: { select: { name: true } },
    },
    orderBy: { incidentTime: 'desc' },
    take: params.limit,
  });

  const columns: CSVColumn<Record<string, unknown>>[] = [
    { key: 'incidentTime', header: 'Date/Time', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'facility.name', header: 'Facility' },
    { key: 'incidentType', header: 'Type' },
    { key: 'location', header: 'Location' },
    { key: 'severityLevel', header: 'Severity' },
    { key: 'description', header: 'Description' },
    { key: 'injuredName', header: 'Injured Party' },
    { key: 'ambulanceCalled', header: 'Ambulance Called', formatter: (v) => formatBooleanForCSV(v as boolean) },
    { key: 'status', header: 'Status' },
    { key: 'reportedBy.name', header: 'Reported By' },
  ];

  return {
    data: incidents,
    columns,
    filename: generateExportFilename('incident-reports'),
  };
}

async function exportAirQuality(
  params: z.infer<typeof exportSchema>,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {};
  if (params.facilityId) where.facilityId = params.facilityId;
  if (Object.keys(dateFilter).length > 0) {
    where.recordedAt = dateFilter;
  }

  const readings = await prisma.airQualityLog.findMany({
    where,
    include: {
      recordedBy: { select: { name: true } },
    },
    orderBy: { recordedAt: 'desc' },
    take: params.limit,
  });

  const columns: CSVColumn<Record<string, unknown>>[] = [
    { key: 'recordedAt', header: 'Date/Time', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'location', header: 'Location' },
    { key: 'co2Level', header: 'CO2 (ppm)', formatter: (v) => formatNumberForCSV(v as number, 0) },
    { key: 'coLevel', header: 'CO (ppm)', formatter: (v) => formatNumberForCSV(v as number, 1) },
    { key: 'temperature', header: 'Temperature (°F)', formatter: (v) => formatNumberForCSV(v as number, 1) },
    { key: 'humidity', header: 'Humidity (%)', formatter: (v) => formatNumberForCSV(v as number, 0) },
    { key: 'thresholdExceeded', header: 'Threshold Exceeded', formatter: (v) => formatBooleanForCSV(v as boolean) },
    { key: 'recordedBy.name', header: 'Recorded By' },
    { key: 'notes', header: 'Notes' },
  ];

  return {
    data: readings,
    columns,
    filename: generateExportFilename('air-quality-readings'),
  };
}

async function exportRefrigeration(
  params: z.infer<typeof exportSchema>,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {};
  if (params.facilityId) where.facilityId = params.facilityId;
  if (Object.keys(dateFilter).length > 0) {
    where.recordedAt = dateFilter;
  }

  const readings = await prisma.refrigerationLog.findMany({
    where,
    include: {
      recordedBy: { select: { name: true } },
    },
    orderBy: { recordedAt: 'desc' },
    take: params.limit,
  });

  const columns: CSVColumn<Record<string, unknown>>[] = [
    { key: 'recordedAt', header: 'Date/Time', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'brineSupplyTemp', header: 'Brine Supply (°F)', formatter: (v) => formatNumberForCSV(v as number, 1) },
    { key: 'brineReturnTemp', header: 'Brine Return (°F)', formatter: (v) => formatNumberForCSV(v as number, 1) },
    { key: 'compressorStatus', header: 'Compressor Status' },
    { key: 'suctionPressure', header: 'Suction PSI', formatter: (v) => formatNumberForCSV(v as number, 1) },
    { key: 'dischargePressure', header: 'Discharge PSI', formatter: (v) => formatNumberForCSV(v as number, 1) },
    { key: 'oilLevel', header: 'Oil Level' },
    { key: 'recordedBy.name', header: 'Recorded By' },
    { key: 'notes', header: 'Notes' },
  ];

  return {
    data: readings,
    columns,
    filename: generateExportFilename('refrigeration-readings'),
  };
}

async function exportSchedules(
  params: z.infer<typeof exportSchema>,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {};
  if (params.facilityId) {
    where.schedule = { facilityId: params.facilityId };
  }
  if (Object.keys(dateFilter).length > 0) {
    where.shiftDate = dateFilter;
  }

  const shifts = await prisma.scheduleShift.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      schedule: {
        select: {
          name: true,
          facility: { select: { name: true } },
        },
      },
    },
    orderBy: [{ shiftDate: 'asc' }, { startTime: 'asc' }],
    take: params.limit,
  });

  const columns: CSVColumn<Record<string, unknown>>[] = [
    { key: 'shiftDate', header: 'Date', formatter: (v) => formatDateOnlyForCSV(v as Date) },
    { key: 'schedule.facility.name', header: 'Facility' },
    { key: 'user.name', header: 'Employee' },
    { key: 'user.email', header: 'Email' },
    { key: 'startTime', header: 'Start Time', formatter: (v) => formatTimeForCSV(v as Date) },
    { key: 'endTime', header: 'End Time', formatter: (v) => formatTimeForCSV(v as Date) },
    { key: 'position', header: 'Position' },
    { key: 'status', header: 'Status' },
    { key: 'notes', header: 'Notes' },
  ];

  return {
    data: shifts,
    columns,
    filename: generateExportFilename('schedule-shifts'),
  };
}

async function exportTimeOff(
  params: z.infer<typeof exportSchema>,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {};
  if (params.status) where.status = params.status;
  if (Object.keys(dateFilter).length > 0) {
    where.startDate = dateFilter;
  }

  const requests = await prisma.timeOffRequest.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: { startDate: 'desc' },
    take: params.limit,
  });

  const columns: CSVColumn<Record<string, unknown>>[] = [
    { key: 'user.name', header: 'Employee' },
    { key: 'user.email', header: 'Email' },
    { key: 'type', header: 'Type' },
    { key: 'startDate', header: 'Start Date', formatter: (v) => formatDateOnlyForCSV(v as Date) },
    { key: 'endDate', header: 'End Date', formatter: (v) => formatDateOnlyForCSV(v as Date) },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status' },
    { key: 'reviewedBy.name', header: 'Reviewed By' },
    { key: 'reviewedAt', header: 'Reviewed At', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'createdAt', header: 'Requested At', formatter: (v) => formatDateForCSV(v as Date) },
  ];

  return {
    data: requests,
    columns,
    filename: generateExportFilename('time-off-requests'),
  };
}

async function exportFormSubmissions(
  params: z.infer<typeof exportSchema>,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {};
  if (params.facilityId) where.facilityId = params.facilityId;
  if (params.status) where.status = params.status;
  if (Object.keys(dateFilter).length > 0) {
    where.submittedAt = dateFilter;
  }

  const submissions = await prisma.formSubmission.findMany({
    where,
    include: {
      formTemplate: { select: { name: true, category: true } },
      submittedBy: { select: { name: true } },
      facility: { select: { name: true } },
    },
    orderBy: { submittedAt: 'desc' },
    take: params.limit,
  });

  const columns: CSVColumn<Record<string, unknown>>[] = [
    { key: 'submittedAt', header: 'Submitted At', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'facility.name', header: 'Facility' },
    { key: 'formTemplate.name', header: 'Form Name' },
    { key: 'formTemplate.category', header: 'Category' },
    { key: 'submittedBy.name', header: 'Submitted By' },
    { key: 'status', header: 'Status' },
    { key: 'reviewedAt', header: 'Reviewed At', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'reviewNotes', header: 'Review Notes' },
  ];

  return {
    data: submissions,
    columns,
    filename: generateExportFilename('form-submissions'),
  };
}

async function exportAlerts(
  params: z.infer<typeof exportSchema>,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {};
  if (params.facilityId) where.facilityId = params.facilityId;
  if (params.status) where.status = params.status;
  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter;
  }

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      facility: { select: { name: true } },
      acknowledgedBy: { select: { name: true } },
      resolvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: params.limit,
  });

  const columns: CSVColumn<Record<string, unknown>>[] = [
    { key: 'createdAt', header: 'Created At', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'facility.name', header: 'Facility' },
    { key: 'type', header: 'Type' },
    { key: 'severity', header: 'Severity' },
    { key: 'title', header: 'Title' },
    { key: 'message', header: 'Message' },
    { key: 'status', header: 'Status' },
    { key: 'acknowledgedBy.name', header: 'Acknowledged By' },
    { key: 'acknowledgedAt', header: 'Acknowledged At', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'resolvedBy.name', header: 'Resolved By' },
    { key: 'resolvedAt', header: 'Resolved At', formatter: (v) => formatDateForCSV(v as Date) },
  ];

  return {
    data: alerts,
    columns,
    filename: generateExportFilename('alerts'),
  };
}

async function exportUsers(params: z.infer<typeof exportSchema>) {
  const where: Record<string, unknown> = {};

  // If facilityId provided, get users from that facility
  let users;
  if (params.facilityId) {
    const facilityUsers = await prisma.facilityUser.findMany({
      where: { facilityId: params.facilityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLogin: true,
          },
        },
      },
      take: params.limit,
    });
    users = facilityUsers.map((fu) => ({
      ...fu.user,
      facilityRole: fu.role,
    }));
  } else {
    users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { name: 'asc' },
      take: params.limit,
    });
  }

  const columns: CSVColumn<Record<string, unknown>>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'isActive', header: 'Active', formatter: (v) => formatBooleanForCSV(v as boolean) },
    { key: 'createdAt', header: 'Created', formatter: (v) => formatDateForCSV(v as Date) },
    { key: 'lastLogin', header: 'Last Login', formatter: (v) => formatDateForCSV(v as Date) },
  ];

  return {
    data: users,
    columns,
    filename: generateExportFilename('users'),
  };
}
