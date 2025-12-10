'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type EquipmentStatus = 'OK' | 'LOW' | 'NEEDS_ATTENTION' | 'CRITICAL';

export interface RefrigerationReading {
  id: string;
  facilityId: string;
  recordedById: string;
  recordedAt: string;
  compressor1Suction: number | null;
  compressor1Discharge: number | null;
  compressor2Suction: number | null;
  compressor2Discharge: number | null;
  brineSupply: number | null;
  brineReturn: number | null;
  condenserIn: number | null;
  condenserOut: number | null;
  oilPressure: number | null;
  oilLevel: EquipmentStatus | null;
  refrigerantLevel: EquipmentStatus | null;
  alarmsPresent: boolean;
  alarmDetails?: string;
  notes?: string;
  recordedBy?: {
    id: string;
    name: string;
  };
}

export interface RefrigerationFilters {
  facilityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface RefrigerationResponse {
  items: RefrigerationReading[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateRefrigerationData {
  facilityId: string;
  compressor1Suction?: number;
  compressor1Discharge?: number;
  compressor2Suction?: number;
  compressor2Discharge?: number;
  brineSupply?: number;
  brineReturn?: number;
  condenserIn?: number;
  condenserOut?: number;
  oilPressure?: number;
  oilLevel?: EquipmentStatus;
  refrigerantLevel?: EquipmentStatus;
  alarmsPresent?: boolean;
  alarmDetails?: string;
  notes?: string;
}

// Operating thresholds for refrigeration systems
export const REFRIGERATION_THRESHOLDS = {
  suctionPressure: { min: 20, max: 40, critical: 15 }, // PSI
  dischargePressure: { min: 150, max: 200, critical: 220 }, // PSI
  brineSupply: { min: 15, max: 22, critical: 25 }, // °F
  brineReturn: { min: 20, max: 28, critical: 32 }, // °F
};

// Fetch refrigeration readings
async function fetchRefrigerationReadings(
  filters: RefrigerationFilters = {}
): Promise<RefrigerationResponse> {
  const params = new URLSearchParams();

  if (filters.facilityId) params.append('facilityId', filters.facilityId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

  const response = await fetch(`/api/refrigeration?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch refrigeration readings');
  }

  const result = await response.json();
  return result.data;
}

// Create a new refrigeration reading
async function createRefrigerationReading(
  data: CreateRefrigerationData
): Promise<{ data: RefrigerationReading }> {
  const response = await fetch('/api/refrigeration', {
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

// Hook to fetch refrigeration readings with filters
export function useRefrigerationReadings(filters: RefrigerationFilters = {}) {
  return useQuery({
    queryKey: ['refrigeration', filters],
    queryFn: () => fetchRefrigerationReadings(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Hook to fetch refrigeration readings with auto-refresh
export function useRefrigerationReadingsLive(
  filters: RefrigerationFilters = {},
  refreshInterval: number = 60000 // Default 1 minute
) {
  return useQuery({
    queryKey: ['refrigeration', 'live', filters],
    queryFn: () => fetchRefrigerationReadings(filters),
    staleTime: refreshInterval / 2,
    refetchInterval: refreshInterval > 0 ? refreshInterval : undefined,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

// Hook to create a new refrigeration reading
export function useCreateRefrigerationReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRefrigerationReading,
    onSuccess: () => {
      // Invalidate all refrigeration queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['refrigeration'] });
    },
  });
}

// Helper to check if reading values are within normal range
export function checkRefrigerationStatus(reading: Partial<RefrigerationReading>): {
  hasWarnings: boolean;
  hasCritical: boolean;
  warnings: string[];
  critical: string[];
} {
  const warnings: string[] = [];
  const critical: string[] = [];

  // Check compressor 1 suction
  if (reading.compressor1Suction !== null && reading.compressor1Suction !== undefined) {
    if (reading.compressor1Suction < REFRIGERATION_THRESHOLDS.suctionPressure.critical) {
      critical.push(`Comp 1 Suction critically low: ${reading.compressor1Suction} PSI`);
    } else if (
      reading.compressor1Suction < REFRIGERATION_THRESHOLDS.suctionPressure.min ||
      reading.compressor1Suction > REFRIGERATION_THRESHOLDS.suctionPressure.max
    ) {
      warnings.push(`Comp 1 Suction out of range: ${reading.compressor1Suction} PSI`);
    }
  }

  // Check compressor 1 discharge
  if (reading.compressor1Discharge !== null && reading.compressor1Discharge !== undefined) {
    if (reading.compressor1Discharge > REFRIGERATION_THRESHOLDS.dischargePressure.critical) {
      critical.push(`Comp 1 Discharge critically high: ${reading.compressor1Discharge} PSI`);
    } else if (
      reading.compressor1Discharge < REFRIGERATION_THRESHOLDS.dischargePressure.min ||
      reading.compressor1Discharge > REFRIGERATION_THRESHOLDS.dischargePressure.max
    ) {
      warnings.push(`Comp 1 Discharge out of range: ${reading.compressor1Discharge} PSI`);
    }
  }

  // Check compressor 2 suction
  if (reading.compressor2Suction !== null && reading.compressor2Suction !== undefined) {
    if (reading.compressor2Suction < REFRIGERATION_THRESHOLDS.suctionPressure.critical) {
      critical.push(`Comp 2 Suction critically low: ${reading.compressor2Suction} PSI`);
    } else if (
      reading.compressor2Suction < REFRIGERATION_THRESHOLDS.suctionPressure.min ||
      reading.compressor2Suction > REFRIGERATION_THRESHOLDS.suctionPressure.max
    ) {
      warnings.push(`Comp 2 Suction out of range: ${reading.compressor2Suction} PSI`);
    }
  }

  // Check compressor 2 discharge
  if (reading.compressor2Discharge !== null && reading.compressor2Discharge !== undefined) {
    if (reading.compressor2Discharge > REFRIGERATION_THRESHOLDS.dischargePressure.critical) {
      critical.push(`Comp 2 Discharge critically high: ${reading.compressor2Discharge} PSI`);
    } else if (
      reading.compressor2Discharge < REFRIGERATION_THRESHOLDS.dischargePressure.min ||
      reading.compressor2Discharge > REFRIGERATION_THRESHOLDS.dischargePressure.max
    ) {
      warnings.push(`Comp 2 Discharge out of range: ${reading.compressor2Discharge} PSI`);
    }
  }

  // Check brine supply
  if (reading.brineSupply !== null && reading.brineSupply !== undefined) {
    if (reading.brineSupply > REFRIGERATION_THRESHOLDS.brineSupply.critical) {
      critical.push(`Brine Supply too warm: ${reading.brineSupply}°F`);
    } else if (
      reading.brineSupply < REFRIGERATION_THRESHOLDS.brineSupply.min ||
      reading.brineSupply > REFRIGERATION_THRESHOLDS.brineSupply.max
    ) {
      warnings.push(`Brine Supply out of range: ${reading.brineSupply}°F`);
    }
  }

  // Check brine return
  if (reading.brineReturn !== null && reading.brineReturn !== undefined) {
    if (reading.brineReturn > REFRIGERATION_THRESHOLDS.brineReturn.critical) {
      critical.push(`Brine Return too warm: ${reading.brineReturn}°F`);
    } else if (
      reading.brineReturn < REFRIGERATION_THRESHOLDS.brineReturn.min ||
      reading.brineReturn > REFRIGERATION_THRESHOLDS.brineReturn.max
    ) {
      warnings.push(`Brine Return out of range: ${reading.brineReturn}°F`);
    }
  }

  // Check equipment status
  if (reading.oilLevel === 'CRITICAL') {
    critical.push('Oil level CRITICAL');
  } else if (reading.oilLevel === 'NEEDS_ATTENTION' || reading.oilLevel === 'LOW') {
    warnings.push(`Oil level: ${reading.oilLevel}`);
  }

  if (reading.refrigerantLevel === 'CRITICAL') {
    critical.push('Refrigerant level CRITICAL');
  } else if (reading.refrigerantLevel === 'NEEDS_ATTENTION' || reading.refrigerantLevel === 'LOW') {
    warnings.push(`Refrigerant level: ${reading.refrigerantLevel}`);
  }

  if (reading.alarmsPresent) {
    critical.push('Active alarms present');
  }

  return {
    hasWarnings: warnings.length > 0,
    hasCritical: critical.length > 0,
    warnings,
    critical,
  };
}

// Helper to get status color for equipment status
export function getEquipmentStatusColor(status: EquipmentStatus | null): {
  color: string;
  bg: string;
  label: string;
} {
  switch (status) {
    case 'CRITICAL':
      return { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' };
    case 'NEEDS_ATTENTION':
      return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Needs Attention' };
    case 'LOW':
      return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Low' };
    case 'OK':
      return { color: 'text-green-600', bg: 'bg-green-100', label: 'OK' };
    default:
      return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
  }
}

// Helper to check if a pressure value is in range
export function isPressureInRange(
  value: number | null,
  type: 'suction' | 'discharge'
): 'normal' | 'warning' | 'critical' {
  if (value === null) return 'normal';

  const threshold = type === 'suction'
    ? REFRIGERATION_THRESHOLDS.suctionPressure
    : REFRIGERATION_THRESHOLDS.dischargePressure;

  if (type === 'suction' && value < threshold.critical) return 'critical';
  if (type === 'discharge' && value > threshold.critical) return 'critical';
  if (value < threshold.min || value > threshold.max) return 'warning';
  return 'normal';
}

// Helper to check if a brine temperature is in range
export function isBrineInRange(
  value: number | null,
  type: 'supply' | 'return'
): 'normal' | 'warning' | 'critical' {
  if (value === null) return 'normal';

  const threshold = type === 'supply'
    ? REFRIGERATION_THRESHOLDS.brineSupply
    : REFRIGERATION_THRESHOLDS.brineReturn;

  if (value > threshold.critical) return 'critical';
  if (value < threshold.min || value > threshold.max) return 'warning';
  return 'normal';
}
