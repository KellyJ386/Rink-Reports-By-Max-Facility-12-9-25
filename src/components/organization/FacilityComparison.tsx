'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  useFacilityComparison,
  COMPARISON_METRIC_LABELS,
  COMPARISON_PERIOD_LABELS,
  ComparisonMetric,
  ComparisonPeriod,
} from '@/hooks/useOrganization';

interface FacilityComparisonProps {
  facilities: { id: string; name: string }[];
  defaultMetric?: ComparisonMetric;
}

export function FacilityComparison({
  facilities,
  defaultMetric = 'ice_depth',
}: FacilityComparisonProps) {
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    facilities.slice(0, 3).map((f) => f.id)
  );
  const [metric, setMetric] = useState<ComparisonMetric>(defaultMetric);
  const [period, setPeriod] = useState<ComparisonPeriod>('month');

  const { data, isLoading, refetch, isFetching } = useFacilityComparison({
    facilityIds: selectedFacilities,
    metric,
    period,
  });

  const toggleFacility = (facilityId: string) => {
    setSelectedFacilities((prev) => {
      if (prev.includes(facilityId)) {
        return prev.filter((id) => id !== facilityId);
      }
      if (prev.length >= 10) {
        return prev; // Max 10 facilities
      }
      return [...prev, facilityId];
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Facility Comparison
            </h2>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 space-y-4">
        {/* Metric Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Metric
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(COMPARISON_METRIC_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMetric(key as ComparisonMetric)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  metric === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Period Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Period
          </label>
          <div className="flex gap-2">
            {Object.entries(COMPARISON_PERIOD_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key as ComparisonPeriod)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  period === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Facility Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Facilities ({selectedFacilities.length}/10 selected)
          </label>
          <div className="flex flex-wrap gap-2">
            {facilities.map((facility) => (
              <button
                key={facility.id}
                onClick={() => toggleFacility(facility.id)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selectedFacilities.includes(facility.id)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                {facility.name}
              </button>
            ))}
          </div>
          {selectedFacilities.length < 2 && (
            <p className="text-xs text-yellow-600 mt-1">Select at least 2 facilities to compare</p>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        ) : !data ? (
          <p className="text-center text-gray-500 py-8">
            Select at least 2 facilities to see comparison
          </p>
        ) : (
          <ComparisonTable data={data.data} metric={metric} />
        )}
      </div>
    </div>
  );
}

interface ComparisonTableProps {
  data: Record<string, unknown>[];
  metric: ComparisonMetric;
}

function ComparisonTable({ data, metric }: ComparisonTableProps) {
  // Define columns based on metric
  const getColumns = () => {
    switch (metric) {
      case 'ice_depth':
        return [
          { key: 'facilityName', label: 'Facility' },
          { key: 'averageDepth', label: 'Avg Depth (in)', format: (v: unknown) => v != null ? (v as number).toFixed(2) : '-' },
          { key: 'totalReadings', label: 'Total Readings' },
        ];
      case 'incidents':
        return [
          { key: 'facilityName', label: 'Facility' },
          { key: 'total', label: 'Total' },
          { key: 'bySeverity.CRITICAL', label: 'Critical' },
          { key: 'bySeverity.SERIOUS', label: 'Serious' },
          { key: 'bySeverity.MODERATE', label: 'Moderate' },
          { key: 'bySeverity.MINOR', label: 'Minor' },
        ];
      case 'air_quality':
        return [
          { key: 'facilityName', label: 'Facility' },
          { key: 'avgCO2', label: 'Avg CO2 (ppm)', format: (v: unknown) => v != null ? Math.round(v as number) : '-' },
          { key: 'maxCO2', label: 'Max CO2', format: (v: unknown) => v != null ? Math.round(v as number) : '-' },
          { key: 'avgCO', label: 'Avg CO (ppm)', format: (v: unknown) => v != null ? (v as number).toFixed(1) : '-' },
          { key: 'totalReadings', label: 'Readings' },
        ];
      case 'refrigeration':
        return [
          { key: 'facilityName', label: 'Facility' },
          { key: 'avgBrineSupply', label: 'Brine Supply (°F)', format: (v: unknown) => v != null ? (v as number).toFixed(1) : '-' },
          { key: 'avgBrineReturn', label: 'Brine Return (°F)', format: (v: unknown) => v != null ? (v as number).toFixed(1) : '-' },
          { key: 'totalReadings', label: 'Readings' },
        ];
      case 'forms':
        return [
          { key: 'facilityName', label: 'Facility' },
          { key: 'total', label: 'Total' },
          { key: 'byStatus.APPROVED', label: 'Approved' },
          { key: 'byStatus.PENDING', label: 'Pending' },
          { key: 'completionRate', label: 'Completion %', format: (v: unknown) => v != null ? `${(v as number).toFixed(0)}%` : '-' },
        ];
      case 'alerts':
        return [
          { key: 'facilityName', label: 'Facility' },
          { key: 'total', label: 'Total' },
          { key: 'acknowledgedCount', label: 'Acknowledged' },
          { key: 'acknowledgmentRate', label: 'Ack Rate', format: (v: unknown) => v != null ? `${(v as number).toFixed(0)}%` : '-' },
        ];
      case 'schedules':
        return [
          { key: 'facilityName', label: 'Facility' },
          { key: 'totalShifts', label: 'Total Shifts' },
          { key: 'filledShifts', label: 'Filled' },
          { key: 'openShifts', label: 'Open' },
          { key: 'fillRate', label: 'Fill Rate', format: (v: unknown) => v != null ? `${(v as number).toFixed(0)}%` : '-' },
        ];
      default:
        return [];
    }
  };

  const columns = getColumns();

  const getValue = (row: Record<string, unknown>, key: string): unknown => {
    const parts = key.split('.');
    let value: unknown = row;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return value;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-gray-700">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              {columns.map((col) => {
                const value = getValue(row, col.key);
                const formatted = col.format ? col.format(value) : (value ?? '-');
                return (
                  <td key={col.key} className="py-3 px-3 text-gray-900 dark:text-white">
                    {String(formatted)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
