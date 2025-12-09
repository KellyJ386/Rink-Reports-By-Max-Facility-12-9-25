'use client';

import { useRouter } from 'next/navigation';
import { FormBuilder } from '@/components/form-builder';
import { FormFieldConfig } from '@/types';
import { FormCategory } from '@prisma/client';

export default function NewFormPage() {
  const router = useRouter();

  const handleSave = async (data: {
    name: string;
    description?: string;
    category: FormCategory;
    fields: FormFieldConfig[];
  }) => {
    // TODO: Save to database via API
    console.log('Saving form:', data);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate back to forms list
    router.push('/admin/forms');
  };

  const handleBack = () => {
    router.push('/admin/forms');
  };

  return <FormBuilder onSave={handleSave} onBack={handleBack} />;
}
