'use client';

import { useMemo } from 'react';

interface WeeklyData {
  weekStart: string;
  averageDepth: number;
  minDepth: number;
  maxDepth: number;
  readingsCount: number;
}

interface WeeklyComparisonChartProps {
  data: WeeklyData[];
}

export function WeeklyComparisonChart({ data }: WeeklyComparisonChartProps) {
  const chartConfig = useMemo(() => {
    if (data.length === 0) return null;

    const depths = data.flatMap(d => [d.minDepth, d.maxDepth]);
    const minValue = Math.floor(Math.min(...depths) * 10) / 10 - 0.1;
    const maxValue = Math.ceil(Math.max(...depths) * 10) / 10 + 0.1;
    const range = maxValue - minValue;

    return { minValue, maxValue, range };
  }, [data]);

  if (!chartConfig || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-rink-500">
        No data available
      </div>
    );
  }

  const { minValue, maxValue, range } = chartConfig;
  const chartHeight = 280;
  const chartWidth = 100; // percentage
  const barWidth = Math.min(60, (chartWidth / data.length) * 0.6);
  const optimalMin = 1.0;
  const optimalMax = 1.25;

  const getYPosition = (value: number) => {
    return ((maxValue - value) / range) * chartHeight;
  };

  const yAxisLabels = [];
  const step = range > 0.5 ? 0.2 : 0.1;
  for (let v = minValue; v <= maxValue; v += step) {
    yAxisLabels.push(v);
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-ice-500 rounded"></div>
          <span className="text-rink-600">Average Depth</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-rink-300"></div>
          <span className="text-rink-600">Min/Max Range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-rink-600">Optimal Zone (1.0" - 1.25")</span>
        </div>
      </div>

      <div className="relative flex">
        {/* Y-axis */}
        <div className="w-12 relative" style={{ height: chartHeight }}>
          {yAxisLabels.map((value, i) => (
            <div
              key={i}
              className="absolute right-2 text-xs text-rink-500 transform -translate-y-1/2"
              style={{ top: getYPosition(value) }}
            >
              {value.toFixed(1)}"
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 relative" style={{ height: chartHeight }}>
          {/* Gridlines */}
          <svg className="absolute inset-0 w-full h-full">
            {yAxisLabels.map((value, i) => (
              <line
                key={i}
                x1="0"
                y1={getYPosition(value)}
                x2="100%"
                y2={getYPosition(value)}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
            ))}

            {/* Optimal zone background */}
            <rect
              x="0"
              y={getYPosition(optimalMax)}
              width="100%"
              height={getYPosition(optimalMin) - getYPosition(optimalMax)}
              fill="rgba(34, 197, 94, 0.1)"
            />

            {/* Optimal zone lines */}
            <line
              x1="0"
              y1={getYPosition(optimalMax)}
              x2="100%"
              y2={getYPosition(optimalMax)}
              stroke="#22c55e"
              strokeDasharray="6"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1={getYPosition(optimalMin)}
              x2="100%"
              y2={getYPosition(optimalMin)}
              stroke="#22c55e"
              strokeDasharray="6"
              strokeWidth="1"
            />
          </svg>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around px-4">
            {data.map((week, i) => {
              const barHeight = ((week.averageDepth - minValue) / range) * chartHeight;
              const rangeTop = getYPosition(week.maxDepth);
              const rangeBottom = getYPosition(week.minDepth);
              const rangeHeight = rangeBottom - rangeTop;
              const centerX = ((i + 0.5) / data.length) * 100;

              return (
                <div
                  key={week.weekStart}
                  className="relative flex flex-col items-center"
                  style={{ width: `${barWidth}px` }}
                >
                  {/* Range line (whisker) */}
                  <div
                    className="absolute w-0.5 bg-rink-300"
                    style={{
                      top: rangeTop,
                      height: rangeHeight,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />

                  {/* Min/Max caps */}
                  <div
                    className="absolute w-4 h-0.5 bg-rink-400"
                    style={{
                      top: rangeTop,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                  <div
                    className="absolute w-4 h-0.5 bg-rink-400"
                    style={{
                      top: rangeBottom,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />

                  {/* Average depth bar */}
                  <div
                    className="w-full bg-gradient-to-t from-ice-600 to-ice-400 rounded-t transition-all hover:from-ice-700 hover:to-ice-500"
                    style={{ height: barHeight }}
                    title={`Week of ${new Date(week.weekStart).toLocaleDateString()}
Average: ${week.averageDepth.toFixed(2)}"
Range: ${week.minDepth.toFixed(2)}" - ${week.maxDepth.toFixed(2)}"`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-around mt-2 ml-12">
        {data.map((week) => (
          <div key={week.weekStart} className="text-center" style={{ width: `${barWidth}px` }}>
            <p className="text-xs font-medium text-rink-700">
              {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <p className="text-xs text-rink-500">{week.readingsCount} readings</p>
          </div>
        ))}
      </div>

      {/* Change indicators */}
      <div className="flex justify-around mt-4 ml-12">
        {data.map((week, i) => {
          if (i === 0) return <div key={week.weekStart} style={{ width: `${barWidth}px` }} />;

          const prevWeek = data[i - 1];
          const change = week.averageDepth - prevWeek.averageDepth;

          return (
            <div key={week.weekStart} className="text-center" style={{ width: `${barWidth}px` }}>
              <span className={`text-xs font-medium ${
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-rink-500'
              }`}>
                {change > 0 ? '+' : ''}{change.toFixed(2)}"
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
