'use client';

import { QueryClient } from '@tanstack/react-query';
import { queryKeys, CACHE_TIME } from './queryClient';

// Types for prefetch data
interface PrefetchOptions {
  facilityId?: string;
  rinkId?: string;
}

// Base fetch function with error handling
async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data || data;
  } catch {
    return null;
  }
}

// Prefetch dashboard data
export async function prefetchDashboard(
  queryClient: QueryClient,
  facilityId?: string
) {
  const params = facilityId ? `?facilityId=${facilityId}` : '';

  await queryClient.prefetchQuery({
    queryKey: queryKeys.dashboard.stats(facilityId),
    queryFn: () => safeFetch(`/api/dashboard/stats${params}`),
    staleTime: CACHE_TIME.SHORT,
  });
}

// Prefetch incidents list
export async function prefetchIncidents(
  queryClient: QueryClient,
  options: PrefetchOptions = {}
) {
  const params = new URLSearchParams();
  if (options.facilityId) params.set('facilityId', options.facilityId);
  if (options.rinkId) params.set('rinkId', options.rinkId);
  params.set('limit', '20');

  await queryClient.prefetchQuery({
    queryKey: queryKeys.incidents.list({ ...options, limit: 20 }),
    queryFn: () => safeFetch(`/api/incidents?${params}`),
    staleTime: CACHE_TIME.MEDIUM,
  });
}

// Prefetch a single incident (for hover/focus states)
export async function prefetchIncident(
  queryClient: QueryClient,
  incidentId: string
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.incidents.single(incidentId),
    queryFn: () => safeFetch(`/api/incidents/${incidentId}`),
    staleTime: CACHE_TIME.MEDIUM,
  });
}

// Prefetch ice depth readings
export async function prefetchIceDepthReadings(
  queryClient: QueryClient,
  options: PrefetchOptions = {}
) {
  const params = new URLSearchParams();
  if (options.rinkId) params.set('rinkId', options.rinkId);
  params.set('limit', '20');

  await queryClient.prefetchQuery({
    queryKey: queryKeys.iceDepth.readings({ ...options, limit: 20 }),
    queryFn: () => safeFetch(`/api/ice-depth?${params}`),
    staleTime: CACHE_TIME.MEDIUM,
  });
}

// Prefetch alerts
export async function prefetchAlerts(
  queryClient: QueryClient,
  options: PrefetchOptions = {}
) {
  const params = new URLSearchParams();
  if (options.facilityId) params.set('facilityId', options.facilityId);
  params.set('limit', '20');

  await queryClient.prefetchQuery({
    queryKey: queryKeys.alerts.list({ ...options, limit: 20 }),
    queryFn: () => safeFetch(`/api/alerts?${params}`),
    staleTime: CACHE_TIME.SHORT, // Alerts need fresher data
  });
}

// Prefetch alert stats
export async function prefetchAlertStats(
  queryClient: QueryClient,
  facilityId: string
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.alerts.stats(facilityId),
    queryFn: () => safeFetch(`/api/alerts/stats?facilityId=${facilityId}`),
    staleTime: CACHE_TIME.SHORT,
  });
}

// Prefetch facilities list (static data)
export async function prefetchFacilities(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.facilities.list(),
    queryFn: () => safeFetch('/api/facilities'),
    staleTime: CACHE_TIME.VERY_LONG, // Facilities rarely change
  });
}

// Prefetch facility rinks
export async function prefetchFacilityRinks(
  queryClient: QueryClient,
  facilityId: string
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.facilities.rinks(facilityId),
    queryFn: () => safeFetch(`/api/facilities/${facilityId}/rinks`),
    staleTime: CACHE_TIME.VERY_LONG,
  });
}

// Prefetch data for dashboard page
export async function prefetchDashboardPage(
  queryClient: QueryClient,
  facilityId?: string
) {
  await Promise.all([
    prefetchDashboard(queryClient, facilityId),
    prefetchAlerts(queryClient, { facilityId }),
    facilityId && prefetchAlertStats(queryClient, facilityId),
  ]);
}

// Prefetch data for incidents page
export async function prefetchIncidentsPage(
  queryClient: QueryClient,
  options: PrefetchOptions = {}
) {
  await Promise.all([
    prefetchIncidents(queryClient, options),
    prefetchFacilities(queryClient),
  ]);
}

// Prefetch data for ice depth page
export async function prefetchIceDepthPage(
  queryClient: QueryClient,
  options: PrefetchOptions = {}
) {
  await Promise.all([
    prefetchIceDepthReadings(queryClient, options),
    prefetchFacilities(queryClient),
  ]);
}

// Hook for prefetching on hover (useful for links)
export function createHoverPrefetch(
  queryClient: QueryClient,
  prefetchFn: () => Promise<void>
) {
  let prefetched = false;

  return {
    onMouseEnter: () => {
      if (!prefetched) {
        prefetched = true;
        prefetchFn();
      }
    },
    onFocus: () => {
      if (!prefetched) {
        prefetched = true;
        prefetchFn();
      }
    },
  };
}
