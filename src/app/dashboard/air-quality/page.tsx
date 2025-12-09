'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  CloudIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface AirQualityReading {
  id: string;
  recordedAt: string;
  location: string;
  co2Level: number;
  temperature: number;
  humidity: number;
  coLevel?: number;
  thresholdExceeded: boolean;
}

// Thresholds
const THRESHOLDS = {
  CO2_WARNING: 800,
  CO2_DANGER: 1000,
  CO_WARNING: 9,
  CO_DANGER: 35,
};

// Mock data
const mockReadings: AirQualityReading[] = [
  {
    id: '1',
    recordedAt: new Date().toISOString(),
    location: 'Rink A - Main Area',
    co2Level: 650,
    temperature: 62,
    humidity: 45,
    coLevel: 0,
    thresholdExceeded: false,
  },
  {
    id: '2',
    recordedAt: new Date(Date.now() - 3600000).toISOString(),
    location: 'Rink B - Spectator Area',
    co2Level: 890,
    temperature: 68,
    humidity: 52,
    coLevel: 2,
    thresholdExceeded: true,
  },
  {
    id: '3',
    recordedAt: new Date(Date.now() - 7200000).toISOString(),
    location: 'Lobby',
    co2Level: 520,
    temperature: 70,
    humidity: 40,
    coLevel: 0,
    thresholdExceeded: false,
  },
];

const getCO2Status = (level: number) => {
  if (level >= THRESHOLDS.CO2_DANGER) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Danger' };
  if (level >= THRESHOLDS.CO2_WARNING) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Elevated' };
  return { color: 'text-green-600', bg: 'bg-green-100', label: 'Normal' };
};

export default function AirQualityPage() {
  const [readings, setReadings] = useState<AirQualityReading[]>(mockReadings);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data: unknown) => {
    const formData = data as Record<string, string | number>;
    const co2Level = Number(formData.co2Level);
    const coLevel = formData.coLevel ? Number(formData.coLevel) : 0;

    const newReading: AirQualityReading = {
      id: `reading-${Date.now()}`,
      recordedAt: new Date().toISOString(),
      location: formData.location as string,
      co2Level,
      temperature: Number(formData.temperature),
      humidity: Number(formData.humidity),
      coLevel,
      thresholdExceeded: co2Level > THRESHOLDS.CO2_WARNING || coLevel > THRESHOLDS.CO_WARNING,
    };
    setReadings([newReading, ...readings]);
    setShowForm(false);
    reset();
  };

  const latestByLocation = readings.reduce((acc, reading) => {
    if (!acc[reading.location] || new Date(reading.recordedAt) > new Date(acc[reading.location].recordedAt)) {
      acc[reading.location] = reading;
    }
    return acc;
  }, {} as Record<string, AirQualityReading>);

  const alertCount = readings.filter((r) => r.thresholdExceeded).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Air Quality Monitoring</h1>
          <p className="page-description">
            Monitor CO₂, temperature, and humidity levels across your facility.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          New Reading
        </Button>
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
              Review locations with CO₂ above {THRESHOLDS.CO2_WARNING} ppm
            </p>
          </div>
        </div>
      )}

      {/* Current Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(latestByLocation).slice(0, 3).map((reading) => {
          const status = getCO2Status(reading.co2Level);
          return (
            <Card key={reading.location}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-rink-500">{reading.location}</p>
                  <p className="text-xs text-rink-400">
                    {format(new Date(reading.recordedAt), 'h:mm a')}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                  {status.label}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-rink-500">CO₂ Level</span>
                  <span className={`text-lg font-bold ${status.color}`}>
                    {reading.co2Level} ppm
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-rink-500">Temperature</span>
                  <span className="text-lg font-semibold text-rink-900">
                    {reading.temperature}°F
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-rink-500">Humidity</span>
                  <span className="text-lg font-semibold text-rink-900">
                    {reading.humidity}%
                  </span>
                </div>
                {reading.coLevel !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-rink-500">CO Level</span>
                    <span className={`text-lg font-semibold ${reading.coLevel > THRESHOLDS.CO_WARNING ? 'text-red-600' : 'text-rink-900'}`}>
                      {reading.coLevel} ppm
                    </span>
                  </div>
                )}
              </div>

              {/* Visual CO2 Bar */}
              <div className="mt-4">
                <div className="h-2 bg-rink-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      reading.co2Level >= THRESHOLDS.CO2_DANGER
                        ? 'bg-red-500'
                        : reading.co2Level >= THRESHOLDS.CO2_WARNING
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((reading.co2Level / 1500) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-rink-400 mt-1">
                  <span>0</span>
                  <span className="text-yellow-600">{THRESHOLDS.CO2_WARNING}</span>
                  <span className="text-red-600">{THRESHOLDS.CO2_DANGER}</span>
                  <span>1500</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* New Reading Form */}
      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold text-rink-900 mb-4">Record New Reading</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Location</label>
                <select {...register('location', { required: true })} className="form-input">
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
              </div>
              <Input
                {...register('co2Level', { required: true, min: 0, max: 5000 })}
                type="number"
                label="CO₂ Level (ppm)"
                placeholder="e.g., 650"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                {...register('temperature', { required: true })}
                type="number"
                step="0.1"
                label="Temperature (°F)"
                placeholder="e.g., 62"
                required
              />
              <Input
                {...register('humidity', { required: true, min: 0, max: 100 })}
                type="number"
                label="Humidity (%)"
                placeholder="e.g., 45"
                required
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
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Reading</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Threshold Reference */}
      <Card>
        <h3 className="text-lg font-semibold text-rink-900 mb-4">Air Quality Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-rink-700 mb-2">Carbon Dioxide (CO₂)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-rink-600">&lt; {THRESHOLDS.CO2_WARNING} ppm - Normal (outdoor levels 400-450)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-rink-600">{THRESHOLDS.CO2_WARNING}-{THRESHOLDS.CO2_DANGER} ppm - Elevated (increase ventilation)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-rink-600">&gt; {THRESHOLDS.CO2_DANGER} ppm - High (immediate ventilation needed)</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-rink-700 mb-2">Carbon Monoxide (CO)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-rink-600">&lt; {THRESHOLDS.CO_WARNING} ppm - Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-rink-600">{THRESHOLDS.CO_WARNING}-{THRESHOLDS.CO_DANGER} ppm - Elevated (investigate source)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-rink-600">&gt; {THRESHOLDS.CO_DANGER} ppm - CRITICAL (evacuate, call emergency)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Reading History */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-rink-200">
          <h3 className="text-lg font-semibold text-rink-900">Reading History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-rink-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">CO₂ (ppm)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Temp (°F)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Humidity (%)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">CO (ppm)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rink-100">
              {readings.map((reading) => {
                const status = getCO2Status(reading.co2Level);
                return (
                  <tr key={reading.id} className="hover:bg-rink-50">
                    <td className="px-4 py-3 text-sm text-rink-900">
                      {format(new Date(reading.recordedAt), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-sm text-rink-600">{reading.location}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${status.color}`}>{reading.co2Level}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-rink-600">{reading.temperature}</td>
                    <td className="px-4 py-3 text-sm text-rink-600">{reading.humidity}</td>
                    <td className="px-4 py-3 text-sm text-rink-600">{reading.coLevel ?? '-'}</td>
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
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
