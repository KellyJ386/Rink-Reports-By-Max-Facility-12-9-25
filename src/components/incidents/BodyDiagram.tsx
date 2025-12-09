'use client';

import { useState } from 'react';
import { BodyInjury } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface BodyDiagramProps {
  injuries: BodyInjury[];
  onAddInjury: (injury: BodyInjury) => void;
  onRemoveInjury: (id: string) => void;
  readOnly?: boolean;
}

const bodyParts: Record<string, { x: number; y: number; label: string }> = {
  head: { x: 50, y: 8, label: 'Head' },
  neck: { x: 50, y: 15, label: 'Neck' },
  leftShoulder: { x: 35, y: 20, label: 'Left Shoulder' },
  rightShoulder: { x: 65, y: 20, label: 'Right Shoulder' },
  leftArm: { x: 25, y: 35, label: 'Left Arm' },
  rightArm: { x: 75, y: 35, label: 'Right Arm' },
  chest: { x: 50, y: 30, label: 'Chest' },
  abdomen: { x: 50, y: 42, label: 'Abdomen' },
  leftHand: { x: 18, y: 50, label: 'Left Hand' },
  rightHand: { x: 82, y: 50, label: 'Right Hand' },
  leftHip: { x: 40, y: 52, label: 'Left Hip' },
  rightHip: { x: 60, y: 52, label: 'Right Hip' },
  leftThigh: { x: 40, y: 65, label: 'Left Thigh' },
  rightThigh: { x: 60, y: 65, label: 'Right Thigh' },
  leftKnee: { x: 40, y: 75, label: 'Left Knee' },
  rightKnee: { x: 60, y: 75, label: 'Right Knee' },
  leftLeg: { x: 40, y: 85, label: 'Left Leg' },
  rightLeg: { x: 60, y: 85, label: 'Right Leg' },
  leftFoot: { x: 40, y: 95, label: 'Left Foot' },
  rightFoot: { x: 60, y: 95, label: 'Right Foot' },
};

export function BodyDiagram({ injuries, onAddInjury, onRemoveInjury, readOnly = false }: BodyDiagramProps) {
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [description, setDescription] = useState('');

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Find closest body part
    let closestPart = '';
    let minDistance = Infinity;

    Object.entries(bodyParts).forEach(([key, value]) => {
      const distance = Math.sqrt(Math.pow(x - value.x, 2) + Math.pow(y - value.y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestPart = key;
      }
    });

    if (minDistance < 15) {
      setSelectedPoint({ x: bodyParts[closestPart].x, y: bodyParts[closestPart].y });
    } else {
      setSelectedPoint({ x, y });
    }
  };

  const handleAddInjury = () => {
    if (selectedPoint && description.trim()) {
      const nearestPart = Object.entries(bodyParts).reduce(
        (nearest, [key, value]) => {
          const distance = Math.sqrt(
            Math.pow(selectedPoint.x - value.x, 2) + Math.pow(selectedPoint.y - value.y, 2)
          );
          if (distance < nearest.distance) {
            return { key, distance, label: value.label };
          }
          return nearest;
        },
        { key: 'other', distance: Infinity, label: 'Other' }
      );

      onAddInjury({
        id: `injury-${Date.now()}`,
        bodyPart: nearestPart.label,
        x: selectedPoint.x,
        y: selectedPoint.y,
        description: description.trim(),
      });

      setSelectedPoint(null);
      setDescription('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Body Diagram */}
        <div className="relative bg-rink-50 rounded-lg p-4">
          <svg
            viewBox="0 0 100 100"
            className="w-full max-w-xs mx-auto cursor-crosshair"
            onClick={handleSvgClick}
          >
            {/* Body outline - front view */}
            <defs>
              <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="50%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>
            </defs>

            {/* Head */}
            <ellipse cx="50" cy="10" rx="8" ry="9" fill="url(#skinGradient)" stroke="#d97706" strokeWidth="0.5" />

            {/* Neck */}
            <rect x="46" y="18" width="8" height="5" fill="url(#skinGradient)" stroke="#d97706" strokeWidth="0.5" />

            {/* Torso */}
            <path
              d="M35 23 L65 23 L68 50 L60 55 L40 55 L32 50 Z"
              fill="url(#skinGradient)"
              stroke="#d97706"
              strokeWidth="0.5"
            />

            {/* Arms */}
            <path
              d="M35 23 L28 25 L20 50 L25 52 L33 30"
              fill="url(#skinGradient)"
              stroke="#d97706"
              strokeWidth="0.5"
            />
            <path
              d="M65 23 L72 25 L80 50 L75 52 L67 30"
              fill="url(#skinGradient)"
              stroke="#d97706"
              strokeWidth="0.5"
            />

            {/* Pelvis/Hips */}
            <path
              d="M40 55 L60 55 L62 62 L38 62 Z"
              fill="url(#skinGradient)"
              stroke="#d97706"
              strokeWidth="0.5"
            />

            {/* Left Leg */}
            <path
              d="M38 62 L45 62 L44 95 L36 95 Z"
              fill="url(#skinGradient)"
              stroke="#d97706"
              strokeWidth="0.5"
            />

            {/* Right Leg */}
            <path
              d="M55 62 L62 62 L64 95 L56 95 Z"
              fill="url(#skinGradient)"
              stroke="#d97706"
              strokeWidth="0.5"
            />

            {/* Existing injuries */}
            {injuries.map((injury) => (
              <g key={injury.id}>
                <circle
                  cx={injury.x}
                  cy={injury.y}
                  r="3"
                  fill="#ef4444"
                  stroke="#b91c1c"
                  strokeWidth="0.5"
                  className="animate-pulse"
                />
                <text
                  x={injury.x}
                  y={injury.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2.5"
                  fontWeight="bold"
                  fill="white"
                >
                  !
                </text>
              </g>
            ))}

            {/* Selected point */}
            {selectedPoint && (
              <circle
                cx={selectedPoint.x}
                cy={selectedPoint.y}
                r="4"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="1"
                strokeDasharray="2,1"
                className="animate-pulse"
              />
            )}
          </svg>

          {!readOnly && (
            <p className="text-center text-sm text-rink-500 mt-2">
              Click on the diagram to mark injury location
            </p>
          )}
        </div>

        {/* Injury Input / List */}
        <div className="space-y-4">
          {!readOnly && selectedPoint && (
            <div className="p-4 bg-ice-50 border border-ice-200 rounded-lg">
              <h4 className="font-medium text-rink-900 mb-3">Add Injury Details</h4>
              <div className="space-y-3">
                <Input
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the injury..."
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddInjury} disabled={!description.trim()}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Injury
                  </Button>
                  <Button variant="secondary" onClick={() => setSelectedPoint(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Injury List */}
          <div>
            <h4 className="font-medium text-rink-900 mb-2">
              Recorded Injuries ({injuries.length})
            </h4>
            {injuries.length === 0 ? (
              <p className="text-sm text-rink-500 py-4 text-center bg-rink-50 rounded-lg">
                No injuries marked yet
              </p>
            ) : (
              <div className="space-y-2">
                {injuries.map((injury) => (
                  <div
                    key={injury.id}
                    className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="w-3 h-3 mt-1 bg-red-500 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-rink-900">{injury.bodyPart}</p>
                      <p className="text-sm text-rink-600">{injury.description}</p>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => onRemoveInjury(injury.id)}
                        className="p-1 text-rink-400 hover:text-red-600 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
