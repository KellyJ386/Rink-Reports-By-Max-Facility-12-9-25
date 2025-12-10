'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormBuilder } from '@/components/form-builder';
import { useCreateForm, useFacilities } from '@/hooks';
import { FormFieldConfig } from '@/types';
import { FormCategory } from '@prisma/client';

export default function NewFormPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const createFormMutation = useCreateForm();
  const { data: facilities } = useFacilities();

  // Get first facility as default (in a real app, this would come from context/session)
  const defaultFacilityId = facilities?.[0]?.id;

  const handleSave = async (data: {
    name: string;
    description?: string;
    category: FormCategory;
    fields: FormFieldConfig[];
  }) => {
    if (!defaultFacilityId) {
      setError('No facility available. Please create a facility first.');
      return;
    }

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

      await createFormMutation.mutateAsync({
        facilityId: defaultFacilityId,
        name: data.name,
        description: data.description,
        category: data.category,
        fields: formattedFields,
        includeWeather: true,
        includeTimestamp: true,
        includeUser: true,
        includeFacility: true,
      });

      // Navigate back to forms list on success
      router.push('/admin/forms');
    } catch (err) {
      console.error('Failed to create form:', err);
      setError(err instanceof Error ? err.message : 'Failed to create form');
    }
  };

  const handleBack = () => {
    router.push('/admin/forms');
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
        onSave={handleSave}
        onBack={handleBack}
        isLoading={createFormMutation.isPending}
      />
    </div>
  );
}
