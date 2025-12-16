'use client';

import { useCallback, useMemo } from 'react';
import { FormTemplate } from '@/hooks';
import {
  CloudIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface FormRendererProps {
  form: FormTemplate;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  readOnly?: boolean;
}

export function FormRenderer({ form, values, onChange, readOnly = false }: FormRendererProps) {
  // Handle field value change
  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      onChange({ ...values, [fieldId]: value });
    },
    [values, onChange]
  );

  // Check if a field should be visible based on conditional logic
  const isFieldVisible = useCallback(
    (field: FormTemplate['fields'][0]) => {
      if (!field.conditionalLogic?.showIf) return true;

      const { fieldId, operator, value } = field.conditionalLogic.showIf;
      const currentValue = values[fieldId];

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
    },
    [values]
  );

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

  const baseInputClass =
    'w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-ice-500 focus:border-ice-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2';

  const renderField = (field: FormTemplate['fields'][0]) => {
    const value = values[field.id] ?? (field.defaultValue || '');
    const disabled = readOnly;

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            disabled={disabled}
            minLength={field.minLength ?? undefined}
            maxLength={field.maxLength ?? undefined}
            pattern={field.pattern ?? undefined}
            className={baseInputClass}
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            disabled={disabled}
            rows={4}
            minLength={field.minLength ?? undefined}
            maxLength={field.maxLength ?? undefined}
            className={`${baseInputClass} resize-none`}
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            value={value === '' ? '' : Number(value)}
            onChange={(e) =>
              handleFieldChange(field.id, e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder={field.placeholder || ''}
            disabled={disabled}
            min={field.minValue ?? undefined}
            max={field.maxValue ?? undefined}
            className={baseInputClass}
          />
        );

      case 'EMAIL':
        return (
          <input
            type="email"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'PHONE':
        return (
          <input
            type="tel"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'TIME':
        return (
          <input
            type="time"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'DATETIME':
        return (
          <input
            type="datetime-local"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'DROPDOWN':
        return (
          <select
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          >
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
          <select
            multiple
            value={Array.isArray(value) ? value.map(String) : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
              handleFieldChange(field.id, selected);
            }}
            disabled={disabled}
            className={`${baseInputClass} h-32`}
          >
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
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  disabled={disabled}
                  className="text-ice-600 focus:ring-ice-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'CHECKBOX':
        const checkboxValues = (Array.isArray(value) ? value : []) as string[];
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checkboxValues.includes(opt.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...checkboxValues, opt.value]
                      : checkboxValues.filter((v) => v !== opt.value);
                    handleFieldChange(field.id, newValues);
                  }}
                  disabled={disabled}
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
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ice-300 dark:peer-focus:ring-ice-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-ice-600 peer-disabled:opacity-50" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
          </label>
        );

      case 'FILE_UPLOAD':
        return (
          <input
            type="file"
            disabled={disabled}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-ice-50 file:text-ice-700 hover:file:bg-ice-100 disabled:opacity-50"
          />
        );

      case 'PHOTO':
        return (
          <input
            type="file"
            accept="image/*"
            disabled={disabled}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-ice-50 file:text-ice-700 hover:file:bg-ice-100 disabled:opacity-50"
          />
        );

      case 'SIGNATURE':
        return (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">Signature capture area</p>
            <p className="text-xs text-gray-400 mt-1">(Interactive in full app)</p>
          </div>
        );

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

      case 'ICE_GRID':
        return (
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 text-center">Ice grid measurement area</p>
            <p className="text-xs text-gray-400 text-center mt-1">(9-point ice depth measurement)</p>
          </div>
        );

      case 'DIVIDER':
        return <hr className="border-gray-200 dark:border-gray-700" />;

      case 'AUTO_USER':
      case 'AUTO_DATE':
      case 'AUTO_FACILITY':
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            Auto-captured from system
          </div>
        );

      case 'SECTION_HEADER':
      case 'INSTRUCTIONAL_TEXT':
        return null;

      default:
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            disabled={disabled}
            className={baseInputClass}
          />
        );
    }
  };

  // Filter visible fields
  const visibleFields = useMemo(() => {
    return form.fields.filter(isFieldVisible);
  }, [form.fields, isFieldVisible]);

  return (
    <div className="space-y-6">
      {/* Auto-captured data indicators */}
      {(form.includeTimestamp || form.includeUser || form.includeFacility || form.includeWeather) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {form.includeTimestamp && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
              <CalendarIcon className="w-3 h-3" />
              Timestamp auto-captured
            </div>
          )}
          {form.includeUser && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
              <UserIcon className="w-3 h-3" />
              User auto-captured
            </div>
          )}
          {form.includeFacility && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
              <BuildingOfficeIcon className="w-3 h-3" />
              Facility auto-captured
            </div>
          )}
          {form.includeWeather && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
              <CloudIcon className="w-3 h-3" />
              Weather auto-captured
            </div>
          )}
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-12 gap-4">
        {visibleFields.map((field) => {
          // Special rendering for section headers
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

          // Instructional text
          if (field.fieldType === 'INSTRUCTIONAL_TEXT') {
            return (
              <div
                key={field.id}
                className="col-span-12 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <p className="text-sm text-blue-700 dark:text-blue-300">{field.label}</p>
              </div>
            );
          }

          // Divider
          if (field.fieldType === 'DIVIDER') {
            return (
              <div key={field.id} className="col-span-12">
                {renderField(field)}
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

          // Standard field with label
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
            </div>
          );
        })}
      </div>

      {visibleFields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No fields to display in this form.</p>
        </div>
      )}
    </div>
  );
}
