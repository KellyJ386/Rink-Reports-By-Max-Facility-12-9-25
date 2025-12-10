/**
 * Data Export Utilities
 * Handles CSV and Excel export for data tables
 */

// Types
export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
}

/**
 * Format a value for CSV export (handles special characters, commas, quotes)
 */
function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Export data to CSV format
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  // Build header row
  const headers = columns.map((col) => formatCsvValue(col.header));
  const headerRow = headers.join(',');

  // Build data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        const rawValue = getNestedValue(row, col.key as string);
        const formattedValue = col.formatter ? col.formatter(rawValue, row) : rawValue;
        return formatCsvValue(formattedValue);
      })
      .join(',');
  });

  // Combine into CSV content
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${options.filename}.csv`);
}

/**
 * Export data to Excel format (XLSX)
 * Uses a simple XML-based format that Excel can open
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  const sheetName = options.sheetName || 'Sheet1';

  // Build XML spreadsheet
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml +=
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';

  // Styles
  xml += '<Styles>\n';
  xml += '<Style ss:ID="Header">\n';
  xml += '<Font ss:Bold="1"/>\n';
  xml += '<Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>\n';
  xml += '</Style>\n';
  xml += '<Style ss:ID="Date">\n';
  xml += '<NumberFormat ss:Format="yyyy-mm-dd hh:mm:ss"/>\n';
  xml += '</Style>\n';
  xml += '</Styles>\n';

  // Worksheet
  xml += `<Worksheet ss:Name="${escapeXml(sheetName)}">\n`;
  xml += '<Table>\n';

  // Column widths
  columns.forEach(() => {
    xml += '<Column ss:AutoFitWidth="1" ss:Width="120"/>\n';
  });

  // Header row
  xml += '<Row>\n';
  columns.forEach((col) => {
    xml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>\n`;
  });
  xml += '</Row>\n';

  // Data rows
  data.forEach((row) => {
    xml += '<Row>\n';
    columns.forEach((col) => {
      const rawValue = getNestedValue(row, col.key as string);
      const formattedValue = col.formatter ? col.formatter(rawValue, row) : rawValue;
      const cellValue = formattedValue ?? '';
      const cellType = typeof cellValue === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${cellType}">${escapeXml(String(cellValue))}</Data></Cell>\n`;
    });
    xml += '</Row>\n';
  });

  xml += '</Table>\n';
  xml += '</Worksheet>\n';
  xml += '</Workbook>';

  // Create blob and download
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `${options.filename}.xls`);
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Format datetime for export
 */
export function formatDateTimeForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format boolean for export
 */
export function formatBooleanForExport(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? 'Yes' : 'No';
}

/**
 * Pre-defined export configurations for common entities
 */
export const exportConfigs = {
  incidents: [
    { key: 'reportNumber', header: 'Report Number' },
    { key: 'type', header: 'Type' },
    { key: 'severity', header: 'Severity' },
    { key: 'status', header: 'Status' },
    { key: 'title', header: 'Title' },
    { key: 'description', header: 'Description' },
    { key: 'location', header: 'Location' },
    { key: 'occurredAt', header: 'Occurred At', formatter: formatDateTimeForExport },
    { key: 'reportedBy.name', header: 'Reported By' },
    { key: 'assignedTo.name', header: 'Assigned To' },
    { key: 'createdAt', header: 'Created At', formatter: formatDateTimeForExport },
  ],

  iceReadings: [
    { key: 'rink.name', header: 'Rink' },
    { key: 'readingDate', header: 'Date', formatter: formatDateForExport },
    { key: 'averageDepth', header: 'Avg Depth (in)' },
    { key: 'minDepth', header: 'Min Depth (in)' },
    { key: 'maxDepth', header: 'Max Depth (in)' },
    { key: 'surfaceTemp', header: 'Surface Temp (°F)' },
    { key: 'ambientTemp', header: 'Ambient Temp (°F)' },
    { key: 'humidity', header: 'Humidity (%)' },
    { key: 'quality', header: 'Quality' },
    { key: 'recordedBy.name', header: 'Recorded By' },
  ],

  refrigerationLogs: [
    { key: 'rink.name', header: 'Rink' },
    { key: 'logTime', header: 'Time', formatter: formatDateTimeForExport },
    { key: 'compressorStatus', header: 'Compressor' },
    { key: 'suctionPressure', header: 'Suction (PSI)' },
    { key: 'dischargePressure', header: 'Discharge (PSI)' },
    { key: 'brineSupplyTemp', header: 'Brine Supply (°F)' },
    { key: 'brineReturnTemp', header: 'Brine Return (°F)' },
    { key: 'condenserTemp', header: 'Condenser (°F)' },
    { key: 'oilLevel', header: 'Oil Level' },
    { key: 'refrigerantLevel', header: 'Refrigerant Level' },
    { key: 'operator.name', header: 'Operator' },
  ],

  airQualityLogs: [
    { key: 'rink.name', header: 'Rink' },
    { key: 'readingTime', header: 'Time', formatter: formatDateTimeForExport },
    { key: 'co2Level', header: 'CO2 (ppm)' },
    { key: 'coLevel', header: 'CO (ppm)' },
    { key: 'no2Level', header: 'NO2 (ppm)' },
    { key: 'humidity', header: 'Humidity (%)' },
    { key: 'temperature', header: 'Temperature (°F)' },
    { key: 'pm25', header: 'PM2.5' },
    { key: 'pm10', header: 'PM10' },
    { key: 'ventilationStatus', header: 'Ventilation' },
    { key: 'recordedBy.name', header: 'Recorded By' },
  ],

  schedules: [
    { key: 'user.name', header: 'Employee' },
    { key: 'user.email', header: 'Email' },
    { key: 'shift.name', header: 'Shift' },
    { key: 'startTime', header: 'Start', formatter: formatDateTimeForExport },
    { key: 'endTime', header: 'End', formatter: formatDateTimeForExport },
    { key: 'position', header: 'Position' },
    { key: 'status', header: 'Status' },
    { key: 'notes', header: 'Notes' },
  ],

  equipment: [
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type' },
    { key: 'model', header: 'Model' },
    { key: 'serialNumber', header: 'Serial Number' },
    { key: 'manufacturer', header: 'Manufacturer' },
    { key: 'status', header: 'Status' },
    { key: 'location', header: 'Location' },
    { key: 'purchaseDate', header: 'Purchase Date', formatter: formatDateForExport },
    { key: 'lastMaintenanceDate', header: 'Last Maintenance', formatter: formatDateForExport },
    { key: 'nextMaintenanceDate', header: 'Next Maintenance', formatter: formatDateForExport },
    { key: 'hoursUsed', header: 'Hours Used' },
  ],

  auditLogs: [
    { key: 'createdAt', header: 'Timestamp', formatter: formatDateTimeForExport },
    { key: 'action', header: 'Action' },
    { key: 'entityType', header: 'Entity Type' },
    { key: 'entityId', header: 'Entity ID' },
    { key: 'user.name', header: 'User' },
    { key: 'user.email', header: 'User Email' },
    { key: 'ipAddress', header: 'IP Address' },
  ],
};
