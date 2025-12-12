'use client';

import React, { useState, useCallback } from 'react';

interface RinkMarker {
  id: string;
  x: number;
  y: number;
  type: string;
  description?: string;
}

interface USAHockeyRinkProps {
  markers?: RinkMarker[];
  onAddMarker?: (marker: Omit<RinkMarker, 'id'>) => void;
  onRemoveMarker?: (id: string) => void;
  readOnly?: boolean;
  className?: string;
}

const USAHockeyRink: React.FC<USAHockeyRinkProps> = ({
  markers = [],
  onAddMarker,
  onRemoveMarker,
  readOnly = false,
  className = '',
}) => {
  const [selectedType, setSelectedType] = useState('incident');
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  // Scale: 1 foot = 4 units for precision
  const scale = 4;
  const rinkLength = 200 * scale;
  const rinkWidth = 85 * scale;
  const cornerRadius = 28 * scale;

  // Key measurements
  const goalLineFromBoards = 11 * scale;
  const blueLineFromGoal = 64 * scale;
  const centerX = rinkLength / 2;
  const centerY = rinkWidth / 2;

  // Face-off positions
  const faceoffFromCenter = 22 * scale;
  const neutralFaceoffFromBlue = 5 * scale;
  const endFaceoffFromGoal = 20 * scale;

  // Circle dimensions
  const faceoffCircleRadius = 15 * scale;
  const creaseRadius = 6 * scale;

  // Line widths
  const thinLine = 2;
  const thickLine = scale;

  // Colors
  const redLine = '#c8102e';
  const blueLine = '#003087';
  const creaseBlue = '#a8d4f0';

  // Goal line intersection with corner radius
  const goalLineOffset = cornerRadius - goalLineFromBoards;
  const goalLineIntersectOffset = Math.sqrt(cornerRadius * cornerRadius - goalLineOffset * goalLineOffset);
  const goalLineYTop = cornerRadius - goalLineIntersectOffset;
  const goalLineYBottom = rinkWidth - cornerRadius + goalLineIntersectOffset;

  // Calculated positions
  const leftGoalLine = goalLineFromBoards;
  const rightGoalLine = rinkLength - goalLineFromBoards;
  const leftBlueLine = goalLineFromBoards + blueLineFromGoal;
  const rightBlueLine = rinkLength - goalLineFromBoards - blueLineFromGoal;

  // Face-off spot positions
  const neutralFaceoffX_left = leftBlueLine + neutralFaceoffFromBlue;
  const neutralFaceoffX_right = rightBlueLine - neutralFaceoffFromBlue;
  const endFaceoffX_left = leftGoalLine + endFaceoffFromGoal;
  const endFaceoffX_right = rightGoalLine - endFaceoffFromGoal;
  const faceoffY_top = centerY - faceoffFromCenter;
  const faceoffY_bottom = centerY + faceoffFromCenter;

  // Rink outline path
  const rinkPath = `
    M ${cornerRadius} 0
    L ${rinkLength - cornerRadius} 0
    Q ${rinkLength} 0 ${rinkLength} ${cornerRadius}
    L ${rinkLength} ${rinkWidth - cornerRadius}
    Q ${rinkLength} ${rinkWidth} ${rinkLength - cornerRadius} ${rinkWidth}
    L ${cornerRadius} ${rinkWidth}
    Q 0 ${rinkWidth} 0 ${rinkWidth - cornerRadius}
    L 0 ${cornerRadius}
    Q 0 0 ${cornerRadius} 0
    Z
  `;

  // Marker types with colors
  const markerTypes = {
    incident: { color: '#ef4444', label: 'Incident' },
    maintenance: { color: '#f59e0b', label: 'Maintenance' },
    damage: { color: '#8b5cf6', label: 'Damage' },
    observation: { color: '#3b82f6', label: 'Observation' },
  };

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onAddMarker) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;

    // Calculate click position in SVG coordinates
    const clickX = ((e.clientX - rect.left) / rect.width) * (viewBox.width + 20) - 10;
    const clickY = ((e.clientY - rect.top) / rect.height) * (viewBox.height + 20) - 10;

    // Transform back from rotated coordinates
    // The rink is rotated 90 degrees, so we need to adjust
    const transformedX = clickY;
    const transformedY = rinkWidth - clickX;

    // Check if click is within rink bounds (approximate)
    if (transformedX >= 0 && transformedX <= rinkLength &&
        transformedY >= 0 && transformedY <= rinkWidth) {
      onAddMarker({
        x: transformedX,
        y: transformedY,
        type: selectedType,
      });
    }
  }, [readOnly, onAddMarker, selectedType, rinkLength, rinkWidth]);

  const GoalCrease = ({ x, direction }: { x: number; direction: 'left' | 'right' }) => {
    const creaseHalfWidth = 4 * scale;
    const dir = direction === 'left' ? 1 : -1;
    const sideLineLength = Math.sqrt(creaseRadius * creaseRadius - creaseHalfWidth * creaseHalfWidth);

    return (
      <g>
        <path
          d={`
            M ${x} ${centerY - creaseHalfWidth}
            L ${x + dir * sideLineLength} ${centerY - creaseHalfWidth}
            A ${creaseRadius} ${creaseRadius} 0 0 ${direction === 'left' ? 1 : 0} ${x + dir * sideLineLength} ${centerY + creaseHalfWidth}
            L ${x} ${centerY + creaseHalfWidth}
            Z
          `}
          fill={creaseBlue}
          opacity={0.7}
        />
        <line x1={x} y1={centerY - creaseHalfWidth} x2={x + dir * sideLineLength} y2={centerY - creaseHalfWidth} stroke={redLine} strokeWidth={thinLine} />
        <line x1={x} y1={centerY + creaseHalfWidth} x2={x + dir * sideLineLength} y2={centerY + creaseHalfWidth} stroke={redLine} strokeWidth={thinLine} />
        <path
          d={`M ${x + dir * sideLineLength} ${centerY - creaseHalfWidth} A ${creaseRadius} ${creaseRadius} 0 0 ${direction === 'left' ? 1 : 0} ${x + dir * sideLineLength} ${centerY + creaseHalfWidth}`}
          fill="none"
          stroke={redLine}
          strokeWidth={thinLine}
        />
      </g>
    );
  };

  const GoalNet = ({ x, direction }: { x: number; direction: 'left' | 'right' }) => {
    const goalWidth = 6 * scale / 2;
    const goalDepth = 3.33 * scale;
    const dir = direction === 'left' ? -1 : 1;

    return (
      <g>
        <rect
          x={direction === 'left' ? x + dir * goalDepth : x}
          y={centerY - goalWidth}
          width={goalDepth}
          height={goalWidth * 2}
          fill="none"
          stroke={redLine}
          strokeWidth={3}
        />
        <circle cx={x} cy={centerY - goalWidth} r={2} fill={redLine} />
        <circle cx={x} cy={centerY + goalWidth} r={2} fill={redLine} />
      </g>
    );
  };

  const EndZoneFaceoffCircle = ({ cx, cy }: { cx: number; cy: number }) => {
    const hashLength = 2 * scale;
    const hashDistance = 2 * scale;
    const lShapeLength = 4 * scale;
    const lShapeWidth = 3 * scale;

    return (
      <g>
        <circle cx={cx} cy={cy} r={faceoffCircleRadius} fill="none" stroke={redLine} strokeWidth={thinLine} />
        <circle cx={cx} cy={cy} r={scale} fill={redLine} />

        {[-1, 1].map(side => (
          <g key={`hash-${side}`}>
            <line x1={cx - hashDistance} y1={cy + side * (faceoffCircleRadius + 1)} x2={cx - hashDistance} y2={cy + side * (faceoffCircleRadius + hashLength + 1)} stroke={redLine} strokeWidth={thinLine} />
            <line x1={cx + hashDistance} y1={cy + side * (faceoffCircleRadius + 1)} x2={cx + hashDistance} y2={cy + side * (faceoffCircleRadius + hashLength + 1)} stroke={redLine} strokeWidth={thinLine} />
          </g>
        ))}

        {[-1, 1].map((yDir, i) => (
          <g key={`L-left-${i}`}>
            <line x1={cx - 4} y1={cy + yDir * 8} x2={cx - 4 - lShapeWidth} y2={cy + yDir * 8} stroke={redLine} strokeWidth={thinLine} />
            <line x1={cx - 4} y1={cy + yDir * 8} x2={cx - 4} y2={cy + yDir * (8 + lShapeLength)} stroke={redLine} strokeWidth={thinLine} />
          </g>
        ))}
        {[-1, 1].map((yDir, i) => (
          <g key={`L-right-${i}`}>
            <line x1={cx + 4} y1={cy + yDir * 8} x2={cx + 4 + lShapeWidth} y2={cy + yDir * 8} stroke={redLine} strokeWidth={thinLine} />
            <line x1={cx + 4} y1={cy + yDir * 8} x2={cx + 4} y2={cy + yDir * (8 + lShapeLength)} stroke={redLine} strokeWidth={thinLine} />
          </g>
        ))}
      </g>
    );
  };

  const NeutralFaceoffSpot = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
      <circle cx={cx} cy={cy} r={scale} fill={redLine} />
      <circle cx={cx} cy={cy} r={scale * 1.5} fill="none" stroke={redLine} strokeWidth={thinLine} />
    </g>
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Marker type selector */}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(markerTypes).map(([type, { color, label }]) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                selectedType === type
                  ? 'border-current shadow-sm'
                  : 'border-transparent bg-gray-100 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: selectedType === type ? `${color}20` : undefined,
                color: selectedType === type ? color : undefined,
                borderColor: selectedType === type ? color : undefined,
              }}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Rink SVG */}
      <div className="w-full max-w-2xl mx-auto">
        <svg
          viewBox={`-10 -10 ${rinkWidth + 20} ${rinkLength + 20}`}
          className="w-full h-auto cursor-crosshair"
          onClick={handleSvgClick}
        >
          <defs>
            <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0f7fc" />
              <stop offset="50%" stopColor="#e8f4fc" />
              <stop offset="100%" stopColor="#dceef8" />
            </linearGradient>
          </defs>

          <g transform={`rotate(90, ${rinkWidth / 2}, ${rinkWidth / 2})`}>
            {/* Ice surface */}
            <path d={rinkPath} fill="url(#iceGradient)" />
            <path d={rinkPath} fill="none" stroke="#000000" strokeWidth="6" />

            {/* Goal lines */}
            <line x1={leftGoalLine} y1={goalLineYTop} x2={leftGoalLine} y2={goalLineYBottom} stroke={redLine} strokeWidth={thinLine} />
            <line x1={rightGoalLine} y1={goalLineYTop} x2={rightGoalLine} y2={goalLineYBottom} stroke={redLine} strokeWidth={thinLine} />

            {/* Blue lines */}
            <rect x={leftBlueLine - thickLine / 2} y={0} width={thickLine} height={rinkWidth} fill={blueLine} />
            <rect x={rightBlueLine - thickLine / 2} y={0} width={thickLine} height={rinkWidth} fill={blueLine} />

            {/* Center line */}
            <rect x={centerX - thickLine / 2} y={0} width={thickLine} height={rinkWidth} fill={redLine} />

            {/* Center circle */}
            <circle cx={centerX} cy={centerY} r={faceoffCircleRadius} fill="none" stroke={blueLine} strokeWidth={thinLine} />
            <circle cx={centerX} cy={centerY} r={scale / 2} fill={blueLine} />

            {/* Goal creases */}
            <GoalCrease x={leftGoalLine} direction="left" />
            <GoalCrease x={rightGoalLine} direction="right" />

            {/* Goal nets */}
            <GoalNet x={leftGoalLine} direction="left" />
            <GoalNet x={rightGoalLine} direction="right" />

            {/* End zone faceoff circles */}
            <EndZoneFaceoffCircle cx={endFaceoffX_left} cy={faceoffY_top} />
            <EndZoneFaceoffCircle cx={endFaceoffX_left} cy={faceoffY_bottom} />
            <EndZoneFaceoffCircle cx={endFaceoffX_right} cy={faceoffY_top} />
            <EndZoneFaceoffCircle cx={endFaceoffX_right} cy={faceoffY_bottom} />

            {/* Neutral zone faceoff spots */}
            <NeutralFaceoffSpot cx={neutralFaceoffX_left} cy={faceoffY_top} />
            <NeutralFaceoffSpot cx={neutralFaceoffX_left} cy={faceoffY_bottom} />
            <NeutralFaceoffSpot cx={neutralFaceoffX_right} cy={faceoffY_top} />
            <NeutralFaceoffSpot cx={neutralFaceoffX_right} cy={faceoffY_bottom} />

            {/* Markers */}
            {markers.map((marker) => {
              const markerConfig = markerTypes[marker.type as keyof typeof markerTypes] || markerTypes.observation;
              const isHovered = hoveredMarker === marker.id;

              return (
                <g
                  key={marker.id}
                  onMouseEnter={() => setHoveredMarker(marker.id)}
                  onMouseLeave={() => setHoveredMarker(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly && onRemoveMarker) {
                      onRemoveMarker(marker.id);
                    }
                  }}
                  style={{ cursor: readOnly ? 'default' : 'pointer' }}
                >
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r={isHovered ? 14 : 10}
                    fill={markerConfig.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    opacity={0.9}
                  />
                  <text
                    x={marker.x}
                    y={marker.y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#ffffff"
                    fontWeight="bold"
                  >
                    {markers.indexOf(marker) + 1}
                  </text>
                  {isHovered && marker.description && (
                    <g>
                      <rect
                        x={marker.x + 15}
                        y={marker.y - 10}
                        width={120}
                        height={20}
                        fill="#1f2937"
                        rx={4}
                      />
                      <text
                        x={marker.x + 20}
                        y={marker.y + 4}
                        fontSize="10"
                        fill="#ffffff"
                      >
                        {marker.description.slice(0, 20)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Instructions */}
      {!readOnly && (
        <p className="text-xs text-gray-500 text-center">
          Click on the rink to add a marker. Click on a marker to remove it.
        </p>
      )}

      {/* Markers list */}
      {markers.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Marked Locations ({markers.length})</p>
          <div className="grid grid-cols-2 gap-2">
            {markers.map((marker, index) => {
              const markerConfig = markerTypes[marker.type as keyof typeof markerTypes] || markerTypes.observation;
              return (
                <div
                  key={marker.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: markerConfig.color }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-gray-600">{markerConfig.label}</span>
                  {!readOnly && onRemoveMarker && (
                    <button
                      type="button"
                      onClick={() => onRemoveMarker(marker.id)}
                      className="ml-auto text-gray-400 hover:text-red-500"
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default USAHockeyRink;

export { USAHockeyRink };
export type { RinkMarker, USAHockeyRinkProps };
