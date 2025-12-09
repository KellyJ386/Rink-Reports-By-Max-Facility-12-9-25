'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RinkDiagram, useIceDepthPoints, DepthInputPanel, DepthStats } from '@/components/ice-depth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  ArrowLeftIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function NewIceDepthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rinkName = searchParams.get('rink') || 'Rink A - Main';

  const [pointsConfig] = useState<25 | 35 | 47>(25);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { points, updatePoint, resetPoints, getStats } = useIceDepthPoints(pointsConfig);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to database via API
      console.log('Saving ice depth reading:', {
        rinkName,
        points,
        stats,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/dashboard/ice-depth');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all measurements?')) {
      resetPoints();
      setSelectedPointId(null);
    }
  };

  // Auto-select first point if none selected
  if (!selectedPointId && points.length > 0) {
    setSelectedPointId(points[0].pointId);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/ice-depth')}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="page-title">New Ice Depth Reading</h1>
            <p className="page-description">{rinkName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleReset}
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<CheckIcon className="w-4 h-4" />}
            disabled={measuredCount === 0}
          >
            Save Reading
          </Button>
        </div>
      </div>

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
            <CardHeader title="Rink Diagram" description="Click on a point to enter its depth measurement" />
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
