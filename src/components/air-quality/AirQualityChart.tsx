'use client';

import { useMemo } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AirQualityReading {
  recordedAt: string;
  co2Level: number | null;
  coLevel: number | null;
  temperature: number | null;
  humidity: number | null;
  location: string;
}

interface AirQualityChartProps {
  data: AirQualityReading[];
  metric: 'co2' | 'co' | 'all';
}

// OSHA and safety thresholds
const thresholds = {
  co2: {
    normal: 1000,      // ppm - acceptable for indoor spaces
    elevated: 2000,    // ppm - start ventilating
    warning: 5000,     // ppm - OSHA 8-hour TWA limit
    danger: 40000,     // ppm - IDLH (Immediately Dangerous)
  },
  co: {
    normal: 9,         // ppm - EPA outdoor standard
    warning: 35,       // ppm - OSHA ceiling limit (brief exposure)
    danger: 200,       // ppm - NIOSH ceiling limit
    critical: 1200,    // ppm - IDLH
  },
};

export function AirQualityChart({ data, metric }: AirQualityChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    // Get values based on metric
    let values: number[] = [];
    let maxThreshold = 0;

    if (metric === 'co2' || metric === 'all') {
      const co2Values = data.map(d => d.co2Level).filter((v): v is number => v !== null);
      values = [...values, ...co2Values];
      maxThreshold = Math.max(maxThreshold, thresholds.co2.warning);
    }
    if (metric === 'co' || metric === 'all') {
      const coValues = data.map(d => d.coLevel).filter((v): v is number => v !== null);
      values = [...values, ...coValues];
      maxThreshold = Math.max(maxThreshold, thresholds.co.danger);
    }

    if (values.length === 0) return null;

    const maxValue = Math.max(...values, maxThreshold);
    const minY = 0;
    const maxY = Math.ceil(maxValue * 1.2);

    return { minY, maxY, range: maxY - minY };
  }, [data, metric]);

  // Check for threshold violations
  const violations = useMemo(() => {
    const alerts: Array<{ type: string; level: string; value: number; time: string }> = [];

    data.forEach(reading => {
      if (reading.co2Level !== null && reading.co2Level >= thresholds.co2.warning) {
        alerts.push({
          type: 'CO2',
          level: reading.co2Level >= thresholds.co2.danger ? 'critical' : 'warning',
          value: reading.co2Level,
          time: reading.recordedAt,
        });
      }
      if (reading.coLevel !== null && reading.coLevel >= thresholds.co.warning) {
        alerts.push({
          type: 'CO',
          level: reading.coLevel >= thresholds.co.danger ? 'critical' : 'warning',
          value: reading.coLevel,
          time: reading.recordedAt,
        });
      }
    });

    return alerts;
  }, [data]);

  if (!chartData || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-rink-500">
        No data available
      </div>
    );
  }

  const { minY, maxY, range } = chartData;
  const chartHeight = 320;
  const padding = { top: 20, right: 60, bottom: 60, left: 60 };

  const getYPosition = (value: number) => {
    return padding.top + ((maxY - value) / range) * (chartHeight - padding.top - padding.bottom);
  };

  const getXPosition = (index: number) => {
    return padding.left + ((index) / (data.length - 1 || 1)) * (100 - padding.left - padding.right);
  };

  const generatePath = (values: (number | null)[]) => {
    const validPoints = values
      .map((v, i) => (v !== null ? { v, i } : null))
      .filter((p): p is { v: number; i: number } => p !== null);

    if (validPoints.length === 0) return '';

    return validPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getXPosition(p.i)}% ${getYPosition(p.v)}`)
      .join(' ');
  };

  // Y-axis labels
  const yLabels: number[] = [];
  const step = range > 5000 ? 1000 : range > 500 ? 100 : range > 50 ? 10 : 5;
  for (let v = minY; v <= maxY; v += step) {
    yLabels.push(v);
  }

  return (
    <div className="w-full">
      {/* Alerts */}
      {violations.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Threshold Violations Detected
          </div>
          <div className="space-y-1">
            {violations.slice(0, 3).map((v, i) => (
              <p key={i} className="text-sm text-red-700">
                {v.type} at {v.value} ppm ({v.level}) - {new Date(v.time).toLocaleString()}
              </p>
            ))}
            {violations.length > 3 && (
              <p className="text-sm text-red-600">...and {violations.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-4 text-sm">
        {(metric === 'co2' || metric === 'all') && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-rink-600">CO₂ (ppm)</span>
          </div>
        )}
        {(metric === 'co' || metric === 'all') && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500"></div>
            <span className="text-rink-600">CO (ppm)</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-yellow-400 opacity-50"></div>
          <span className="text-rink-500">Warning Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-400 opacity-50"></div>
          <span className="text-rink-500">Danger Zone</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg className="w-full h-full">
          {/* Threshold zones */}
          {(metric === 'co2' || metric === 'all') && (
            <>
              {/* CO2 Warning zone */}
              <rect
                x={`${padding.left}%`}
                y={getYPosition(Math.min(thresholds.co2.warning, maxY))}
                width={`${100 - padding.left - padding.right}%`}
                height={Math.max(0, getYPosition(thresholds.co2.elevated) - getYPosition(Math.min(thresholds.co2.warning, maxY)))}
                fill="rgba(234, 179, 8, 0.15)"
              />
              {/* CO2 Danger zone */}
              {maxY > thresholds.co2.warning && (
                <rect
                  x={`${padding.left}%`}
                  y={padding.top}
                  width={`${100 - padding.left - padding.right}%`}
                  height={getYPosition(thresholds.co2.warning) - padding.top}
                  fill="rgba(239, 68, 68, 0.1)"
                />
              )}
            </>
          )}

          {(metric === 'co' || metric === 'all') && (
            <>
              {/* CO Warning line */}
              <line
                x1={`${padding.left}%`}
                y1={getYPosition(thresholds.co.warning)}
                x2={`${100 - padding.right}%`}
                y2={getYPosition(thresholds.co.warning)}
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
              {/* CO Danger line */}
              {maxY > thresholds.co.danger && (
                <line
                  x1={`${padding.left}%`}
                  y1={getYPosition(thresholds.co.danger)}
                  x2={`${100 - padding.right}%`}
                  y2={getYPosition(thresholds.co.danger)}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="8,4"
                />
              )}
            </>
          )}

          {/* Y-axis gridlines and labels */}
          {yLabels.map((value, i) => (
            <g key={i}>
              <line
                x1={`${padding.left}%`}
                y1={getYPosition(value)}
                x2={`${100 - padding.right}%`}
                y2={getYPosition(value)}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x={`${padding.left - 2}%`}
                y={getYPosition(value)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-rink-500"
              >
                {value}
              </text>
            </g>
          ))}

          {/* CO2 Line */}
          {(metric === 'co2' || metric === 'all') && (
            <>
              <path
                d={generatePath(data.map(d => d.co2Level))}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.map((d, i) => d.co2Level !== null && (
                <circle
                  key={`co2-${i}`}
                  cx={`${getXPosition(i)}%`}
                  cy={getYPosition(d.co2Level)}
                  r={d.co2Level >= thresholds.co2.warning ? 6 : 4}
                  fill={
                    d.co2Level >= thresholds.co2.warning
                      ? '#ef4444'
                      : d.co2Level >= thresholds.co2.elevated
                      ? '#f59e0b'
                      : '#3b82f6'
                  }
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))}
            </>
          )}

          {/* CO Line */}
          {(metric === 'co' || metric === 'all') && (
            <>
              <path
                d={generatePath(data.map(d => d.coLevel))}
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.map((d, i) => d.coLevel !== null && (
                <circle
                  key={`co-${i}`}
                  cx={`${getXPosition(i)}%`}
                  cy={getYPosition(d.coLevel)}
                  r={d.coLevel >= thresholds.co.warning ? 6 : 4}
                  fill={
                    d.coLevel >= thresholds.co.danger
                      ? '#ef4444'
                      : d.coLevel >= thresholds.co.warning
                      ? '#f59e0b'
                      : '#f97316'
                  }
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))}
            </>
          )}

          {/* X-axis labels */}
          {data.map((d, i) => (
            i % Math.ceil(data.length / 6) === 0 && (
              <text
                key={i}
                x={`${getXPosition(i)}%`}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-rink-600"
              >
                {new Date(d.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            )
          ))}

          {/* Threshold labels */}
          {(metric === 'co2' || metric === 'all') && thresholds.co2.warning <= maxY && (
            <text
              x={`${100 - padding.right + 1}%`}
              y={getYPosition(thresholds.co2.warning)}
              dominantBaseline="middle"
              className="text-xs fill-yellow-600 font-medium"
            >
              CO₂ OSHA
            </text>
          )}
          {(metric === 'co' || metric === 'all') && thresholds.co.warning <= maxY && (
            <text
              x={`${100 - padding.right + 1}%`}
              y={getYPosition(thresholds.co.warning)}
              dominantBaseline="middle"
              className="text-xs fill-orange-600 font-medium"
            >
              CO Limit
            </text>
          )}
        </svg>
      </div>

      {/* OSHA Reference Panel */}
      <div className="mt-4 p-4 bg-rink-50 rounded-lg">
        <p className="text-xs font-medium text-rink-700 mb-3">OSHA & Safety Thresholds</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-rink-800">Carbon Dioxide (CO₂)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>&lt; {thresholds.co2.normal} ppm - Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span>{thresholds.co2.elevated}+ ppm - Ventilate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>{thresholds.co2.warning} ppm - OSHA TWA</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>{thresholds.co2.danger}+ ppm - IDLH</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-rink-800">Carbon Monoxide (CO)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>&lt; {thresholds.co.normal} ppm - Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span>{thresholds.co.warning} ppm - OSHA Ceiling</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>{thresholds.co.danger} ppm - NIOSH Ceiling</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>{thresholds.co.critical}+ ppm - IDLH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
