'use client';

import { useState, useCallback, useRef } from 'react';
import { IceDepthPoint, CustomDiagramConfig } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface CustomDiagramEditorProps {
  initialConfig?: CustomDiagramConfig;
  onSave: (config: CustomDiagramConfig) => void;
  onCancel: () => void;
}

// Preset templates
const PRESET_TEMPLATES = {
  '25-point': {
    name: '25-Point Standard',
    description: 'Standard 5x5 grid pattern',
    rinkType: 'standard' as const,
    dimensions: { length: 200, width: 85 },
    points: generateGridPoints(5, 5),
  },
  '35-point': {
    name: '35-Point Extended',
    description: 'Extended 5x7 grid pattern',
    rinkType: 'standard' as const,
    dimensions: { length: 200, width: 85 },
    points: generateGridPoints(5, 7),
  },
  '47-point': {
    name: '47-Point NHL',
    description: 'NHL-style with extra goal area points',
    rinkType: 'standard' as const,
    dimensions: { length: 200, width: 85 },
    points: generateNHLPoints(),
  },
  'olympic': {
    name: 'Olympic Rink',
    description: 'Olympic size rink (200x100)',
    rinkType: 'olympic' as const,
    dimensions: { length: 200, width: 100 },
    points: generateGridPoints(5, 7),
  },
  'curling': {
    name: 'Curling Sheet',
    description: 'Curling sheet layout',
    rinkType: 'curling' as const,
    dimensions: { length: 150, width: 16 },
    points: generateCurlingPoints(),
  },
};

function generateGridPoints(rows: number, cols: number): IceDepthPoint[] {
  const points: IceDepthPoint[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xPadding = 10;
      const yPadding = 10;
      const xSpacing = (100 - 2 * xPadding) / (cols - 1);
      const ySpacing = (100 - 2 * yPadding) / (rows - 1);
      points.push({
        pointId: `p${row * cols + col + 1}`,
        x: xPadding + col * xSpacing,
        y: yPadding + row * ySpacing,
        depth: null,
        label: `${String.fromCharCode(65 + row)}${col + 1}`,
      });
    }
  }
  return points;
}

function generateNHLPoints(): IceDepthPoint[] {
  const points: IceDepthPoint[] = [];
  let idx = 1;

  // Center line points
  for (let i = 0; i < 5; i++) {
    points.push({
      pointId: `center${i + 1}`,
      x: 50,
      y: 10 + i * 20,
      depth: null,
      label: `C${i + 1}`,
    });
    idx++;
  }

  // Goal crease areas (extra points)
  ['L', 'R'].forEach((side, sideIdx) => {
    const x = sideIdx === 0 ? 15 : 85;
    for (let i = 0; i < 3; i++) {
      points.push({
        pointId: `goal${side}${i + 1}`,
        x,
        y: 35 + i * 15,
        depth: null,
        label: `G${side}${i + 1}`,
      });
      idx++;
    }
  });

  // Regular grid around the rink
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      if (col !== 3) {
        points.push({
          pointId: `p${idx}`,
          x: 7 + col * 14.3,
          y: 10 + row * 20,
          depth: null,
          label: `${String.fromCharCode(65 + row)}${col < 3 ? col + 1 : col}`,
        });
        idx++;
      }
    }
  }

  return points.slice(0, 47);
}

function generateCurlingPoints(): IceDepthPoint[] {
  const points: IceDepthPoint[] = [];
  // Curling has a long narrow sheet - measure along the length
  for (let i = 0; i < 15; i++) {
    points.push({
      pointId: `c${i + 1}`,
      x: 5 + i * 6.4,
      y: 50,
      depth: null,
      label: `${i + 1}`,
    });
  }
  return points;
}

