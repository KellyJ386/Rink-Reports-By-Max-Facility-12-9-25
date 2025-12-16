'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface OrganizationSettings {
  id: string;
  organizationId: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  defaultIceDepthMin?: number;
  defaultIceDepthMax?: number;
  defaultCO2Threshold?: number;
  defaultCOThreshold?: number;
  enableScheduling: boolean;
  enableIncidents: boolean;
  enableForms: boolean;
  enableReports: boolean;
  enableAirQuality: boolean;
  enableRefrigeration: boolean;
  requireMFA: boolean;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  auditLogRetentionDays: number;
  incidentRetentionYears: number;
  readingsRetentionDays: number;
  defaultEmailNotifications: boolean;
  defaultSMSNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface OrganizationSettingsResponse {
  organization: Organization;
  settings: OrganizationSettings;
}

export interface UpdateSettingsInput {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  defaultIceDepthMin?: number | null;
  defaultIceDepthMax?: number | null;
  defaultCO2Threshold?: number | null;
  defaultCOThreshold?: number | null;
  enableScheduling?: boolean;
  enableIncidents?: boolean;
  enableForms?: boolean;
  enableReports?: boolean;
  enableAirQuality?: boolean;
  enableRefrigeration?: boolean;
  requireMFA?: boolean;
  sessionTimeoutMinutes?: number;
  passwordMinLength?: number;
  passwordRequireSpecial?: boolean;
  auditLogRetentionDays?: number;
  incidentRetentionYears?: number;
  readingsRetentionDays?: number;
  defaultEmailNotifications?: boolean;
  defaultSMSNotifications?: boolean;
}

export interface FacilityGroup {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  color?: string;
  facilities: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupInput {
  organizationId: string;
  name: string;
  description?: string;
  color?: string;
  facilityIds?: string[];
}

export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  facilityIds?: string[];
}

// Feature toggle labels
export const FEATURE_LABELS: Record<string, string> = {
  enableScheduling: 'Staff Scheduling',
  enableIncidents: 'Incident Reporting',
  enableForms: 'Forms & Checklists',
  enableReports: 'Reports & Export',
  enableAirQuality: 'Air Quality Monitoring',
  enableRefrigeration: 'Refrigeration Logs',
};

// Security setting labels
export const SECURITY_LABELS: Record<string, string> = {
  requireMFA: 'Require Two-Factor Authentication',
  sessionTimeoutMinutes: 'Session Timeout (minutes)',
  passwordMinLength: 'Minimum Password Length',
  passwordRequireSpecial: 'Require Special Characters in Passwords',
};

// Fetch organization settings
async function fetchOrganizationSettings(organizationId: string): Promise<OrganizationSettingsResponse> {
  const response = await fetch(`/api/organization/settings?organizationId=${organizationId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch organization settings');
  }
  return response.json();
}

// Update organization settings
async function updateOrganizationSettings({
  organizationId,
  ...input
}: UpdateSettingsInput & { organizationId: string }): Promise<OrganizationSettings> {
  const response = await fetch(`/api/organization/settings?organizationId=${organizationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update settings');
  }

  return response.json();
}

// Fetch facility groups
async function fetchFacilityGroups(organizationId?: string): Promise<FacilityGroup[]> {
  const url = organizationId
    ? `/api/organization/groups?organizationId=${organizationId}`
    : '/api/organization/groups';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch facility groups');
  }
  return response.json();
}

// Create facility group
async function createFacilityGroup(input: CreateGroupInput): Promise<FacilityGroup> {
  const response = await fetch('/api/organization/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create group');
  }

  return response.json();
}

// Update facility group
async function updateFacilityGroup({
  groupId,
  ...input
}: UpdateGroupInput & { groupId: string }): Promise<FacilityGroup> {
  const response = await fetch(`/api/organization/groups/${groupId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update group');
  }

  return response.json();
}

// Delete facility group
async function deleteFacilityGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/organization/groups/${groupId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete group');
  }
}

// Hooks
export function useOrganizationSettings(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organizationSettings', organizationId],
    queryFn: () => fetchOrganizationSettings(organizationId!),
    enabled: !!organizationId,
  });
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganizationSettings,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organizationSettings', variables.organizationId],
      });
    },
  });
}

export function useFacilityGroups(organizationId?: string) {
  return useQuery({
    queryKey: ['facilityGroups', organizationId],
    queryFn: () => fetchFacilityGroups(organizationId),
  });
}

export function useCreateFacilityGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFacilityGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['facilityGroups', data.organizationId],
      });
    },
  });
}

export function useUpdateFacilityGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFacilityGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilityGroups'] });
    },
  });
}

export function useDeleteFacilityGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFacilityGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilityGroups'] });
    },
  });
}
