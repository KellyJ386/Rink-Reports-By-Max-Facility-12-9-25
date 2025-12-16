'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  RinkDiagram,
  useIceDepthPoints,
  DepthInputPanel,
  DepthStats,
  BluetoothInput,
} from '@/components/ice-depth';
import { useCreateIceDepthReading } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeftIcon,
  CheckIcon,
  ArrowPathIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { BluetoothReading, BluetoothConnectionState } from '@/types';

export default function NewIceDepthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rinkName = searchParams.get('rink') || 'Rink A - Main';
  const rinkId = searchParams.get('rinkId') || '';

  const [pointsConfig] = useState<25 | 35 | 47>(25);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [showBluetooth, setShowBluetooth] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<BluetoothConnectionState['status']>('disconnected');
  const [lastBluetoothReading, setLastBluetoothReading] = useState<number | null>(null);

  const { points, updatePoint, resetPoints, getStats } = useIceDepthPoints(pointsConfig);
  const createReadingMutation = useCreateIceDepthReading();

  const stats = getStats();
  const measuredCount = points.filter((p) => p.depth !== null).length;

  const selectedPoint = points.find((p) => p.pointId === selectedPointId) || null;
  const currentIndex = points.findIndex((p) => p.pointId === selectedPointId);

  const handlePointSelect = useCallback((pointId: string) => {
    setSelectedPointId(pointId);
  }, []);

  const handlePointUpdate = useCallback(
    (depth: number) => {
      if (selectedPointId) {
        updatePoint(selectedPointId, depth);
      }
    },
    [selectedPointId, updatePoint]
  );

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < points.length) {
      setSelectedPointId(points[nextIndex].pointId);
    }
  }, [currentIndex, points]);

  const handlePrevious = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setSelectedPointId(points[prevIndex].pointId);
    }
  }, [currentIndex, points]);

  // Handle Bluetooth reading - automatically update selected point and move to next
  const handleBluetoothReading = useCallback(
    (reading: BluetoothReading) => {
      const depthValue = Math.round(reading.value * 100) / 100; // Round to 2 decimal places
      setLastBluetoothReading(depthValue);

      if (selectedPointId) {
        updatePoint(selectedPointId, depthValue);

        // Auto-advance to next unmeasured point
        const currentIdx = points.findIndex((p) => p.pointId === selectedPointId);
        const nextUnmeasured = points.findIndex(
          (p, i) => i > currentIdx && p.depth === null
        );

        if (nextUnmeasured !== -1) {
          setSelectedPointId(points[nextUnmeasured].pointId);
        } else {
          // If no more unmeasured points after current, find any unmeasured point
          const anyUnmeasured = points.find((p) => p.depth === null);
          if (anyUnmeasured) {
            setSelectedPointId(anyUnmeasured.pointId);
          }
        }
      }
    },
    [selectedPointId, points, updatePoint]
  );

  const handleBluetoothConnectionChange = useCallback(
    (state: BluetoothConnectionState) => {
      setBluetoothStatus(state.status);
    },
    []
  );

  const handleSave = async () => {
    if (!rinkId) {
      alert('Please select a rink from the Ice Depth page to save readings.');
      return;
    }

    try {
      const readingPoints = points.map((p) => ({
        pointId: p.pointId,
        x: p.x,
        y: p.y,
        depth: p.depth,
      }));

      await createReadingMutation.mutateAsync({
        rinkId,
        pointsConfig,
        readingPoints,
      });

      router.push('/dashboard/ice-depth');
    } catch (error) {
      console.error('Failed to save reading:', error);
      alert('Failed to save reading. Please try again.');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all measurements?')) {
      resetPoints();
      setSelectedPointId(null);
      setLastBluetoothReading(null);
    }
  };

  // Auto-select first point if none selected
  if (!selectedPointId && points.length > 0) {
    setSelectedPointId(points[0].pointId);
  }

  // Check if Bluetooth is supported
  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/ice-depth')}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Ice Depth Reading</h1>
            <p className="text-gray-600 dark:text-gray-400">{rinkName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {isBluetoothSupported && (
            <Button
              variant={showBluetooth ? 'primary' : 'secondary'}
              onClick={() => setShowBluetooth(!showBluetooth)}
              leftIcon={<SignalIcon className="w-4 h-4" />}
            >
              {bluetoothStatus === 'connected' ? 'BT Connected' : 'Bluetooth'}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleReset}
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            isLoading={createReadingMutation.isPending}
            leftIcon={<CheckIcon className="w-4 h-4" />}
            disabled={measuredCount === 0}
          >
            Save Reading
          </Button>
        </div>
      </div>

      {/* Bluetooth Panel */}
      {showBluetooth && (
        <Card className="border-2 border-primary-200 dark:border-primary-800">
          <CardHeader
            title="Bluetooth Device"
            description="Connect a digital caliper or ice thickness gauge"
            action={
              <Badge
                variant={
                  bluetoothStatus === 'connected'
                    ? 'success'
                    : bluetoothStatus === 'connecting'
                    ? 'warning'
                    : 'default'
                }
              >
                {bluetoothStatus}
              </Badge>
            }
          />
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <BluetoothInput
                  onReading={handleBluetoothReading}
                  onConnectionChange={handleBluetoothConnectionChange}
                  unit="inches"
                />
              </div>
              {lastBluetoothReading !== null && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Reading</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {lastBluetoothReading}"
                  </p>
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Tip: Readings are automatically applied to the selected point and advance to the next unmeasured point.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuration Card */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="form-label">Points Configuration</label>
              <div className="flex gap-2">
                {([25, 35, 47] as const).map((config) => (
                  <button
                    key={config}
                    disabled
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      pointsConfig === config
                        ? 'bg-ice-100 text-ice-700 border border-ice-300'
                        : 'bg-rink-100 text-rink-500'
                    }`}
                  >
                    {config} Points
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <p className="text-sm text-rink-500">Progress</p>
              <p className="text-2xl font-bold text-rink-900">
                {measuredCount} / {points.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rink Diagram */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Rink Diagram"
              description={
                bluetoothStatus === 'connected'
                  ? 'Take measurements with your Bluetooth device - readings auto-apply to selected point'
                  : 'Click on a point to enter its depth measurement'
              }
            />
            <CardContent>
              <RinkDiagram
                pointsConfig={pointsConfig}
                points={points}
                selectedPointId={selectedPointId}
                onPointSelect={handlePointSelect}
                onPointUpdate={handlePointUpdate}
              />
            </CardContent>
          </Card>
        </div>

        {/* Input Panel & Stats */}
        <div className="space-y-6">
          <DepthInputPanel
            selectedPoint={selectedPoint}
            onUpdate={handlePointUpdate}
            onNext={handleNext}
            onPrevious={handlePrevious}
            totalPoints={points.length}
            currentIndex={currentIndex}
            measuredCount={measuredCount}
          />
          <DepthStats stats={stats} />
        </div>
      </div>

      {/* All Measurements Table */}
      {measuredCount > 0 && (
        <Card>
          <CardHeader title="All Measurements" />
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {points.map((point) => (
                <button
                  key={point.pointId}
                  onClick={() => setSelectedPointId(point.pointId)}
                  className={`p-2 rounded-lg text-center text-sm transition-colors ${
                    point.pointId === selectedPointId
                      ? 'bg-ice-100 border-2 border-ice-500'
                      : point.depth !== null
                      ? 'bg-green-50 border border-green-200 hover:border-green-300'
                      : 'bg-rink-50 border border-rink-200 hover:border-rink-300'
                  }`}
                >
                  <p className="font-medium text-rink-700">
                    {point.pointId.replace('p', 'P')}
                  </p>
                  <p className={point.depth !== null ? 'text-rink-900 font-semibold' : 'text-rink-400'}>
                    {point.depth !== null ? `${point.depth}"` : '-'}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
