'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Report,
  ReportType,
  ReportFormat,
  ReportStatus,
  ScheduledReport,
  GenerateReportInput,
  CreateScheduledReportInput,
  ReportFrequency,
} from '@/lib/reports/types';

// Re-export types for convenience
export type {
  Report,
  ReportType,
  ReportFormat,
  ReportStatus,
  ScheduledReport,
  GenerateReportInput,
  CreateScheduledReportInput,
  ReportFrequency,
};

// ========== API Functions ==========

interface FetchReportsParams {
  facilityId?: string;
  includeScheduled?: boolean;
}

interface ReportsResponse {
  reports: Report[];
  scheduled?: ScheduledReport[];
}

async function fetchReports(params?: FetchReportsParams): Promise<ReportsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.facilityId) searchParams.append('facilityId', params.facilityId);
  if (params?.includeScheduled) searchParams.append('includeScheduled', 'true');

  const response = await fetch(`/api/reports?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }
  return response.json();
}

async function fetchReport(reportId: string): Promise<Report> {
  const response = await fetch(`/api/reports/${reportId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch report');
  }
  const data = await response.json();
  return data.report;
}

async function generateReport(input: GenerateReportInput): Promise<Report> {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate report');
  }

  const data = await response.json();
  return data.report;
}

interface ScheduleReportInput extends CreateScheduledReportInput {
  schedule: {
    frequency: ReportFrequency;
    recipients?: string[];
  };
}

async function scheduleReport(input: ScheduleReportInput): Promise<ScheduledReport> {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to schedule report');
  }

  const data = await response.json();
  return data.scheduled;
}

