'use client';

import { useQuery } from '@tanstack/react-query';

// Types
export interface FacilityStat {
  id: string;
  name: string;
  openIncidents: number;
  unacknowledgedAlerts: number;
  pendingSubmissions: number;
  totalUsers: number;
}

export interface OrganizationDashboard {
  summary: {
    facilities: {
      total: number;
      active: number;
    };
    users: {
      total: number;
      active: number;
    };
    incidents: {
      total: number;
      open: number;
      thisMonth: number;
    };
    alerts: {
      total: number;
      unacknowledged: number;
      thisWeek: number;
    };
    forms: {
      total: number;
      pending: number;
      thisMonth: number;
    };
    iceDepth: {
      readingsToday: number;
      facilitiesWithReadings: number;
    };
    airQuality: {
      alertsThisWeek: number;
    };
    scheduling: {
      shiftsThisWeek: number;
      pendingTimeOff: number;
    };
  };
  facilityStats: FacilityStat[];
  lastUpdated: string;
}

export type ComparisonMetric =
  | 'ice_depth'
  | 'incidents'
  | 'air_quality'
  | 'refrigeration'
  | 'forms'
  | 'alerts'
  | 'schedules';

export type ComparisonPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface ComparisonResult {
  metric: ComparisonMetric;
  period: ComparisonPeriod;
  startDate: string;
  endDate: string;
  facilities: { id: string; name: string }[];
  data: Record<string, unknown>[];
}

export interface ComparisonParams {
  facilityIds: string[];
  metric: ComparisonMetric;
  period?: ComparisonPeriod;
}

// Metric labels
export const COMPARISON_METRIC_LABELS: Record<ComparisonMetric, string> = {
  ice_depth: 'Ice Depth',
  incidents: 'Incidents',
  air_quality: 'Air Quality',
  refrigeration: 'Refrigeration',
  forms: 'Form Submissions',
  alerts: 'Alerts',
  schedules: 'Schedules',
};

export const COMPARISON_PERIOD_LABELS: Record<ComparisonPeriod, string> = {
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  quarter: 'Last 90 Days',
  year: 'Last Year',
};

// Fetch organization dashboard
async function fetchOrganizationDashboard(organizationId?: string): Promise<OrganizationDashboard> {
  const url = organizationId
    ? `/api/organization/dashboard?organizationId=${organizationId}`
    : '/api/organization/dashboard';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch organization dashboard');
  }
  return response.json();
}

// Fetch facility comparison
async function fetchFacilityComparison(params: ComparisonParams): Promise<ComparisonResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('facilityIds', params.facilityIds.join(','));
  searchParams.set('metric', params.metric);
  if (params.period) searchParams.set('period', params.period);

  const response = await fetch(`/api/organization/comparison?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch facility comparison');
  }
  return response.json();
}

// Hooks
export function useOrganizationDashboard(organizationId?: string) {
  return useQuery({
    queryKey: ['organizationDashboard', organizationId],
    queryFn: () => fetchOrganizationDashboard(organizationId),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useOrganizationDashboardLive(organizationId?: string) {
  return useQuery({
    queryKey: ['organizationDashboard', organizationId],
    queryFn: () => fetchOrganizationDashboard(organizationId),
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useFacilityComparison(params: ComparisonParams) {
  return useQuery({
    queryKey: ['facilityComparison', params],
    queryFn: () => fetchFacilityComparison(params),
    enabled: params.facilityIds.length >= 2,
  });
}

// Helper: Get summary card color based on value
export function getSummaryCardColor(
  value: number,
  thresholds: { warning: number; danger: number }
): 'green' | 'yellow' | 'red' {
  if (value >= thresholds.danger) return 'red';
  if (value >= thresholds.warning) return 'yellow';
  return 'green';
}

// Helper: Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Helper: Format large numbers
export function formatLargeNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

// Helper: Get facility health score based on stats
export function getFacilityHealthScore(stat: FacilityStat): {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
} {
  let score = 100;

  // Deduct points for issues
  score -= stat.openIncidents * 10;
  score -= stat.unacknowledgedAlerts * 5;
  score -= stat.pendingSubmissions * 2;

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  let status: 'excellent' | 'good' | 'warning' | 'critical';
  if (score >= 90) status = 'excellent';
  else if (score >= 70) status = 'good';
  else if (score >= 50) status = 'warning';
  else status = 'critical';

  return { score, status };
}

// Helper: Get status color
export function getHealthStatusColor(status: 'excellent' | 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'excellent':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    case 'good':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    case 'warning':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    case 'critical':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
  }
}
