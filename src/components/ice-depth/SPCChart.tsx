'use client';

import { useMemo } from 'react';

interface WeeklyData {
  weekStart: string;
  averageDepth: number;
  minDepth: number;
  maxDepth: number;
  readingsCount: number;
}

interface SPCChartProps {
  data: WeeklyData[];
}

// Calculate SPC control limits using standard formulas
function calculateControlLimits(data: WeeklyData[]) {
  if (data.length < 2) return null;

  const values = data.map(d => d.averageDepth);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  // Calculate moving range for individuals chart
  const movingRanges: number[] = [];
  for (let i = 1; i < values.length; i++) {
    movingRanges.push(Math.abs(values[i] - values[i - 1]));
  }

  const avgMovingRange = movingRanges.length > 0
    ? movingRanges.reduce((a, b) => a + b, 0) / movingRanges.length
    : 0;

  // d2 constant for n=2 (moving range of 2 observations) = 1.128
  const d2 = 1.128;
  const sigma = avgMovingRange / d2;

  // Control limits at 3 sigma
  const ucl = mean + 3 * sigma;
  const lcl = mean - 3 * sigma;

  // Warning limits at 2 sigma
  const uwl = mean + 2 * sigma;
  const lwl = mean - 2 * sigma;

  return {
    mean,
    ucl,
    lcl,
    uwl,
    lwl,
    sigma,
  };
}

