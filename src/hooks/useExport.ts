'use client';

import { useMutation } from '@tanstack/react-query';

export type ExportType =
  | 'ice_depth'
  | 'incidents'
  | 'air_quality'
  | 'refrigeration'
  | 'schedules'
  | 'time_off'
  | 'forms'
  | 'alerts'
  | 'users';

export type ExportFormat = 'csv' | 'json';

export interface ExportParams {
  type: ExportType;
  format?: ExportFormat;
  facilityId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
}

export interface ExportResult {
  success: boolean;
  data?: string;
  blob?: Blob;
  filename?: string;
  error?: string;
}

// Export type labels for UI
export const EXPORT_TYPE_LABELS: Record<ExportType, string> = {
  ice_depth: 'Ice Depth Measurements',
  incidents: 'Incident Reports',
  air_quality: 'Air Quality Readings',
  refrigeration: 'Refrigeration Logs',
  schedules: 'Staff Schedules',
  time_off: 'Time Off Requests',
  forms: 'Form Submissions',
  alerts: 'System Alerts',
  users: 'User Directory',
};

// Export format labels
export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV (Spreadsheet)',
  json: 'JSON (Data)',
};

// Build export URL with query parameters
function buildExportUrl(params: ExportParams): string {
  const searchParams = new URLSearchParams();

  searchParams.set('type', params.type);
  if (params.format) searchParams.set('format', params.format);
  if (params.facilityId) searchParams.set('facilityId', params.facilityId);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.status) searchParams.set('status', params.status);
  if (params.limit) searchParams.set('limit', params.limit.toString());

  return `/api/export?${searchParams.toString()}`;
}

// Fetch export data
async function fetchExport(params: ExportParams): Promise<ExportResult> {
  const url = buildExportUrl(params);
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(errorData.error || 'Export failed');
  }

  const contentType = response.headers.get('content-type') || '';
  const contentDisposition = response.headers.get('content-disposition') || '';

  // Extract filename from content-disposition
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch ? filenameMatch[1] : `export-${params.type}.${params.format || 'csv'}`;

  if (contentType.includes('application/json') && params.format === 'json') {
    const data = await response.json();
    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      filename,
    };
  }

  // For CSV, get as text
  const data = await response.text();
  return {
    success: true,
    data,
    filename,
  };
}

// Download export as file
async function downloadExport(params: ExportParams): Promise<void> {
  const result = await fetchExport(params);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Export failed');
  }

  // Create blob and trigger download
  const mimeType = params.format === 'json' ? 'application/json' : 'text/csv';
  const blob = new Blob([result.data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename || `export.${params.format || 'csv'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
}

// Hook for exporting data (returns data)
export function useExport() {
  return useMutation({
    mutationFn: fetchExport,
  });
}

// Hook for downloading export (triggers file download)
export function useExportDownload() {
  return useMutation({
    mutationFn: downloadExport,
  });
}

// Get default date range (last 30 days)
export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

// Get date range for specific periods
export function getDateRangeForPeriod(period: 'week' | 'month' | 'quarter' | 'year'): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}