export function CustomDiagramEditor({
  initialConfig,
  onSave,
  onCancel,
}: CustomDiagramEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [config, setConfig] = useState<Partial<CustomDiagramConfig>>(
    initialConfig || {
      name: '',
      description: '',
      rinkType: 'standard',
      dimensions: { length: 200, width: 85 },
      points: [],
    }
  );
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editMode, setEditMode] = useState<'select' | 'add' | 'delete'>('select');

  // Convert SVG coordinates to percentage
  const getSvgCoordinates = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
  }, []);

  // Add a new point
  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: IceDepthPoint = {
      pointId: `custom_${Date.now()}`,
      x,
      y,
      depth: null,
      label: `P${(config.points?.length || 0) + 1}`,
    };
    setConfig((prev) => ({
      ...prev,
      points: [...(prev.points || []), newPoint],
    }));
  }, [config.points?.length]);

  // Delete a point
  const deletePoint = useCallback((pointId: string) => {
    setConfig((prev) => ({
      ...prev,
      points: prev.points?.filter((p) => p.pointId !== pointId) || [],
    }));
    setSelectedPointId(null);
  }, []);

  // Update point position
  const updatePointPosition = useCallback((pointId: string, x: number, y: number) => {
    setConfig((prev) => ({
      ...prev,
      points: prev.points?.map((p) =>
        p.pointId === pointId ? { ...p, x, y } : p
      ) || [],
    }));
  }, []);

  // Update point label
  const updatePointLabel = useCallback((pointId: string, label: string) => {
    setConfig((prev) => ({
      ...prev,
      points: prev.points?.map((p) =>
        p.pointId === pointId ? { ...p, label } : p
      ) || [],
    }));
  }, []);

  // Handle SVG click
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (editMode === 'add') {
      const coords = getSvgCoordinates(e);
      addPoint(coords.x, coords.y);
    }
  }, [editMode, getSvgCoordinates, addPoint]);

  // Handle point drag
  const handlePointDrag = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging && selectedPointId && editMode === 'select') {
      const coords = getSvgCoordinates(e);
      updatePointPosition(selectedPointId, coords.x, coords.y);
    }
  }, [isDragging, selectedPointId, editMode, getSvgCoordinates, updatePointPosition]);

  // Load preset template
  const loadPreset = useCallback((presetKey: keyof typeof PRESET_TEMPLATES) => {
    const preset = PRESET_TEMPLATES[presetKey];
    setConfig((prev) => ({
      ...prev,
      name: prev.name || preset.name,
      description: prev.description || preset.description,
      rinkType: preset.rinkType,
      dimensions: preset.dimensions,
      points: preset.points.map((p) => ({ ...p })),
    }));
  }, []);

  // Clear all points
  const clearPoints = useCallback(() => {
    setConfig((prev) => ({ ...prev, points: [] }));
    setSelectedPointId(null);
  }, []);

  // Save configuration
  const handleSave = useCallback(() => {
    if (!config.name || !config.points?.length) {
      alert('Please provide a name and add at least one measurement point.');
      return;
    }

    const finalConfig: CustomDiagramConfig = {
      id: initialConfig?.id || `diagram_${Date.now()}`,
      name: config.name,
      description: config.description,
      rinkType: config.rinkType || 'custom',
      dimensions: config.dimensions || { length: 200, width: 85 },
      points: config.points,
      createdAt: initialConfig?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(finalConfig);
  }, [config, initialConfig, onSave]);

  const selectedPoint = config.points?.find((p) => p.pointId === selectedPointId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Configuration */}
      <Card>
        <CardHeader title="Diagram Configuration" />
        <CardContent className="space-y-4">
          <div>
            <label className="form-label">Diagram Name *</label>
            <Input
              value={config.name || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="My Custom Diagram"
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <Input
              value={config.description || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Length (ft)</label>
              <Input
                type="number"
                value={config.dimensions?.length || 200}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    dimensions: { ...prev.dimensions!, length: parseInt(e.target.value) || 200 },
                  }))
                }
              />
            </div>
            <div>
              <label className="form-label">Width (ft)</label>
              <Input
                type="number"
                value={config.dimensions?.width || 85}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    dimensions: { ...prev.dimensions!, width: parseInt(e.target.value) || 85 },
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="form-label">Rink Type</label>
            <select
              value={config.rinkType || 'standard'}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, rinkType: e.target.value as CustomDiagramConfig['rinkType'] }))
              }
              className="input"
            >
              <option value="standard">Standard (NHL)</option>
              <option value="olympic">Olympic</option>
              <option value="recreational">Recreational</option>
              <option value="curling">Curling</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="form-label">Load Preset Template</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PRESET_TEMPLATES).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => loadPreset(key as keyof typeof PRESET_TEMPLATES)}
                  className="p-2 text-xs border rounded-lg hover:bg-rink-50 text-left"
                >
                  <span className="font-medium">{preset.name}</span>
                  <span className="block text-rink-500">{preset.points.length} points</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-rink-600 mb-2">
              <strong>{config.points?.length || 0}</strong> measurement points
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={clearPoints}>
                <TrashIcon className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Center - Diagram Editor */}
      <Card className="lg:col-span-2">
        <CardHeader
          title="Diagram Editor"
          description="Click to add points, drag to reposition"
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode('select')}
                className={clsx(
                  'px-3 py-1 text-sm rounded-lg',
                  editMode === 'select' ? 'bg-ice-500 text-white' : 'bg-rink-100'
                )}
              >
                Select
              </button>
              <button
                onClick={() => setEditMode('add')}
                className={clsx(
                  'px-3 py-1 text-sm rounded-lg',
                  editMode === 'add' ? 'bg-green-500 text-white' : 'bg-rink-100'
                )}
              >
                <PlusIcon className="w-4 h-4 inline mr-1" />
                Add
              </button>
              <button
                onClick={() => setEditMode('delete')}
                className={clsx(
                  'px-3 py-1 text-sm rounded-lg',
                  editMode === 'delete' ? 'bg-red-500 text-white' : 'bg-rink-100'
                )}
              >
                <TrashIcon className="w-4 h-4 inline mr-1" />
                Delete
              </button>
            </div>
          }
        />
        <CardContent>
          <div className="relative w-full aspect-[2/1] bg-gradient-to-b from-sky-100 to-sky-200 rounded-lg overflow-hidden">
            <svg
              ref={svgRef}
              viewBox="0 0 100 50"
              className="w-full h-full cursor-crosshair"
              onClick={handleSvgClick}
              onMouseMove={handlePointDrag}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {/* Rink outline */}
              <rect
                x="1"
                y="1"
                width="98"
                height="48"
                rx="10"
                ry="10"
                fill="none"
                stroke="#0369a1"
                strokeWidth="0.5"
                strokeDasharray="2,1"
              />

              {/* Center line */}
              <line x1="50" y1="1" x2="50" y2="49" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="1,1" />

              {/* Grid lines for reference */}
              {[25, 75].map((x) => (
                <line key={`v${x}`} x1={x} y1="1" x2={x} y2="49" stroke="#94a3b8" strokeWidth="0.2" strokeDasharray="1,2" />
              ))}
              {[12.5, 25, 37.5].map((y) => (
                <line key={`h${y}`} x1="1" y1={y} x2="99" y2={y} stroke="#94a3b8" strokeWidth="0.2" strokeDasharray="1,2" />
              ))}

              {/* Measurement points */}
              {config.points?.map((point) => {
                const isSelected = point.pointId === selectedPointId;
                return (
                  <g
                    key={point.pointId}
                    className={clsx(
                      'cursor-pointer transition-transform',
                      editMode === 'delete' && 'hover:opacity-50'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editMode === 'delete') {
                        deletePoint(point.pointId);
                      } else {
                        setSelectedPointId(point.pointId);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (editMode === 'select') {
                        setSelectedPointId(point.pointId);
                        setIsDragging(true);
                      }
                    }}
                  >
                    {isSelected && (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="3.5"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="0.4"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="2"
                      fill={isSelected ? '#0ea5e9' : '#22c55e'}
                      stroke="white"
                      strokeWidth="0.3"
                    />
                    {point.label && (
                      <text
                        x={point.x}
                        y={point.y + 0.5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="1.2"
                        fontWeight="bold"
                        fill="white"
                      >
                        {point.label.substring(0, 2)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Instructions overlay */}
            {(config.points?.length || 0) === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="bg-white/90 rounded-lg px-6 py-4 text-center">
                  <p className="text-rink-600 font-medium">No measurement points</p>
                  <p className="text-sm text-rink-500 mt-1">
                    Click "Add" mode and click on the rink to add points,<br />
                    or load a preset template.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Selected point editor */}
          {selectedPoint && editMode === 'select' && (
            <div className="mt-4 p-4 bg-rink-50 rounded-lg">
              <h4 className="font-medium text-rink-900 mb-3">Edit Point: {selectedPoint.label || selectedPoint.pointId}</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label text-xs">Label</label>
                  <Input
                    value={selectedPoint.label || ''}
                    onChange={(e) => updatePointLabel(selectedPoint.pointId, e.target.value)}
                    placeholder="A1"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">X Position (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={selectedPoint.x.toFixed(1)}
                    onChange={(e) =>
                      updatePointPosition(selectedPoint.pointId, parseFloat(e.target.value) || 0, selectedPoint.y)
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Y Position (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={selectedPoint.y.toFixed(1)}
                    onChange={(e) =>
                      updatePointPosition(selectedPoint.pointId, selectedPoint.x, parseFloat(e.target.value) || 0)
                    }
                    className="text-sm"
                  />
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => deletePoint(selectedPoint.pointId)}
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                Delete Point
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <CheckIcon className="w-4 h-4 mr-1" />
              Save Diagram
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
