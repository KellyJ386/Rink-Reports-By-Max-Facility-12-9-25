'use client';

import { useQuery } from '@tanstack/react-query';

export interface DashboardStats {
  overview: {
    formsSubmitted: {
      value: number;
      weekValue: number;
      change: string;
      changeType: 'positive' | 'negative' | 'neutral';
    };
    iceReadings: {
      value: number;
      todayValue: number;
      description: string;
    };
    openIncidents: {
      value: number;
      change: string;
      changeType: 'positive' | 'negative' | 'neutral';
    };
    scheduledShifts: {
      value: number;
      todayValue: number;
      description: string;
    };
  };
  alerts: {
    active: number;
    urgent: number;
  };
  activity: Array<{
    id: string;
    type: string;
    title: string;
    user: string;
    time: string;
    status: string;
  }>;
  weekSummary: {
    submissions: number;
    incidents: number;
    iceReadings: number;
    shifts: number;
  };
}

async function fetchDashboardStats(facilityId?: string): Promise<DashboardStats> {
  const params = facilityId ? `?facilityId=${facilityId}` : '';
  const response = await fetch(`/api/dashboard/stats${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  const data = await response.json();
  return data.data;
}

export function useDashboardStats(facilityId?: string) {
  return useQuery({
    queryKey: ['dashboardStats', facilityId],
    queryFn: () => fetchDashboardStats(facilityId),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true,
  });
}

// Module-specific summary types
export interface ModuleSummary {
  title: string;
  description: string;
  stats: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }>;
  recentItems: Array<{
    id: string;
    title: string;
    subtitle: string;
    status?: string;
    time: string;
  }>;
  quickActions: Array<{
    label: string;
    href: string;
    icon?: string;
  }>;
}

// Hook for getting all module summaries
export function useModuleSummaries() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading || error || !stats) {
    return {
      isLoading,
      error,
      modules: null,
    };
  }

  const modules: Record<string, ModuleSummary> = {
    iceDepth: {
      title: 'Ice Depth Analysis',
      description: 'Monitor ice thickness and quality',
      stats: [
        { label: 'This Week', value: stats.iceReadings.value },
        { label: 'Today', value: stats.iceReadings.todayValue },
      ],
      recentItems: stats.activity
        .filter((a) => a.type === 'ice_depth')
        .slice(0, 3)
        .map((a) => ({
          id: a.id,
          title: a.title,
          subtitle: a.user,
          time: a.time,
        })),
      quickActions: [
        { label: 'New Reading', href: '/dashboard/ice-depth/new' },
        { label: 'View Analysis', href: '/dashboard/ice-depth' },
      ],
    },
    incidents: {
      title: 'Incident Reporting',
      description: 'Track and manage facility incidents',
      stats: [
        {
          label: 'Open',
          value: stats.openIncidents.value,
          trend: stats.openIncidents.changeType === 'positive' ? 'down' : 'up',
          trendValue: stats.openIncidents.change,
        },
        { label: 'This Week', value: stats.weekSummary.incidents },
      ],
      recentItems: stats.activity
        .filter((a) => a.type === 'incident')
        .slice(0, 3)
        .map((a) => ({
          id: a.id,
          title: a.title,
          subtitle: a.user,
          status: a.status,
          time: a.time,
        })),
      quickActions: [
        { label: 'Report Incident', href: '/dashboard/incidents/new' },
        { label: 'View All', href: '/dashboard/incidents' },
      ],
    },
    forms: {
      title: 'Form Submissions',
      description: 'Operational forms and logs',
      stats: [
        {
          label: 'Total',
          value: stats.formsSubmitted.value,
          trend: stats.formsSubmitted.changeType === 'positive' ? 'up' : 'down',
          trendValue: stats.formsSubmitted.change,
        },
        { label: 'This Week', value: stats.formsSubmitted.weekValue },
      ],
      recentItems: stats.activity
        .filter((a) => a.type === 'form')
        .slice(0, 3)
        .map((a) => ({
          id: a.id,
          title: a.title,
          subtitle: a.user,
          status: a.status,
          time: a.time,
        })),
      quickActions: [
        { label: 'Fill Out Form', href: '/dashboard/forms' },
        { label: 'View Submissions', href: '/dashboard/forms' },
      ],
    },
    schedule: {
      title: 'Staff Schedule',
      description: 'Employee shifts and time-off',
      stats: [
        { label: 'This Week', value: stats.scheduledShifts.value },
        { label: 'Today', value: stats.scheduledShifts.todayValue },
      ],
      recentItems: [],
      quickActions: [
        { label: 'View Schedule', href: '/dashboard/schedule' },
        { label: 'Add Shift', href: '/dashboard/schedule' },
      ],
    },
    alerts: {
      title: 'Active Alerts',
      description: 'System notifications and warnings',
      stats: [
        { label: 'Active', value: stats.alerts.active },
        {
          label: 'Urgent',
          value: stats.alerts.urgent,
          trend: stats.alerts.urgent > 0 ? 'up' : 'neutral',
        },
      ],
      recentItems: [],
      quickActions: [
        { label: 'View Alerts', href: '/dashboard/alerts' },
        { label: 'Settings', href: '/settings/notifications' },
      ],
    },
  };

  return {
    isLoading: false,
    error: null,
    modules,
    stats,
  };
}
