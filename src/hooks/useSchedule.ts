'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Shift {
  id: string;
  userId: string;
  userName?: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  position?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  notes?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  schedule?: {
    id: string;
    name: string;
    status: string;
    facility: {
      id: string;
      name: string;
    };
  };
}

interface ShiftFilters {
  scheduleId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

interface CreateShiftData {
  scheduleId: string;
  userId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  position?: string;
  notes?: string;
}

interface UpdateShiftData extends Partial<CreateShiftData> {
  id: string;
  status?: Shift['status'];
}

// Fetch shifts with optional filters
async function fetchShifts(filters: ShiftFilters = {}): Promise<Shift[]> {
  const params = new URLSearchParams();
  if (filters.scheduleId) params.append('scheduleId', filters.scheduleId);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`/api/schedules/shifts?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch shifts');
  }
  const data = await response.json();
  return data.data;
}

// Create a new shift
async function createShift(shiftData: CreateShiftData): Promise<Shift> {
  const response = await fetch('/api/schedules/shifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create shift');
  }

  const data = await response.json();
  return data.data;
}

// Update a shift
async function updateShift(shiftData: UpdateShiftData): Promise<Shift> {
  const { id, ...data } = shiftData;
  const response = await fetch(`/api/schedules/shifts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update shift');
  }

  const result = await response.json();
  return result.data;
}

// Delete a shift
async function deleteShift(shiftId: string): Promise<void> {
  const response = await fetch(`/api/schedules/shifts/${shiftId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete shift');
  }
}

// Move shift to a new date
async function moveShift(shiftId: string, newDate: string): Promise<Shift> {
  const response = await fetch(`/api/schedules/shifts/${shiftId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newDate }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to move shift');
  }

  const data = await response.json();
  return data.data;
}

// Hook to fetch shifts
export function useShifts(filters: ShiftFilters = {}) {
  return useQuery({
    queryKey: ['shifts', filters],
    queryFn: () => fetchShifts(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Hook to create a shift
export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

// Hook to update a shift
export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

// Hook to delete a shift
export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

// Hook to move a shift
export function useMoveShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shiftId, newDate }: { shiftId: string; newDate: string }) =>
      moveShift(shiftId, newDate),
    onMutate: async ({ shiftId, newDate }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shifts'] });

      // Snapshot the previous value
      const previousShifts = queryClient.getQueryData(['shifts']);

      // Optimistically update to the new value
      queryClient.setQueryData(['shifts'], (old: Shift[] | undefined) => {
        if (!old) return old;
        return old.map((shift) =>
          shift.id === shiftId
            ? {
                ...shift,
                shiftDate: newDate,
                startTime: `${newDate}T${shift.startTime.split('T')[1]}`,
                endTime: `${newDate}T${shift.endTime.split('T')[1]}`,
              }
            : shift
        );
      });

      return { previousShifts };
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.previousShifts) {
        queryClient.setQueryData(['shifts'], context.previousShifts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

// ========== Schedule Management ==========

export interface Schedule {
  id: string;
  facilityId: string;
  name: string;
  weekStarting: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  publishedById?: string;
  createdAt: string;
  updatedAt: string;
  facility?: {
    id: string;
    name: string;
  };
}

// Fetch schedules
async function fetchSchedules(facilityId?: string): Promise<Schedule[]> {
  const params = facilityId ? `?facilityId=${facilityId}` : '';
  const response = await fetch(`/api/schedules${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch schedules');
  }

  const data = await response.json();
  return data.data;
}

// Create schedule
async function createSchedule(data: {
  facilityId: string;
  name: string;
  weekStarting: string;
}): Promise<Schedule> {
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create schedule');
  }

  const result = await response.json();
  return result.data;
}

// Publish schedule
async function publishSchedule(scheduleId: string): Promise<Schedule> {
  const response = await fetch(`/api/schedules/${scheduleId}/publish`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to publish schedule');
  }

  const result = await response.json();
  return result.data;
}

// Hook to fetch schedules
export function useSchedules(facilityId?: string) {
  return useQuery({
    queryKey: ['schedules', facilityId],
    queryFn: () => fetchSchedules(facilityId),
    staleTime: 60000, // 1 minute
  });
}

// Hook to create a schedule
export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

// Hook to publish a schedule
export function usePublishSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

// ========== Time-Off Requests ==========

export interface TimeOffRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  reviewedById?: string;
  reviewedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Fetch time-off requests
async function fetchTimeOffRequests(status?: string): Promise<TimeOffRequest[]> {
  const params = status ? `?status=${status}` : '';
  const response = await fetch(`/api/schedules/time-off${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch time-off requests');
  }

  const data = await response.json();
  return data.data;
}

// Review time-off request
async function reviewTimeOffRequest(data: {
  requestId: string;
  action: 'approve' | 'deny';
  notes?: string;
}): Promise<TimeOffRequest> {
  const response = await fetch(`/api/schedules/time-off/${data.requestId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: data.action, notes: data.notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to review request');
  }

  const result = await response.json();
  return result.data;
}

// Hook to fetch time-off requests
export function useTimeOffRequests(status?: string) {
  return useQuery({
    queryKey: ['timeOffRequests', status],
    queryFn: () => fetchTimeOffRequests(status),
    staleTime: 30000,
  });
}

// Hook to review time-off request
export function useReviewTimeOff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOffRequests'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}
