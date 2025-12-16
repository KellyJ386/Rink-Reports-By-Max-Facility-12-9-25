'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type ReportSchedule = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ReportType =
  | 'ice_depth'
  | 'incidents'
  | 'air_quality'
  | 'refrigeration'
  | 'schedules'
  | 'forms'
  | 'alerts';

export interface ScheduledReport {
  id: string;
  facilityId: string;
  createdById: string;
  name: string;
  description?: string;
  reportType: ReportType;
  schedule: ReportSchedule;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  exportFormat: 'csv' | 'json';
  includeCharts: boolean;
  recipients: string[];
  emailSubject?: string;
  emailBody?: string;
  dateRangeDays: number;
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: string;
  lastRunError?: string;
  createdAt: string;
  updatedAt: string;
  facility?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  history?: ReportHistory[];
}

export interface ReportHistory {
  id: string;
  scheduledReportId: string;
  generatedAt: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  fileUrl?: string;
  fileSize?: number;
  recordCount?: number;
  emailsSent: number;
  emailsFailed: number;
}

export interface CreateScheduledReportInput {
  facilityId: string;
  name: string;
  description?: string;
  reportType: ReportType;
  schedule: ReportSchedule;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay?: string;
  exportFormat?: 'csv' | 'json';
  includeCharts?: boolean;
  recipients: string[];
  emailSubject?: string;
  emailBody?: string;
  dateRangeDays?: number;
  isActive?: boolean;
}

export interface UpdateScheduledReportInput {
  name?: string;
  description?: string;
  schedule?: ReportSchedule;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  timeOfDay?: string;
  exportFormat?: 'csv' | 'json';
  includeCharts?: boolean;
  recipients?: string[];
  emailSubject?: string | null;
  emailBody?: string | null;
  dateRangeDays?: number;
  isActive?: boolean;
}

// Report type labels
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  ice_depth: 'Ice Depth Measurements',
  incidents: 'Incident Reports',
  air_quality: 'Air Quality Readings',
  refrigeration: 'Refrigeration Logs',
  schedules: 'Staff Schedules',
  forms: 'Form Submissions',
  alerts: 'System Alerts',
};

// Schedule labels
export const SCHEDULE_LABELS: Record<ReportSchedule, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

// Day of week labels
export const DAY_OF_WEEK_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Fetch scheduled reports
async function fetchScheduledReports(params?: {
  facilityId?: string;
  isActive?: boolean;
}): Promise<ScheduledReport[]> {
  const searchParams = new URLSearchParams();
  if (params?.facilityId) searchParams.set('facilityId', params.facilityId);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));

  const url = `/api/reports/scheduled${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch scheduled reports');
  }

  return response.json();
}

// Fetch single scheduled report
async function fetchScheduledReport(reportId: string): Promise<ScheduledReport> {
  const response = await fetch(`/api/reports/scheduled/${reportId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch scheduled report');
  }

  return response.json();
}

// Create scheduled report
async function createScheduledReport(input: CreateScheduledReportInput): Promise<ScheduledReport> {
  const response = await fetch('/api/reports/scheduled', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create scheduled report');
  }

  return response.json();
}

// Update scheduled report
async function updateScheduledReport({
  id,
  ...input
}: UpdateScheduledReportInput & { id: string }): Promise<ScheduledReport> {
  const response = await fetch(`/api/reports/scheduled/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update scheduled report');
  }

  return response.json();
}

// Delete scheduled report
async function deleteScheduledReport(id: string): Promise<void> {
  const response = await fetch(`/api/reports/scheduled/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete scheduled report');
  }
}

// Run scheduled report manually
async function runScheduledReport(id: string): Promise<Blob> {
  const response = await fetch(`/api/reports/scheduled/${id}/run`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to run scheduled report');
  }

  return response.blob();
}

// Hooks
export function useScheduledReports(params?: { facilityId?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['scheduledReports', params],
    queryFn: () => fetchScheduledReports(params),
  });
}

export function useScheduledReport(reportId: string | undefined) {
  return useQuery({
    queryKey: ['scheduledReport', reportId],
    queryFn: () => fetchScheduledReport(reportId!),
    enabled: !!reportId,
  });
}

export function useCreateScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createScheduledReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });
}

export function useUpdateScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateScheduledReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledReport', data.id] });
    },
  });
}

export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteScheduledReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });
}

export function useRunScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const blob = await runScheduledReport(id);

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
    },
  });
}

// Helper: Format schedule description
export function formatScheduleDescription(report: ScheduledReport): string {
  const time = report.timeOfDay;

  switch (report.schedule) {
    case 'DAILY':
      return `Daily at ${time}`;
    case 'WEEKLY':
      return `Every ${DAY_OF_WEEK_LABELS[report.dayOfWeek || 0]} at ${time}`;
    case 'MONTHLY':
      return `Monthly on day ${report.dayOfMonth || 1} at ${time}`;
    default:
      return report.schedule;
  }
}

// Helper: Get next run date
export function getNextRunDate(report: ScheduledReport): Date {
  const now = new Date();
  const [hours, minutes] = report.timeOfDay.split(':').map(Number);

  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  switch (report.schedule) {
    case 'DAILY':
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;
    case 'WEEKLY': {
      const targetDay = report.dayOfWeek || 0;
      const currentDay = next.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
        daysUntil += 7;
      }
      next.setDate(next.getDate() + daysUntil);
      break;
    }
    case 'MONTHLY': {
      const targetDate = report.dayOfMonth || 1;
      next.setDate(targetDate);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
    }
  }

  return next;
}
