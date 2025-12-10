'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { IceDepthPoint, CustomDiagramConfig } from '@/types';

interface RinkDiagramProps {
  pointsConfig?: number; // Now supports any number
  customConfig?: CustomDiagramConfig; // Custom diagram configuration
  points: IceDepthPoint[];
  selectedPointId: string | null;
  onPointSelect: (pointId: string) => void;
  onPointUpdate: (pointId: string, depth: number) => void;
  readOnly?: boolean;
  showLabels?: boolean; // Option to show point labels
  rinkType?: 'standard' | 'olympic' | 'recreational' | 'curling' | 'custom';
}

// Generate point layouts for different configurations
function generatePoints(config: number, rinkType: string = 'standard'): IceDepthPoint[] {
  const points: IceDepthPoint[] = [];

  if (config === 25) {
    // 5x5 grid
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        points.push({
          pointId: `p${row * 5 + col + 1}`,
          x: 10 + col * 20,
          y: 10 + row * 20,
          depth: null,
          label: `${String.fromCharCode(65 + row)}${col + 1}`,
        });
      }
    }
  } else if (config === 35) {
    // 5x7 grid
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        points.push({
          pointId: `p${row * 7 + col + 1}`,
          x: 7 + col * 14.3,
          y: 10 + row * 20,
          depth: null,
          label: `${String.fromCharCode(65 + row)}${col + 1}`,
        });
      }
    }
  } else if (config === 47) {
    // 47-point custom layout (NHL-style with curves)
    // Center line points
    for (let i = 0; i < 5; i++) {
      points.push({
        pointId: `center${i + 1}`,
        x: 50,
        y: 10 + i * 20,
        depth: null,
        label: `C${i + 1}`,
      });
    }
    // Goal crease areas (extra points)
    [15, 85].forEach((x, idx) => {
      for (let i = 0; i < 3; i++) {
        points.push({
          pointId: `goal${idx}${i}`,
          x,
          y: 35 + i * 15,
          depth: null,
          label: `G${idx === 0 ? 'L' : 'R'}${i + 1}`,
        });
      }
    });
    // Regular grid around the rink
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        if (col !== 3) { // Skip center (already added)
          points.push({
            pointId: `p${row * 7 + col + 1}`,
            x: 7 + col * 14.3,
            y: 10 + row * 20,
            depth: null,
            label: `${String.fromCharCode(65 + row)}${col < 3 ? col + 1 : col}`,
          });
        }
      }
    }
  } else {
    // Custom grid - calculate optimal rows/cols
    const aspectRatio = rinkType === 'curling' ? 9.4 : 2.35; // Length/width ratio
    const cols = Math.ceil(Math.sqrt(config * aspectRatio));
    const rows = Math.ceil(config / cols);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (idx >= config) break;

        points.push({
          pointId: `p${idx + 1}`,
          x: 5 + (col / (cols - 1 || 1)) * 90,
          y: 5 + (row / (rows - 1 || 1)) * 90,
          depth: null,
          label: `${String.fromCharCode(65 + row)}${col + 1}`,
        });
      }
    }
  }

  return points.slice(0, config);
}

// Depth status helpers
function getDepthStatus(depth: number | null): 'empty' | 'normal' | 'warning' | 'danger' {
  if (depth === null) return 'empty';
  if (depth < 0.75) return 'danger';
  if (depth < 1.0) return 'warning';
  return 'normal';
}

function getDepthColor(depth: number | null): string {
  const status = getDepthStatus(depth);
  switch (status) {
    case 'danger':
      return '#ef4444'; // red-500
    case 'warning':
      return '#eab308'; // yellow-500
    case 'normal':
      return '#22c55e'; // green-500
    default:
      return '#94a3b8'; // slate-400
  }
}

