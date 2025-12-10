import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Alert {
  id: string;
  facilityId: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'SERIOUS' | 'CRITICAL';
  message: string;
  threshold: number | null;
  actualValue: number | null;
  acknowledgedAt: string | null;
  acknowledgedBy: { id: string; name: string } | null;
  resolvedAt: string | null;
  createdAt: string;
  facility: { id: string; name: string };
}

interface AlertStats {
  total: number;
  unacknowledged: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}

// Fetch alerts
async function fetchAlerts(params: {
  facilityId?: string;
  alertType?: string;
  severity?: string;
  acknowledged?: boolean;
  limit?: number;
}): Promise<Alert[]> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.set(key, value.toString());
  });

  const response = await fetch(`/api/alerts?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }
  const data = await response.json();
  return data.data;
}

// Fetch alert stats
async function fetchAlertStats(facilityId: string): Promise<AlertStats> {
  const response = await fetch(`/api/alerts/stats?facilityId=${facilityId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch alert stats');
  }
  const data = await response.json();
  return data.data;
}

// Acknowledge alert
async function acknowledgeAlert(id: string): Promise<Alert> {
  const response = await fetch(`/api/alerts/${id}/acknowledge`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to acknowledge alert');
  }
  const data = await response.json();
  return data.data;
}

// Resolve alert
async function resolveAlert(id: string): Promise<Alert> {
  const response = await fetch(`/api/alerts/${id}/resolve`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to resolve alert');
  }
  const data = await response.json();
  return data.data;
}

// Hooks
export function useAlerts(params: {
  facilityId?: string;
  alertType?: string;
  severity?: string;
  acknowledged?: boolean;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => fetchAlerts(params),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time alerts
  });
}

export function useAlertStats(facilityId: string) {
  return useQuery({
    queryKey: ['alert-stats', facilityId],
    queryFn: () => fetchAlertStats(facilityId),
    enabled: !!facilityId,
    refetchInterval: 30000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });
}

export type { Alert, AlertStats };
