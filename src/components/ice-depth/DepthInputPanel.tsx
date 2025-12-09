'use client';

import { useState } from 'react';
import { IceDepthPoint } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface DepthInputPanelProps {
  selectedPoint: IceDepthPoint | null;
  onUpdate: (depth: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  totalPoints: number;
  currentIndex: number;
  measuredCount: number;
}

export function DepthInputPanel({
  selectedPoint,
  onUpdate,
  onNext,
  onPrevious,
  totalPoints,
  currentIndex,
  measuredCount,
}: DepthInputPanelProps) {
  const [inputValue, setInputValue] = useState(
    selectedPoint?.depth?.toString() || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const depth = parseFloat(inputValue);
    if (!isNaN(depth) && depth >= 0 && depth <= 5) {
      onUpdate(depth);
      setInputValue('');
      onNext();
    }
  };

  const quickValues = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  if (!selectedPoint) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-rink-500">Select a measurement point on the rink diagram</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={`Point ${selectedPoint.pointId.toUpperCase()}`}
        description={`${measuredCount} of ${totalPoints} points measured`}
      />
      <CardContent>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-rink-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-ice-500 transition-all duration-300"
              style={{ width: `${(measuredCount / totalPoints) * 100}%` }}
            />
          </div>
        </div>

        {/* Current depth display */}
        {selectedPoint.depth !== null && (
          <div className="mb-4 p-4 bg-rink-50 rounded-lg text-center">
            <p className="text-sm text-rink-500">Current Reading</p>
            <p className="text-3xl font-bold text-rink-900">
              {selectedPoint.depth.toFixed(2)}"
            </p>
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Ice Depth (inches)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter depth in inches"
              className="text-center text-xl font-medium"
              autoFocus
            />
          </div>

          {/* Quick value buttons */}
          <div>
            <label className="form-label">Quick Values</label>
            <div className="grid grid-cols-4 gap-2">
              {quickValues.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInputValue(value.toString())}
                  className={clsx(
                    'py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                    inputValue === value.toString()
                      ? 'border-ice-500 bg-ice-50 text-ice-700'
                      : 'border-rink-200 text-rink-600 hover:border-rink-300'
                  )}
                >
                  {value}"
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              type="submit"
              className="flex-1"
              leftIcon={<CheckIcon className="w-4 h-4" />}
            >
              Save & Next
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onNext}
              disabled={currentIndex >= totalPoints - 1}
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            >
              Skip
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Statistics display component
interface DepthStatsProps {
  stats: {
    average: number | null;
    min: number | null;
    max: number | null;
    variance: number | null;
  };
}

export function DepthStats({ stats }: DepthStatsProps) {
  if (stats.average === null) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-rink-500">No measurements recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Ice Depth Statistics" />
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-rink-50 rounded-lg">
            <p className="text-sm text-rink-500">Average</p>
            <p className="text-2xl font-bold text-rink-900">
              {stats.average?.toFixed(2)}"
            </p>
          </div>
          <div className="p-4 bg-rink-50 rounded-lg">
            <p className="text-sm text-rink-500">Range</p>
            <p className="text-2xl font-bold text-rink-900">
              {stats.min?.toFixed(2)}" - {stats.max?.toFixed(2)}"
            </p>
          </div>
          <div className="p-4 bg-rink-50 rounded-lg col-span-2">
            <p className="text-sm text-rink-500">Variance</p>
            <p className="text-2xl font-bold text-rink-900">
              {stats.variance?.toFixed(4)}
            </p>
            <p className="text-xs text-rink-400 mt-1">
              {stats.variance! < 0.05 ? 'Excellent uniformity' :
               stats.variance! < 0.1 ? 'Good uniformity' : 'Review required'}
            </p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="mt-4 space-y-2">
          {stats.min !== null && stats.min < 0.75 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <p className="text-sm text-red-700">
                Warning: Some areas below 0.75" threshold
              </p>
            </div>
          )}
          {stats.min !== null && stats.min >= 0.75 && stats.min < 1.0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <p className="text-sm text-yellow-700">
                Caution: Some areas approaching minimum threshold
              </p>
            </div>
          )}
          {stats.min !== null && stats.min >= 1.0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className="text-sm text-green-700">
                All areas within safe range
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
