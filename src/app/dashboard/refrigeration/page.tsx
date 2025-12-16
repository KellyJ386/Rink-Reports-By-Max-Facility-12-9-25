'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { RefrigerationTrendChart } from '@/components/refrigeration/RefrigerationTrendChart';
import {
  useRefrigerationReadingsLive,
  useCreateRefrigerationReading,
  getEquipmentStatusColor,
  checkRefrigerationStatus,
  REFRIGERATION_THRESHOLDS,
  type RefrigerationReading,
  type EquipmentStatus,
} from '@/hooks';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowPathIcon,
  SignalIcon,
  CogIcon,
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

const statusColors: Record<EquipmentStatus, string> = {
  OK: 'bg-green-100 text-green-800',
  LOW: 'bg-yellow-100 text-yellow-800',
  NEEDS_ATTENTION: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function RefrigerationPage() {
  const [showForm, setShowForm] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [chartMetric, setChartMetric] = useState<'compressor' | 'brine' | 'all'>('compressor');
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
  } = useRefrigerationReadingsLive(
    { facilityId, pageSize: 30 },
    refreshInterval > 0 ? refreshInterval : undefined
  );

  const createReading = useCreateRefrigerationReading();

  const readings = readingsData?.items || [];
  const latestReading = readings[0];

  // Check status of latest reading
  const latestStatus = latestReading ? checkRefrigerationStatus(latestReading) : null;

  // Handle form submission
  const onSubmit = async (data: Record<string, string | number | boolean>) => {
    try {
      await createReading.mutateAsync({
        facilityId,
        compressor1Suction: data.compressor1Suction ? Number(data.compressor1Suction) : undefined,
        compressor1Discharge: data.compressor1Discharge ? Number(data.compressor1Discharge) : undefined,
        compressor2Suction: data.compressor2Suction ? Number(data.compressor2Suction) : undefined,
        compressor2Discharge: data.compressor2Discharge ? Number(data.compressor2Discharge) : undefined,
        brineSupply: data.brineSupply ? Number(data.brineSupply) : undefined,
        brineReturn: data.brineReturn ? Number(data.brineReturn) : undefined,
        condenserIn: data.condenserIn ? Number(data.condenserIn) : undefined,
        condenserOut: data.condenserOut ? Number(data.condenserOut) : undefined,
        oilPressure: data.oilPressure ? Number(data.oilPressure) : undefined,
        oilLevel: (data.oilLevel as EquipmentStatus) || 'OK',
        refrigerantLevel: (data.refrigerantLevel as EquipmentStatus) || 'OK',
        alarmsPresent: data.alarmsPresent === 'true',
        alarmDetails: data.alarmDetails as string,
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
          <h1 className="page-title">Refrigeration Room Logs</h1>
          <p className="page-description">
            Monitor and record plant room readings for regulatory compliance.
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

      {/* Alert Banner for Critical Conditions */}
      {latestStatus?.hasCritical && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Critical Condition Detected</p>
            <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
              {latestStatus.critical.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {latestStatus?.hasWarnings && !latestStatus.hasCritical && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">Readings Out of Normal Range</p>
            <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
              {latestStatus.warnings.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="flex items-center gap-4">
              <div className={clsx(
                'p-3 rounded-lg',
                latestReading?.oilLevel === 'OK' ? 'bg-green-100' :
                latestReading?.oilLevel === 'CRITICAL' ? 'bg-red-100' : 'bg-yellow-100'
              )}>
                <BeakerIcon className={clsx(
                  'w-6 h-6',
                  latestReading?.oilLevel === 'OK' ? 'text-green-600' :
                  latestReading?.oilLevel === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600'
                )} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Oil Level</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latestReading?.oilLevel || 'N/A'}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className={clsx(
                'p-3 rounded-lg',
                latestReading?.refrigerantLevel === 'OK' ? 'bg-green-100' :
                latestReading?.refrigerantLevel === 'CRITICAL' ? 'bg-red-100' : 'bg-yellow-100'
              )}>
                <BeakerIcon className={clsx(
                  'w-6 h-6',
                  latestReading?.refrigerantLevel === 'OK' ? 'text-green-600' :
                  latestReading?.refrigerantLevel === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600'
                )} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Refrigerant Level</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latestReading?.refrigerantLevel || 'N/A'}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className={clsx(
                'p-3 rounded-lg',
                !latestReading?.alarmsPresent ? 'bg-green-100' : 'bg-red-100'
              )}>
                {latestReading?.alarmsPresent ? (
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                ) : (
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Alarms</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latestReading?.alarmsPresent ? 'Active' : 'None'}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-ice-100">
                <ClockIcon className="w-6 h-6 text-ice-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Reading</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latestReading
                    ? format(new Date(latestReading.recordedAt), 'h:mm a')
                    : 'N/A'}
                </p>
              </div>
            </Card>
          </div>

          {/* Current Pressures & Temps */}
          {latestReading && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CogIcon className="w-5 h-5 text-gray-400" />
                Current Readings
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Comp 1 Suction</p>
                  <p className="text-xl font-bold text-gray-900">
                    {latestReading.compressor1Suction?.toFixed(1) ?? '-'} <span className="text-sm font-normal">PSI</span>
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Comp 1 Discharge</p>
                  <p className="text-xl font-bold text-gray-900">
                    {latestReading.compressor1Discharge?.toFixed(1) ?? '-'} <span className="text-sm font-normal">PSI</span>
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Comp 2 Suction</p>
                  <p className="text-xl font-bold text-gray-900">
                    {latestReading.compressor2Suction?.toFixed(1) ?? '-'} <span className="text-sm font-normal">PSI</span>
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Comp 2 Discharge</p>
                  <p className="text-xl font-bold text-gray-900">
                    {latestReading.compressor2Discharge?.toFixed(1) ?? '-'} <span className="text-sm font-normal">PSI</span>
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">Brine Supply</p>
                  <p className="text-xl font-bold text-blue-900">
                    {latestReading.brineSupply?.toFixed(1) ?? '-'} <span className="text-sm font-normal">°F</span>
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">Brine Return</p>
                  <p className="text-xl font-bold text-blue-900">
                    {latestReading.brineReturn?.toFixed(1) ?? '-'} <span className="text-sm font-normal">°F</span>
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Trend Charts */}
          {readings.length > 0 && (
            <Card padding="none">
              <CardHeader
                title={
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-ice-600" />
                    <span>Trend Analysis</span>
                    {isRefetching && (
                      <ArrowPathIcon className="w-4 h-4 animate-spin text-ice-500" />
                    )}
                  </div>
                }
                action={
                  <div className="flex items-center gap-2">
                    <select
                      value={chartMetric}
                      onChange={(e) => setChartMetric(e.target.value as 'compressor' | 'brine' | 'all')}
                      className="form-input text-sm py-1"
                    >
                      <option value="compressor">Compressor Pressures</option>
                      <option value="brine">Brine Temperatures</option>
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
                  <RefrigerationTrendChart
                    data={[...readings].reverse().map((r) => ({
                      recordedAt: r.recordedAt,
                      compressor1Suction: r.compressor1Suction ?? 0,
                      compressor1Discharge: r.compressor1Discharge ?? 0,
                      compressor2Suction: r.compressor2Suction ?? 0,
                      compressor2Discharge: r.compressor2Discharge ?? 0,
                      brineSupply: r.brineSupply ?? 0,
                      brineReturn: r.brineReturn ?? 0,
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Compressor Readings */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Compressor Readings (PSI)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      {...register('compressor1Suction', { required: 'Required' })}
                      type="number"
                      step="0.1"
                      label="Comp 1 Suction"
                      placeholder={`${REFRIGERATION_THRESHOLDS.suctionPressure.min}-${REFRIGERATION_THRESHOLDS.suctionPressure.max}`}
                      error={errors.compressor1Suction?.message as string}
                    />
                    <Input
                      {...register('compressor1Discharge', { required: 'Required' })}
                      type="number"
                      step="0.1"
                      label="Comp 1 Discharge"
                      placeholder={`${REFRIGERATION_THRESHOLDS.dischargePressure.min}-${REFRIGERATION_THRESHOLDS.dischargePressure.max}`}
                      error={errors.compressor1Discharge?.message as string}
                    />
                    <Input
                      {...register('compressor2Suction', { required: 'Required' })}
                      type="number"
                      step="0.1"
                      label="Comp 2 Suction"
                      placeholder={`${REFRIGERATION_THRESHOLDS.suctionPressure.min}-${REFRIGERATION_THRESHOLDS.suctionPressure.max}`}
                      error={errors.compressor2Suction?.message as string}
                    />
                    <Input
                      {...register('compressor2Discharge', { required: 'Required' })}
                      type="number"
                      step="0.1"
                      label="Comp 2 Discharge"
                      placeholder={`${REFRIGERATION_THRESHOLDS.dischargePressure.min}-${REFRIGERATION_THRESHOLDS.dischargePressure.max}`}
                      error={errors.compressor2Discharge?.message as string}
                    />
                  </div>
                </div>

                {/* Brine Temperatures */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Brine Temperatures (°F)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      {...register('brineSupply', { required: 'Required' })}
                      type="number"
                      step="0.1"
                      label="Brine Supply"
                      placeholder={`${REFRIGERATION_THRESHOLDS.brineSupply.min}-${REFRIGERATION_THRESHOLDS.brineSupply.max}`}
                      error={errors.brineSupply?.message as string}
                    />
                    <Input
                      {...register('brineReturn', { required: 'Required' })}
                      type="number"
                      step="0.1"
                      label="Brine Return"
                      placeholder={`${REFRIGERATION_THRESHOLDS.brineReturn.min}-${REFRIGERATION_THRESHOLDS.brineReturn.max}`}
                      error={errors.brineReturn?.message as string}
                    />
                    <Input
                      {...register('condenserIn')}
                      type="number"
                      step="0.1"
                      label="Condenser In"
                      placeholder="Optional"
                    />
                    <Input
                      {...register('condenserOut')}
                      type="number"
                      step="0.1"
                      label="Condenser Out"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Status Indicators */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Equipment Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="form-label">Oil Level</label>
                      <select {...register('oilLevel')} className="form-input">
                        <option value="OK">OK</option>
                        <option value="LOW">Low</option>
                        <option value="NEEDS_ATTENTION">Needs Attention</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Refrigerant Level</label>
                      <select {...register('refrigerantLevel')} className="form-input">
                        <option value="OK">OK</option>
                        <option value="LOW">Low</option>
                        <option value="NEEDS_ATTENTION">Needs Attention</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Alarms Present</label>
                      <select {...register('alarmsPresent')} className="form-input">
                        <option value="">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    <Input
                      {...register('oilPressure')}
                      type="number"
                      step="0.1"
                      label="Oil Pressure (PSI)"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Alarm Details (conditionally shown) */}
                <div>
                  <label className="form-label">Alarm Details (if any)</label>
                  <Input
                    {...register('alarmDetails')}
                    placeholder="Describe any active alarms..."
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    {...register('notes')}
                    className="form-input h-20"
                    placeholder="Any observations or issues..."
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

          {/* Recent Readings Table */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Readings</h3>
              <span className="text-sm text-gray-500">
                {readingsData?.total || 0} total readings
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date/Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Comp 1 S/D
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Comp 2 S/D
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Brine S/R
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Oil
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Refrigerant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Alarms
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {readings.map((reading) => (
                    <tr key={reading.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(reading.recordedAt), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {reading.compressor1Suction?.toFixed(1) ?? '-'} /{' '}
                        {reading.compressor1Discharge?.toFixed(1) ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {reading.compressor2Suction?.toFixed(1) ?? '-'} /{' '}
                        {reading.compressor2Discharge?.toFixed(1) ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {reading.brineSupply?.toFixed(1) ?? '-'}°F /{' '}
                        {reading.brineReturn?.toFixed(1) ?? '-'}°F
                      </td>
                      <td className="px-4 py-3">
                        {reading.oilLevel && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[reading.oilLevel]}`}>
                            {reading.oilLevel}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {reading.refrigerantLevel && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[reading.refrigerantLevel]}`}>
                            {reading.refrigerantLevel}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {reading.alarmsPresent ? (
                          <Badge variant="error">Active</Badge>
                        ) : (
                          <Badge variant="success">None</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
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
