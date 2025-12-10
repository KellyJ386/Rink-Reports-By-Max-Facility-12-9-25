// Data Management Types

export type ExportFormat = 'json' | 'csv' | 'xlsx';

export type DataEntity =
  | 'incidents'
  | 'ice_readings'
  | 'schedules'
  | 'users'
  | 'forms'
  | 'maintenance'
  | 'all';

export interface ExportOptions {
  entities: DataEntity[];
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
  facilityId?: string;
  includeArchived?: boolean;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options: ExportOptions;
  progress: number;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export interface ImportOptions {
  entity: DataEntity;
  format: ExportFormat;
  mode: 'append' | 'replace' | 'merge';
  facilityId?: string;
  validateOnly?: boolean;
  mapping?: Record<string, string>;
}

export interface ImportJob {
  id: string;
  status: 'pending' | 'validating' | 'processing' | 'completed' | 'failed';
  options: ImportOptions;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  skippedRecords: number;
  errors: ImportError[];
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: unknown;
}

export interface BackupJob {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  size?: number;
  facilityId?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  url?: string;
}

export interface RetentionPolicy {
  id: string;
  entity: DataEntity;
  retentionDays: number;
  archiveFirst: boolean;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface DataStats {
  entity: DataEntity;
  totalRecords: number;
  archivedRecords: number;
  sizeBytes: number;
  oldestRecord?: Date;
  newestRecord?: Date;
}

export interface CleanupResult {
  entity: DataEntity;
  deletedCount: number;
  archivedCount: number;
  freedBytes: number;
}
