// Report Generation Service

import { v4 as uuid } from 'uuid';
import type {
  Report,
  ReportData,
  GenerateReportInput,
  ScheduledReport,
  CreateScheduledReportInput,
  ReportStatus,
} from './types';
import { getTemplate } from './templates';

// In-memory stores for demo
const reports: Map<string, Report> = new Map();
const scheduledReports: Map<string, ScheduledReport> = new Map();

// Generate a report
export async function generateReport(
  input: GenerateReportInput,
  userId: string
): Promise<Report> {
  const template = input.templateId ? getTemplate(input.templateId) : null;

  const report: Report = {
    id: uuid(),
    templateId: input.templateId,
    name: input.name,
    type: input.type,
    status: 'pending',
    format: input.format,
    filters: input.filters,
    facilityId: input.facilityId,
    createdBy: userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };

  reports.set(report.id, report);

  // Simulate async generation
  processReportGeneration(report.id);

  return report;
}

// Process report generation asynchronously
async function processReportGeneration(reportId: string): Promise<void> {
  const report = reports.get(reportId);
  if (!report) return;

  // Update status to generating
  report.status = 'generating';
  report.generatedAt = new Date();
  reports.set(reportId, report);

  try {
    // Simulate generation time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock data
    const data = await generateReportData(report);

    // In production, this would create actual PDF/Excel files
    const fileUrl = `/api/reports/${reportId}/download`;
    const fileSize = Math.floor(Math.random() * 500000) + 50000; // 50KB - 550KB

    report.status = 'completed';
    report.completedAt = new Date();
    report.fileUrl = fileUrl;
    report.fileSize = fileSize;
    reports.set(reportId, report);
  } catch (error) {
    report.status = 'failed';
    report.error = error instanceof Error ? error.message : 'Generation failed';
    reports.set(reportId, report);
  }
}

// Generate report data based on type
async function generateReportData(report: Report): Promise<ReportData> {
  const dateRange = report.filters.dateRange as { start: string; end: string } | undefined;

  const data: ReportData = {
    metadata: {
      title: report.name,
      generatedAt: new Date(),
      generatedBy: report.createdBy,
      dateRange: dateRange
        ? { start: new Date(dateRange.start), end: new Date(dateRange.end) }
        : undefined,
      facility: report.facilityId,
    },
    sections: [],
    summary: {},
  };

  switch (report.type) {
    case 'incident_summary':
      data.sections = [
        {
          id: 'overview',
          title: 'Executive Summary',
          type: 'metrics',
          data: {
            total: 47,
            resolved: 42,
            pending: 5,
            averageResolutionTime: '2.3 hours',
          },
        },
        {
          id: 'by-type',
          title: 'Incidents by Type',
          type: 'chart',
          data: [
            { type: 'Slip & Fall', count: 15 },
            { type: 'Equipment', count: 12 },
            { type: 'Ice Quality', count: 10 },
            { type: 'Other', count: 10 },
          ],
        },
      ];
      data.summary = {
        totalIncidents: 47,
        resolvedPercentage: 89,
        mostCommonType: 'Slip & Fall',
      };
      break;

    case 'ice_depth_analysis':
      data.sections = [
        {
          id: 'overview',
          title: 'Summary',
          type: 'metrics',
          data: {
            averageDepth: 1.2,
            minDepth: 0.8,
            maxDepth: 1.5,
            readingsCount: 156,
            alertsCount: 3,
          },
        },
      ];
      data.summary = {
        overallStatus: 'Good',
        alertsThisPeriod: 3,
      };
      break;

    case 'staff_schedule':
      data.sections = [
        {
          id: 'summary',
          title: 'Hours Summary',
          type: 'metrics',
          data: {
            totalHours: 1240,
            overtimeHours: 45,
            staffCount: 18,
            shiftsCount: 156,
          },
        },
      ];
      break;

    default:
      data.sections = [
        {
          id: 'default',
          title: 'Report Data',
          type: 'text',
          data: 'Report generated successfully.',
        },
      ];
  }

  return data;
}

// Get all reports for a user
export async function getReports(userId: string, facilityId?: string): Promise<Report[]> {
  let results = Array.from(reports.values()).filter(
    (r) => r.createdBy === userId
  );

  if (facilityId) {
    results = results.filter((r) => r.facilityId === facilityId);
  }

  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return results;
}

// Get a single report
export async function getReport(reportId: string, userId: string): Promise<Report | null> {
  const report = reports.get(reportId);
  if (!report || report.createdBy !== userId) return null;
  return report;
}

// Delete a report
export async function deleteReport(reportId: string, userId: string): Promise<boolean> {
  const report = reports.get(reportId);
  if (!report || report.createdBy !== userId) return false;
  return reports.delete(reportId);
}

// Create a scheduled report
export async function createScheduledReport(
  input: CreateScheduledReportInput,
  userId: string
): Promise<ScheduledReport> {
  const nextRun = calculateNextRun(input.frequency);

  const scheduled: ScheduledReport = {
    id: uuid(),
    templateId: input.templateId,
    name: input.name,
    frequency: input.frequency,
    format: input.format,
    filters: input.filters,
    recipients: input.recipients,
    facilityId: input.facilityId,
    nextRunAt: nextRun,
    isActive: true,
    createdBy: userId,
    createdAt: new Date(),
  };

  scheduledReports.set(scheduled.id, scheduled);
  return scheduled;
}

// Calculate next run time based on frequency
function calculateNextRun(frequency: string): Date {
  const now = new Date();

  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    case 'quarterly':
      const nextQuarter = new Date(now);
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);
      return nextQuarter;
    default:
      return now;
  }
}

// Get scheduled reports for a user
export async function getScheduledReports(
  userId: string,
  facilityId?: string
): Promise<ScheduledReport[]> {
  let results = Array.from(scheduledReports.values()).filter(
    (r) => r.createdBy === userId
  );

  if (facilityId) {
    results = results.filter((r) => r.facilityId === facilityId);
  }

  return results;
}

// Update scheduled report
export async function updateScheduledReport(
  id: string,
  userId: string,
  updates: Partial<ScheduledReport>
): Promise<ScheduledReport | null> {
  const scheduled = scheduledReports.get(id);
  if (!scheduled || scheduled.createdBy !== userId) return null;

  const updated = { ...scheduled, ...updates };
  scheduledReports.set(id, updated);
  return updated;
}

// Delete scheduled report
export async function deleteScheduledReport(
  id: string,
  userId: string
): Promise<boolean> {
  const scheduled = scheduledReports.get(id);
  if (!scheduled || scheduled.createdBy !== userId) return false;
  return scheduledReports.delete(id);
}

// Toggle scheduled report active status
export async function toggleScheduledReport(
  id: string,
  userId: string
): Promise<ScheduledReport | null> {
  const scheduled = scheduledReports.get(id);
  if (!scheduled || scheduled.createdBy !== userId) return null;

  scheduled.isActive = !scheduled.isActive;
  scheduledReports.set(id, scheduled);
  return scheduled;
}
