'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { RefrigerationTrendChart } from '@/components/refrigeration/RefrigerationTrendChart';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface RefrigerationReading {
  id: string;
  recordedAt: string;
  compressor1Suction: number;
  compressor1Discharge: number;
  compressor2Suction: number;
  compressor2Discharge: number;
  brineSupply: number;
  brineReturn: number;
  oilLevel: 'OK' | 'LOW' | 'NEEDS_ATTENTION' | 'CRITICAL';
  refrigerantLevel: 'OK' | 'LOW' | 'NEEDS_ATTENTION' | 'CRITICAL';
  alarmsPresent: boolean;
  notes?: string;
}

// Generate mock data for the past 7 days
const generateMockReadings = (): RefrigerationReading[] => {
  const readings: RefrigerationReading[] = [];
  for (let i = 0; i < 14; i++) {
    readings.push({
      id: `reading-${i}`,
      recordedAt: new Date(Date.now() - i * 43200000).toISOString(), // Every 12 hours
      compressor1Suction: 25 + Math.random() * 10,
      compressor1Discharge: 170 + Math.random() * 20,
      compressor2Suction: 24 + Math.random() * 10,
      compressor2Discharge: 168 + Math.random() * 20,
      brineSupply: 16 + Math.random() * 6,
      brineReturn: 20 + Math.random() * 6,
      oilLevel: i === 3 ? 'LOW' : 'OK',
      refrigerantLevel: 'OK',
      alarmsPresent: i === 5,
      notes: i === 3 ? 'Oil level slightly low, scheduled for top-up' : undefined,
    });
  }
  return readings;
};

const mockReadings: RefrigerationReading[] = generateMockReadings();

const statusColors = {
  OK: 'bg-green-100 text-green-800',
  LOW: 'bg-yellow-100 text-yellow-800',
  NEEDS_ATTENTION: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function RefrigerationPage() {
  const [readings, setReadings] = useState<RefrigerationReading[]>(mockReadings);
  const [showForm, setShowForm] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [chartMetric, setChartMetric] = useState<'compressor' | 'brine' | 'all'>('compressor');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data: unknown) => {
    const formData = data as Record<string, number | string | boolean>;
    const newReading: RefrigerationReading = {
      id: `reading-${Date.now()}`,
      recordedAt: new Date().toISOString(),
      compressor1Suction: Number(formData.compressor1Suction),
      compressor1Discharge: Number(formData.compressor1Discharge),
      compressor2Suction: Number(formData.compressor2Suction),
      compressor2Discharge: Number(formData.compressor2Discharge),
      brineSupply: Number(formData.brineSupply),
      brineReturn: Number(formData.brineReturn),
      oilLevel: formData.oilLevel as 'OK',
      refrigerantLevel: formData.refrigerantLevel as 'OK',
      alarmsPresent: Boolean(formData.alarmsPresent),
      notes: formData.notes as string,
    };
    setReadings([newReading, ...readings]);
    setShowForm(false);
    reset();
  };

  const latestReading = readings[0];

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
        <Button
          onClick={() => setShowForm(!showForm)}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          New Reading
        </Button>
      </div>

      {/* Current Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${latestReading?.oilLevel === 'OK' ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <BeakerIcon className={`w-6 h-6 ${latestReading?.oilLevel === 'OK' ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <div>
            <p className="text-sm text-rink-500">Oil Level</p>
            <p className="text-lg font-semibold text-rink-900">{latestReading?.oilLevel || 'N/A'}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${latestReading?.refrigerantLevel === 'OK' ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <BeakerIcon className={`w-6 h-6 ${latestReading?.refrigerantLevel === 'OK' ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <div>
            <p className="text-sm text-rink-500">Refrigerant Level</p>
            <p className="text-lg font-semibold text-rink-900">{latestReading?.refrigerantLevel || 'N/A'}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${!latestReading?.alarmsPresent ? 'bg-green-100' : 'bg-red-100'}`}>
            {latestReading?.alarmsPresent ? (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            ) : (
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div>
            <p className="text-sm text-rink-500">Alarms</p>
            <p className="text-lg font-semibold text-rink-900">
              {latestReading?.alarmsPresent ? 'Active' : 'None'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-ice-100">
            <ClockIcon className="w-6 h-6 text-ice-600" />
          </div>
          <div>
            <p className="text-sm text-rink-500">Last Reading</p>
            <p className="text-lg font-semibold text-rink-900">
              {latestReading ? format(new Date(latestReading.recordedAt), 'h:mm a') : 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      {/* Trend Charts */}
      <Card padding="none">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-ice-600" />
              <span>Trend Analysis</span>
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
              data={[...readings].reverse()}
              metric={chartMetric}
            />
          </CardContent>
        )}
      </Card>

      {/* New Reading Form */}
      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold text-rink-900 mb-4">Record New Reading</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Compressor Readings */}
            <div>
              <h4 className="font-medium text-rink-700 mb-3">Compressor Readings (PSI)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  {...register('compressor1Suction', { required: true })}
                  type="number"
                  step="0.1"
                  label="Comp 1 Suction"
                  placeholder="e.g., 28"
                />
                <Input
                  {...register('compressor1Discharge', { required: true })}
                  type="number"
                  step="0.1"
                  label="Comp 1 Discharge"
                  placeholder="e.g., 180"
                />
                <Input
                  {...register('compressor2Suction', { required: true })}
                  type="number"
                  step="0.1"
                  label="Comp 2 Suction"
                  placeholder="e.g., 27"
                />
                <Input
                  {...register('compressor2Discharge', { required: true })}
                  type="number"
                  step="0.1"
                  label="Comp 2 Discharge"
                  placeholder="e.g., 175"
                />
              </div>
            </div>

            {/* Brine Temperatures */}
            <div>
              <h4 className="font-medium text-rink-700 mb-3">Brine Temperatures (°F)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  {...register('brineSupply', { required: true })}
                  type="number"
                  step="0.1"
                  label="Brine Supply"
                  placeholder="e.g., 18"
                />
                <Input
                  {...register('brineReturn', { required: true })}
                  type="number"
                  step="0.1"
                  label="Brine Return"
                  placeholder="e.g., 22"
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
              <h4 className="font-medium text-rink-700 mb-3">Equipment Status</h4>
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
                <div>
                  <label className="form-label">Oil Pressure (PSI)</label>
                  <Input {...register('oilPressure')} type="number" step="0.1" placeholder="Optional" />
                </div>
              </div>
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
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Reading</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Recent Readings Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-rink-200">
          <h3 className="text-lg font-semibold text-rink-900">Recent Readings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-rink-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Comp 1 S/D</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Comp 2 S/D</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Brine S/R</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Oil</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Refrigerant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Alarms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rink-100">
              {readings.map((reading) => (
                <tr key={reading.id} className="hover:bg-rink-50">
                  <td className="px-4 py-3 text-sm text-rink-900">
                    {format(new Date(reading.recordedAt), 'MMM d, h:mm a')}
                  </td>
                  <td className="px-4 py-3 text-sm text-rink-600">
                    {reading.compressor1Suction} / {reading.compressor1Discharge}
                  </td>
                  <td className="px-4 py-3 text-sm text-rink-600">
                    {reading.compressor2Suction} / {reading.compressor2Discharge}
                  </td>
                  <td className="px-4 py-3 text-sm text-rink-600">
                    {reading.brineSupply}°F / {reading.brineReturn}°F
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[reading.oilLevel]}`}>
                      {reading.oilLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[reading.refrigerantLevel]}`}>
                      {reading.refrigerantLevel}
                    </span>
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
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
