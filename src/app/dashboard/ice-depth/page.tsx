'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import {
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BeakerIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { useIceDepthReadings, type IceDepthReading } from '@/hooks';

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
];

function TrendIcon({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) {
    return <div className="w-4 h-4 flex items-center justify-center text-rink-400">-</div>;
  }
  const diff = current - previous;
  if (diff > 0.02) {
    return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
  } else if (diff < -0.02) {
    return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
  }
  return <div className="w-4 h-4 flex items-center justify-center text-rink-400">-</div>;
}

export default function IceDepthPage() {
  const [refreshInterval, setRefreshInterval] = useState(60000);

  // Fetch recent readings
  const { data: readings, isLoading, error, refetch, dataUpdatedAt } = useIceDepthReadings({
    limit: 50,
  });

  // Calculate stats from readings
  const stats = useMemo(() => {
    if (!readings || readings.length === 0) {
      return {
        thisWeekCount: 0,
        avgDepth: null,
        lastReadingTime: null,
        lastReadingRink: null,
        flaggedCount: 0,
        avgChange: null,
      };
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const lastWeekStart = subWeeks(weekStart, 1);

    // This week's readings
    const thisWeekReadings = readings.filter((r) => {
      const date = new Date(r.recordedAt);
      return date >= weekStart && date <= weekEnd;
    });

    // Last week's readings
    const lastWeekReadings = readings.filter((r) => {
      const date = new Date(r.recordedAt);
      return date >= lastWeekStart && date < weekStart;
    });

    // Calculate averages
    const thisWeekAvg = thisWeekReadings.length > 0
      ? thisWeekReadings.reduce((sum, r) => sum + (r.averageDepth || 0), 0) / thisWeekReadings.length
      : null;

    const lastWeekAvg = lastWeekReadings.length > 0
      ? lastWeekReadings.reduce((sum, r) => sum + (r.averageDepth || 0), 0) / lastWeekReadings.length
      : null;

    // Count flagged readings (thin ice)
    const flaggedCount = readings.filter((r) =>
      r.status === 'FLAGGED' || (r.minDepth !== null && r.minDepth < 0.75)
    ).length;

    // Latest reading
    const latestReading = readings[0];

    return {
      thisWeekCount: thisWeekReadings.length,
      avgDepth: thisWeekAvg,
      lastReadingTime: latestReading?.recordedAt,
      lastReadingRink: latestReading?.rink?.name,
      flaggedCount,
      avgChange: thisWeekAvg && lastWeekAvg ? thisWeekAvg - lastWeekAvg : null,
    };
  }, [readings]);

  // Group readings by rink for the rink selector
  const rinkSummary = useMemo(() => {
    if (!readings) return [];

    const rinkMap = new Map<string, { name: string; lastReading: IceDepthReading; avgDepth: number; count: number }>();

    readings.forEach((reading) => {
      const rinkId = reading.rink?.id || reading.rinkId;
      const rinkName = reading.rink?.name || 'Unknown Rink';

      if (!rinkMap.has(rinkId)) {
        rinkMap.set(rinkId, {
          name: rinkName,
          lastReading: reading,
          avgDepth: reading.averageDepth || 0,
          count: 1,
        });
      } else {
        const existing = rinkMap.get(rinkId)!;
        existing.avgDepth = (existing.avgDepth * existing.count + (reading.averageDepth || 0)) / (existing.count + 1);
        existing.count += 1;
      }
    });

    return Array.from(rinkMap.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }, [readings]);

  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return 'Never';
    return formatDistanceToNow(dataUpdatedAt, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
        <p className="font-medium">Failed to load ice depth readings</p>
        <p className="text-sm mt-1">{error.message}</p>
        <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ice Depth Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track ice thickness with precision measurements and AI analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Updated {formatLastUpdated()}</span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          >
            {REFRESH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Refresh now"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <Link href="/dashboard/ice-depth/analysis">
            <Button variant="secondary" leftIcon={<BeakerIcon className="w-4 h-4" />}>
              AI Analysis
            </Button>
          </Link>
          <Link href="/dashboard/ice-depth/new">
            <Button leftIcon={<PlusIcon className="w-4 h-4" />}>New Reading</Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-ice-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-ice-600" />
            </div>
            <div>
              <p className="text-sm text-rink-500">This Week</p>
              <p className="text-2xl font-bold text-rink-900">{stats.thisWeekCount}</p>
              <p className="text-xs text-rink-500">readings</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-rink-500">Avg Depth</p>
              <p className="text-2xl font-bold text-rink-900">
                {stats.avgDepth !== null ? `${stats.avgDepth.toFixed(2)}"` : 'N/A'}
              </p>
              {stats.avgChange !== null && (
                <p className={`text-xs ${stats.avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(2)}" from last week
                </p>
              )}
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-rink-500">Last Reading</p>
              <p className="text-2xl font-bold text-rink-900">
                {stats.lastReadingTime
                  ? formatDistanceToNow(new Date(stats.lastReadingTime), { addSuffix: false })
                  : 'N/A'}
              </p>
              <p className="text-xs text-rink-500">{stats.lastReadingRink || ''}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-rink-500">Flagged Areas</p>
              <p className="text-2xl font-bold text-rink-900">{stats.flaggedCount}</p>
              <p className="text-xs text-red-600">
                {stats.flaggedCount > 0 ? 'Need attention' : 'All clear'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Rink Selection */}
      <Card padding="none">
        <CardHeader
          title="Select Rink"
          description="Choose a rink to view detailed measurements or take a new reading"
        />
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rinkSummary.length > 0 ? (
              rinkSummary.map((rink) => (
                <Link
                  key={rink.id}
                  href={`/dashboard/ice-depth/new?rink=${encodeURIComponent(rink.name)}&rinkId=${rink.id}`}
                >
                  <div className="p-4 border border-rink-200 rounded-lg hover:border-ice-300 hover:bg-ice-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-rink-900">{rink.name}</h3>
                        <p className="text-sm text-rink-500">
                          {rink.lastReading.pointsConfig}-point configuration
                        </p>
                      </div>
                      <Badge variant="info">
                        {rink.lastReading.pointsConfig === 25 ? 'NHL Size' :
                         rink.lastReading.pointsConfig === 35 ? 'Olympic' : 'Custom'}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <span className="text-rink-500">
                        Last reading:{' '}
                        {formatDistanceToNow(new Date(rink.lastReading.recordedAt), { addSuffix: true })}
                      </span>
                      <span className="text-green-600">
                        Avg: {rink.avgDepth.toFixed(2)}"
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-500">
                <p>No rinks with readings found.</p>
                <Link href="/dashboard/ice-depth/new" className="text-primary-600 hover:underline">
                  Take your first reading
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Recent Readings */}
      <Card padding="none">
        <CardHeader
          title="Recent Readings"
          action={
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Rink</th>
                <th>Recorded By</th>
                <th>Date/Time</th>
                <th>Avg Depth</th>
                <th>Range</th>
                <th>Trend</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {readings && readings.length > 0 ? (
                readings.slice(0, 10).map((reading, index) => {
                  // Find previous reading for trend comparison
                  const previousReading = readings.find(
                    (r, i) => i > index && r.rinkId === reading.rinkId
                  );

                  return (
                    <tr key={reading.id}>
                      <td className="font-medium text-rink-900">
                        {reading.rink?.name || 'Unknown Rink'}
                      </td>
                      <td>{reading.recordedBy?.name || 'Unknown'}</td>
                      <td>
                        {new Date(reading.recordedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="font-medium">
                        {reading.averageDepth !== null ? `${reading.averageDepth.toFixed(2)}"` : 'N/A'}
                      </td>
                      <td>
                        {reading.minDepth !== null && reading.maxDepth !== null
                          ? `${reading.minDepth.toFixed(2)}" - ${reading.maxDepth.toFixed(2)}"`
                          : 'N/A'}
                      </td>
                      <td>
                        <TrendIcon
                          current={reading.averageDepth}
                          previous={previousReading?.averageDepth || null}
                        />
                      </td>
                      <td>
                        <StatusBadge status={reading.status} />
                      </td>
                      <td>
                        <Link href={`/dashboard/ice-depth/${reading.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No readings found. Take your first reading to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