async function deleteReport(reportId: string): Promise<void> {
  const response = await fetch(`/api/reports/${reportId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete report');
  }
}

// ========== React Query Hooks ==========

/**
 * Hook to fetch all reports for the current user
 */
export function useReports(params?: FetchReportsParams) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => fetchReports(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch reports with live refresh capability
 */
export function useReportsLive(
  params?: FetchReportsParams,
  options?: { refreshInterval?: number; enabled?: boolean }
) {
  const { refreshInterval = 0, enabled = true } = options || {};

  return useQuery({
    queryKey: ['reports', 'live', params],
    queryFn: () => fetchReports(params),
    enabled,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    staleTime: 10000,
  });
}

/**
 * Hook to fetch a single report by ID
 */
export function useReport(reportId: string) {
  return useQuery({
    queryKey: ['reports', reportId],
    queryFn: () => fetchReport(reportId),
    enabled: !!reportId,
    staleTime: 30000,
  });
}

/**
 * Hook to generate a new report
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * Hook to schedule a recurring report
 */
export function useScheduleReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * Hook to delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// ========== Helper Functions ==========

/**
 * Get status badge color for report status
 */
export function getReportStatusColor(status: ReportStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'generating':
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    case 'scheduled':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Get human-readable report type name
 */
export function getReportTypeName(type: ReportType): string {
  const typeNames: Record<ReportType, string> = {
    incident_summary: 'Incident Summary',
    ice_depth_analysis: 'Ice Depth Analysis',
    staff_schedule: 'Staff Schedule',
    maintenance_log: 'Maintenance Log',
    facility_overview: 'Facility Overview',
    compliance: 'Compliance Report',
    financial: 'Financial Report',
    custom: 'Custom Report',
  };
  return typeNames[type] || type;
}

/**
 * Get icon color class for report type
 */
export function getReportTypeColor(type: ReportType): string {
  const typeColors: Record<ReportType, string> = {
    incident_summary: 'bg-red-100 text-red-700',
    ice_depth_analysis: 'bg-ice-100 text-ice-700',
    staff_schedule: 'bg-green-100 text-green-700',
    maintenance_log: 'bg-purple-100 text-purple-700',
    facility_overview: 'bg-blue-100 text-blue-700',
    compliance: 'bg-yellow-100 text-yellow-700',
    financial: 'bg-emerald-100 text-emerald-700',
    custom: 'bg-gray-100 text-gray-700',
  };
  return typeColors[type] || 'bg-gray-100 text-gray-700';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format relative time for display
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return then.toLocaleDateString();
}

/**
 * Get frequency display text
 */
export function getFrequencyText(frequency: ReportFrequency): string {
  const freqText: Record<ReportFrequency, string> = {
    once: 'One-time',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
  };
  return freqText[frequency] || frequency;
}

// ========== Report Type Configuration ==========

export interface ReportTypeConfig {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  apiEndpoint: string;
  color: string;
  params: ReportParam[];
  comingSoon?: boolean;
}

export interface ReportParam {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange';
  required?: boolean;
  options?: { value: string; label: string }[];
}

export const REPORT_TYPES: ReportTypeConfig[] = [
  {
    id: 'ice-depth',
    name: 'Ice Depth Analysis Report',
    description: 'Comprehensive ice depth readings with SPC analysis, weekly comparisons, and AI insights.',
    type: 'ice_depth_analysis',
    apiEndpoint: '/api/reports/ice-depth',
    color: 'bg-ice-100 text-ice-700',
    params: [
      {
        key: 'rinkId',
        label: 'Rink',
        type: 'select',
        required: true,
        options: [
          { value: 'rink-a', label: 'Rink A - NHL Size' },
          { value: 'rink-b', label: 'Rink B - Olympic Size' },
        ],
      },
      {
        key: 'weeks',
        label: 'Time Period',
        type: 'select',
        options: [
          { value: '1', label: 'Last Week' },
          { value: '2', label: 'Last 2 Weeks' },
          { value: '4', label: 'Last 4 Weeks' },
          { value: '8', label: 'Last 8 Weeks' },
          { value: '12', label: 'Last 12 Weeks' },
        ],
      },
    ],
  },
  {
    id: 'incident',
    name: 'Incident Report',
    description: 'Detailed incident report for documentation, insurance, and follow-up purposes.',
    type: 'incident_summary',
    apiEndpoint: '/api/reports/incident',
    color: 'bg-red-100 text-red-700',
    params: [
      { key: 'incidentId', label: 'Incident ID', type: 'text', required: true },
    ],
  },
  {
    id: 'refrigeration',
    name: 'Refrigeration Summary',
    description: 'Plant room readings, trends, and maintenance alerts over selected period.',
    type: 'maintenance_log',
    apiEndpoint: '/api/reports/refrigeration',
    color: 'bg-purple-100 text-purple-700',
    params: [
      {
        key: 'period',
        label: 'Time Period',
        type: 'select',
        options: [
          { value: 'week', label: 'Last Week' },
          { value: 'month', label: 'Last Month' },
          { value: 'quarter', label: 'Last Quarter' },
        ],
      },
    ],
    comingSoon: true,
  },
  {
    id: 'air-quality',
    name: 'Air Quality Report',
    description: 'CO2 and CO monitoring trends with OSHA compliance status.',
    type: 'compliance',
    apiEndpoint: '/api/reports/air-quality',
    color: 'bg-teal-100 text-teal-700',
    params: [
      {
        key: 'period',
        label: 'Time Period',
        type: 'select',
        options: [
          { value: 'week', label: 'Last Week' },
          { value: 'month', label: 'Last Month' },
        ],
      },
    ],
    comingSoon: true,
  },
  {
    id: 'schedule',
    name: 'Schedule Summary',
    description: 'Staff hours, shift coverage, and time-off summary.',
    type: 'staff_schedule',
    apiEndpoint: '/api/reports/schedule',
    color: 'bg-green-100 text-green-700',
    params: [
      {
        key: 'period',
        label: 'Time Period',
        type: 'select',
        options: [
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' },
        ],
      },
    ],
    comingSoon: true,
  },
  {
    id: 'forms',
    name: 'Form Submissions Report',
    description: 'Summary of all form submissions with completion rates.',
    type: 'custom',
    apiEndpoint: '/api/reports/forms',
    color: 'bg-yellow-100 text-yellow-700',
    params: [
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          { value: 'all', label: 'All Forms' },
          { value: 'ICE_OPERATIONS', label: 'Ice Operations' },
          { value: 'REFRIGERATION', label: 'Refrigeration' },
          { value: 'AIR_QUALITY', label: 'Air Quality' },
        ],
      },
      {
        key: 'period',
        label: 'Time Period',
        type: 'select',
        options: [
          { value: 'week', label: 'Last Week' },
          { value: 'month', label: 'Last Month' },
        ],
      },
    ],
    comingSoon: true,
  },
];

/**
 * Get report type config by ID
 */
export function getReportTypeConfig(id: string): ReportTypeConfig | undefined {
  return REPORT_TYPES.find((r) => r.id === id);
}
