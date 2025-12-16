'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  prefetchDashboard,
  prefetchIncidents,
  prefetchIncident,
  prefetchIceDepthReadings,
  prefetchAlerts,
  prefetchAlertStats,
  prefetchFacilities,
  prefetchFacilityRinks,
  prefetchDashboardPage,
  prefetchIncidentsPage,
  prefetchIceDepthPage,
  createHoverPrefetch,
} from '@/lib/prefetch';

interface PrefetchOptions {
  facilityId?: string;
  rinkId?: string;
}

/**
 * Hook for prefetching data in components
 *
 * @example
 * // Basic usage
 * const { prefetchDashboard, prefetchIncident } = usePrefetch();
 *
 * // Prefetch on mount
 * useEffect(() => {
 *   prefetchDashboard();
 * }, []);
 *
 * // Prefetch on hover
 * <Link {...getHoverProps(() => prefetchIncident(id))}>
 *   View Incident
 * </Link>
 */
export function usePrefetch(options: PrefetchOptions = {}) {
  const queryClient = useQueryClient();
  const { facilityId, rinkId } = options;

  // Dashboard prefetch
  const prefetchDashboardData = useCallback(
    () => prefetchDashboard(queryClient, facilityId),
    [queryClient, facilityId]
  );

  // Incidents prefetch
  const prefetchIncidentsData = useCallback(
    () => prefetchIncidents(queryClient, { facilityId, rinkId }),
    [queryClient, facilityId, rinkId]
  );

  const prefetchIncidentData = useCallback(
    (incidentId: string) => prefetchIncident(queryClient, incidentId),
    [queryClient]
  );

  // Ice depth prefetch
  const prefetchIceDepthData = useCallback(
    () => prefetchIceDepthReadings(queryClient, { rinkId }),
    [queryClient, rinkId]
  );

  // Alerts prefetch
  const prefetchAlertsData = useCallback(
    () => prefetchAlerts(queryClient, { facilityId }),
    [queryClient, facilityId]
  );

  const prefetchAlertStatsData = useCallback(
    () => (facilityId ? prefetchAlertStats(queryClient, facilityId) : Promise.resolve()),
    [queryClient, facilityId]
  );

  // Facilities prefetch
  const prefetchFacilitiesData = useCallback(
    () => prefetchFacilities(queryClient),
    [queryClient]
  );

  const prefetchFacilityRinksData = useCallback(
    (fId: string) => prefetchFacilityRinks(queryClient, fId),
    [queryClient]
  );

  // Page-level prefetch
  const prefetchDashboardPageData = useCallback(
    () => prefetchDashboardPage(queryClient, facilityId),
    [queryClient, facilityId]
  );

  const prefetchIncidentsPageData = useCallback(
    () => prefetchIncidentsPage(queryClient, { facilityId, rinkId }),
    [queryClient, facilityId, rinkId]
  );

  const prefetchIceDepthPageData = useCallback(
    () => prefetchIceDepthPage(queryClient, { rinkId }),
    [queryClient, rinkId]
  );

  // Hover prefetch helper
  const getHoverProps = useCallback(
    (prefetchFn: () => Promise<void>) => createHoverPrefetch(queryClient, prefetchFn),
    [queryClient]
  );

  return {
    // Individual prefetch functions
    prefetchDashboard: prefetchDashboardData,
    prefetchIncidents: prefetchIncidentsData,
    prefetchIncident: prefetchIncidentData,
    prefetchIceDepth: prefetchIceDepthData,
    prefetchAlerts: prefetchAlertsData,
    prefetchAlertStats: prefetchAlertStatsData,
    prefetchFacilities: prefetchFacilitiesData,
prefetchFacilityRinks: prefetchFacilityRinksData,

    // Page-level prefetch functions
    prefetchDashboardPage: prefetchDashboardPageData,
    prefetchIncidentsPage: prefetchIncidentsPageData,
    prefetchIceDepthPage: prefetchIceDepthPageData,

    // Utility for hover prefetch
    getHoverProps,
  };
}

/**
 * Hook for link prefetching on hover/focus
 *
 * @example
 * const hoverProps = useLinkPrefetch(() => prefetchIncident(id));
 * <Link {...hoverProps} href={`/incidents/${id}`}>View</Link>
 */
export function useLinkPrefetch(prefetchFn: () => Promise<void>) {
  const queryClient = useQueryClient();
  return createHoverPrefetch(queryClient, prefetchFn);
}
