// Data Management Module

export * from './types';
export * from './service';

// Format helpers
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

// Entity display names
export const entityNames: Record<string, string> = {
  incidents: 'Incidents',
  ice_readings: 'Ice Readings',
  schedules: 'Schedules',
  users: 'Users',
  forms: 'Forms',
  maintenance: 'Maintenance',
  all: 'All Data',
};

// Export format configurations
export const exportFormats = {
  json: {
    name: 'JSON',
    extension: '.json',
    mimeType: 'application/json',
  },
  csv: {
    name: 'CSV',
    extension: '.csv',
    mimeType: 'text/csv',
  },
  xlsx: {
    name: 'Excel',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
};

// Import mode descriptions
export const importModes = {
  append: {
    name: 'Append',
    description: 'Add new records without modifying existing ones',
  },
  replace: {
    name: 'Replace',
    description: 'Delete all existing records and import new ones',
  },
  merge: {
    name: 'Merge',
    description: 'Update existing records and add new ones',
  },
};
