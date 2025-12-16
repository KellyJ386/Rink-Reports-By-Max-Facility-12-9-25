'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ========== Types ==========

export type DailyReportTabCategory =
  | 'FRONT_DESK'
  | 'CUSTODIAL'
  | 'PRO_SHOP'
  | 'CONCESSIONS'
  | 'LEARN_TO_SKATE'
  | 'PUBLIC_SESSIONS'
  | 'SAFETY_EMERGENCY'
  | 'GENERAL_FACILITY'
  | 'LOCKER_ROOMS'
  | 'MAINTENANCE'
  | 'EVENTS'
  | 'HOCKEY_PROGRAMS'
  | 'FIGURE_SKATING'
  | 'RENTALS'
  | 'CUSTOM';

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'ALL_DAY';
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'ARCHIVED';
export type TabStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'REVIEWED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'NEEDS_ATTENTION' | 'REJECTED';
export type UserRole = 'SUPER_ADMIN' | 'FACILITY_ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'ICE_TECHNICIAN' | 'STAFF';

export interface DailyReportTabRole {
  id: string;
  tabId: string;
  role: UserRole;
  canView: boolean;
  canSubmit: boolean;
  canReview: boolean;
}

export interface DailyReportTab {
  id: string;
  facilityId: string;
  name: string;
  category: DailyReportTabCategory;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  orderIndex: number;
  isActive: boolean;
  formTemplateId?: string | null;
  requiresCompletion: boolean;
  allowMultipleSubmissions: boolean;
  formTemplate?: {
    id: string;
    name: string;
    category: string;
    isPublished: boolean;
    description?: string | null;
    fields?: Array<{
      id: string;
      label: string;
      fieldType: string;
      isRequired: boolean;
      orderIndex: number;
    }>;
  } | null;
  roleAssignments: DailyReportTabRole[];
  _count?: {
    submissions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportSession {
  id: string;
  facilityId: string;
  shiftDate: string;
  shiftType: ShiftType;
  status: SessionStatus;
  handoffSummary?: string | null;
  handoffNotes?: string | null;
  reviewStatus?: ReviewStatus;
  reviewNotes?: string | null;
  facility?: {
    id: string;
    name: string;
  };
  startedBy?: {
    id: string;
    name: string;
    email: string;
  };
  completedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  tabSubmissions: DailyReportTabSubmission[];
  _count?: {
    tabSubmissions: number;
  };
  createdAt: string;
  completedAt?: string | null;
  reviewedAt?: string | null;
}

export interface DailyReportTabSubmission {
  id: string;
  sessionId: string;
  tabId: string;
  formSubmissionId?: string | null;
  submittedById?: string | null;
  status: TabStatus;
  checklistData?: Record<string, unknown> | null;
  notes?: string | null;
  reviewNotes?: string | null;
  tab?: {
    id: string;
    name: string;
    category: DailyReportTabCategory;
    icon?: string | null;
    color?: string | null;
    formTemplateId?: string | null;
    requiresCompletion: boolean;
  };
  submittedBy?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  reviewedBy?: {
    id: string;
    name: string;
  } | null;
  formSubmission?: {
    id: string;
    status: string;
    submittedAt: string;
  } | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

// ========== Tab API Functions ==========

async function fetchTabs(params: {
  facilityId: string;
  includeInactive?: boolean;
}): Promise<DailyReportTab[]> {
  const searchParams = new URLSearchParams();
  searchParams.append('facilityId', params.facilityId);
  if (params.includeInactive) {
    searchParams.append('includeInactive', 'true');
  }

  const response = await fetch(`/api/admin/daily-reports/tabs?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tabs');
  }
  const data = await response.json();
  return data.data;
}

async function fetchTab(tabId: string): Promise<DailyReportTab> {
  const response = await fetch(`/api/admin/daily-reports/tabs/${tabId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tab');
  }
  const data = await response.json();
  return data.data;
}

async function createTab(data: {
  facilityId: string;
  name: string;
  category: DailyReportTabCategory;
  description?: string;
  icon?: string;
  color?: string;
  formTemplateId?: string | null;
  requiresCompletion?: boolean;
  allowMultipleSubmissions?: boolean;
  roleAssignments?: Array<{
    role: UserRole;
    canView?: boolean;
    canSubmit?: boolean;
    canReview?: boolean;
  }>;
}): Promise<DailyReportTab> {
  const response = await fetch('/api/admin/daily-reports/tabs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tab');
  }

  const result = await response.json();
  return result.data;
}

async function updateTab(
  tabId: string,
  data: {
    name?: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    isActive?: boolean;
    formTemplateId?: string | null;
    requiresCompletion?: boolean;
    allowMultipleSubmissions?: boolean;
    roleAssignments?: Array<{
      role: UserRole;
      canView?: boolean;
      canSubmit?: boolean;
      canReview?: boolean;
    }>;
  }
): Promise<DailyReportTab> {
  const response = await fetch(`/api/admin/daily-reports/tabs/${tabId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tab');
  }

  const result = await response.json();
  return result.data;
}

async function deleteTab(tabId: string): Promise<{ success: boolean; softDeleted?: boolean }> {
  const response = await fetch(`/api/admin/daily-reports/tabs/${tabId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tab');
  }

  return response.json();
}

async function reorderTabs(data: {
  facilityId: string;
  tabOrder: string[];
}): Promise<DailyReportTab[]> {
  const response = await fetch('/api/admin/daily-reports/tabs/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reorder tabs');
  }

  const result = await response.json();
  return result.data;
}

// ========== Session API Functions ==========

async function fetchSessions(params: {
  facilityId: string;
  startDate?: string;
  endDate?: string;
  status?: SessionStatus;
  page?: number;
  limit?: number;
}): Promise<{
  sessions: DailyReportSession[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  searchParams.append('facilityId', params.facilityId);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  if (params.status) searchParams.append('status', params.status);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const response = await fetch(`/api/admin/daily-reports/sessions?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  const data = await response.json();
  return {
    sessions: data.data,
    pagination: data.pagination,
  };
}

async function fetchSession(sessionId: string): Promise<DailyReportSession & { stats: SessionStats }> {
  const response = await fetch(`/api/admin/daily-reports/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }
  const data = await response.json();
  return data.data;
}

interface SessionStats {
  totalTabs: number;
  completedTabs: number;
  requiredTabs: number;
  requiredCompleted: number;
  completionPercentage: number;
  allRequiredComplete: boolean;
}

async function createOrGetSession(data: {
  facilityId: string;
  shiftDate: string;
  shiftType?: ShiftType;
}): Promise<{ session: DailyReportSession; isExisting: boolean }> {
  const response = await fetch('/api/admin/daily-reports/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create session');
  }

  const result = await response.json();
  return {
    session: result.data,
    isExisting: result.isExisting,
  };
}

async function updateSession(
  sessionId: string,
  data: {
    status?: SessionStatus;
    handoffSummary?: string | null;
    handoffNotes?: string | null;
    reviewStatus?: ReviewStatus;
    reviewNotes?: string | null;
  }
): Promise<DailyReportSession> {
  const response = await fetch(`/api/admin/daily-reports/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update session');
  }

  const result = await response.json();
  return result.data;
}

// ========== Tab Submission API Functions ==========

async function fetchTabSubmissions(params: {
  sessionId: string;
  tabId?: string;
}): Promise<DailyReportTabSubmission[]> {
  const searchParams = new URLSearchParams();
  searchParams.append('sessionId', params.sessionId);
  if (params.tabId) searchParams.append('tabId', params.tabId);

  const response = await fetch(`/api/daily-reports/submissions?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tab submissions');
  }
  const data = await response.json();
  return data.data;
}

async function createTabSubmission(data: {
  sessionId: string;
  tabId: string;
  formSubmissionId?: string | null;
  checklistData?: Record<string, unknown> | null;
  notes?: string | null;
  status?: TabStatus;
}): Promise<{ submission: DailyReportTabSubmission; isUpdate: boolean }> {
  const response = await fetch('/api/daily-reports/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tab submission');
  }

  const result = await response.json();
  return {
    submission: result.data,
    isUpdate: result.isUpdate,
  };
}

async function updateTabSubmission(
  submissionId: string,
  data: {
    status?: TabStatus;
    checklistData?: Record<string, unknown> | null;
    notes?: string | null;
    reviewNotes?: string | null;
  }
): Promise<DailyReportTabSubmission> {
  const searchParams = new URLSearchParams({ id: submissionId });
  const response = await fetch(`/api/daily-reports/submissions?${searchParams.toString()}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tab submission');
  }

  const result = await response.json();
  return result.data;
}

// ========== Tab Hooks ==========

export function useDailyReportTabs(params: {
  facilityId: string;
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: ['dailyReportTabs', params],
    queryFn: () => fetchTabs(params),
    enabled: !!params.facilityId,
    staleTime: 60000,
  });
}

export function useDailyReportTab(tabId: string) {
  return useQuery({
    queryKey: ['dailyReportTabs', tabId],
    queryFn: () => fetchTab(tabId),
    enabled: !!tabId,
    staleTime: 30000,
  });
}

export function useCreateDailyReportTab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTab,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dailyReportTabs'] });
    },
  });
}

export function useUpdateDailyReportTab(tabId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof updateTab>[1]) => updateTab(tabId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyReportTabs'] });
    },
  });
}

export function useDeleteDailyReportTab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTab,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyReportTabs'] });
    },
  });
}

export function useReorderDailyReportTabs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderTabs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyReportTabs'] });
    },
  });
}

// ========== Session Hooks ==========

export function useDailyReportSessions(params: {
  facilityId: string;
  startDate?: string;
  endDate?: string;
  status?: SessionStatus;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['dailyReportSessions', params],
    queryFn: () => fetchSessions(params),
    enabled: !!params.facilityId,
    staleTime: 30000,
  });
}

export function useDailyReportSession(sessionId: string) {
  return useQuery({
    queryKey: ['dailyReportSessions', sessionId],
    queryFn: () => fetchSession(sessionId),
    enabled: !!sessionId,
    staleTime: 30000,
  });
}

export function useCreateOrGetSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrGetSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyReportSessions'] });
    },
  });
}

export function useUpdateDailyReportSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof updateSession>[1]) => updateSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyReportSessions'] });
    },
  });
}

export function useCompleteSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => updateSession(sessionId, { status: 'COMPLETED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyReportSessions'] });
    },
  });
}

// ========== Tab Submission Hooks ==========

export function useDailyReportTabSubmissions(params: {
  sessionId: string;
  tabId?: string;
}) {
  return useQuery({
    queryKey: ['dailyReportTabSubmissions', params],
    queryFn: () => fetchTabSubmissions(params),
    enabled: !!params.sessionId,
    staleTime: 30000,
  });
}

export function useCreateTabSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTabSubmission,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dailyReportTabSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['dailyReportSessions', variables.sessionId] });
    },
  });
}

export function useUpdateTabSubmission(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof updateTabSubmission>[1]) =>
      updateTabSubmission(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyReportTabSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['dailyReportSessions'] });
    },
  });
}

// ========== Utility Hooks ==========

// Get today's session for a facility
export function useTodaySession(facilityId: string, shiftType: ShiftType = 'ALL_DAY') {
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['dailyReportSessions', 'today', facilityId, shiftType],
    queryFn: async () => {
      const result = await fetchSessions({
        facilityId,
        startDate: today,
        endDate: today,
        limit: 1,
      });

      // Filter by shift type
      const session = result.sessions.find((s) => s.shiftType === shiftType);
      return session || null;
    },
    enabled: !!facilityId,
    staleTime: 30000,
  });
}

// Get tabs with user's role filter
export function useUserTabs(params: {
  facilityId: string;
  userRole: UserRole;
}) {
  return useQuery({
    queryKey: ['dailyReportTabs', 'user', params],
    queryFn: async () => {
      const tabs = await fetchTabs({ facilityId: params.facilityId });
      // Filter tabs based on user role and canView permission
      return tabs.filter((tab) => {
        if (!tab.isActive) return false;
        const roleAssignment = tab.roleAssignments.find((ra) => ra.role === params.userRole);
        // If no specific role assignment, assume visible
        return !roleAssignment || roleAssignment.canView;
      });
    },
    enabled: !!params.facilityId && !!params.userRole,
    staleTime: 60000,
  });
}

// Tab category metadata helper
export const TAB_CATEGORY_META: Record<
  DailyReportTabCategory,
  { label: string; icon: string; defaultColor: string }
> = {
  FRONT_DESK: { label: 'Front Desk', icon: 'Inbox', defaultColor: 'blue' },
  CUSTODIAL: { label: 'Custodial', icon: 'Sparkles', defaultColor: 'green' },
  PRO_SHOP: { label: 'Pro Shop', icon: 'ShoppingBag', defaultColor: 'purple' },
  CONCESSIONS: { label: 'Concessions', icon: 'Coffee', defaultColor: 'orange' },
  LEARN_TO_SKATE: { label: 'Learn to Skate', icon: 'GraduationCap', defaultColor: 'pink' },
  PUBLIC_SESSIONS: { label: 'Public Sessions', icon: 'Users', defaultColor: 'cyan' },
  SAFETY_EMERGENCY: { label: 'Safety & Emergency', icon: 'AlertTriangle', defaultColor: 'red' },
  GENERAL_FACILITY: { label: 'General Facility', icon: 'Building', defaultColor: 'gray' },
  LOCKER_ROOMS: { label: 'Locker Rooms', icon: 'DoorClosed', defaultColor: 'indigo' },
  MAINTENANCE: { label: 'Maintenance', icon: 'Wrench', defaultColor: 'yellow' },
  EVENTS: { label: 'Events', icon: 'Calendar', defaultColor: 'violet' },
  HOCKEY_PROGRAMS: { label: 'Hockey Programs', icon: 'Trophy', defaultColor: 'slate' },
  FIGURE_SKATING: { label: 'Figure Skating', icon: 'Sparkle', defaultColor: 'rose' },
  RENTALS: { label: 'Rentals', icon: 'Key', defaultColor: 'emerald' },
  CUSTOM: { label: 'Custom', icon: 'Settings', defaultColor: 'neutral' },
};

// Shift type metadata helper
export const SHIFT_TYPE_META: Record<
  ShiftType,
  { label: string; timeRange: string }
> = {
  MORNING: { label: 'Morning Shift', timeRange: '6:00 AM - 2:00 PM' },
  AFTERNOON: { label: 'Afternoon Shift', timeRange: '2:00 PM - 10:00 PM' },
  NIGHT: { label: 'Night Shift', timeRange: '10:00 PM - 6:00 AM' },
  ALL_DAY: { label: 'All Day', timeRange: 'Full Day' },
};
