'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormTemplate } from '@/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  CheckIcon,
  CloudIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface FormPreviewProps {
  form: FormTemplate;
  onSubmit?: (data: Record<string, unknown>) => void;
}

export function FormPreview({ form, onSubmit }: FormPreviewProps) {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const watchedValues = watch();

  const handleFormSubmit = (data: Record<string, unknown>) => {
    console.log('Form submitted:', data);
    if (onSubmit) {
      onSubmit(data);
    }
    setSubmitted(true);
  };

  // Check if a field should be visible based on conditional logic
  const isFieldVisible = (field: FormTemplate['fields'][0]) => {
    if (!field.conditionalLogic?.showIf) return true;

    const { fieldId, operator, value } = field.conditionalLogic.showIf;
    const currentValue = watchedValues[fieldId];

    switch (operator) {
      case 'equals':
        return currentValue === value;
      case 'not_equals':
        return currentValue !== value;
      case 'contains':
        return String(currentValue).includes(String(value));
      case 'greater_than':
        return Number(currentValue) > Number(value);
      case 'less_than':
        return Number(currentValue) < Number(value);
      default:
        return true;
    }
  };

  const getFieldWidth = (width: string) => {
    switch (width) {
      case 'half':
        return 'col-span-6';
      case 'third':
        return 'col-span-4';
      default:
        return 'col-span-12';
    }
  };

  const renderField = (field: FormTemplate['fields'][0]) => {
    if (!isFieldVisible(field)) return null;

    const baseProps = {
      ...register(field.id, { required: field.isRequired }),
      placeholder: field.placeholder || '',
      className: 'w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-ice-500 focus:border-ice-500',
    };

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            {...baseProps}
            minLength={field.minLength ?? undefined}
            maxLength={field.maxLength ?? undefined}
            pattern={field.pattern ?? undefined}
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            {...baseProps}
            rows={4}
            minLength={field.minLength ?? undefined}
            maxLength={field.maxLength ?? undefined}
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            {...baseProps}
            min={field.minValue ?? undefined}
            max={field.maxValue ?? undefined}
          />
        );

      case 'EMAIL':
        return <input type="email" {...baseProps} />;

      case 'PHONE':
        return <input type="tel" {...baseProps} />;

      case 'DATE':
        return <input type="date" {...baseProps} />;

      case 'TIME':
        return <input type="time" {...baseProps} />;

      case 'DATETIME':
        return <input type="datetime-local" {...baseProps} />;

      case 'DROPDOWN':
        return (
          <select {...baseProps}>
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'MULTI_SELECT':
        return (
          <select {...baseProps} multiple className={`${baseProps.className} h-32`}>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'RADIO':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  {...register(field.id, { required: field.isRequired })}
                  value={opt.value}
                  className="text-ice-600 focus:ring-ice-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register(`${field.id}.${opt.value}`)}
                  className="rounded text-ice-600 focus:ring-ice-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'TOGGLE':
        return (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register(field.id)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ice-300 dark:peer-focus:ring-ice-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-ice-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {field.label}
            </span>
          </label>
        );

      case 'FILE_UPLOAD':
        return (
          <input
            type="file"
            {...register(field.id, { required: field.isRequired })}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-ice-50 file:text-ice-700 hover:file:bg-ice-100"
          />
        );

      case 'PHOTO':
        return (
          <input
            type="file"
            accept="image/*"
            {...register(field.id, { required: field.isRequired })}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-ice-50 file:text-ice-700 hover:file:bg-ice-100"
          />
        );

      case 'SIGNATURE':
        return (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">Signature capture area</p>
            <p className="text-xs text-gray-400 mt-1">(Interactive in full app)</p>
          </div>
        );

      case 'SECTION_HEADER':
        return null;

      case 'INSTRUCTIONAL_TEXT':
        return null;

      case 'BODY_DIAGRAM':
        return (
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 text-center">Body diagram interactive area</p>
            <p className="text-xs text-gray-400 text-center mt-1">(Click to mark injury locations)</p>
          </div>
        );

      case 'RINK_DIAGRAM':
        return (
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 text-center">Rink diagram interactive area</p>
            <p className="text-xs text-gray-400 text-center mt-1">(Click to mark locations)</p>
          </div>
        );

      default:
        return <input type="text" {...baseProps} />;
    }
  };

  if (submitted) {
    return (
      <Card className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Form Submitted Successfully
        </h3>
        <p className="text-gray-500 mb-4">This is a preview - no data was saved.</p>
        <Button onClick={() => setSubmitted(false)}>Submit Another</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{form.name}</h2>
        {form.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">{form.description}</p>
        )}
      </div>

      {/* Auto-captured data indicators */}
      <div className="flex flex-wrap gap-2">
        {form.includeTimestamp && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
            <CalendarIcon className="w-3 h-3" />
            Timestamp
          </div>
        )}
        {form.includeUser && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
            <UserIcon className="w-3 h-3" />
            User
          </div>
        )}
        {form.includeFacility && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
            <BuildingOfficeIcon className="w-3 h-3" />
            Facility
          </div>
        )}
        {form.includeWeather && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
            <CloudIcon className="w-3 h-3" />
            Weather
          </div>
        )}
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-12 gap-4">
          {form.fields.map((field) => {
            if (!isFieldVisible(field)) return null;

            // Special rendering for section headers and instructional text
            if (field.fieldType === 'SECTION_HEADER') {
              return (
                <div key={field.id} className="col-span-12 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    {field.label}
                  </h3>
                  {field.helpText && (
                    <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              );
            }

            if (field.fieldType === 'INSTRUCTIONAL_TEXT') {
              return (
                <div key={field.id} className="col-span-12 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">{field.label}</p>
                </div>
              );
            }

            // Toggle doesn't need a separate label
            if (field.fieldType === 'TOGGLE') {
              return (
                <div key={field.id} className={getFieldWidth(field.width)}>
                  {renderField(field)}
                  {field.helpText && (
                    <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              );
            }

            return (
              <div key={field.id} className={getFieldWidth(field.width)}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label}
                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {field.helpText && (
                  <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                )}
                {errors[field.id] && (
                  <p className="text-xs text-red-500 mt-1">This field is required</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => setSubmitted(false)}>
            Clear
          </Button>
          <Button type="submit">Submit Form</Button>
        </div>
      </form>
    </div>
  );
}