export function RinkDiagram({
  pointsConfig = 25,
  customConfig,
  points: initialPoints,
  selectedPointId,
  onPointSelect,
  onPointUpdate,
  readOnly = false,
  showLabels = false,
  rinkType = 'standard',
}: RinkDiagramProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // Use provided points, custom config points, or generate defaults
  const points = customConfig?.points?.length
    ? customConfig.points
    : initialPoints.length > 0
      ? initialPoints
      : generatePoints(pointsConfig, rinkType);

  // Determine rink type for rendering
  const effectiveRinkType = customConfig?.rinkType || rinkType;

  return (
    <div className="relative w-full aspect-[2/1] max-w-4xl mx-auto">
      <svg
        viewBox="0 0 100 50"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
      >
        {/* Rink Background */}
        <defs>
          <linearGradient id="iceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <filter id="innerShadow">
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="1" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Rink outline with rounded corners */}
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

        {/* Measurement points */}
        {points.map((point) => {
          const isSelected = point.pointId === selectedPointId;
          const isHovered = point.pointId === hoveredPoint;
          const status = getDepthStatus(point.depth);
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
              {/* Selection ring */}
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

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-3 py-2 text-xs flex gap-4">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-rink-600">Normal (≥1.0")</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-rink-600">Warning (0.75-1.0")</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-rink-600">Danger (&lt;0.75")</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-slate-400" />
          <span className="text-rink-600">Not measured</span>
        </div>
      </div>
    </div>
  );
}

// Hook for managing ice depth readings - supports custom configurations
export function useIceDepthPoints(
  config: number | CustomDiagramConfig,
  rinkType: string = 'standard'
) {
  const [points, setPoints] = useState<IceDepthPoint[]>(() => {
    if (typeof config === 'object' && config.points) {
      return config.points.map(p => ({ ...p }));
    }
    return generatePoints(config as number, rinkType);
  });

  const updatePoint = useCallback((pointId: string, depth: number) => {
    setPoints((prev) =>
      prev.map((p) => (p.pointId === pointId ? { ...p, depth } : p))
    );
  }, []);

  const resetPoints = useCallback(() => {
    if (typeof config === 'object' && config.points) {
      setPoints(config.points.map(p => ({ ...p, depth: null })));
    } else {
      setPoints(generatePoints(config as number, rinkType));
    }
  }, [config, rinkType]);

  const loadCustomConfig = useCallback((customConfig: CustomDiagramConfig) => {
    setPoints(customConfig.points.map(p => ({ ...p, depth: null })));
  }, []);

  const getStats = useCallback(() => {
    const measuredPoints = points.filter((p) => p.depth !== null);
    if (measuredPoints.length === 0) {
      return { average: null, min: null, max: null, variance: null, measuredCount: 0, totalCount: points.length };
    }

    const depths = measuredPoints.map((p) => p.depth!);
    const average = depths.reduce((a, b) => a + b, 0) / depths.length;
    const min = Math.min(...depths);
    const max = Math.max(...depths);
    const variance =
      depths.reduce((acc, d) => acc + Math.pow(d - average, 2), 0) / depths.length;

    return {
      average,
      min,
      max,
      variance,
      measuredCount: measuredPoints.length,
      totalCount: points.length,
    };
  }, [points]);

  // Get points by zone (for zone-based analysis)
  const getPointsByZone = useCallback(() => {
    const zones = {
      goalLeft: points.filter(p => p.x < 20),
      leftWing: points.filter(p => p.x >= 20 && p.x < 40),
      center: points.filter(p => p.x >= 40 && p.x < 60),
      rightWing: points.filter(p => p.x >= 60 && p.x < 80),
      goalRight: points.filter(p => p.x >= 80),
    };
    return zones;
  }, [points]);

  return {
    points,
    updatePoint,
    resetPoints,
    loadCustomConfig,
    getStats,
    getPointsByZone,
  };
}

// Generate points for a custom grid configuration
export function generateCustomGrid(rows: number, cols: number): IceDepthPoint[] {
  const points: IceDepthPoint[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xPadding = 8;
      const yPadding = 8;
      const xSpacing = (100 - 2 * xPadding) / Math.max(cols - 1, 1);
      const ySpacing = (100 - 2 * yPadding) / Math.max(rows - 1, 1);
      points.push({
        pointId: `p${row * cols + col + 1}`,
        x: cols === 1 ? 50 : xPadding + col * xSpacing,
        y: rows === 1 ? 50 : yPadding + row * ySpacing,
        depth: null,
        label: `${String.fromCharCode(65 + row)}${col + 1}`,
      });
    }
  }
  return points;
}

export { generatePoints };
