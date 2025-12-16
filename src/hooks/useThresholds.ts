'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThresholdModule, SeverityLevel, NotificationChannel, UserRole } from '@prisma/client';

// Types
export interface ThresholdConfigData {
  id: string;
  facilityId: string;
  rinkId: string | null;
  rinkName?: string | null;
  module: ThresholdModule;
  parameterName: string;
  minValue: number | null;
  maxValue: number | null;
  warningMin: number | null;
  warningMax: number | null;
  alertEnabled: boolean;
  alertSeverity: SeverityLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DefaultThreshold {
  id: null;
  facilityId: string;
  rinkId: null;
  module: string;
  parameterName: string;
  minValue: number | null;
  maxValue: number | null;
  warningMin: number | null;
  warningMax: number | null;
  alertEnabled: boolean;
  alertSeverity: string;
  isActive: boolean;
  isDefault: boolean;
  label: string;
  unit: string;
}

export interface RinkInfo {
  id: string;
  name: string;
}

export interface ThresholdsResponse {
  thresholds: ThresholdConfigData[];
  defaults?: DefaultThreshold[];
  rinks: RinkInfo[];
}

export interface NotificationConfigData {
  id: string;
  facilityId: string;
  module: ThresholdModule;
  alertSeverity: SeverityLevel;
  recipientRole: UserRole | null;
  recipientUserId: string | null;
  recipientName?: string | null;
  channels: NotificationChannel[];
  isEnabled: boolean;
  requiresAck: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface NotificationConfigsResponse {
  configs: NotificationConfigData[];
  users: FacilityUser[];
}

export interface CreateThresholdInput {
  facilityId: string;
  rinkId?: string | null;
  module: ThresholdModule;
  parameterName: string;
  minValue?: number | null;
  maxValue?: number | null;
  warningMin?: number | null;
  warningMax?: number | null;
  alertEnabled?: boolean;
  alertSeverity?: SeverityLevel;
  isActive?: boolean;
}

export interface UpdateThresholdInput extends Partial<CreateThresholdInput> {
  id: string;
}

export interface BulkThresholdsInput {
  thresholds: CreateThresholdInput[];
}

export interface CreateNotificationConfigInput {
  facilityId: string;
  module: ThresholdModule;
  alertSeverity: SeverityLevel;
  recipientRole?: UserRole | null;
  recipientUserId?: string | null;
  channels: NotificationChannel[];
  isEnabled?: boolean;
  requiresAck?: boolean;
}

export interface UpdateNotificationConfigInput extends Partial<CreateNotificationConfigInput> {
  id: string;
}

// API functions
async function fetchThresholds(
  facilityId: string,
  options?: { module?: ThresholdModule; rinkId?: string; includeDefaults?: boolean }
): Promise<ThresholdsResponse> {
  const params = new URLSearchParams({ facilityId });
  if (options?.module) params.append('module', options.module);
  if (options?.rinkId) params.append('rinkId', options.rinkId);
  if (options?.includeDefaults) params.append('includeDefaults', 'true');

  const res = await fetch(`/api/admin/thresholds?${params}`);
  if (!res.ok) throw new Error('Failed to fetch thresholds');
  const json = await res.json();
  return json.data;
}

async function createThreshold(input: CreateThresholdInput): Promise<ThresholdConfigData> {
  const res = await fetch('/api/admin/thresholds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create threshold');
  const json = await res.json();
  return json.data;
}

async function bulkSaveThresholds(input: BulkThresholdsInput): Promise<ThresholdConfigData[]> {
  const res = await fetch('/api/admin/thresholds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to save thresholds');
  const json = await res.json();
  return json.data;
}

async function updateThreshold(input: UpdateThresholdInput): Promise<ThresholdConfigData> {
  const res = await fetch('/api/admin/thresholds', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update threshold');
  const json = await res.json();
  return json.data;
}

async function deleteThreshold(id: string): Promise<void> {
  const res = await fetch(`/api/admin/thresholds?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete threshold');
}

async function fetchNotificationConfigs(
  facilityId: string,
  module?: ThresholdModule
): Promise<NotificationConfigsResponse> {
  const params = new URLSearchParams({ facilityId });
  if (module) params.append('module', module);

  const res = await fetch(`/api/admin/notifications?${params}`);
  if (!res.ok) throw new Error('Failed to fetch notification configs');
  const json = await res.json();
  return json.data;
}

async function createNotificationConfig(input: CreateNotificationConfigInput): Promise<NotificationConfigData> {
  const res = await fetch('/api/admin/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create notification config');
  const json = await res.json();
  return json.data;
}

async function updateNotificationConfig(input: UpdateNotificationConfigInput): Promise<NotificationConfigData> {
  const res = await fetch('/api/admin/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update notification config');
  const json = await res.json();
  return json.data;
}

async function deleteNotificationConfig(id: string): Promise<void> {
  const res = await fetch(`/api/admin/notifications?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete notification config');
}

// Hooks

export function useThresholds(
  facilityId: string | null,
  options?: { module?: ThresholdModule; rinkId?: string; includeDefaults?: boolean }
) {
  return useQuery({
    queryKey: ['thresholds', facilityId, options],
    queryFn: () => fetchThresholds(facilityId!, options),
    enabled: !!facilityId,
    staleTime: 30000,
  });
}

export function useThresholdsLive(
  facilityId: string | null,
  options?: { module?: ThresholdModule; rinkId?: string; includeDefaults?: boolean },
  refreshInterval = 60000
) {
  return useQuery({
    queryKey: ['thresholds', facilityId, options],
    queryFn: () => fetchThresholds(facilityId!, options),
    enabled: !!facilityId,
    refetchInterval: refreshInterval,
  });
}

export function useCreateThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
    },
  });
}

