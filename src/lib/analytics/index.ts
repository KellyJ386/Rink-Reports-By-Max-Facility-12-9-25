// Analytics Module

export * from './types';
export * from './service';

// Metric categories
export const metricCategories = {
  operations: {
    name: 'Operations',
    metrics: ['ice-quality', 'ice-depth', 'maintenance-compliance', 'energy-usage'],
  },
  safety: {
    name: 'Safety',
    metrics: ['incident-rate', 'near-misses', 'safety-compliance'],
  },
  staff: {
    name: 'Staff',
    metrics: ['staff-utilization', 'overtime-hours', 'attendance'],
  },
  customer: {
    name: 'Customer',
    metrics: ['visitor-count', 'satisfaction-score', 'booking-rate'],
  },
};

// Time range presets
export const timeRangePresets = [
  { id: 'today', label: 'Today', days: 0 },
  { id: '7d', label: 'Last 7 Days', days: 7 },
  { id: '30d', label: 'Last 30 Days', days: 30 },
  { id: '90d', label: 'Last 90 Days', days: 90 },
  { id: '12m', label: 'Last 12 Months', days: 365 },
  { id: 'ytd', label: 'Year to Date', days: -1 },
];

// KPI status thresholds
export const kpiThresholds = {
  'ice-quality': { good: 90, warning: 80 },
  'incident-rate': { good: 2, warning: 4 },
  'maintenance-compliance': { good: 95, warning: 85 },
  'staff-utilization': { good: 85, warning: 70 },
};

// Chart color schemes
export const chartColors = {
  primary: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'],
  success: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
  danger: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'],
  mixed: ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
};

// Format helpers
export function formatMetricValue(
  value: number,
  format?: 'number' | 'currency' | 'percentage' | 'duration'
): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'duration':
      if (value < 1) return `${Math.round(value * 60)}m`;
      return `${value.toFixed(1)}h`;
    default:
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}

export function formatChange(change: number, isPercentage: boolean = false): string {
  const sign = change > 0 ? '+' : '';
  const value = isPercentage ? `${change.toFixed(1)}%` : change.toFixed(2);
  return `${sign}${value}`;
}

export function getStatusColor(status?: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    case 'warning':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    case 'critical':
      return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  }
}

export function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
}
