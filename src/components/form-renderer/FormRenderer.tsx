'use client';

import { useForm, Controller } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { FormFieldConfig, WeatherData, ConditionalLogic } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import clsx from 'clsx';
import { format } from 'date-fns';

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
              <label className="form-label">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="mt-1">
                <input
                  {...register(field.id, {
                    required: field.isRequired ? `${field.label} is required` : false,
                  })}
                  type="file"
                  accept={field.fieldType === 'PHOTO' ? 'image/*' : undefined}
                  capture={field.fieldType === 'PHOTO' ? 'environment' : undefined}
                  className="block w-full text-sm text-rink-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-ice-50 file:text-ice-700 hover:file:bg-ice-100"
                />
              </div>
              {field.helpText && <p className="form-help">{field.helpText}</p>}
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
