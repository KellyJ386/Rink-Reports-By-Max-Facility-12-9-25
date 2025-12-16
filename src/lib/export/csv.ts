// CSV Export Utilities

export interface CSVColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
}

/**
 * Convert array of objects to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CSVColumn<T>[]
): string {
  if (data.length === 0) {
    return columns.map((c) => `"${escapeCSV(c.header)}"`).join(',');
  }

  // Header row
  const headers = columns.map((c) => `"${escapeCSV(c.header)}"`).join(',');

  // Data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = getNestedValue(row, col.key as string);
        const formatted = col.formatter ? col.formatter(value, row) : formatValue(value);
        return `"${escapeCSV(formatted)}"`;
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Format value for CSV
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string): string {
  return value.replace(/"/g, '""');
}

/**
 * Format date for human-readable CSV
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date only (no time)
 */
export function formatDateOnlyForCSV(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format time only
 */
export function formatTimeForCSV(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format number with specified decimal places
 */
export function formatNumberForCSV(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '';
  return value.toFixed(decimals);
}

/**
 * Format boolean as Yes/No
 */
export function formatBooleanForCSV(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? 'Yes' : 'No';
}

/**
 * Generate filename with timestamp
 */
export function generateExportFilename(prefix: string, format: 'csv' | 'json' = 'csv'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${prefix}-${timestamp}.${format}`;
}