export function useBulkSaveThresholds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkSaveThresholds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
    },
  });
}

export function useUpdateThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
    },
  });
}

export function useDeleteThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
    },
  });
}

export function useNotificationConfigs(facilityId: string | null, module?: ThresholdModule) {
  return useQuery({
    queryKey: ['notificationConfigs', facilityId, module],
    queryFn: () => fetchNotificationConfigs(facilityId!, module),
    enabled: !!facilityId,
    staleTime: 30000,
  });
}

export function useNotificationConfigsLive(
  facilityId: string | null,
  module?: ThresholdModule,
  refreshInterval = 60000
) {
  return useQuery({
    queryKey: ['notificationConfigs', facilityId, module],
    queryFn: () => fetchNotificationConfigs(facilityId!, module),
    enabled: !!facilityId,
    refetchInterval: refreshInterval,
  });
}

export function useCreateNotificationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNotificationConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationConfigs'] });
    },
  });
}

export function useUpdateNotificationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationConfigs'] });
    },
  });
}

export function useDeleteNotificationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotificationConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationConfigs'] });
    },
  });
}

// Utility functions for threshold checking
export function checkValueAgainstThreshold(
  value: number,
  threshold: ThresholdConfigData | DefaultThreshold
): 'ok' | 'warning' | 'critical' {
  const { minValue, maxValue, warningMin, warningMax } = threshold;

  // Check critical thresholds
  if (minValue !== null && value < minValue) return 'critical';
  if (maxValue !== null && value > maxValue) return 'critical';

  // Check warning thresholds
  if (warningMin !== null && value < warningMin) return 'warning';
  if (warningMax !== null && value > warningMax) return 'warning';

  return 'ok';
}

export function getThresholdStatusColor(status: 'ok' | 'warning' | 'critical'): string {
  switch (status) {
    case 'critical':
      return 'text-red-600 bg-red-100';
    case 'warning':
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-green-600 bg-green-100';
  }
}

export function getThresholdStatusLabel(status: 'ok' | 'warning' | 'critical'): string {
  switch (status) {
    case 'critical':
      return 'Critical';
    case 'warning':
      return 'Warning';
    default:
      return 'Normal';
  }
}

// Module labels
export const MODULE_LABELS: Record<ThresholdModule, string> = {
  ICE_DEPTH: 'Ice Depth',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
};

export const MODULE_COLORS: Record<ThresholdModule, string> = {
  ICE_DEPTH: 'bg-ice-100 text-ice-700',
  REFRIGERATION: 'bg-purple-100 text-purple-700',
  AIR_QUALITY: 'bg-green-100 text-green-700',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  MINOR: 'Minor',
  MODERATE: 'Moderate',
  SERIOUS: 'Serious',
  CRITICAL: 'Critical',
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  MINOR: 'bg-blue-100 text-blue-700',
  MODERATE: 'bg-yellow-100 text-yellow-700',
  SERIOUS: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  IN_APP: 'In-App',
  PUSH: 'Push Notification',
};
