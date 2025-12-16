'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useForm, useCreateSubmission } from '@/hooks/useFormSubmissions';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  CloudIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface FormValues {
  [key: string]: string | number | boolean | string[];
}

export default function FormFillPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const { data: form, isLoading: isLoadingForm, error } = useForm(formId);
  const createSubmission = useCreateSubmission(formId);

  const [formValues, setFormValues] = useState<FormValues>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [weatherData, setWeatherData] = useState<{
    temperature?: number;
    humidity?: number;
    conditions?: string;
  } | null>(null);

  // Initialize form with default values
  useEffect(() => {
    if (form?.fields) {
      const defaults: FormValues = {};
      form.fields.forEach((field) => {
        if (field.defaultValue) {
          defaults[field.id] = field.defaultValue;
        } else if (field.fieldType === 'CHECKBOX' || field.fieldType === 'TOGGLE') {
          defaults[field.id] = false;
        } else if (field.fieldType === 'MULTI_SELECT') {
          defaults[field.id] = [];
        } else {
          defaults[field.id] = '';
        }
      });
      setFormValues(defaults);
    }
  }, [form]);

  // Simulated weather fetch (would use real API in production)
  useEffect(() => {
    if (form?.includeWeather) {
      setWeatherData({
        temperature: 28,
        humidity: 65,
        conditions: 'Partly Cloudy',
      });
    }
  }, [form?.includeWeather]);

  // Check conditional logic visibility
  const isFieldVisible = (fieldId: string): boolean => {
    const field = form?.fields.find((f) => f.id === fieldId);
    if (!field?.conditionalLogic) return true;

    const { fieldId: conditionFieldId, operator, value } = field.conditionalLogic.showIf;
    const conditionValue = formValues[conditionFieldId];

    switch (operator) {
      case 'equals':
        return conditionValue === value;
      case 'not_equals':
        return conditionValue !== value;
      case 'contains':
        return typeof conditionValue === 'string' && conditionValue.includes(value as string);
      case 'greater_than':
        return Number(conditionValue) > Number(value);
      case 'less_than':
        return Number(conditionValue) < Number(value);
      default:
        return true;
    }
  };

  // Get visible fields
  const visibleFields = useMemo(() => {
    return form?.fields.filter((f) => isFieldVisible(f.id)) || [];
  }, [form?.fields, formValues]);

  const handleInputChange = (fieldId: string, value: string | number | boolean | string[]) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear validation error when field changes
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    visibleFields.forEach((field) => {
      const value = formValues[field.id];

      // Check required
      if (field.isRequired) {
        if (value === undefined || value === null || value === '') {
          errors[field.id] = `${field.label} is required`;
          return;
        }
        if (Array.isArray(value) && value.length === 0) {
          errors[field.id] = `${field.label} is required`;
          return;
        }
      }

      // Skip further validation if empty and not required
      if (value === undefined || value === null || value === '') return;

      // Number validation
      if (typeof value === 'number' || field.fieldType === 'NUMBER') {
        const numValue = Number(value);
        if (field.minValue !== null && field.minValue !== undefined && numValue < field.minValue) {
          errors[field.id] = `Must be at least ${field.minValue}`;
        }
        if (field.maxValue !== null && field.maxValue !== undefined && numValue > field.maxValue) {
          errors[field.id] = `Must be at most ${field.maxValue}`;
        }
      }

      // String validation
      if (typeof value === 'string') {
        if (field.minLength !== null && field.minLength !== undefined && value.length < field.minLength) {
          errors[field.id] = `Must be at least ${field.minLength} characters`;
        }
        if (field.maxLength !== null && field.maxLength !== undefined && value.length > field.maxLength) {
          errors[field.id] = `Must be at most ${field.maxLength} characters`;
        }
        if (field.pattern) {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            errors[field.id] = 'Invalid format';
          }
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Build submission data with only visible fields
      const submissionData: Record<string, unknown> = {};
      visibleFields.forEach((field) => {
        submissionData[field.id] = formValues[field.id];
      });

      await createSubmission.mutateAsync({
        data: submissionData,
        weatherData: weatherData || undefined,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit form:', err);
    }
  };

  if (isLoadingForm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-600" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <Card className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <DocumentTextIcon className="w-16 h-16 text-rink-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-rink-900 mb-2">Form Not Found</h2>
          <p className="text-rink-500 mb-6">
            The form you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/dashboard/forms')}>
            Back to Forms
          </Button>
        </div>
      </Card>
    );
  }

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-rink-900 mb-2">Submission Successful!</h2>
          <p className="text-rink-500 mb-6">
            Your {form.name} has been submitted successfully.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="secondary" onClick={() => {
              setIsSubmitted(false);
              setFormValues({});
            }}>
              Submit Another
            </Button>
            <Button onClick={() => router.push('/dashboard/forms')}>
              Back to Forms
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Render a field based on its type
  const renderField = (field: typeof form.fields[0]) => {
    const value = formValues[field.id];
    const error = validationErrors[field.id];

    const commonProps = {
      id: field.id,
      label: field.label + (field.isRequired ? ' *' : ''),
      placeholder: field.placeholder || undefined,
      error,
      helperText: field.helpText || undefined,
    };

    switch (field.fieldType) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
        return (
          <Input
            {...commonProps}
            type={field.fieldType.toLowerCase()}
            value={value as string || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );

      case 'NUMBER':
        return (
          <Input
            {...commonProps}
            type="number"
            step="any"
            min={field.minValue ?? undefined}
            max={field.maxValue ?? undefined}
            value={value as string || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );

      case 'TEXTAREA':
        return (
          <div>
            <label className="form-label">
              {field.label}{field.isRequired && ' *'}
            </label>
            <textarea
              className={`form-input h-24 ${error ? 'border-red-500' : ''}`}
              placeholder={field.placeholder || ''}
              value={value as string || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              maxLength={field.maxLength ?? undefined}
            />
            {field.helpText && <p className="text-xs text-rink-500 mt-1">{field.helpText}</p>}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'DATE':
        return (
          <Input
            {...commonProps}
            type="date"
            value={value as string || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );

      case 'TIME':
        return (
          <Input
            {...commonProps}
            type="time"
            value={value as string || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );

      case 'DATETIME':
        return (
          <Input
            {...commonProps}
            type="datetime-local"
            value={value as string || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );

      case 'DROPDOWN':
        return (
          <div>
            <label className="form-label">
              {field.label}{field.isRequired && ' *'}
            </label>
            <select
              className={`form-input ${error ? 'border-red-500' : ''}`}
              value={value as string || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            >
              <option value="">{field.placeholder || 'Select an option...'}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {field.helpText && <p className="text-xs text-rink-500 mt-1">{field.helpText}</p>}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'RADIO':
        return (
          <div>
            <label className="form-label">
              {field.label}{field.isRequired && ' *'}
            </label>
            <div className="space-y-2">
              {field.options?.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="text-ice-600"
                  />
                  <span className="text-sm text-rink-700">{opt.label}</span>
                </label>
              ))}
            </div>
            {field.helpText && <p className="text-xs text-rink-500 mt-1">{field.helpText}</p>}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'CHECKBOX':
      case 'TOGGLE':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value as boolean || false}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="w-5 h-5 text-ice-600 rounded"
            />
            <span className="text-sm text-rink-700">
              {field.label}{field.isRequired && ' *'}
            </span>
          </label>
        );

      case 'SECTION_HEADER':
        return (
          <div className="pt-4 pb-2 border-b border-rink-200">
            <h3 className="text-lg font-semibold text-rink-900">{field.label}</h3>
            {field.helpText && (
              <p className="text-sm text-rink-500 mt-1">{field.helpText}</p>
            )}
          </div>
        );

      case 'INSTRUCTIONAL_TEXT':
        return (
          <div className="p-4 bg-ice-50 rounded-lg border border-ice-200">
            <p className="text-sm text-rink-700">{field.helpText || field.label}</p>
          </div>
        );

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            value={value as string || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
    }
  };

  // Width classes
  const widthClasses = {
    full: 'col-span-12',
    half: 'col-span-12 md:col-span-6',
    third: 'col-span-12 md:col-span-4',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/forms')}
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-rink-900">{form.name}</h1>
          {form.description && (
            <p className="text-rink-500 mt-1">{form.description}</p>
          )}
        </div>
        <Badge className="ml-auto">{form.category.replace('_', ' ')}</Badge>
      </div>

      {/* Weather Info */}
      {form.includeWeather && weatherData && (
        <Card className="flex items-center gap-4 p-4">
          <CloudIcon className="w-8 h-8 text-ice-500" />
          <div>
            <p className="text-sm font-medium text-rink-700">Current Weather</p>
            <p className="text-rink-500">
              {weatherData.temperature}°F | {weatherData.humidity}% Humidity | {weatherData.conditions}
            </p>
          </div>
        </Card>
      )}

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-4">
            {visibleFields.map((field) => (
              <div key={field.id} className={widthClasses[field.width]}>
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* Error Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </p>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {Object.values(validationErrors).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Error */}
          {createSubmission.error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {createSubmission.error instanceof Error
                  ? createSubmission.error.message
                  : 'Failed to submit form'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/dashboard/forms')}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createSubmission.isPending}>
              Submit Form
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
