'use client';

import { useMemo, useState } from 'react';

// Mock data for heatmap visualization
const mockReadingPoints = [
  // Row 1 (top)
  { pointId: 'A1', x: 10, y: 10, depth: 1.15 },
  { pointId: 'A2', x: 30, y: 10, depth: 1.22 },
  { pointId: 'A3', x: 50, y: 10, depth: 1.18 },
  { pointId: 'A4', x: 70, y: 10, depth: 1.20 },
  { pointId: 'A5', x: 90, y: 10, depth: 1.16 },
  // Row 2
  { pointId: 'B1', x: 10, y: 30, depth: 1.25 },
  { pointId: 'B2', x: 30, y: 30, depth: 1.28 },
  { pointId: 'B3', x: 50, y: 30, depth: 1.25 },
  { pointId: 'B4', x: 70, y: 30, depth: 1.24 },
  { pointId: 'B5', x: 90, y: 30, depth: 1.22 },
  // Row 3 (center)
  { pointId: 'C1', x: 10, y: 50, depth: 1.30 },
  { pointId: 'C2', x: 30, y: 50, depth: 1.32 },
  { pointId: 'C3', x: 50, y: 50, depth: 1.35 },
  { pointId: 'C4', x: 70, y: 50, depth: 1.33 },
  { pointId: 'C5', x: 90, y: 50, depth: 1.28 },
  // Row 4
  { pointId: 'D1', x: 10, y: 70, depth: 1.22 },
  { pointId: 'D2', x: 30, y: 70, depth: 1.25 },
  { pointId: 'D3', x: 50, y: 70, depth: 1.28 },
  { pointId: 'D4', x: 70, y: 70, depth: 1.26 },
  { pointId: 'D5', x: 90, y: 70, depth: 1.20 },
  // Row 5 (bottom)
  { pointId: 'E1', x: 10, y: 90, depth: 0.95 },
  { pointId: 'E2', x: 30, y: 90, depth: 1.08 },
  { pointId: 'E3', x: 50, y: 90, depth: 1.12 },
  { pointId: 'E4', x: 70, y: 90, depth: 1.10 },
  { pointId: 'E5', x: 90, y: 90, depth: 0.92 },
];

interface ReadingPoint {
  pointId: string;
  x: number;
  y: number;
  depth: number | null;
}

interface HeatmapVisualizationProps {
  readingPoints?: ReadingPoint[];
}

// Color scale for depth values
function getHeatColor(depth: number): string {
  // Optimal range: 1.0" - 1.25"
  // Red for thin ice (< 0.75)
  // Yellow for below optimal (0.75 - 1.0)
  // Green for optimal (1.0 - 1.25)
  // Blue for thick (1.25 - 1.5)
  // Purple for very thick (> 1.5)

  if (depth < 0.5) return 'rgb(220, 38, 38)'; // Red-600
  if (depth < 0.75) return 'rgb(239, 68, 68)'; // Red-500
  if (depth < 1.0) return 'rgb(234, 179, 8)'; // Yellow-500
  if (depth < 1.25) return 'rgb(34, 197, 94)'; // Green-500
  if (depth < 1.5) return 'rgb(14, 165, 233)'; // Sky-500
  return 'rgb(147, 51, 234)'; // Purple-600
}

function getHeatColorWithOpacity(depth: number, opacity: number = 0.7): string {
  if (depth < 0.5) return `rgba(220, 38, 38, ${opacity})`;
  if (depth < 0.75) return `rgba(239, 68, 68, ${opacity})`;
  if (depth < 1.0) return `rgba(234, 179, 8, ${opacity})`;
  if (depth < 1.25) return `rgba(34, 197, 94, ${opacity})`;
  if (depth < 1.5) return `rgba(14, 165, 233, ${opacity})`;
  return `rgba(147, 51, 234, ${opacity})`;
}

