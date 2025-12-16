import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { toCSV, CSVColumn, formatDateForCSV, formatNumberForCSV } from '@/lib/export/csv';

interface RouteParams {
  params: Promise<{ reportId: string }>;
}

// POST /api/reports/scheduled/[reportId]/run - Manually run a scheduled report
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // Check permission
    if (!hasPermission(session.user.role, 'reports', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scheduledReport = await prisma.scheduledReport.findUnique({
      where: { id: reportId },
      include: {
        facility: true,
      },
    });

    if (!scheduledReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - scheduledReport.dateRangeDays);

    let data: unknown[] = [];
    let columns: CSVColumn<unknown>[] = [];
    let recordCount = 0;

    // Fetch data based on report type
    switch (scheduledReport.reportType) {
      case 'ice_depth': {
        const readings = await prisma.iceDepthReading.findMany({
          where: {
            rink: { facilityId: scheduledReport.facilityId },
            recordedAt: { gte: startDate, lte: endDate },
          },
          include: {
            rink: { select: { name: true } },
            recordedBy: { select: { name: true } },
          },
          orderBy: { recordedAt: 'desc' },
        });
        data = readings;
        recordCount = readings.length;
        columns = [
          { key: 'recordedAt', header: 'Date/Time', formatter: (v) => formatDateForCSV(v as Date) },
          { key: 'rink.name', header: 'Rink' },
          { key: 'averageDepth', header: 'Avg Depth (in)', formatter: (v) => formatNumberForCSV(v as number, 2) },
          { key: 'minDepth', header: 'Min Depth (in)', formatter: (v) => formatNumberForCSV(v as number, 2) },
          { key: 'maxDepth', header: 'Max Depth (in)', formatter: (v) => formatNumberForCSV(v as number, 2) },
          { key: 'recordedBy.name', header: 'Recorded By' },
        ];
        break;
      }

      case 'incidents': {
        const incidents = await prisma.incidentReport.findMany({
          where: {
            facilityId: scheduledReport.facilityId,
            createdAt: { gte: startDate, lte: endDate },
          },
          include: {
            reportedBy: { select: { name: true } },
          },
          orderBy: { incidentTime: 'desc' },
        });
        data = incidents;
        recordCount = incidents.length;
        columns = [
          { key: 'incidentTime', header: 'Incident Time', formatter: (v) => formatDateForCSV(v as Date) },
          { key: 'incidentType', header: 'Type' },
          { key: 'location', header: 'Location' },
          { key: 'severityLevel', header: 'Severity' },
          { key: 'description', header: 'Description' },
          { key: 'injuredName', header: 'Injured Party' },
          { key: 'status', header: 'Status' },
          { key: 'reportedBy.name', header: 'Reported By' },
        ];
        break;
      }

      case 'air_quality': {
        const readings = await prisma.airQualityLog.findMany({
          where: {
            facilityId: scheduledReport.facilityId,
            recordedAt: { gte: startDate, lte: endDate },
          },
          orderBy: { recordedAt: 'desc' },
        });
        data = readings;
        recordCount = readings.length;
        columns = [
          { key: 'recordedAt', header: 'Date/Time', formatter: (v) => formatDateForCSV(v as Date) },
          { key: 'location', header: 'Location' },
          { key: 'co2Level', header: 'CO2 (ppm)', formatter: (v) => formatNumberForCSV(v as number) },
          { key: 'coLevel', header: 'CO (ppm)', formatter: (v) => formatNumberForCSV(v as number, 1) },
          { key: 'temperature', header: 'Temp (°F)', formatter: (v) => formatNumberForCSV(v as number, 1) },
          { key: 'humidity', header: 'Humidity (%)', formatter: (v) => formatNumberForCSV(v as number) },
          { key: 'thresholdExceeded', header: 'Threshold Exceeded', formatter: (v) => v ? 'Yes' : 'No' },
        ];
        break;
      }

      case 'refrigeration': {
        const logs = await prisma.refrigerationLog.findMany({
          where: {
            facilityId: scheduledReport.facilityId,
            recordedAt: { gte: startDate, lte: endDate },
          },
          orderBy: { recordedAt: 'desc' },
        });
        data = logs;
        recordCount = logs.length;
        columns = [
          { key: 'recordedAt', header: 'Date/Time', formatter: (v) => formatDateForCSV(v as Date) },
          { key: 'brineSupplyTemp', header: 'Brine Supply (°F)', formatter: (v) => formatNumberForCSV(v as number, 1) },
          { key: 'brineReturnTemp', header: 'Brine Return (°F)', formatter: (v) => formatNumberForCSV(v as number, 1) },
          { key: 'suctionPressure', header: 'Suction PSI', formatter: (v) => formatNumberForCSV(v as number, 1) },
          { key: 'dischargePressure', header: 'Discharge PSI', formatter: (v) => formatNumberForCSV(v as number, 1) },
          { key: 'compressorStatus', header: 'Compressor Status' },
        ];
        break;
      }

      case 'schedules': {
        const shifts = await prisma.scheduleShift.findMany({
          where: {
            schedule: { facilityId: scheduledReport.facilityId },
            shiftDate: { gte: startDate, lte: endDate },
          },
          include: {
            user: { select: { name: true, email: true } },
            schedule: { select: { name: true } },
          },
          orderBy: { shiftDate: 'asc' },
        });
        data = shifts;
        recordCount = shifts.length;
        columns = [
          { key: 'shiftDate', header: 'Date', formatter: (v) => formatDateForCSV(v as Date) },
          { key: 'startTime', header: 'Start Time' },
          { key: 'endTime', header: 'End Time' },
          { key: 'user.name', header: 'Employee' },
          { key: 'user.email', header: 'Email' },
          { key: 'position', header: 'Position' },
          { key: 'status', header: 'Status' },
          { key: 'schedule.name', header: 'Schedule' },
        ];
        break;
      }

      case 'forms': {
        const submissions = await prisma.formSubmission.findMany({
          where: {
            facilityId: scheduledReport.facilityId,
            createdAt: { gte: startDate, lte: endDate },
          },
          include: {
            submittedBy: { select: { name: true } },
            formTemplate: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        data = submissions;
        recordCount = submissions.length;
        columns = [
          { key: 'createdAt', header: 'Submitted At', formatter: (v) => formatDateForCSV(v as Date) },
          { key: 'formTemplate.name', header: 'Form' },
          { key: 'submittedBy.name', header: 'Submitted By' },
          { key: 'status', header: 'Status' },
        ];
        break;
      }

      case 'alerts': {
        const alerts = await prisma.alert.findMany({
          where: {
            facilityId: scheduledReport.facilityId,
            createdAt: { gte: startDate, lte: endDate },
          },
          orderBy: { createdAt: 'desc' },
        });
        data = alerts;
        recordCount = alerts.length;
        columns = [
          { key: 'createdAt', header: 'Date/Time', formatter: (v) => formatDateForCSV(v as Date) },
          { key: 'alertType', header: 'Type' },
          { key: 'severity', header: 'Severity' },
          { key: 'message', header: 'Message' },
          { key: 'threshold', header: 'Threshold', formatter: (v) => formatNumberForCSV(v as number, 2) },
          { key: 'actualValue', header: 'Actual Value', formatter: (v) => formatNumberForCSV(v as number, 2) },
          { key: 'isAcknowledged', header: 'Acknowledged', formatter: (v) => v ? 'Yes' : 'No' },
        ];
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported report type: ${scheduledReport.reportType}` },
          { status: 400 }
        );
    }

    // Generate output
    let output: string;
    let contentType: string;
    let fileExtension: string;

    if (scheduledReport.exportFormat === 'json') {
      output = JSON.stringify(data, null, 2);
      contentType = 'application/json';
      fileExtension = 'json';
    } else {
      output = toCSV(data, columns);
      contentType = 'text/csv';
      fileExtension = 'csv';
    }

    // Record history
    const history = await prisma.reportHistory.create({
      data: {
        scheduledReportId: reportId,
        status: 'success',
        recordCount,
        fileSize: new Blob([output]).size,
      },
    });

    // Update last run info
    await prisma.scheduledReport.update({
      where: { id: reportId },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: 'success',
        lastRunError: null,
      },
    });

    // Return the generated report
    const filename = `${scheduledReport.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

    return new NextResponse(output, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Report-History-Id': history.id,
        'X-Record-Count': recordCount.toString(),
      },
    });
  } catch (error) {
    console.error('Error running scheduled report:', error);

    // Try to record failure
    try {
      const { reportId } = await params;
      await prisma.scheduledReport.update({
        where: { id: reportId },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'failed',
          lastRunError: (error as Error).message,
        },
      });

      await prisma.reportHistory.create({
        data: {
          scheduledReportId: reportId,
          status: 'failed',
          errorMessage: (error as Error).message,
        },
      });
    } catch {
      // Ignore errors in error handling
    }

    return NextResponse.json(
      { error: 'Failed to run scheduled report' },
      { status: 500 }
    );
  }
}
