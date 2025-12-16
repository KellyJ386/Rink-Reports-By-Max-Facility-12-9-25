'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { FormBuilder } from '@/components/form-builder';
import { useForm, useUpdateForm, useCreateFormVersion } from '@/hooks';
import { FormFieldConfig } from '@/types';
import { FormCategory } from '@prisma/client';

interface EditFormPageProps {
  params: Promise<{ formId: string }>;
}

export default function EditFormPage({ params }: EditFormPageProps) {
  const { formId } = use(params);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { data: form, isLoading: isLoadingForm, error: fetchError } = useForm(formId);
  const updateFormMutation = useUpdateForm(formId);
  const createVersionMutation = useCreateFormVersion(formId);

  const handleSave = async (data: {
    name: string;
    description?: string;
    category: FormCategory;
    fields: FormFieldConfig[];
  }) => {
    try {
      setError(null);

      // Transform fields to match API format
      const formattedFields = data.fields.map((field, index) => ({
        id: field.id || `field-${Date.now()}-${index}`,
        fieldType: field.fieldType,
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
        isRequired: field.isRequired || false,
        minValue: field.minValue,
        maxValue: field.maxValue,
        minLength: field.minLength,
        maxLength: field.maxLength,
        pattern: field.pattern,
        options: field.options,
        orderIndex: field.orderIndex ?? index,
        sectionId: field.sectionId,
        width: field.width || 'full',
        conditionalLogic: field.conditionalLogic,
        defaultValue: field.defaultValue,
      }));

      await updateFormMutation.mutateAsync({
        name: data.name,
        description: data.description,
        category: data.category,
        fields: formattedFields,
      });

      // Navigate back to forms list on success
      router.push('/admin/forms');
    } catch (err) {
      console.error('Failed to update form:', err);
      setError(err instanceof Error ? err.message : 'Failed to update form');
    }
  };

  const handleSaveVersion = async (data: {
    name: string;
    description?: string;
    category: FormCategory;
    fields: FormFieldConfig[];
    versionType: 'MAJOR' | 'MINOR';
    changeNotes?: string;
  }) => {
    try {
      setError(null);

      // Transform fields to match API format
      const formattedFields = data.fields.map((field, index) => ({
        id: field.id || `field-${Date.now()}-${index}`,
        fieldType: field.fieldType,
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
        isRequired: field.isRequired || false,
        minValue: field.minValue,
        maxValue: field.maxValue,
        minLength: field.minLength,
        maxLength: field.maxLength,
        pattern: field.pattern,
        options: field.options,
        orderIndex: field.orderIndex ?? index,
        sectionId: field.sectionId,
        width: field.width || 'full',
        conditionalLogic: field.conditionalLogic,
        defaultValue: field.defaultValue,
      }));

      // First update the form
      await updateFormMutation.mutateAsync({
        name: data.name,
        description: data.description,
        category: data.category,
        fields: formattedFields,
      });

      // Then create a version snapshot
      await createVersionMutation.mutateAsync({
        versionType: data.versionType,
        changeNotes: data.changeNotes,
      });

      // Navigate back to forms list on success
      router.push('/admin/forms');
    } catch (err) {
      console.error('Failed to save form version:', err);
      setError(err instanceof Error ? err.message : 'Failed to save form version');
    }
  };

  const handleBack = () => {
    router.push('/admin/forms');
  };

  if (isLoadingForm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-600" />
      </div>
    );
  }

  if (fetchError || !form) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <p className="font-medium">Failed to load form</p>
          <p className="text-sm mt-1">{fetchError?.message || 'Form not found'}</p>
          <button
            onClick={() => router.push('/admin/forms')}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Back to forms
          </button>
        </div>
      </div>
    );
  }

  // Transform form data to match FormBuilder's expected format
  const initialData = {
    name: form.name,
    description: form.description || '',
    category: form.category as FormCategory,
    version: form.version,
    fields: form.fields.map((field) => ({
      id: field.id,
      fieldType: field.fieldType as FormFieldConfig['fieldType'],
      label: field.label,
      placeholder: field.placeholder || undefined,
      helpText: field.helpText || undefined,
      isRequired: field.isRequired,
      minValue: field.minValue ?? undefined,
      maxValue: field.maxValue ?? undefined,
      minLength: field.minLength ?? undefined,
      maxLength: field.maxLength ?? undefined,
      pattern: field.pattern || undefined,
      options: field.options as { value: string; label: string }[] | undefined,
      orderIndex: field.orderIndex,
      sectionId: field.sectionId || undefined,
      width: (field.width || 'full') as 'full' | 'half' | 'third',
      conditionalLogic: field.conditionalLogic as FormFieldConfig['conditionalLogic'],
      defaultValue: field.defaultValue || undefined,
    })),
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <FormBuilder
        formId={formId}
        initialData={initialData}
        onSave={handleSave}
        onSaveVersion={handleSaveVersion}
        onBack={handleBack}
      />
    </div>
  );
}
