'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type UserRole = 'STAFF' | 'MANAGER' | 'FACILITY_ADMIN' | 'SUPER_ADMIN';

export interface RecurringForm {
  id: string;
  facilityId: string;
  formTemplateId: string;
  frequency: RecurringFrequency;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  timeOfDay: string;
  assignedRole: UserRole | null;
  assignedUserId: string | null;
  reminderEnabled: boolean;
  reminderMinutes: number;
  dueInHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  formTemplate?: {
    id: string;
    name: string;
    category: string;
    isActive: boolean;
    facility?: { id: string; name: string };
  };
  assignedUser?: { id: string; name: string; email: string } | null;
  assignedRoleUsers?: Array<{ id: string; name: string; email: string }>;
}

export interface CreateRecurringFormInput {
  facilityId: string;
  formTemplateId: string;
  frequency: RecurringFrequency;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  timeOfDay?: string;
  assignedRole?: UserRole;
  assignedUserId?: string;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
  dueInHours?: number;
  isActive?: boolean;
}

export interface UpdateRecurringFormInput {
  frequency?: RecurringFrequency;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  timeOfDay?: string;
  assignedRole?: UserRole | null;
  assignedUserId?: string | null;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
  dueInHours?: number;
  isActive?: boolean;
}

export interface RecurringFormFilters {
  facilityId?: string;
  formTemplateId?: string;
  isActive?: boolean;
}

// Fetch recurring forms
async function fetchRecurringForms(filters: RecurringFormFilters): Promise<RecurringForm[]> {
  const params = new URLSearchParams();
  if (filters.facilityId) params.set('facilityId', filters.facilityId);
  if (filters.formTemplateId) params.set('formTemplateId', filters.formTemplateId);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));

  const res = await fetch(`/api/forms/recurring?${params}`);
  if (!res.ok) throw new Error('Failed to fetch recurring forms');
  const json = await res.json();
  return json.data;
}

// Fetch single recurring form
async function fetchRecurringForm(id: string): Promise<RecurringForm> {
  const res = await fetch(`/api/forms/recurring/${id}`);
  if (!res.ok) throw new Error('Failed to fetch recurring form');
  const json = await res.json();
  return json.data;
}

// Create recurring form
async function createRecurringForm(input: CreateRecurringFormInput): Promise<RecurringForm> {
  const res = await fetch('/api/forms/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create recurring form');
  }
  const json = await res.json();
  return json.data;
}

// Update recurring form
async function updateRecurringForm(
  id: string,
  input: UpdateRecurringFormInput
): Promise<RecurringForm> {
  const res = await fetch(`/api/forms/recurring/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update recurring form');
  }
  const json = await res.json();
  return json.data;
}

// Delete recurring form
async function deleteRecurringForm(id: string): Promise<void> {
  const res = await fetch(`/api/forms/recurring/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete recurring form');
  }
}

// Hooks

export function useRecurringForms(filters: RecurringFormFilters = {}) {
  return useQuery({
    queryKey: ['recurringForms', filters],
    queryFn: () => fetchRecurringForms(filters),
    staleTime: 60000,
  });
}

export function useRecurringForm(id: string | undefined) {
  return useQuery({
    queryKey: ['recurringForm', id],
    queryFn: () => fetchRecurringForm(id!),
    enabled: !!id,
    staleTime: 60000,
  });
}

export function useCreateRecurringForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecurringForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringForms'] });
    },
  });
}

export function useUpdateRecurringForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateRecurringFormInput & { id: string }) =>
      updateRecurringForm(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringForms'] });
      queryClient.invalidateQueries({ queryKey: ['recurringForm'] });
    },
  });
}

export function useDeleteRecurringForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecurringForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringForms'] });
    },
  });
}

// Helper functions

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  CUSTOM: 'Custom',
};

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_FULL_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatScheduleDescription(form: RecurringForm): string {
  const time = formatTime24to12(form.timeOfDay);

  switch (form.frequency) {
    case 'DAILY':
      return `Daily at ${time}`;
    case 'WEEKLY':
      if (form.daysOfWeek.length === 7) {
        return `Every day at ${time}`;
      }
      if (form.daysOfWeek.length === 5 &&
          !form.daysOfWeek.includes(0) &&
          !form.daysOfWeek.includes(6)) {
        return `Weekdays at ${time}`;
      }
      const days = form.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ');
      return `Weekly on ${days} at ${time}`;
    case 'MONTHLY':
      const suffix = getOrdinalSuffix(form.dayOfMonth || 1);
      return `Monthly on the ${form.dayOfMonth}${suffix} at ${time}`;
    case 'CUSTOM':
      return `Custom schedule at ${time}`;
    default:
      return 'Unknown schedule';
  }
}

function formatTime24to12(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function getNextOccurrence(form: RecurringForm): Date | null {
  const now = new Date();
  const [hours, minutes] = form.timeOfDay.split(':').map(Number);

  switch (form.frequency) {
    case 'DAILY': {
      const next = new Date();
      next.setHours(hours, minutes, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }
    case 'WEEKLY': {
      if (form.daysOfWeek.length === 0) return null;
      const today = now.getDay();
      const sortedDays = [...form.daysOfWeek].sort((a, b) => a - b);

      for (const day of sortedDays) {
        if (day > today || (day === today && hours > now.getHours()) ||
            (day === today && hours === now.getHours() && minutes > now.getMinutes())) {
          const diff = day - today;
          const next = new Date();
          next.setDate(now.getDate() + diff);
          next.setHours(hours, minutes, 0, 0);
          return next;
        }
      }

      // Wrap to next week
      const firstDay = sortedDays[0];
      const diff = 7 - today + firstDay;
      const next = new Date();
      next.setDate(now.getDate() + diff);
      next.setHours(hours, minutes, 0, 0);
      return next;
    }
    case 'MONTHLY': {
      if (!form.dayOfMonth) return null;
      const next = new Date();
      next.setDate(form.dayOfMonth);
      next.setHours(hours, minutes, 0, 0);

      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    }
    default:
      return null;
  }
}
