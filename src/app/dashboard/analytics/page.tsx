'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  getKPIs,
  getTimeSeriesData,
  getIncidentAnalytics,
  getFacilityMetrics,
  formatMetricValue,
  formatChange,
  getStatusColor,
  timeRangePresets,
  chartColors,
} from '@/lib/analytics';
import type { KPI, TimeSeriesData, FacilityMetrics } from '@/lib/analytics/types';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [iceQualityData, setIceQualityData] = useState<TimeSeriesData[]>([]);
  const [incidentData, setIncidentData] = useState<TimeSeriesData[]>([]);
  const [facilityMetrics, setFacilityMetrics] = useState<FacilityMetrics[]>([]);
  const [incidentAnalytics, setIncidentAnalytics] = useState<Awaited<ReturnType<typeof getIncidentAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiData, iceData, incidents, facilities, incidentStats] = await Promise.all([
        getKPIs(),
        getTimeSeriesData('ice-quality', { granularity: 'day' }),
        getTimeSeriesData('incidents', { granularity: 'day' }),
        getFacilityMetrics(),
        getIncidentAnalytics(),
      ]);

      setKpis(kpiData);
      setIceQualityData(iceData);
      setIncidentData(incidents);
      setFacilityMetrics(facilities);
      setIncidentAnalytics(incidentStats);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4" />;
      default:
        return <MinusIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track performance metrics and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {timeRangePresets.slice(0, 4).map((preset) => (
              <button
                key={preset.id}
                onClick={() => setTimeRange(preset.id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  timeRange === preset.id
                    ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {kpi.name}
              </span>
              <span
                className={cn(
                  'px-1.5 py-0.5 text-xs font-medium rounded',
                  getStatusColor(kpi.status)
                )}
              >
                {kpi.status}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMetricValue(kpi.value, kpi.format)}
              </span>
              {kpi.changePercent !== undefined && (
                <span
                  className={cn(
                    'flex items-center text-sm font-medium mb-1',
                    kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  )}
                >
                  <TrendIcon trend={kpi.trend} />
                  {formatChange(kpi.changePercent, true)}
                </span>
              )}
            </div>
            {kpi.target && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Target: {formatMetricValue(kpi.target, kpi.format)}</span>
                  <span>{Math.round((kpi.value / kpi.target) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      kpi.status === 'good' ? 'bg-green-500' :
                      kpi.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(100, (kpi.value / kpi.target) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ice Quality Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Ice Quality Trend</h3>
            <select className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg">
              <option>All Rinks</option>
              <option>Rink A</option>
              <option>Rink B</option>
            </select>
          </div>
          <div className="h-64 flex items-end gap-1">
            {iceQualityData.slice(-14).map((point, i) => (
              <div
                key={i}
                className="flex-1 bg-primary-500 dark:bg-primary-600 rounded-t hover:bg-primary-600 transition-colors"
                style={{ height: `${(point.value / 100) * 100}%` }}
                title={`${point.timestamp.toLocaleDateString()}: ${point.value}%`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{iceQualityData[iceQualityData.length - 14]?.timestamp.toLocaleDateString()}</span>
            <span>{iceQualityData[iceQualityData.length - 1]?.timestamp.toLocaleDateString()}</span>
          </div>
        </Card>

        {/* Incidents by Type */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Incidents by Type</h3>
            <span className="text-sm text-gray-500">
              {incidentAnalytics?.byType.reduce((sum, t) => sum + t.count, 0)} total
            </span>
          </div>
          <div className="space-y-3">
            {incidentAnalytics?.byType.map((item, i) => {
              const maxCount = Math.max(...(incidentAnalytics?.byType.map(t => t.count) || [1]));
              return (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{item.type}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{item.count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                        backgroundColor: chartColors.mixed[i % chartColors.mixed.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Facility Comparison */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Facility Comparison</h3>
          <Button variant="ghost" size="sm">
            <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
            Configure
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="pb-3">Facility</th>
                <th className="pb-3 text-center">Ice Quality</th>
                <th className="pb-3 text-center">Incident Rate</th>
                <th className="pb-3 text-center">Maintenance</th>
                <th className="pb-3 text-center">Staff Util.</th>
                <th className="pb-3 text-center">Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {facilityMetrics.map((facility) => (
                <tr key={facility.facilityId}>
                  <td className="py-3 font-medium text-gray-900 dark:text-white">
                    {facility.facilityName}
                  </td>
                  <td className="py-3 text-center">
                    <span className={cn(
                      'px-2 py-1 text-sm font-medium rounded',
                      facility.iceQualityScore >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      facility.iceQualityScore >= 80 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    )}>
                      {facility.iceQualityScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                    {facility.incidentRate.toFixed(1)}
                  </td>
                  <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                    {facility.maintenanceCompliance.toFixed(1)}%
                  </td>
                  <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                    {facility.staffUtilization.toFixed(1)}%
                  </td>
                  <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                    {facility.customerSatisfaction?.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Resolution Time & Severity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Incident Resolution Time
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-3xl font-bold text-primary-600">
                {incidentAnalytics?.resolutionTime.average.toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500">Average</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {incidentAnalytics?.resolutionTime.median.toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500">Median</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {incidentAnalytics?.resolutionTime.min.toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500">Fastest</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">
                {incidentAnalytics?.resolutionTime.max.toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500">Slowest</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Incidents by Severity
          </h3>
          <div className="space-y-3">
            {incidentAnalytics?.bySeverity.map((item) => {
              const colors: Record<string, string> = {
                Minor: 'bg-gray-500',
                Moderate: 'bg-yellow-500',
                Serious: 'bg-orange-500',
                Critical: 'bg-red-500',
              };
              const total = incidentAnalytics.bySeverity.reduce((sum, s) => sum + s.count, 0);
              return (
                <div key={item.severity} className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', colors[item.severity])} />
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{item.severity}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{item.count}</span>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {Math.round((item.count / total) * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
