/**
 * Standalone Rink Diagram Component
 *
 * A reusable SVG-based ice hockey rink visualization component for React.
 *
 * Features:
 * - Three point configurations: 25-point (5x5), 35-point (5x7), 47-point (NHL-style)
 * - Interactive measurement points with click selection
 * - Color-coded depth status (green/yellow/red/gray)
 * - Statistics calculation hook (average, min, max, variance)
 * - Read-only mode for display purposes
 * - Fully responsive SVG that scales to any size
 *
 * Dependencies:
 * - React 18+
 * - clsx (npm install clsx)
 * - Tailwind CSS (or replace utility classes with your own CSS)
 *
 * Usage:
 * ```tsx
 * import { RinkDiagram, useIceDepthPoints } from './RinkDiagram-Standalone';
 *
 * function MyComponent() {
 *   const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
 *   const { points, updatePoint, getStats } = useIceDepthPoints(25);
 *
 *   return (
 *     <RinkDiagram
 *       pointsConfig={25}
 *       points={points}
 *       selectedPointId={selectedPoint}
 *       onPointSelect={setSelectedPoint}
 *       onPointUpdate={updatePoint}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IceDepthPoint {
  pointId: string;
  x: number;
  y: number;
  depth: number | null;
}

export interface IceDepthConfig {
  points: 25 | 35 | 47;
  layout: IceDepthPoint[];
}

export interface IceDepthStats {
  average: number | null;
  min: number | null;
  max: number | null;
  variance: number | null;
}

export interface RinkDiagramProps {
  /** Number of measurement points: 25 (5x5), 35 (5x7), or 47 (NHL-style) */
  pointsConfig: 25 | 35 | 47;
  /** Array of ice depth measurement points */
  points: IceDepthPoint[];
  /** Currently selected point ID */
  selectedPointId: string | null;
  /** Callback when a point is clicked */
  onPointSelect: (pointId: string) => void;
  /** Callback when a point's depth is updated */
  onPointUpdate: (pointId: string, depth: number) => void;
  /** If true, disables point interaction */
  readOnly?: boolean;
  /** Optional: Hide the legend */
  hideLegend?: boolean;
  /** Optional: Custom class name for the container */
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate measurement point layouts for different configurations
 */
export function generatePoints(config: 25 | 35 | 47): IceDepthPoint[] {
  const points: IceDepthPoint[] = [];

  if (config === 25) {
    // 5x5 grid - standard layout
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        points.push({
          pointId: `p${row * 5 + col + 1}`,
          x: 10 + col * 20,
          y: 10 + row * 20,
          depth: null,
        });
      }
    }
  } else if (config === 35) {
    // 5x7 grid - more detailed layout
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        points.push({
          pointId: `p${row * 7 + col + 1}`,
          x: 7 + col * 14.3,
          y: 10 + row * 20,
          depth: null,
        });
      }
    }
  } else {
    // 47-point custom layout (NHL-style with extra points near goals)
    // Center line points
    for (let i = 0; i < 5; i++) {
      points.push({
        pointId: `center${i + 1}`,
        x: 50,
        y: 10 + i * 20,
        depth: null,
      });
    }
    // Goal crease areas (extra points for high-traffic zones)
    [15, 85].forEach((x, idx) => {
      for (let i = 0; i < 3; i++) {
        points.push({
          pointId: `goal${idx}${i}`,
          x,
          y: 35 + i * 15,
          depth: null,
        });
      }
    });
    // Regular grid around the rink
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        if (col !== 3) {
          // Skip center column (already added)
          points.push({
            pointId: `p${row * 7 + col + 1}`,
            x: 7 + col * 14.3,
            y: 10 + row * 20,
            depth: null,
          });
        }
      }
    }
  }

  return points.slice(0, config);
}

/**
 * Get the status category for a depth measurement
 */
export function getDepthStatus(depth: number | null): 'empty' | 'normal' | 'warning' | 'danger' {
  if (depth === null) return 'empty';
  if (depth < 0.75) return 'danger';
  if (depth < 1.0) return 'warning';
  return 'normal';
}

/**
 * Get the display color for a depth measurement
 */
