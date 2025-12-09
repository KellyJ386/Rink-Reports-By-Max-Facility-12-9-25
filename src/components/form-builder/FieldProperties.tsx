'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormFieldConfig, FormFieldOption } from '@/types';
import { FieldType } from '@prisma/client';
import clsx from 'clsx';

interface FieldPropertiesProps {
  field: FormFieldConfig | null;
  onUpdate: (field: FormFieldConfig) => void;
  onClose: () => void;
}

const fieldTypeLabels: Record<FieldType, string> = {
  TEXT: 'Text Input',
  TEXTAREA: 'Text Area',
  NUMBER: 'Number',
  EMAIL: 'Email',
  PHONE: 'Phone',
  DROPDOWN: 'Dropdown',
  MULTI_SELECT: 'Multi-Select',
  RADIO: 'Radio Buttons',
  CHECKBOX: 'Checkboxes',
  TOGGLE: 'Toggle Switch',
  DATE: 'Date Picker',
  TIME: 'Time Picker',
  DATETIME: 'Date & Time',
  FILE_UPLOAD: 'File Upload',
  PHOTO: 'Photo Upload',
  SIGNATURE: 'Digital Signature',
  SECTION_HEADER: 'Section Header',
  INSTRUCTIONAL_TEXT: 'Instructions',
  BODY_DIAGRAM: 'Body Diagram',
  RINK_DIAGRAM: 'Rink Diagram',
};

const fieldTypesWithOptions: FieldType[] = ['DROPDOWN', 'MULTI_SELECT', 'RADIO', 'CHECKBOX'];
const fieldTypesWithValidation: FieldType[] = ['TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'PHONE'];

export function FieldProperties({ field, onUpdate, onClose }: FieldPropertiesProps) {
  const { register, watch, setValue, handleSubmit, reset } = useForm<FormFieldConfig>({
    defaultValues: field || undefined,
  });

  useEffect(() => {
    if (field) {
      reset(field);
    }
  }, [field, reset]);

  if (!field) {
    return (
      <div className="w-80 bg-white border-l border-rink-200 p-6 flex items-center justify-center">
        <p className="text-rink-500 text-center">
          Select a field to edit its properties
        </p>
      </div>
    );
  }

  const hasOptions = fieldTypesWithOptions.includes(field.fieldType);
  const hasValidation = fieldTypesWithValidation.includes(field.fieldType);
  const isNumeric = field.fieldType === 'NUMBER';
  const options = watch('options') || [];

  const onSubmit = (data: FormFieldConfig) => {
    onUpdate({ ...field, ...data });
  };

  const addOption = () => {
    const newOptions = [...options, { value: `option${options.length + 1}`, label: `Option ${options.length + 1}` }];
    setValue('options', newOptions);
    onUpdate({ ...field, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setValue('options', newOptions);
    onUpdate({ ...field, options: newOptions });
  };

  const updateOption = (index: number, key: 'value' | 'label', value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [key]: value };
    setValue('options', newOptions);
    onUpdate({ ...field, options: newOptions });
  };

  return (
    <div className="w-80 bg-white border-l border-rink-200 overflow-y-auto h-full">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-rink-200 p-4 flex items-center justify-between z-10">
        <div>
          <h3 className="font-semibold text-rink-900">Field Properties</h3>
          <p className="text-xs text-rink-500">{fieldTypeLabels[field.fieldType]}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-rink-400 hover:text-rink-600 rounded"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onBlur={handleSubmit(onSubmit)} className="p-4 space-y-4">
        {/* Basic Properties */}
        <div>
          <Input
            label="Label"
            {...register('label')}
            placeholder="Enter field label"
          />
        </div>

        {field.fieldType !== 'SECTION_HEADER' && field.fieldType !== 'INSTRUCTIONAL_TEXT' && (
          <>
            <div>
              <Input
                label="Placeholder"
                {...register('placeholder')}
                placeholder="Enter placeholder text"
              />
            </div>

            <div>
              <Input
                label="Help Text"
                {...register('helpText')}
                placeholder="Additional instructions"
              />
            </div>
          </>
        )}

        {/* Required Toggle */}
        {field.fieldType !== 'SECTION_HEADER' && field.fieldType !== 'INSTRUCTIONAL_TEXT' && (
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium text-rink-700">Required</label>
            <button
              type="button"
              onClick={() => {
                const newValue = !watch('isRequired');
                setValue('isRequired', newValue);
                onUpdate({ ...field, isRequired: newValue });
              }}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                watch('isRequired') ? 'bg-ice-600' : 'bg-rink-200'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition',
                  watch('isRequired') ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        )}

        {/* Width */}
        <div>
          <label className="form-label">Field Width</label>
          <div className="grid grid-cols-3 gap-2">
            {(['full', 'half', 'third'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setValue('width', w);
                  onUpdate({ ...field, width: w });
                }}
                className={clsx(
                  'py-2 text-sm font-medium rounded-lg border transition-colors',
                  watch('width') === w
                    ? 'border-ice-500 bg-ice-50 text-ice-700'
                    : 'border-rink-200 text-rink-600 hover:border-rink-300'
                )}
              >
                {w === 'full' ? '100%' : w === 'half' ? '50%' : '33%'}
              </button>
            ))}
          </div>
        </div>

        {/* Options for selection fields */}
        {hasOptions && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Options</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOption}
                leftIcon={<PlusIcon className="w-4 h-4" />}
              >
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-rink-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {options.length === 0 && (
                <p className="text-sm text-rink-400 text-center py-2">
                  No options added yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Validation for input fields */}
        {hasValidation && (
          <div className="space-y-4 pt-4 border-t border-rink-200">
            <h4 className="text-sm font-medium text-rink-700">Validation</h4>

            {isNumeric ? (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Min Value"
                  type="number"
                  {...register('minValue', { valueAsNumber: true })}
                />
                <Input
                  label="Max Value"
                  type="number"
                  {...register('maxValue', { valueAsNumber: true })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Min Length"
                  type="number"
                  {...register('minLength', { valueAsNumber: true })}
                />
                <Input
                  label="Max Length"
                  type="number"
                  {...register('maxLength', { valueAsNumber: true })}
                />
              </div>
            )}

            <Input
              label="Pattern (Regex)"
              {...register('pattern')}
              placeholder="e.g., ^[A-Za-z]+$"
            />
          </div>
        )}

        {/* Default Value */}
        {field.fieldType !== 'SECTION_HEADER' &&
         field.fieldType !== 'INSTRUCTIONAL_TEXT' &&
         field.fieldType !== 'SIGNATURE' &&
         field.fieldType !== 'FILE_UPLOAD' &&
         field.fieldType !== 'PHOTO' && (
          <div className="pt-4 border-t border-rink-200">
            <Input
              label="Default Value"
              {...register('defaultValue')}
              placeholder="Enter default value"
            />
          </div>
        )}
      </form>
    </div>
  );
}
