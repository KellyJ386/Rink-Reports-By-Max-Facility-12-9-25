'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface FormField {
  id: string;
  fieldType: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  minValue?: number | null;
  maxValue?: number | null;
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: string | null;
  options?: Array<{ value: string; label: string }> | null;
  orderIndex: number;
  sectionId?: string | null;
  width: 'full' | 'half' | 'third';
  conditionalLogic?: {
    showIf: {
      fieldId: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: string | number | boolean;
    };
  } | null;
  defaultValue?: string | null;
}

export interface FormTemplate {
  id: string;
  facilityId: string;
  name: string;
  description?: string;
  category: string;
  isPublished: boolean;
  isActive: boolean;
  version: number;
  includeWeather: boolean;
  includeTimestamp: boolean;
  includeUser: boolean;
  includeFacility: boolean;
  fields: FormField[];
  facility?: {
    id: string;
    name: string;
    slug: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    submissions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmission {
  id: string;
  formTemplateId: string;
  submittedById: string;
  facilityId: string;
  formVersion: number;
  data: Record<string, unknown>;
  weatherData?: {
    temperature?: number;
    humidity?: number;
    conditions?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  submittedAt: string;
  submittedBy?: {
    id: string;
    name: string;
    email: string;
  };
  facility?: {
    id: string;
    name: string;
  };
  formTemplate?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface SubmissionInput {
  data: Record<string, unknown>;
  weatherData?: {
    temperature?: number;
    humidity?: number;
    conditions?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

// Fetch forms
async function fetchForms(params?: {
  facilityId?: string;
  category?: string;
  published?: boolean;
}): Promise<FormTemplate[]> {
  const searchParams = new URLSearchParams();
  if (params?.facilityId) searchParams.append('facilityId', params.facilityId);
  if (params?.category) searchParams.append('category', params.category);
  if (params?.published !== undefined) searchParams.append('published', params.published.toString());

  const response = await fetch(`/api/forms?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch forms');
  }
  const data = await response.json();
  return data.data;
}

// Fetch single form
async function fetchForm(formId: string): Promise<FormTemplate> {
  const response = await fetch(`/api/forms/${formId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch form');
  }
  const data = await response.json();
  return data.data;
}

// Fetch submissions for a form
async function fetchSubmissions(
  formId: string,
  params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    userId?: string;
  }
): Promise<{
  submissions: FormSubmission[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.startDate) searchParams.append('startDate', params.startDate);
  if (params?.endDate) searchParams.append('endDate', params.endDate);
  if (params?.userId) searchParams.append('userId', params.userId);

  const response = await fetch(`/api/forms/${formId}/submissions?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch submissions');
  }
  const data = await response.json();
  return {
    submissions: data.data,
    pagination: data.pagination,
  };
}

// Create submission
async function createSubmission(
  formId: string,
  input: SubmissionInput
): Promise<FormSubmission> {
  const response = await fetch(`/api/forms/${formId}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create submission');
  }

  const data = await response.json();
  return data.data;
}

// ========== Hooks ==========

// Hook to fetch all forms
export function useForms(params?: {
  facilityId?: string;
  category?: string;
  published?: boolean;
}) {
  return useQuery({
    queryKey: ['forms', params],
    queryFn: () => fetchForms(params),
    staleTime: 60000, // 1 minute
  });
}

// Hook to fetch a single form
export function useForm(formId: string) {
  return useQuery({
    queryKey: ['forms', formId],
    queryFn: () => fetchForm(formId),
    enabled: !!formId,
    staleTime: 30000,
  });
}

// Hook to fetch submissions for a form
export function useFormSubmissions(
  formId: string,
  params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    userId?: string;
  }
) {
  return useQuery({
    queryKey: ['formSubmissions', formId, params],
    queryFn: () => fetchSubmissions(formId, params),
    enabled: !!formId,
    staleTime: 30000,
  });
}

// Hook to create a submission
export function useCreateSubmission(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmissionInput) => createSubmission(formId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formSubmissions', formId] });
      queryClient.invalidateQueries({ queryKey: ['forms', formId] });
    },
  });
}

// Hook to get all submissions across forms (for dashboard)
export function useAllSubmissions(params?: {
  page?: number;
  limit?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['allSubmissions', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.category) searchParams.append('category', params.category);
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);

      const response = await fetch(`/api/forms/submissions?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 30000,
  });
}
