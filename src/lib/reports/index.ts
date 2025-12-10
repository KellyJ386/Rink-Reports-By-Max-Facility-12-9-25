// Reports Module

export * from './types';
export * from './templates';
export * from './generator';

// Report format configurations
export const formatConfig = {
  pdf: {
    name: 'PDF Document',
    extension: '.pdf',
    mimeType: 'application/pdf',
    icon: 'DocumentTextIcon',
  },
  excel: {
    name: 'Excel Spreadsheet',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    icon: 'TableCellsIcon',
  },
  csv: {
    name: 'CSV File',
    extension: '.csv',
    mimeType: 'text/csv',
    icon: 'DocumentIcon',
  },
  json: {
    name: 'JSON Data',
    extension: '.json',
    mimeType: 'application/json',
    icon: 'CodeBracketIcon',
  },
};

// Frequency configurations
export const frequencyConfig = {
  once: {
    name: 'One Time',
    description: 'Generate report once',
  },
  daily: {
    name: 'Daily',
    description: 'Generate every day',
  },
  weekly: {
    name: 'Weekly',
    description: 'Generate every week',
  },
  monthly: {
    name: 'Monthly',
    description: 'Generate every month',
  },
  quarterly: {
    name: 'Quarterly',
    description: 'Generate every quarter',
  },
};

// Report type icons
export const reportTypeIcons = {
  incident_summary: 'ExclamationCircleIcon',
  ice_depth_analysis: 'ChartBarIcon',
  staff_schedule: 'CalendarIcon',
  maintenance_log: 'WrenchIcon',
  facility_overview: 'BuildingOfficeIcon',
  compliance: 'ClipboardDocumentCheckIcon',
  financial: 'CurrencyDollarIcon',
  custom: 'DocumentPlusIcon',
};

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
