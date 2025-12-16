// Report Types and Interfaces

export type ReportType =
  | 'incident_summary'
  | 'ice_depth_analysis'
  | 'staff_schedule'
  | 'maintenance_log'
  | 'facility_overview'
  | 'compliance'
  | 'financial'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export type ReportFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'scheduled';

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  sections: ReportSection[];
  filters: ReportFilter[];
  defaultFormat: ReportFormat;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  name: string;
  type: 'summary' | 'table' | 'chart' | 'text' | 'metrics';
  config: Record<string, unknown>;
  order: number;
}

export interface ReportFilter {
  id: string;
  name: string;
  type: 'date_range' | 'facility' | 'rink' | 'user' | 'status' | 'custom';
  required: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
}

export interface Report {
  id: string;
  templateId?: string;
  name: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;
  filters: Record<string, unknown>;
  facilityId?: string;
  generatedAt?: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: ReportFrequency;
  format: ReportFormat;
  filters: Record<string, unknown>;
  recipients: string[];
  facilityId?: string;
  nextRunAt: Date;
  lastRunAt?: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ReportData {
  metadata: {
    title: string;
    generatedAt: Date;
    generatedBy: string;
    dateRange?: { start: Date; end: Date };
    facility?: string;
  };
  sections: ReportDataSection[];
  summary?: Record<string, unknown>;
}

export interface ReportDataSection {
  id: string;
  title: string;
  type: 'summary' | 'table' | 'chart' | 'text' | 'metrics';
  data: unknown;
}

export interface GenerateReportInput {
  templateId?: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  filters: Record<string, unknown>;
  facilityId?: string;
}

export interface CreateScheduledReportInput {
  templateId: string;
  name: string;
  frequency: ReportFrequency;
  format: ReportFormat;
  filters: Record<string, unknown>;
  recipients: string[];
  facilityId?: string;
}
