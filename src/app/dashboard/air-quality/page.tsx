'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AirQualityChart } from '@/components/air-quality/AirQualityChart';
import {
  useAirQualityReadingsLive,
  useCreateAirQualityReading,
  getCO2Status,
  getCOStatus,
  AIR_QUALITY_THRESHOLDS,
  type AirQualityReading,
} from '@/hooks';
import {
  CloudIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import clsx from 'clsx';

// Refresh intervals
const REFRESH_INTERVALS = [
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 },
  { label: 'Manual', value: 0 },
];

export default function AirQualityPage() {
  const [showForm, setShowForm] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [chartMetric, setChartMetric] = useState<'co2' | 'co' | 'all'>('co2');
  const [refreshInterval, setRefreshInterval] = useState(60000);
  const [facilityId] = useState('facility-1'); // Would come from context/session

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch readings with live refresh
  const {
    data: readingsData,
    isLoading,
    isRefetching,
    refetch,
    dataUpdatedAt,
  } = useAirQualityReadingsLive(
    { facilityId, pageSize: 50 },
    refreshInterval > 0 ? refreshInterval : undefined
  );

  const createReading = useCreateAirQualityReading();

  const readings = readingsData?.items || [];

  // Get latest reading per location
  const latestByLocation = useMemo(() => {
    return readings.reduce(
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
  }, [readings]);

  // Count alerts
  const alertCount = useMemo(() => {
    return Object.values(latestByLocation).filter((r) => r.thresholdExceeded).length;
  }, [latestByLocation]);

  // Handle form submission
  const onSubmit = async (data: Record<string, string | number>) => {
    try {
      await createReading.mutateAsync({
        facilityId,
        location: data.location as string,
        co2Level: data.co2Level ? Number(data.co2Level) : undefined,
        coLevel: data.coLevel ? Number(data.coLevel) : undefined,
        temperature: data.temperature ? Number(data.temperature) : undefined,
        humidity: data.humidity ? Number(data.humidity) : undefined,
        notes: data.notes as string,
      });
      setShowForm(false);
      reset();
    } catch (error) {
      console.error('Failed to create reading:', error);
    }
  };

  // Format last updated time
  const lastUpdated = dataUpdatedAt
    ? format(new Date(dataUpdatedAt), 'h:mm:ss a')
    : 'Never';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Air Quality Monitoring</h1>
          <p className="page-description">
            Monitor CO₂, CO, temperature, and humidity levels across your facility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isRefetching ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin text-ice-600" />
            ) : (
              <SignalIcon className="w-4 h-4 text-green-500" />
            )}
            <span>Updated: {lastUpdated}</span>
          </div>

          {/* Refresh Interval Selector */}
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="form-input text-sm py-1.5"
          >
            {REFRESH_INTERVALS.map((interval) => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>

          {/* Manual Refresh */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <ArrowPathIcon className={clsx('w-4 h-4', isRefetching && 'animate-spin')} />
          </Button>

          <Button
            onClick={() => setShowForm(!showForm)}
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            New Reading
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">
              {alertCount} location{alertCount > 1 ? 's' : ''} with elevated readings
            </p>
            <p className="text-sm text-yellow-700">
              Review locations with CO₂ above {AIR_QUALITY_THRESHOLDS.CO2_WARNING} ppm or CO above {AIR_QUALITY_THRESHOLDS.CO_WARNING} ppm
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-600"></div>
        </div>
      ) : (
        <>
          {/* Current Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(latestByLocation).slice(0, 6).map((reading) => {
              const co2Status = reading.co2Level ? getCO2Status(reading.co2Level) : null;
              const coStatus = reading.coLevel ? getCOStatus(reading.coLevel) : null;
              const hasAlert = reading.thresholdExceeded;

              return (
                <Card
                  key={reading.location}
                  className={clsx(hasAlert && 'ring-2 ring-yellow-400')}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reading.location}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {format(new Date(reading.recordedAt), 'h:mm a')}
                      </p>
                    </div>
                    {co2Status && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${co2Status.bg} ${co2Status.color}`}>
                        {co2Status.label}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {reading.co2Level !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">CO₂ Level</span>
                        <span className={`text-lg font-bold ${co2Status?.color || 'text-gray-900'}`}>
                          {reading.co2Level} ppm
                        </span>
                      </div>
                    )}
                    {reading.temperature !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Temperature</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {reading.temperature}°F
                        </span>
                      </div>
                    )}
                    {reading.humidity !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Humidity</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {reading.humidity}%
                        </span>
                      </div>
                    )}
                    {reading.coLevel !== null && reading.coLevel > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">CO Level</span>
                        <span className={`text-lg font-semibold ${coStatus?.color || 'text-gray-900'}`}>
                          {reading.coLevel} ppm
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Visual CO2 Bar */}
                  {reading.co2Level !== null && (
                    <div className="mt-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            reading.co2Level >= AIR_QUALITY_THRESHOLDS.CO2_DANGER
                              ? 'bg-red-500'
                              : reading.co2Level >= AIR_QUALITY_THRESHOLDS.CO2_WARNING
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          )}
                          style={{ width: `${Math.min((reading.co2Level / 1500) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0</span>
                        <span className="text-yellow-600">{AIR_QUALITY_THRESHOLDS.CO2_WARNING}</span>
                        <span className="text-red-600">{AIR_QUALITY_THRESHOLDS.CO2_DANGER}</span>
                        <span>1500</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {Object.keys(latestByLocation).length === 0 && (
              <Card className="col-span-3 text-center py-8">
                <CloudIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No readings recorded yet</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowForm(true)}
                >
                  Record First Reading
                </Button>
              </Card>
            )}
          </div>

          {/* Trend Chart */}
          {readings.length > 0 && (
            <Card padding="none">
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-ice-600" />
                    <span>Air Quality Trends</span>
                    {isRefetching && (
                      <ArrowPathIcon className="w-4 h-4 animate-spin text-ice-500" />
                    )}
                  </div>
                }
                action={
                  <div className="flex items-center gap-2">
                    <select
                      value={chartMetric}
                      onChange={(e) => setChartMetric(e.target.value as 'co2' | 'co' | 'all')}
                      className="form-input text-sm py-1"
                    >
                      <option value="co2">CO₂ Levels</option>
                      <option value="co">CO Levels</option>
                      <option value="all">All Metrics</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChart(!showChart)}
                    >
                      {showChart ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                }
              />
              {showChart && (
                <CardContent>
                  <AirQualityChart
                    data={[...readings].reverse().map((r) => ({
                      recordedAt: r.recordedAt,
                      co2Level: r.co2Level,
                      coLevel: r.coLevel,
                      temperature: r.temperature,
                      humidity: r.humidity,
                      location: r.location,
                    }))}
                    metric={chartMetric}
                  />
                </CardContent>
              )}
            </Card>
          )}

          {/* New Reading Form */}
          {showForm && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Record New Reading</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Location</label>
                    <select
                      {...register('location', { required: 'Location is required' })}
                      className="form-input"
                    >
                      <option value="">Select location...</option>
                      <option value="Rink A - Main Area">Rink A - Main Area</option>
                      <option value="Rink A - Spectator Area">Rink A - Spectator Area</option>
                      <option value="Rink B - Main Area">Rink B - Main Area</option>
                      <option value="Rink B - Spectator Area">Rink B - Spectator Area</option>
                      <option value="Lobby">Lobby</option>
                      <option value="Pro Shop">Pro Shop</option>
                      <option value="Locker Rooms">Locker Rooms</option>
                      <option value="Zamboni Bay">Zamboni Bay</option>
                    </select>
                    {errors.location && (
                      <p className="form-error">{errors.location.message as string}</p>
                    )}
                  </div>
                  <Input
                    {...register('co2Level', { required: 'CO₂ is required', min: 0, max: 5000 })}
                    type="number"
                    label="CO₂ Level (ppm)"
                    placeholder="e.g., 650"
                    required
                    error={errors.co2Level?.message as string}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    {...register('temperature', { min: 0, max: 120 })}
                    type="number"
                    step="0.1"
                    label="Temperature (°F)"
                    placeholder="e.g., 62"
                  />
                  <Input
                    {...register('humidity', { min: 0, max: 100 })}
                    type="number"
                    label="Humidity (%)"
                    placeholder="e.g., 45"
                  />
                  <Input
                    {...register('coLevel', { min: 0 })}
                    type="number"
                    step="0.1"
                    label="CO Level (ppm)"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    {...register('notes')}
                    className="form-input h-20"
                    placeholder="Any observations..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={createReading.isPending}>
                    Save Reading
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Threshold Reference */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Air Quality Thresholds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Carbon Dioxide (CO₂)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-gray-600">
                      &lt; {AIR_QUALITY_THRESHOLDS.CO2_WARNING} ppm - Normal (outdoor levels 400-450)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-gray-600">
                      {AIR_QUALITY_THRESHOLDS.CO2_WARNING}-{AIR_QUALITY_THRESHOLDS.CO2_DANGER} ppm - Elevated (increase ventilation)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-600">
                      &gt; {AIR_QUALITY_THRESHOLDS.CO2_DANGER} ppm - High (immediate ventilation needed)
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Carbon Monoxide (CO)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-gray-600">
                      &lt; {AIR_QUALITY_THRESHOLDS.CO_WARNING} ppm - Normal
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-gray-600">
                      {AIR_QUALITY_THRESHOLDS.CO_WARNING}-{AIR_QUALITY_THRESHOLDS.CO_DANGER} ppm - Elevated (investigate source)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-600">
                      &gt; {AIR_QUALITY_THRESHOLDS.CO_DANGER} ppm - CRITICAL (evacuate, call emergency)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Reading History */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Reading History</h3>
              <span className="text-sm text-gray-500">
                {readingsData?.total || 0} total readings
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CO₂ (ppm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Temp (°F)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Humidity (%)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CO (ppm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {readings.map((reading) => {
                    const status = reading.co2Level ? getCO2Status(reading.co2Level) : null;
                    return (
                      <tr key={reading.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {format(new Date(reading.recordedAt), 'MMM d, h:mm a')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {reading.location}
                        </td>
                        <td className="px-4 py-3">
                          {reading.co2Level !== null ? (
                            <span className={`font-medium ${status?.color}`}>
                              {reading.co2Level}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {reading.temperature ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {reading.humidity ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {reading.coLevel ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          {reading.thresholdExceeded ? (
                            <Badge variant="warning">Elevated</Badge>
                          ) : (
                            <Badge variant="success">Normal</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {readings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No readings recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