export function getDepthColor(depth: number | null): string {
  const status = getDepthStatus(depth);
  switch (status) {
    case 'danger':
      return '#ef4444'; // red-500
    case 'warning':
      return '#eab308'; // yellow-500
    case 'normal':
      return '#22c55e'; // green-500
    default:
      return '#94a3b8'; // slate-400 (unmeasured)
  }
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook for managing ice depth readings with statistics calculation
 *
 * @param config - Number of measurement points (25, 35, or 47)
 * @returns Object containing points array and management functions
 */
export function useIceDepthPoints(config: 25 | 35 | 47) {
  const [points, setPoints] = useState<IceDepthPoint[]>(() => generatePoints(config));

  const updatePoint = useCallback((pointId: string, depth: number) => {
    setPoints((prev) =>
      prev.map((p) => (p.pointId === pointId ? { ...p, depth } : p))
    );
  }, []);

  const resetPoints = useCallback(() => {
    setPoints(generatePoints(config));
  }, [config]);

  const getStats = useCallback((): IceDepthStats => {
    const measuredPoints = points.filter((p) => p.depth !== null);
    if (measuredPoints.length === 0) {
      return { average: null, min: null, max: null, variance: null };
    }

    const depths = measuredPoints.map((p) => p.depth!);
    const average = depths.reduce((a, b) => a + b, 0) / depths.length;
    const min = Math.min(...depths);
    const max = Math.max(...depths);
    const variance =
      depths.reduce((acc, d) => acc + Math.pow(d - average, 2), 0) / depths.length;

    return { average, min, max, variance };
  }, [points]);

  const getMeasuredCount = useCallback(() => {
    return points.filter((p) => p.depth !== null).length;
  }, [points]);

  const getCompletionPercentage = useCallback(() => {
    const measured = points.filter((p) => p.depth !== null).length;
    return Math.round((measured / points.length) * 100);
  }, [points]);

  return {
    points,
    updatePoint,
    resetPoints,
    getStats,
    getMeasuredCount,
    getCompletionPercentage,
    totalPoints: points.length,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * RinkDiagram - SVG-based ice hockey rink visualization component
 *
 * Renders an interactive hockey rink with measurement points for tracking
 * ice depth across the rink surface.
 */
export function RinkDiagram({
  pointsConfig,
  points: initialPoints,
  selectedPointId,
  onPointSelect,
  onPointUpdate,
  readOnly = false,
  hideLegend = false,
  className,
}: RinkDiagramProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // Use provided points or generate defaults
  const points = initialPoints.length > 0 ? initialPoints : generatePoints(pointsConfig);

  return (
    <div className={clsx('relative w-full aspect-[2/1] max-w-4xl mx-auto', className)}>
      <svg
        viewBox="0 0 100 50"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
      >
        {/* ============ DEFINITIONS ============ */}
        <defs>
          {/* Ice gradient background */}
          <linearGradient id="iceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>

          {/* Inner shadow filter for depth effect */}
          <filter id="innerShadow">
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="1" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* ============ RINK SURFACE ============ */}
        <rect
          x="1"
          y="1"
          width="98"
          height="48"
          rx="10"
          ry="10"
          fill="url(#iceGradient)"
          stroke="#0369a1"
          strokeWidth="0.5"
          filter="url(#innerShadow)"
        />

        {/* ============ RINK MARKINGS ============ */}

        {/* Center red line */}
        <line x1="50" y1="1" x2="50" y2="49" stroke="#dc2626" strokeWidth="0.8" />

        {/* Blue lines */}
        <line x1="30" y1="1" x2="30" y2="49" stroke="#1d4ed8" strokeWidth="0.6" />
        <line x1="70" y1="1" x2="70" y2="49" stroke="#1d4ed8" strokeWidth="0.6" />

        {/* Goal lines */}
        <line x1="10" y1="1" x2="10" y2="49" stroke="#dc2626" strokeWidth="0.4" />
        <line x1="90" y1="1" x2="90" y2="49" stroke="#dc2626" strokeWidth="0.4" />

        {/* Center circle */}
        <circle cx="50" cy="25" r="8" fill="none" stroke="#1d4ed8" strokeWidth="0.4" />
        <circle cx="50" cy="25" r="0.8" fill="#1d4ed8" />

        {/* Face-off circles (4 corners) */}
        {[20, 80].map((x) =>
          [15, 35].map((y) => (
            <g key={`circle-${x}-${y}`}>
              <circle cx={x} cy={y} r="5" fill="none" stroke="#dc2626" strokeWidth="0.3" />
              <circle cx={x} cy={y} r="0.5" fill="#dc2626" />
            </g>
          ))
        )}

        {/* Goal creases */}
        {[8, 92].map((x, idx) => (
          <path
            key={`crease-${idx}`}
            d={`M ${x} 21 A 4 4 0 0 ${idx === 0 ? 0 : 1} ${x} 29`}
            fill="none"
            stroke="#dc2626"
            strokeWidth="0.3"
          />
        ))}

        {/* ============ MEASUREMENT POINTS ============ */}
        {points.map((point) => {
          const isSelected = point.pointId === selectedPointId;
          const isHovered = point.pointId === hoveredPoint;
          const color = getDepthColor(point.depth);

          return (
            <g
              key={point.pointId}
              className={clsx(
                'cursor-pointer transition-transform',
                !readOnly && 'hover:scale-110'
              )}
              onClick={() => !readOnly && onPointSelect(point.pointId)}
              onMouseEnter={() => setHoveredPoint(point.pointId)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Selection ring (pulsing animation) */}
              {isSelected && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="0.4"
                  className="animate-pulse"
                />
              )}

              {/* Point circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r="2"
                fill={color}
                stroke="white"
                strokeWidth="0.3"
                style={{
                  filter: isHovered || isSelected ? 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' : undefined,
                }}
              />

              {/* Depth value label */}
              {point.depth !== null && (
                <text
                  x={point.x}
                  y={point.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="1.2"
                  fontWeight="bold"
                  fill="white"
                >
                  {point.depth.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* ============ LEGEND ============ */}
      {!hideLegend && (
        <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-3 py-2 text-xs flex gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>Normal (≥1.0")</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Warning (0.75-1.0")</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Danger (&lt;0.75")</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            <span>Not measured</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SIMPLE RINK (No measurement points - just the rink visualization)
// ============================================================================

export interface SimpleRinkProps {
  /** Optional: Custom class name for the container */
  className?: string;
}

/**
 * SimpleRink - A basic hockey rink SVG without measurement points
 *
 * Useful when you just need a rink background without the ice depth functionality.
 */
export function SimpleRink({ className }: SimpleRinkProps) {
  return (
    <div className={clsx('relative w-full aspect-[2/1] max-w-4xl mx-auto', className)}>
      <svg
        viewBox="0 0 100 50"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
      >
        <defs>
          <linearGradient id="simpleIceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
        </defs>

        {/* Rink surface */}
        <rect
          x="1"
          y="1"
          width="98"
          height="48"
          rx="10"
          ry="10"
          fill="url(#simpleIceGradient)"
          stroke="#0369a1"
          strokeWidth="0.5"
        />

        {/* Center red line */}
        <line x1="50" y1="1" x2="50" y2="49" stroke="#dc2626" strokeWidth="0.8" />

        {/* Blue lines */}
        <line x1="30" y1="1" x2="30" y2="49" stroke="#1d4ed8" strokeWidth="0.6" />
        <line x1="70" y1="1" x2="70" y2="49" stroke="#1d4ed8" strokeWidth="0.6" />

        {/* Goal lines */}
        <line x1="10" y1="1" x2="10" y2="49" stroke="#dc2626" strokeWidth="0.4" />
        <line x1="90" y1="1" x2="90" y2="49" stroke="#dc2626" strokeWidth="0.4" />

        {/* Center circle */}
        <circle cx="50" cy="25" r="8" fill="none" stroke="#1d4ed8" strokeWidth="0.4" />
        <circle cx="50" cy="25" r="0.8" fill="#1d4ed8" />

        {/* Face-off circles */}
        {[20, 80].map((x) =>
          [15, 35].map((y) => (
            <g key={`circle-${x}-${y}`}>
              <circle cx={x} cy={y} r="5" fill="none" stroke="#dc2626" strokeWidth="0.3" />
              <circle cx={x} cy={y} r="0.5" fill="#dc2626" />
            </g>
          ))
        )}

        {/* Goal creases */}
        {[8, 92].map((x, idx) => (
          <path
            key={`crease-${idx}`}
            d={`M ${x} 21 A 4 4 0 0 ${idx === 0 ? 0 : 1} ${x} 29`}
            fill="none"
            stroke="#dc2626"
            strokeWidth="0.3"
          />
        ))}
      </svg>
    </div>
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default RinkDiagram;
