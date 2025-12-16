'use client';

import { useMemo } from 'react';

interface RefrigerationReading {
  recordedAt: string;
  compressor1Suction: number;
  compressor1Discharge: number;
  compressor2Suction: number;
  compressor2Discharge: number;
  brineSupply: number;
  brineReturn: number;
}

interface RefrigerationChartProps {
  data: RefrigerationReading[];
  metric: 'compressor' | 'brine' | 'all';
}

// Threshold values for refrigeration systems
const thresholds = {
  suctionPressure: { min: 20, max: 40, critical: 15 }, // PSI
  dischargePressure: { min: 150, max: 200, critical: 220 }, // PSI
  brineSupply: { min: 15, max: 22, critical: 25 }, // °F
  brineReturn: { min: 20, max: 28, critical: 32 }, // °F
};

export function RefrigerationTrendChart({ data, metric }: RefrigerationChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    // Get all values for y-axis scaling
    let allValues: number[] = [];
    if (metric === 'compressor' || metric === 'all') {
      allValues = [
        ...allValues,
        ...data.flatMap(d => [d.compressor1Suction, d.compressor1Discharge, d.compressor2Suction, d.compressor2Discharge]),
      ];
    }
    if (metric === 'brine' || metric === 'all') {
      allValues = [
        ...allValues,
        ...data.flatMap(d => [d.brineSupply, d.brineReturn]),
      ];
    }

    const minY = Math.floor(Math.min(...allValues) / 10) * 10 - 10;
    const maxY = Math.ceil(Math.max(...allValues) / 10) * 10 + 10;

    return { minY, maxY, range: maxY - minY };
  }, [data, metric]);

  if (!chartData || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-rink-500">
        No data available
      </div>
    );
  }

  const { minY, maxY, range } = chartData;
  const chartHeight = 300;
  const chartWidth = 100;
  const padding = { top: 20, right: 80, bottom: 60, left: 50 };

  const getYPosition = (value: number) => {
    return padding.top + ((maxY - value) / range) * (chartHeight - padding.top - padding.bottom);
  };

  const getXPosition = (index: number) => {
    return padding.left + ((index) / (data.length - 1 || 1)) * (chartWidth - padding.left - padding.right);
  };

  // Generate points for each line
  const generatePath = (values: number[]) => {
    if (values.length === 0) return '';
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getXPosition(i)}% ${getYPosition(v)}`)
      .join(' ');
  };

  const lines = metric === 'compressor' || metric === 'all' ? [
    { name: 'Comp 1 Suction', values: data.map(d => d.compressor1Suction), color: '#3b82f6', threshold: thresholds.suctionPressure },
    { name: 'Comp 1 Discharge', values: data.map(d => d.compressor1Discharge), color: '#ef4444', threshold: thresholds.dischargePressure },
    { name: 'Comp 2 Suction', values: data.map(d => d.compressor2Suction), color: '#8b5cf6', threshold: thresholds.suctionPressure },
    { name: 'Comp 2 Discharge', values: data.map(d => d.compressor2Discharge), color: '#f97316', threshold: thresholds.dischargePressure },
  ] : [];

  const brineLines = metric === 'brine' || metric === 'all' ? [
    { name: 'Brine Supply', values: data.map(d => d.brineSupply), color: '#0ea5e9', threshold: thresholds.brineSupply },
    { name: 'Brine Return', values: data.map(d => d.brineReturn), color: '#14b8a6', threshold: thresholds.brineReturn },
  ] : [];

  const allLines = [...lines, ...brineLines];

  // Y-axis labels
  const yLabels = [];
  const step = range > 100 ? 20 : range > 50 ? 10 : 5;
  for (let v = minY; v <= maxY; v += step) {
    yLabels.push(v);
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-4 text-sm">
        {allLines.map((line) => (
          <div key={line.name} className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{ backgroundColor: line.color }}></div>
            <span className="text-rink-600">{line.name}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg className="w-full h-full">
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

          {/* Threshold zones for visible lines */}
          {allLines.map((line) => (
            <g key={`threshold-${line.name}`} opacity="0.1">
              {/* Warning zone (above max) */}
              {line.threshold.max < maxY && (
                <rect
                  x={`${padding.left}%`}
                  y={getYPosition(maxY)}
                  width={`${100 - padding.left - padding.right}%`}
                  height={getYPosition(line.threshold.max) - getYPosition(maxY)}
                  fill="#f59e0b"
                />
              )}
              {/* Critical zone */}
              {line.threshold.critical && (
                <line
                  x1={`${padding.left}%`}
                  y1={getYPosition(line.threshold.critical)}
                  x2={`${100 - padding.right}%`}
                  y2={getYPosition(line.threshold.critical)}
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeDasharray="8,4"
                  opacity="0.5"
                />
              )}
            </g>
          ))}

          {/* Data lines */}
          {allLines.map((line) => (
            <path
              key={line.name}
              d={generatePath(line.values)}
              fill="none"
              stroke={line.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Data points */}
          {allLines.map((line) => (
            line.values.map((value, i) => {
              const isOutOfRange = value < line.threshold.min || value > line.threshold.max;
              const isCritical = line.threshold.critical && (
                value < line.threshold.critical || value > line.threshold.critical
              );

              return (
                <circle
                  key={`${line.name}-${i}`}
                  cx={`${getXPosition(i)}%`}
                  cy={getYPosition(value)}
                  r={isOutOfRange ? 5 : 3}
                  fill={isCritical ? '#ef4444' : isOutOfRange ? '#f59e0b' : line.color}
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })
          ))}

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
        </svg>
      </div>

      {/* Threshold Legend */}
      <div className="mt-4 p-3 bg-rink-50 rounded-lg">
        <p className="text-xs font-medium text-rink-700 mb-2">Operating Ranges</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {metric === 'compressor' || metric === 'all' ? (
            <>
              <div>
                <span className="text-rink-500">Suction:</span>{' '}
                <span className="font-medium">{thresholds.suctionPressure.min}-{thresholds.suctionPressure.max} PSI</span>
              </div>
              <div>
                <span className="text-rink-500">Discharge:</span>{' '}
                <span className="font-medium">{thresholds.dischargePressure.min}-{thresholds.dischargePressure.max} PSI</span>
              </div>
            </>
          ) : null}
          {metric === 'brine' || metric === 'all' ? (
            <>
              <div>
                <span className="text-rink-500">Brine Supply:</span>{' '}
                <span className="font-medium">{thresholds.brineSupply.min}-{thresholds.brineSupply.max}°F</span>
              </div>
              <div>
                <span className="text-rink-500">Brine Return:</span>{' '}
                <span className="font-medium">{thresholds.brineReturn.min}-{thresholds.brineReturn.max}°F</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
