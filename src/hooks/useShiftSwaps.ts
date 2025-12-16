'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  originalShiftId: string;
  targetShiftId: string | null;
  targetUserId: string | null;
  status: SwapStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedSwapRequest extends ShiftSwapRequest {
  originalShift: {
    id: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    position: string | null;
    status: string;
    user: { id: string; name: string; email: string };
    schedule: {
      id: string;
      name: string;
      facility: { id: string; name: string };
    };
  };
  targetShift: {
    id: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    position: string | null;
    status: string;
    user: { id: string; name: string; email: string };
    schedule: { id: string; name: string };
  } | null;
  requester: { id: string; name: string; email: string };
  targetUser: { id: string; name: string; email: string } | null;
  reviewer: { id: string; name: string } | null;
}

export type SwapStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED' | 'EXPIRED';

export interface CreateSwapInput {
  originalShiftId: string;
  targetShiftId?: string;
  reason?: string;
  expiresAt?: string;
}

export interface ReviewSwapInput {
  action: 'approve' | 'deny';
  notes?: string;
}

export interface SwapFilters {
  status?: SwapStatus;
  facilityId?: string;
  myRequests?: boolean;
  pendingApproval?: boolean;
  page?: number;
  pageSize?: number;
}

interface SwapsResponse {
  items: EnrichedSwapRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Fetch swap requests
async function fetchSwaps(filters: SwapFilters): Promise<SwapsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.facilityId) params.set('facilityId', filters.facilityId);
  if (filters.myRequests) params.set('myRequests', 'true');
  if (filters.pendingApproval) params.set('pendingApproval', 'true');
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.pageSize) params.set('pageSize', filters.pageSize.toString());

  const res = await fetch(`/api/schedules/swaps?${params}`);
  if (!res.ok) throw new Error('Failed to fetch swap requests');
  const json = await res.json();
  return json.data;
}

// Fetch single swap request
async function fetchSwap(swapId: string): Promise<EnrichedSwapRequest> {
  const res = await fetch(`/api/schedules/swaps/${swapId}`);
  if (!res.ok) throw new Error('Failed to fetch swap request');
  const json = await res.json();
  return json.data;
}

// Create swap request
async function createSwap(input: CreateSwapInput): Promise<EnrichedSwapRequest> {
  const res = await fetch('/api/schedules/swaps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create swap request');
  }
  const json = await res.json();
  return json.data;
}

// Review swap request (approve/deny)
async function reviewSwap(
  swapId: string,
  input: ReviewSwapInput
): Promise<ShiftSwapRequest> {
  const res = await fetch(`/api/schedules/swaps/${swapId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to process swap request');
  }
  const json = await res.json();
  return json.data;
}

// Cancel swap request
async function cancelSwap(swapId: string, reason?: string): Promise<void> {
  const res = await fetch(`/api/schedules/swaps/${swapId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to cancel swap request');
  }
}

// Hooks

export function useShiftSwaps(filters: SwapFilters = {}) {
  return useQuery({
    queryKey: ['shiftSwaps', filters],
    queryFn: () => fetchSwaps(filters),
    staleTime: 30000, // 30 seconds
  });
}

export function useShiftSwap(swapId: string | undefined) {
  return useQuery({
    queryKey: ['shiftSwap', swapId],
    queryFn: () => fetchSwap(swapId!),
    enabled: !!swapId,
    staleTime: 30000,
  });
}

export function useMySwapRequests(page = 1, pageSize = 10) {
  return useShiftSwaps({ myRequests: true, page, pageSize });
}

export function usePendingSwapApprovals(facilityId?: string) {
  return useShiftSwaps({ pendingApproval: true, facilityId, status: 'PENDING' });
}

export function useCreateSwapRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSwap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSwaps'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useReviewSwapRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ swapId, ...input }: ReviewSwapInput & { swapId: string }) =>
      reviewSwap(swapId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSwaps'] });
      queryClient.invalidateQueries({ queryKey: ['shiftSwap'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCancelSwapRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ swapId, reason }: { swapId: string; reason?: string }) =>
      cancelSwap(swapId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSwaps'] });
      queryClient.invalidateQueries({ queryKey: ['shiftSwap'] });
    },
  });
}

// Status helpers
export const SWAP_STATUS_LABELS: Record<SwapStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DENIED: 'Denied',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

export const SWAP_STATUS_COLORS: Record<SwapStatus, string> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  DENIED: 'red',
  CANCELLED: 'gray',
  EXPIRED: 'gray',
};

export function formatSwapShiftDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSwapShiftTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getSwapStatusBadgeClass(status: SwapStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'APPROVED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'DENIED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'CANCELLED':
    case 'EXPIRED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
  }
}
