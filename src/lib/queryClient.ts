'use client';

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// Query key factory for consistent cache management
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (facilityId?: string) => ['dashboardStats', facilityId] as const,
  },
  // Ice Depth
  iceDepth: {
    all: ['ice-depth'] as const,
    readings: (params?: Record<string, unknown>) => ['ice-depth-readings', params] as const,
    analysis: (params: { rinkId: string; weeks?: number }) => ['ice-depth-analysis', params] as const,
    single: (id: string) => ['ice-depth-reading', id] as const,
  },
  // Incidents
  incidents: {
    all: ['incidents'] as const,
    list: (params?: Record<string, unknown>) => ['incidents', params] as const,
    single: (id: string) => ['incident', id] as const,
  },
  // Alerts
  alerts: {
    all: ['alerts'] as const,
    list: (params?: Record<string, unknown>) => ['alerts', params] as const,
    stats: (facilityId: string) => ['alert-stats', facilityId] as const,
  },
  // Forms
  forms: {
    all: ['forms'] as const,
    submissions: (params?: Record<string, unknown>) => ['form-submissions', params] as const,
    single: (id: string) => ['form-submission', id] as const,
  },
  // Schedule
  schedule: {
    all: ['schedule'] as const,
    shifts: (params?: Record<string, unknown>) => ['shifts', params] as const,
    single: (id: string) => ['shift', id] as const,
  },
  // Users
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => ['users', params] as const,
    single: (id: string) => ['user', id] as const,
  },
  // Facilities
  facilities: {
    all: ['facilities'] as const,
    list: () => ['facilities'] as const,
    single: (id: string) => ['facility', id] as const,
    rinks: (facilityId: string) => ['facility-rinks', facilityId] as const,
  },
} as const;

// Cache time constants (in milliseconds)
export const CACHE_TIME = {
  // Short-lived data that changes frequently
  REAL_TIME: 10 * 1000, // 10 seconds
  SHORT: 30 * 1000, // 30 seconds

  // Standard data
  MEDIUM: 2 * 60 * 1000, // 2 minutes

  // Relatively stable data
  LONG: 5 * 60 * 1000, // 5 minutes

  // Very stable data (facilities, users)
  VERY_LONG: 15 * 60 * 1000, // 15 minutes

  // Static data (rarely changes)
  STATIC: 60 * 60 * 1000, // 1 hour
} as const;

// Error handler for queries
function handleQueryError(error: unknown) {
  console.error('Query error:', error);

  // You could add error reporting service here (e.g., Sentry)
  // if (typeof window !== 'undefined') {
  //   Sentry.captureException(error);
  // }
}

// Error handler for mutations
function handleMutationError(error: unknown) {
  console.error('Mutation error:', error);
}

// Create query client with optimized defaults
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleQueryError,
    }),
    mutationCache: new MutationCache({
      onError: handleMutationError,
    }),
    defaultOptions: {
      queries: {
        // Default stale time - data is fresh for 1 minute
        staleTime: CACHE_TIME.MEDIUM,

        // Keep unused data in cache for 5 minutes
        gcTime: CACHE_TIME.LONG,

        // Don't refetch on window focus by default (override where needed)
        refetchOnWindowFocus: false,

        // Don't refetch on reconnect by default
        refetchOnReconnect: 'always',

        // Retry failed requests once
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Enable network mode for offline support
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,

        // Enable network mode for offline support
        networkMode: 'offlineFirst',
      },
    },
  });
}

// Singleton query client for client-side
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return createQueryClient();
  }

  // Browser: use singleton pattern
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}
