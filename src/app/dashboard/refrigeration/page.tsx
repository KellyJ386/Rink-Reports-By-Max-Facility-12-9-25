'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  ClockIcon,
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

// Mock data
const mockReadings: RefrigerationReading[] = [
  {
    id: '1',
    recordedAt: new Date().toISOString(),
    compressor1Suction: 28,
    compressor1Discharge: 180,
    compressor2Suction: 27,
    compressor2Discharge: 175,
    brineSupply: 18,
    brineReturn: 22,
    oilLevel: 'OK',
    refrigerantLevel: 'OK',
    alarmsPresent: false,
  },
  {
    id: '2',
    recordedAt: new Date(Date.now() - 86400000).toISOString(),
    compressor1Suction: 30,
    compressor1Discharge: 185,
    compressor2Suction: 29,
    compressor2Discharge: 178,
    brineSupply: 19,
    brineReturn: 23,
    oilLevel: 'LOW',
    refrigerantLevel: 'OK',
    alarmsPresent: false,
    notes: 'Oil level slightly low, scheduled for top-up',
  },
];

const statusColors = {
  OK: 'bg-green-100 text-green-800',
  LOW: 'bg-yellow-100 text-yellow-800',
  NEEDS_ATTENTION: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function RefrigerationPage() {
  const [readings, setReadings] = useState<RefrigerationReading[]>(mockReadings);
  const [showForm, setShowForm] = useState(false);
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
