'use client';

import { useForm, Controller } from 'react-hook-form';
import { useState, useEffect, useRef, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { FormFieldConfig, WeatherData, ConditionalLogic, BodyInjury, IceDepthPoint } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import clsx from 'clsx';
import { format } from 'date-fns';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface FormRendererProps {
  fields: FormFieldConfig[];
  weatherData?: WeatherData;
  facilityName?: string;
  userName?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
}

export function FormRenderer({
  fields,
  weatherData,
  facilityName,
  userName,
  onSubmit,
  isSubmitting = false,
}: FormRendererProps) {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm();
  const [signatureData, setSignatureData] = useState<Record<string, string>>({});
  const signatureRefs = useRef<Record<string, SignatureCanvas | null>>({});

  const formValues = watch();

  // Evaluate conditional logic
  const shouldShowField = (field: FormFieldConfig): boolean => {
    if (!field.conditionalLogic) return true;

    const { showIf } = field.conditionalLogic;
    const dependentValue = formValues[showIf.fieldId];

    switch (showIf.operator) {
      case 'equals':
        return dependentValue === showIf.value;
      case 'not_equals':
        return dependentValue !== showIf.value;
      case 'contains':
        return String(dependentValue || '').includes(String(showIf.value));
      case 'greater_than':
        return Number(dependentValue) > Number(showIf.value);
      case 'less_than':
        return Number(dependentValue) < Number(showIf.value);
      default:
        return true;
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    // Add signature data
    const enrichedData = {
      ...data,
      ...Object.entries(signatureData).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>),
    };

    await onSubmit(enrichedData);
  };

  const clearSignature = (fieldId: string) => {
    signatureRefs.current[fieldId]?.clear();
    setSignatureData((prev) => {
      const newData = { ...prev };
      delete newData[fieldId];
      return newData;
    });
  };

  const saveSignature = (fieldId: string) => {
    const signatureRef = signatureRefs.current[fieldId];
    if (signatureRef && !signatureRef.isEmpty()) {
      setSignatureData((prev) => ({
        ...prev,
        [fieldId]: signatureRef.toDataURL(),
      }));
    }
  };

  const renderField = (field: FormFieldConfig) => {
    if (!shouldShowField(field)) return null;

    const commonProps = {
      id: field.id,
      'aria-required': field.isRequired,
    };

    const widthClass = {
      full: 'col-span-12',
      half: 'col-span-12 sm:col-span-6',
      third: 'col-span-12 sm:col-span-4',
    }[field.width];

    const renderFieldInput = () => {
      switch (field.fieldType) {
        case 'SECTION_HEADER':
          return (
            <div className="col-span-12 pt-6 pb-2">
              <h3 className="text-lg font-semibold text-rink-900 border-b border-rink-200 pb-2">
                {field.label}
              </h3>
              {field.helpText && (
                <p className="text-sm text-rink-500 mt-1">{field.helpText}</p>
              )}
            </div>
          );

        case 'INSTRUCTIONAL_TEXT':
          return (
            <div className="col-span-12">
              <div className="bg-ice-50 border-l-4 border-ice-500 p-4 rounded">
                <p className="text-sm text-rink-700">{field.label}</p>
              </div>
            </div>
          );

        case 'TEXT':
        case 'EMAIL':
        case 'PHONE':
          return (
            <div className={widthClass}>
              <Input
                {...register(field.id, {
                  required: field.isRequired ? `${field.label} is required` : false,
                  minLength: field.minLength ? { value: field.minLength, message: `Minimum ${field.minLength} characters` } : undefined,
                  maxLength: field.maxLength ? { value: field.maxLength, message: `Maximum ${field.maxLength} characters` } : undefined,
                  pattern: field.pattern ? { value: new RegExp(field.pattern), message: 'Invalid format' } : undefined,
                })}
                type={field.fieldType === 'EMAIL' ? 'email' : field.fieldType === 'PHONE' ? 'tel' : 'text'}
                label={field.label}
                placeholder={field.placeholder}
                helperText={field.helpText}
                error={errors[field.id]?.message as string}
                required={field.isRequired}
              />
            </div>
          );

        case 'TEXTAREA':
          return (
            <div className={widthClass}>
              <label className="form-label">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                {...register(field.id, {
                  required: field.isRequired ? `${field.label} is required` : false,
                })}
                className="form-input h-24"
                placeholder={field.placeholder}
              />
              {field.helpText && <p className="form-help">{field.helpText}</p>}
              {errors[field.id] && (
                <p className="form-error">{errors[field.id]?.message as string}</p>
              )}
            </div>
          );

        case 'NUMBER':
          return (
            <div className={widthClass}>
              <Input
                {...register(field.id, {
                  required: field.isRequired ? `${field.label} is required` : false,
                  min: field.minValue ? { value: field.minValue, message: `Minimum value is ${field.minValue}` } : undefined,
                  max: field.maxValue ? { value: field.maxValue, message: `Maximum value is ${field.maxValue}` } : undefined,
                  valueAsNumber: true,
                })}
                type="number"
                label={field.label}
                placeholder={field.placeholder}
                helperText={field.helpText}
                error={errors[field.id]?.message as string}
                required={field.isRequired}
              />
            </div>
          );

        case 'DROPDOWN':
          return (
            <div className={widthClass}>
              <label className="form-label">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                {...register(field.id, {
                  required: field.isRequired ? `${field.label} is required` : false,
                })}
                className="form-input"
              >
                <option value="">{field.placeholder || 'Select an option...'}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {field.helpText && <p className="form-help">{field.helpText}</p>}
            </div>
          );

        case 'MULTI_SELECT':
          return (
            <div className={widthClass}>
              <label className="form-label">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                {...register(field.id)}
                className="form-input"
                multiple
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {field.helpText && <p className="form-help">{field.helpText}</p>}
            </div>
          );

        case 'RADIO':
          return (
            <div className={widthClass}>
              <label className="form-label">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="space-y-2 mt-2">
                {field.options?.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3">
                    <input
                      {...register(field.id, {
                        required: field.isRequired ? `${field.label} is required` : false,
                      })}
                      type="radio"
                      value={opt.value}
                      className="w-4 h-4 text-ice-600 border-rink-300 focus:ring-ice-500"
                    />
                    <span className="text-sm text-rink-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {field.helpText && <p className="form-help">{field.helpText}</p>}
            </div>
          );

        case 'CHECKBOX':
          return (
            <div className={widthClass}>
              <label className="form-label">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="space-y-2 mt-2">
                {field.options?.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3">
                    <input
                      {...register(`${field.id}.${opt.value}`)}
                      type="checkbox"
                      className="w-4 h-4 rounded text-ice-600 border-rink-300 focus:ring-ice-500"
                    />
                    <span className="text-sm text-rink-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {field.helpText && <p className="form-help">{field.helpText}</p>}
            </div>
          );

        case 'TOGGLE':
          return (
            <div className={widthClass}>
              <Controller
                name={field.id}
                control={control}
                defaultValue={false}
                render={({ field: { value, onChange } }) => (
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <label className="text-sm font-medium text-rink-700">
                        {field.label}
                      </label>
                      {field.helpText && (
                        <p className="text-xs text-rink-500">{field.helpText}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onChange(!value)}
                      className={clsx(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        value ? 'bg-ice-600' : 'bg-rink-200'
                      )}
                    >
                      <span
                        className={clsx(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition',
                          value ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                )}
              />
            </div>
          );

        case 'DATE':
          return (
            <div className={widthClass}>
              <Input
                {...register(field.id, {
                  required: field.isRequired ? `${field.label} is required` : false,
                })}
                type="date"
                label={field.label}
                helperText={field.helpText}
                error={errors[field.id]?.message as string}
                required={field.isRequired}
              />
            </div>
          );

        case 'TIME':
          return (
            <div className={widthClass}>
              <Input
                {...register(field.id, {
                  required: field.isRequired ? `${field.label} is required` : false,
                })}
                type="time"
                label={field.label}
                helperText={field.helpText}
                error={errors[field.id]?.message as string}
                required={field.isRequired}
              />
            </div>
          );

        case 'DATETIME':
          return (
            <div className={widthClass}>
              <Input
                {...register(field.id, {
                  required: field.isRequired ? `${field.label} is required` : false,
                })}
                type="datetime-local"
                label={field.label}
                helperText={field.helpText}
                error={errors[field.id]?.message as string}
                required={field.isRequired}
              />
            </div>
          );

        case 'FILE_UPLOAD':
        case 'PHOTO':
          return (
            <div className={widthClass}>
              <Controller
                name={field.id}
                control={control}
                rules={{
                  required: field.isRequired ? `${field.label} is required` : false,
                  validate: (fileList: FileList | null) => {
                    if (!fileList || fileList.length === 0) {
                      return field.isRequired ? `${field.label} is required` : true;
                    }
                    const file = fileList[0];
                    // Size validation (10MB for photos, 25MB for files)
                    const maxSize = field.fieldType === 'PHOTO' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
                    if (file.size > maxSize) {
                      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
                      return `File size exceeds maximum allowed (${maxSizeMB}MB)`;
                    }
                    // Type validation for photos
                    if (field.fieldType === 'PHOTO') {
                      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
                      if (!allowedTypes.includes(file.type)) {
                        return 'Please select a valid image file (JPEG, PNG, GIF, WebP, or HEIC)';
                      }
                    }
                    return true;
                  },
                }}
                render={({ field: { onChange, onBlur, ref } }) => (
                  <div>
                    <label className="form-label">
                      {field.label}
                      {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="mt-1">
                      <input
                        ref={ref}
                        type="file"
                        onChange={(e) => onChange(e.target.files)}
                        onBlur={onBlur}
                        accept={field.fieldType === 'PHOTO' ? 'image/*' : undefined}
                        capture={field.fieldType === 'PHOTO' ? 'environment' : undefined}
                        className="block w-full text-sm text-rink-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-ice-50 file:text-ice-700 hover:file:bg-ice-100"
                      />
                    </div>
                    <p className="text-xs text-rink-400 mt-1">
                      {field.fieldType === 'PHOTO'
                        ? 'Max 10MB. Supported: JPEG, PNG, GIF, WebP, HEIC'
                        : 'Max 25MB. Supported: Images, PDF, Word, Excel, CSV'}
                    </p>
                    {field.helpText && <p className="form-help">{field.helpText}</p>}
                    {errors[field.id] && (
                      <p className="form-error">{errors[field.id]?.message as string}</p>
                    )}
                  </div>
                )}
              />
            </div>
          );

        case 'SIGNATURE':
          return (
            <div className={widthClass}>
              <label className="form-label">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="mt-1 border-2 border-rink-300 rounded-lg overflow-hidden bg-white">
                <SignatureCanvas
                  ref={(ref) => {
                    signatureRefs.current[field.id] = ref;
                  }}
                  canvasProps={{
                    className: 'w-full h-32',
                  }}
                  onEnd={() => saveSignature(field.id)}
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSignature(field.id)}
                >
                  Clear
                </Button>
              </div>
              {field.helpText && <p className="form-help">{field.helpText}</p>}
            </div>
          );

        case 'BODY_DIAGRAM':
          return (
            <div className="col-span-12">
              <Controller
                name={field.id}
                control={control}
                defaultValue={[]}
                rules={{
                  validate: (value) => {
                    if (field.isRequired && (!value || value.length === 0)) {
                      return `${field.label} requires at least one injury marked`;
                    }
                    return true;
                  },
                }}
                render={({ field: { value, onChange } }) => (
                  <BodyDiagramField
                    label={field.label}
                    helpText={field.helpText}
                    isRequired={field.isRequired}
                    injuries={value || []}
                    onChange={onChange}
                    error={errors[field.id]?.message as string}
                  />
                )}
              />
            </div>
          );

        case 'RINK_DIAGRAM':
          return (
            <div className="col-span-12">
              <Controller
                name={field.id}
                control={control}
                defaultValue={[]}
                rules={{
                  validate: (value) => {
                    if (field.isRequired && (!value || value.length === 0)) {
                      return `${field.label} requires at least one point marked`;
                    }
                    return true;
                  },
                }}
                render={({ field: { value, onChange } }) => (
                  <RinkDiagramField
                    label={field.label}
                    helpText={field.helpText}
                    isRequired={field.isRequired}
                    points={value || []}
                    onChange={onChange}
                    error={errors[field.id]?.message as string}
                  />
                )}
              />
            </div>
          );

        default:
          return null;
      }
    };

    return renderFieldInput();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Auto-populated Header */}
      <div className="bg-rink-50 rounded-lg p-4 border border-rink-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-rink-500">Timestamp:</span>
            <span className="ml-2 text-rink-900 font-medium">
              {format(new Date(), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          <div>
            <span className="text-rink-500">User:</span>
            <span className="ml-2 text-rink-900 font-medium">
              {userName || 'Current User'}
            </span>
          </div>
          <div>
            <span className="text-rink-500">Facility:</span>
            <span className="ml-2 text-rink-900 font-medium">
              {facilityName || 'Current Facility'}
            </span>
          </div>
          {weatherData && (
            <div>
              <span className="text-rink-500">Weather:</span>
              <span className="ml-2 text-rink-900 font-medium">
                {weatherData.temperature}°F, {weatherData.humidity}% humidity
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-12 gap-4">
        {fields
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((field) => (
            <div key={field.id}>{renderField(field)}</div>
          ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-rink-200">
        <Button type="submit" isLoading={isSubmitting}>
          Submit Form
        </Button>
      </div>
    </form>
  );
}

// ============================================
// BODY DIAGRAM FIELD COMPONENT
// ============================================

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

interface BodyDiagramFieldProps {
  label: string;
  helpText?: string;
  isRequired: boolean;
  injuries: BodyInjury[];
  onChange: (injuries: BodyInjury[]) => void;
  error?: string;
}

function BodyDiagramField({
  label,
  helpText,
  isRequired,
  injuries,
  onChange,
  error,
}: BodyDiagramFieldProps) {
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [description, setDescription] = useState('');

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
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

      const newInjury: BodyInjury = {
        id: `injury-${Date.now()}`,
        bodyPart: nearestPart.label,
        x: selectedPoint.x,
        y: selectedPoint.y,
        description: description.trim(),
      };

      onChange([...injuries, newInjury]);
      setSelectedPoint(null);
      setDescription('');
    }
  };

  const handleRemoveInjury = (id: string) => {
    onChange(injuries.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-4">
      <label className="form-label">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Body Diagram SVG */}
        <div className="relative bg-rink-50 rounded-lg p-4">
          <svg
            viewBox="0 0 100 100"
            className="w-full max-w-xs mx-auto cursor-crosshair"
            onClick={handleSvgClick}
          >
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
            <path d="M35 23 L65 23 L68 50 L60 55 L40 55 L32 50 Z" fill="url(#skinGradient)" stroke="#d97706" strokeWidth="0.5" />
            {/* Arms */}
            <path d="M35 23 L28 25 L20 50 L25 52 L33 30" fill="url(#skinGradient)" stroke="#d97706" strokeWidth="0.5" />
            <path d="M65 23 L72 25 L80 50 L75 52 L67 30" fill="url(#skinGradient)" stroke="#d97706" strokeWidth="0.5" />
            {/* Pelvis */}
            <path d="M40 55 L60 55 L62 62 L38 62 Z" fill="url(#skinGradient)" stroke="#d97706" strokeWidth="0.5" />
            {/* Legs */}
            <path d="M38 62 L45 62 L44 95 L36 95 Z" fill="url(#skinGradient)" stroke="#d97706" strokeWidth="0.5" />
            <path d="M55 62 L62 62 L64 95 L56 95 Z" fill="url(#skinGradient)" stroke="#d97706" strokeWidth="0.5" />

            {/* Existing injuries */}
            {injuries.map((injury) => (
              <g key={injury.id}>
                <circle cx={injury.x} cy={injury.y} r="3" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" className="animate-pulse" />
                <text x={injury.x} y={injury.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="2.5" fontWeight="bold" fill="white">!</text>
              </g>
            ))}

            {/* Selected point */}
            {selectedPoint && (
              <circle cx={selectedPoint.x} cy={selectedPoint.y} r="4" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2,1" className="animate-pulse" />
            )}
          </svg>
          <p className="text-center text-sm text-rink-500 mt-2">
            Click on the diagram to mark injury location
          </p>
        </div>

        {/* Injury Input / List */}
        <div className="space-y-4">
          {selectedPoint && (
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
                  <Button type="button" onClick={handleAddInjury} disabled={!description.trim()}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Injury
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setSelectedPoint(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Injury List */}
          <div>
            <h4 className="font-medium text-rink-900 mb-2">Recorded Injuries ({injuries.length})</h4>
            {injuries.length === 0 ? (
              <p className="text-sm text-rink-500 py-4 text-center bg-rink-50 rounded-lg">
                No injuries marked yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {injuries.map((injury) => (
                  <div key={injury.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-3 h-3 mt-1 bg-red-500 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-rink-900">{injury.bodyPart}</p>
                      <p className="text-sm text-rink-600">{injury.description}</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveInjury(injury.id)} className="p-1 text-rink-400 hover:text-red-600 rounded">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {helpText && <p className="form-help">{helpText}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

// ============================================
// RINK DIAGRAM FIELD COMPONENT
// ============================================

interface RinkPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  value?: number | null;
  description?: string;
}

interface RinkDiagramFieldProps {
  label: string;
  helpText?: string;
  isRequired: boolean;
  points: RinkPoint[];
  onChange: (points: RinkPoint[]) => void;
  error?: string;
}

function RinkDiagramField({
  label,
  helpText,
  isRequired,
  points,
  onChange,
  error,
}: RinkDiagramFieldProps) {
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [pointLabel, setPointLabel] = useState('');
  const [pointDescription, setPointDescription] = useState('');

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSelectedPoint({ x, y });
  };

  const handleAddPoint = () => {
    if (selectedPoint && pointLabel.trim()) {
      const newPoint: RinkPoint = {
        id: `point-${Date.now()}`,
        x: selectedPoint.x,
        y: selectedPoint.y,
        label: pointLabel.trim(),
        description: pointDescription.trim() || undefined,
      };

      onChange([...points, newPoint]);
      setSelectedPoint(null);
      setPointLabel('');
      setPointDescription('');
    }
  };

  const handleRemovePoint = (id: string) => {
    onChange(points.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <label className="form-label">
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rink Diagram SVG */}
        <div className="relative bg-rink-50 rounded-lg p-4">
          <svg
            viewBox="0 0 100 50"
            className="w-full cursor-crosshair"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
            onClick={handleSvgClick}
          >
            <defs>
              <linearGradient id="iceGradientField" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="50%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#e0f2fe" />
              </linearGradient>
            </defs>

            {/* Rink outline */}
            <rect x="1" y="1" width="98" height="48" rx="10" ry="10" fill="url(#iceGradientField)" stroke="#0369a1" strokeWidth="0.5" />
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

            {/* Existing points */}
            {points.map((point, idx) => (
              <g key={point.id}>
                <circle cx={point.x} cy={point.y} r="2.5" fill="#0ea5e9" stroke="white" strokeWidth="0.3" />
                <text x={point.x} y={point.y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="1.5" fontWeight="bold" fill="white">
                  {idx + 1}
                </text>
              </g>
            ))}

            {/* Selected point */}
            {selectedPoint && (
              <circle cx={selectedPoint.x} cy={selectedPoint.y} r="3" fill="none" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="1,0.5" className="animate-pulse" />
            )}
          </svg>
          <p className="text-center text-sm text-rink-500 mt-2">
            Click on the rink to mark a location
          </p>
        </div>

        {/* Point Input / List */}
        <div className="space-y-4">
          {selectedPoint && (
            <div className="p-4 bg-ice-50 border border-ice-200 rounded-lg">
              <h4 className="font-medium text-rink-900 mb-3">Add Location Details</h4>
              <div className="space-y-3">
                <Input
                  label="Label"
                  value={pointLabel}
                  onChange={(e) => setPointLabel(e.target.value)}
                  placeholder="e.g., Incident location, damage area..."
                  required
                />
                <Input
                  label="Description (optional)"
                  value={pointDescription}
                  onChange={(e) => setPointDescription(e.target.value)}
                  placeholder="Additional details..."
                />
                <div className="flex gap-2">
                  <Button type="button" onClick={handleAddPoint} disabled={!pointLabel.trim()}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Point
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setSelectedPoint(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Points List */}
          <div>
            <h4 className="font-medium text-rink-900 mb-2">Marked Locations ({points.length})</h4>
            {points.length === 0 ? (
              <p className="text-sm text-rink-500 py-4 text-center bg-rink-50 rounded-lg">
                No locations marked yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {points.map((point, idx) => (
                  <div key={point.id} className="flex items-start gap-3 p-3 bg-ice-50 border border-ice-200 rounded-lg">
                    <div className="w-6 h-6 bg-ice-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-rink-900">{point.label}</p>
                      {point.description && (
                        <p className="text-sm text-rink-600">{point.description}</p>
                      )}
                    </div>
                    <button type="button" onClick={() => handleRemovePoint(point.id)} className="p-1 text-rink-400 hover:text-red-600 rounded">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {helpText && <p className="form-help">{helpText}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