export function SPCChart({ data }: SPCChartProps) {
  const controlLimits = useMemo(() => calculateControlLimits(data), [data]);

  if (!controlLimits || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 text-rink-500">
        <div className="text-center">
          <p className="font-medium">Insufficient data for SPC analysis</p>
          <p className="text-sm mt-1">Need at least 2 weeks of readings</p>
        </div>
      </div>
    );
  }

  const { mean, ucl, lcl, uwl, lwl } = controlLimits;

  // Calculate chart dimensions
  const chartHeight = 300;
  const padding = { top: 20, right: 40, bottom: 60, left: 60 };

  // Determine Y-axis range
  const allValues = data.map(d => d.averageDepth);
  const minY = Math.min(lcl - 0.05, ...allValues) - 0.05;
  const maxY = Math.max(ucl + 0.05, ...allValues) + 0.05;
  const range = maxY - minY;

  const getYPosition = (value: number) => {
    return padding.top + ((maxY - value) / range) * (chartHeight - padding.top - padding.bottom);
  };

  const getXPosition = (index: number) => {
    const chartWidth = 100; // percentage
    return padding.left + ((index + 0.5) / data.length) * (chartWidth - padding.left - padding.right);
  };

  // Check for out-of-control points
  const outOfControl = data.map(d =>
    d.averageDepth > ucl || d.averageDepth < lcl
  );

  const warning = data.map(d =>
    (d.averageDepth > uwl && d.averageDepth <= ucl) ||
    (d.averageDepth < lwl && d.averageDepth >= lcl)
  );

  // Generate Y-axis labels
  const yLabels = [];
  const step = range > 0.4 ? 0.1 : 0.05;
  for (let v = Math.floor(minY * 20) / 20; v <= maxY; v += step) {
    yLabels.push(v);
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-ice-600"></div>
          <span className="text-rink-600">Data Points</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-green-500"></div>
          <span className="text-rink-600">Mean ({mean.toFixed(3)}")</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-red-500"></div>
          <span className="text-rink-600">Control Limits (3σ)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-yellow-500 opacity-60"></div>
          <span className="text-rink-600">Warning Limits (2σ)</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg className="w-full h-full">
          {/* Background zones */}
          {/* Out of control zone (above UCL) */}
          <rect
            x={`${padding.left}%`}
            y={padding.top}
            width={`${100 - padding.left - padding.right}%`}
            height={getYPosition(ucl) - padding.top}
            fill="rgba(239, 68, 68, 0.05)"
          />

          {/* Out of control zone (below LCL) */}
          <rect
            x={`${padding.left}%`}
            y={getYPosition(lcl)}
            width={`${100 - padding.left - padding.right}%`}
            height={chartHeight - padding.bottom - getYPosition(lcl)}
            fill="rgba(239, 68, 68, 0.05)"
          />

          {/* Warning zone (above UWL) */}
          <rect
            x={`${padding.left}%`}
            y={getYPosition(ucl)}
            width={`${100 - padding.left - padding.right}%`}
            height={getYPosition(uwl) - getYPosition(ucl)}
            fill="rgba(234, 179, 8, 0.05)"
          />

          {/* Warning zone (below LWL) */}
          <rect
            x={`${padding.left}%`}
            y={getYPosition(lwl)}
            width={`${100 - padding.left - padding.right}%`}
            height={getYPosition(lcl) - getYPosition(lwl)}
            fill="rgba(234, 179, 8, 0.05)"
          />

          {/* Y-axis gridlines */}
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
                {value.toFixed(2)}"
              </text>
            </g>
          ))}

          {/* Control limit lines */}
          {/* UCL */}
          <line
            x1={`${padding.left}%`}
            y1={getYPosition(ucl)}
            x2={`${100 - padding.right}%`}
            y2={getYPosition(ucl)}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="8,4"
          />
          <text
            x={`${100 - padding.right + 1}%`}
            y={getYPosition(ucl)}
            dominantBaseline="middle"
            className="text-xs fill-red-600 font-medium"
          >
            UCL
          </text>

          {/* LCL */}
          <line
            x1={`${padding.left}%`}
            y1={getYPosition(lcl)}
            x2={`${100 - padding.right}%`}
            y2={getYPosition(lcl)}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="8,4"
          />
          <text
            x={`${100 - padding.right + 1}%`}
            y={getYPosition(lcl)}
            dominantBaseline="middle"
            className="text-xs fill-red-600 font-medium"
          >
            LCL
          </text>

          {/* UWL */}
          <line
            x1={`${padding.left}%`}
            y1={getYPosition(uwl)}
            x2={`${100 - padding.right}%`}
            y2={getYPosition(uwl)}
            stroke="#eab308"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.6"
          />

          {/* LWL */}
          <line
            x1={`${padding.left}%`}
            y1={getYPosition(lwl)}
            x2={`${100 - padding.right}%`}
            y2={getYPosition(lwl)}
            stroke="#eab308"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.6"
          />

          {/* Mean line */}
          <line
            x1={`${padding.left}%`}
            y1={getYPosition(mean)}
            x2={`${100 - padding.right}%`}
            y2={getYPosition(mean)}
            stroke="#22c55e"
            strokeWidth="2"
          />
          <text
            x={`${100 - padding.right + 1}%`}
            y={getYPosition(mean)}
            dominantBaseline="middle"
            className="text-xs fill-green-600 font-medium"
          >
            CL
          </text>

          {/* Connecting line between points */}
          <polyline
            points={data.map((d, i) => `${getXPosition(i)}%,${getYPosition(d.averageDepth)}`).join(' ')}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2"
            style={{
              vectorEffect: 'non-scaling-stroke',
            }}
          />

          {/* Data points */}
          {data.map((d, i) => (
            <g key={d.weekStart}>
              <circle
                cx={`${getXPosition(i)}%`}
                cy={getYPosition(d.averageDepth)}
                r={outOfControl[i] ? 8 : warning[i] ? 7 : 6}
                fill={outOfControl[i] ? '#ef4444' : warning[i] ? '#eab308' : '#0ea5e9'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              {/* Value label */}
              <text
                x={`${getXPosition(i)}%`}
                y={getYPosition(d.averageDepth) - 12}
                textAnchor="middle"
                className="text-xs fill-rink-700 font-medium"
              >
                {d.averageDepth.toFixed(2)}"
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => (
            <text
              key={d.weekStart}
              x={`${getXPosition(i)}%`}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-rink-600"
            >
              {new Date(d.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          ))}
        </svg>
      </div>

      {/* Statistics Panel */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-rink-50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-rink-500 uppercase tracking-wide">Mean (CL)</p>
          <p className="text-lg font-bold text-green-600">{mean.toFixed(3)}"</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-rink-500 uppercase tracking-wide">Upper Control (UCL)</p>
          <p className="text-lg font-bold text-red-600">{ucl.toFixed(3)}"</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-rink-500 uppercase tracking-wide">Lower Control (LCL)</p>
          <p className="text-lg font-bold text-red-600">{lcl.toFixed(3)}"</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-rink-500 uppercase tracking-wide">Sigma (σ)</p>
          <p className="text-lg font-bold text-rink-700">{controlLimits.sigma.toFixed(4)}"</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-rink-500 uppercase tracking-wide">Out of Control</p>
          <p className={`text-lg font-bold ${outOfControl.some(Boolean) ? 'text-red-600' : 'text-green-600'}`}>
            {outOfControl.filter(Boolean).length} / {data.length}
          </p>
        </div>
      </div>

      {/* Rules Violations */}
      {(outOfControl.some(Boolean) || warning.some(Boolean)) && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">SPC Rule Violations Detected</h4>
          <ul className="space-y-1 text-sm text-yellow-800">
            {outOfControl.map((ooc, i) => ooc && (
              <li key={`ooc-${i}`} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Week of {new Date(data[i].weekStart).toLocaleDateString()} - Point outside control limits ({data[i].averageDepth.toFixed(2)}")
              </li>
            ))}
            {warning.map((w, i) => w && !outOfControl[i] && (
              <li key={`warn-${i}`} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Week of {new Date(data[i].weekStart).toLocaleDateString()} - Point in warning zone ({data[i].averageDepth.toFixed(2)}")
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
