'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AirQualityReading {
  id: string;
  facilityId: string;
  recordedById: string;
  recordedAt: string;
  location: string;
  co2Level: number | null;
  coLevel: number | null;
  temperature: number | null;
  humidity: number | null;
  thresholdExceeded: boolean;
  alertSent: boolean;
  notes?: string;
  recordedBy?: {
    id: string;
    name: string;
  };
}

export interface AirQualityFilters {
  facilityId?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  thresholdExceeded?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AirQualityResponse {
  items: AirQualityReading[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateAirQualityData {
  facilityId: string;
  location: string;
  co2Level?: number;
  coLevel?: number;
  temperature?: number;
  humidity?: number;
  notes?: string;
}

export interface AirQualityAlert {
  type: string;
  severity: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  message: string;
  threshold: number;
  actualValue: number;
}

// Thresholds for client-side validation
export const AIR_QUALITY_THRESHOLDS = {
  CO2_WARNING: 800,
  CO2_DANGER: 1000,
  CO_WARNING: 9,
  CO_DANGER: 35,
  TEMP_LOW: 55,
  TEMP_HIGH: 75,
  HUMIDITY_HIGH: 70,
};

// Fetch air quality readings
async function fetchAirQualityReadings(
  filters: AirQualityFilters = {}
): Promise<AirQualityResponse> {
  const params = new URLSearchParams();

  if (filters.facilityId) params.append('facilityId', filters.facilityId);
  if (filters.location) params.append('location', filters.location);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.thresholdExceeded !== undefined) {
    params.append('thresholdExceeded', String(filters.thresholdExceeded));
  }
  if (filters.page) params.append('page', String(filters.page));
  if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

  const response = await fetch(`/api/air-quality?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch air quality readings');
  }

  const result = await response.json();
  return result.data;
}

// Create a new air quality reading
async function createAirQualityReading(
  data: CreateAirQualityData
): Promise<{ data: AirQualityReading; alerts?: AirQualityAlert[] }> {
  const response = await fetch('/api/air-quality', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create reading');
  }

  return response.json();
}

// Hook to fetch air quality readings with filters
export function useAirQualityReadings(filters: AirQualityFilters = {}) {
  return useQuery({
    queryKey: ['airQuality', filters],
    queryFn: () => fetchAirQualityReadings(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Hook to fetch air quality readings with auto-refresh
export function useAirQualityReadingsLive(
  filters: AirQualityFilters = {},
  refreshInterval: number = 60000 // Default 1 minute
) {
  return useQuery({
    queryKey: ['airQuality', 'live', filters],
    queryFn: () => fetchAirQualityReadings(filters),
    staleTime: refreshInterval / 2,
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

// Hook to create a new air quality reading
export function useCreateAirQualityReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAirQualityReading,
    onSuccess: () => {
      // Invalidate all air quality queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['airQuality'] });
    },
  });
}

// Hook to get latest readings by location
export function useLatestReadingsByLocation(facilityId?: string) {
  const { data, ...rest } = useAirQualityReadings({
    facilityId,
    pageSize: 100, // Get enough readings to cover all locations
  });

  // Group by location and get latest
  const latestByLocation = data?.items.reduce(
    (acc, reading) => {
      if (
        !acc[reading.location] ||
        new Date(reading.recordedAt) > new Date(acc[reading.location].recordedAt)
      ) {
        acc[reading.location] = reading;
      }
      return acc;
    },
    {} as Record<string, AirQualityReading>
  );

  return {
    ...rest,
    data: latestByLocation ? Object.values(latestByLocation) : [],
  };
}

// Hook to get readings that exceeded thresholds
export function useThresholdAlerts(facilityId?: string) {
  return useAirQualityReadings({
    facilityId,
    thresholdExceeded: true,
    pageSize: 50,
  });
}

// Helper to check if a reading exceeds thresholds
export function checkThresholds(reading: Partial<AirQualityReading>): {
  exceeded: boolean;
  warnings: string[];
  dangers: string[];
} {
  const warnings: string[] = [];
  const dangers: string[] = [];

  if (reading.co2Level) {
    if (reading.co2Level >= AIR_QUALITY_THRESHOLDS.CO2_DANGER) {
      dangers.push(`CO₂ at dangerous level: ${reading.co2Level} ppm`);
    } else if (reading.co2Level >= AIR_QUALITY_THRESHOLDS.CO2_WARNING) {
      warnings.push(`CO₂ elevated: ${reading.co2Level} ppm`);
    }
  }

  if (reading.coLevel) {
    if (reading.coLevel >= AIR_QUALITY_THRESHOLDS.CO_DANGER) {
      dangers.push(`CO CRITICAL: ${reading.coLevel} ppm - EVACUATE`);
    } else if (reading.coLevel >= AIR_QUALITY_THRESHOLDS.CO_WARNING) {
      warnings.push(`CO elevated: ${reading.coLevel} ppm`);
    }
  }

  if (reading.temperature) {
    if (reading.temperature < AIR_QUALITY_THRESHOLDS.TEMP_LOW) {
      warnings.push(`Temperature low: ${reading.temperature}°F`);
    } else if (reading.temperature > AIR_QUALITY_THRESHOLDS.TEMP_HIGH) {
      warnings.push(`Temperature high: ${reading.temperature}°F`);
    }
  }

  if (reading.humidity && reading.humidity > AIR_QUALITY_THRESHOLDS.HUMIDITY_HIGH) {
    warnings.push(`Humidity high: ${reading.humidity}%`);
  }

  return {
    exceeded: warnings.length > 0 || dangers.length > 0,
    warnings,
    dangers,
  };
}

// Helper to get status color based on CO2 level
export function getCO2Status(level: number): {
  color: string;
  bg: string;
  label: string;
  severity: 'normal' | 'warning' | 'danger';
} {
  if (level >= AIR_QUALITY_THRESHOLDS.CO2_DANGER) {
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Danger', severity: 'danger' };
  }
  if (level >= AIR_QUALITY_THRESHOLDS.CO2_WARNING) {
    return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Elevated', severity: 'warning' };
  }
  return { color: 'text-green-600', bg: 'bg-green-100', label: 'Normal', severity: 'normal' };
}

// Helper to get status color based on CO level
export function getCOStatus(level: number): {
  color: string;
  bg: string;
  label: string;
  severity: 'normal' | 'warning' | 'danger' | 'critical';
} {
  if (level >= AIR_QUALITY_THRESHOLDS.CO_DANGER) {
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'CRITICAL', severity: 'critical' };
  }
  if (level >= AIR_QUALITY_THRESHOLDS.CO_WARNING) {
    return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Elevated', severity: 'warning' };
  }
  return { color: 'text-green-600', bg: 'bg-green-100', label: 'Normal', severity: 'normal' };
}