export function HeatmapVisualization({ readingPoints = mockReadingPoints }: HeatmapVisualizationProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ReadingPoint | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showInterpolation, setShowInterpolation] = useState(true);

  const stats = useMemo(() => {
    const validDepths = readingPoints
      .map(p => p.depth)
      .filter((d): d is number => d !== null);

    if (validDepths.length === 0) return null;

    return {
      min: Math.min(...validDepths),
      max: Math.max(...validDepths),
      avg: validDepths.reduce((a, b) => a + b, 0) / validDepths.length,
    };
  }, [readingPoints]);

  // Create gradient stops for the legend
  const legendGradient = `linear-gradient(to right,
    rgb(220, 38, 38) 0%,
    rgb(239, 68, 68) 15%,
    rgb(234, 179, 8) 30%,
    rgb(34, 197, 94) 50%,
    rgb(14, 165, 233) 70%,
    rgb(147, 51, 234) 100%
  )`;

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="rounded border-rink-300 text-ice-600 focus:ring-ice-500"
            />
            Show depth values
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInterpolation}
              onChange={(e) => setShowInterpolation(e.target.checked)}
              className="rounded border-rink-300 text-ice-600 focus:ring-ice-500"
            />
            Show interpolation
          </label>
        </div>

        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-rink-500">
              Min: <strong className="text-rink-900">{stats.min.toFixed(2)}"</strong>
            </span>
            <span className="text-rink-500">
              Avg: <strong className="text-rink-900">{stats.avg.toFixed(2)}"</strong>
            </span>
            <span className="text-rink-500">
              Max: <strong className="text-rink-900">{stats.max.toFixed(2)}"</strong>
            </span>
          </div>
        )}
      </div>

      {/* Rink SVG */}
      <div className="relative aspect-[2/1] bg-gradient-to-b from-white to-ice-50 rounded-lg border border-rink-200 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Rink outline */}
          <rect
            x="2"
            y="2"
            width="196"
            height="96"
            rx="20"
            ry="20"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.5"
          />

          {/* Center line */}
          <line x1="100" y1="2" x2="100" y2="98" stroke="#dc2626" strokeWidth="0.8" />

          {/* Blue lines */}
          <line x1="40" y1="2" x2="40" y2="98" stroke="#2563eb" strokeWidth="0.8" />
          <line x1="160" y1="2" x2="160" y2="98" stroke="#2563eb" strokeWidth="0.8" />

          {/* Center circle */}
          <circle cx="100" cy="50" r="15" fill="none" stroke="#dc2626" strokeWidth="0.5" />

          {/* Goal creases */}
          <path
            d="M 5 38 A 12 12 0 0 1 5 62"
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#2563eb"
            strokeWidth="0.3"
          />
          <path
            d="M 195 38 A 12 12 0 0 0 195 62"
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#2563eb"
            strokeWidth="0.3"
          />

          {/* Faceoff circles */}
          {[
            { cx: 30, cy: 25 },
            { cx: 30, cy: 75 },
            { cx: 170, cy: 25 },
            { cx: 170, cy: 75 },
          ].map((circle, i) => (
            <circle
              key={i}
              cx={circle.cx}
              cy={circle.cy}
              r="12"
              fill="none"
              stroke="#dc2626"
              strokeWidth="0.3"
            />
          ))}

          {/* Interpolation layer (simplified) */}
          {showInterpolation && (
            <g opacity="0.4">
              {readingPoints.map((point, i) => (
                point.depth !== null && (
                  <circle
                    key={`interp-${i}`}
                    cx={(point.x / 100) * 196 + 2}
                    cy={(point.y / 100) * 96 + 2}
                    r="18"
                    fill={getHeatColorWithOpacity(point.depth, 0.3)}
                    style={{ filter: 'blur(8px)' }}
                  />
                )
              ))}
            </g>
          )}

          {/* Data points */}
          {readingPoints.map((point) => (
            point.depth !== null && (
              <g key={point.pointId}>
                <circle
                  cx={(point.x / 100) * 196 + 2}
                  cy={(point.y / 100) * 96 + 2}
                  r={hoveredPoint?.pointId === point.pointId ? 5 : 4}
                  fill={getHeatColor(point.depth)}
                  stroke="white"
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Point labels */}
                {showLabels && (
                  <text
                    x={(point.x / 100) * 196 + 2}
                    y={(point.y / 100) * 96 + 2 - 6}
                    textAnchor="middle"
                    className="text-[4px] fill-rink-700 font-medium"
                    style={{ pointerEvents: 'none' }}
                  >
                    {point.depth.toFixed(2)}"
                  </text>
                )}
              </g>
            )
          ))}

          {/* Rink labels */}
          <text x="10" y="50" className="text-[6px] fill-rink-400 font-medium" textAnchor="middle" dominantBaseline="middle">
            HOME
          </text>
          <text x="190" y="50" className="text-[6px] fill-rink-400 font-medium" textAnchor="middle" dominantBaseline="middle">
            AWAY
          </text>
        </svg>

        {/* Hover tooltip */}
        {hoveredPoint && hoveredPoint.depth !== null && (
          <div
            className="absolute bg-white px-3 py-2 rounded-lg shadow-lg border border-rink-200 pointer-events-none z-10"
            style={{
              left: `${hoveredPoint.x}%`,
              top: `${hoveredPoint.y - 10}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-semibold text-rink-900">{hoveredPoint.pointId}</p>
            <p className="text-sm">
              Depth: <strong style={{ color: getHeatColor(hoveredPoint.depth) }}>{hoveredPoint.depth.toFixed(2)}"</strong>
            </p>
            <p className="text-xs text-rink-500">
              {hoveredPoint.depth < 0.75
                ? 'Critical - Below safe threshold'
                : hoveredPoint.depth < 1.0
                ? 'Warning - Below optimal'
                : hoveredPoint.depth <= 1.25
                ? 'Optimal range'
                : hoveredPoint.depth <= 1.5
                ? 'Above optimal'
                : 'Excessive thickness'}
            </p>
          </div>
        )}
      </div>

      {/* Color Legend */}
      <div className="mt-4 p-4 bg-rink-50 rounded-lg">
        <p className="text-sm font-medium text-rink-700 mb-2">Depth Legend</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-rink-500">&lt; 0.5"</span>
          <div
            className="flex-1 h-4 rounded"
            style={{ background: legendGradient }}
          />
          <span className="text-xs text-rink-500">&gt; 1.5"</span>
        </div>
        <div className="flex justify-between mt-1 text-xs text-rink-500">
          <span>Critical</span>
          <span>Below Optimal</span>
          <span className="text-green-600 font-medium">Optimal (1.0-1.25")</span>
          <span>Above Optimal</span>
          <span>Excessive</span>
        </div>
      </div>

      {/* Problem Areas Summary */}
      {stats && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Critical Areas */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <h4 className="font-medium text-red-900 mb-2">Critical Areas</h4>
            {readingPoints.filter(p => p.depth !== null && p.depth < 0.75).length > 0 ? (
              <ul className="space-y-1">
                {readingPoints
                  .filter(p => p.depth !== null && p.depth < 0.75)
                  .map(p => (
                    <li key={p.pointId} className="text-sm text-red-700">
                      Point {p.pointId}: {p.depth?.toFixed(2)}"
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-red-600">No critical areas</p>
            )}
          </div>

          {/* Below Optimal */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <h4 className="font-medium text-yellow-900 mb-2">Below Optimal</h4>
            {readingPoints.filter(p => p.depth !== null && p.depth >= 0.75 && p.depth < 1.0).length > 0 ? (
              <ul className="space-y-1">
                {readingPoints
                  .filter(p => p.depth !== null && p.depth >= 0.75 && p.depth < 1.0)
                  .map(p => (
                    <li key={p.pointId} className="text-sm text-yellow-700">
                      Point {p.pointId}: {p.depth?.toFixed(2)}"
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-yellow-600">All within range</p>
            )}
          </div>

          {/* Above Optimal */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-2">Above Optimal</h4>
            {readingPoints.filter(p => p.depth !== null && p.depth > 1.25).length > 0 ? (
              <ul className="space-y-1">
                {readingPoints
                  .filter(p => p.depth !== null && p.depth > 1.25)
                  .map(p => (
                    <li key={p.pointId} className="text-sm text-blue-700">
                      Point {p.pointId}: {p.depth?.toFixed(2)}"
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-blue-600">None exceeding optimal</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
