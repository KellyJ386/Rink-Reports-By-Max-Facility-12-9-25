'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ========== Types ==========

export type UserRole =
  | 'SUPER_ADMIN'
  | 'FACILITY_ADMIN'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'ICE_TECHNICIAN'
  | 'STAFF';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  facilityUsers?: {
    facility: {
      id: string;
      name: string;
    };
  }[];
  _count?: {
    formSubmissions: number;
    iceDepthReadings: number;
  };
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  phone?: string;
  role: UserRole;
  facilityId?: string;
}

export interface UpdateUserInput {
  userId: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface Facility {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  timezone: string;
  organization?: {
    id: string;
    name: string;
  };
  rinks?: {
    id: string;
    name: string;
    rinkType: string;
    icePointsConfig: number;
  }[];
  _count?: {
    facilityUsers: number;
    formTemplates: number;
    formSubmissions: number;
    incidentReports: number;
  };
}

export interface CreateFacilityInput {
  organizationId: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  timezone?: string;
}

export interface UpdateFacilityInput {
  facilityId: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  timezone?: string;
}

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'ENABLE'
  | 'DISABLE'
  | 'SEND'
  | 'ARCHIVE'
  | 'RESTORE';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLogEntry {
  id: string;
  timestamp: Date | string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  resourceName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  facilityId?: string;
  facilityName?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: AuditSeverity;
  description: string;
  outcome: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  changes?: {
    fields?: string[];
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

export interface AuditStats {
  total: number;
  today: number;
  failures: number;
  highSeverity: number;
}

export interface AuditLogFilter {
  actions?: AuditAction[];
  resources?: string[];
  severity?: AuditSeverity[];
  userId?: string;
  facilityId?: string;
  resourceId?: string;
  outcome?: 'SUCCESS' | 'FAILURE';
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ========== API Functions ==========

// Users API
async function fetchUsers(params?: {
  facilityId?: string;
  role?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const searchParams = new URLSearchParams();
  if (params?.facilityId) searchParams.append('facilityId', params.facilityId);
  if (params?.role) searchParams.append('role', params.role);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());

  const response = await fetch(`/api/admin/users?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await response.json();
  return data.data;
}

async function createUser(input: CreateUserInput): Promise<AdminUser> {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user');
  }

  const data = await response.json();
  return data.data;
}

async function updateUser(input: UpdateUserInput): Promise<AdminUser> {
  const response = await fetch('/api/admin/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }

  const data = await response.json();
  return data.data;
}

// Facilities API
async function fetchFacilities(params?: {
  organizationId?: string;
  search?: string;
}): Promise<Facility[]> {
  const searchParams = new URLSearchParams();
  if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
  if (params?.search) searchParams.append('search', params.search);

  const response = await fetch(`/api/admin/facilities?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch facilities');
  }
  const data = await response.json();
  return data.data;
}

async function createFacility(input: CreateFacilityInput): Promise<Facility> {
  const response = await fetch('/api/admin/facilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create facility');
  }

  const data = await response.json();
  return data.data;
}

async function updateFacility(input: UpdateFacilityInput): Promise<Facility> {
  const response = await fetch('/api/admin/facilities', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update facility');
  }

  const data = await response.json();
  return data.data;
}

// Audit API
async function fetchAuditLogs(filter?: AuditLogFilter): Promise<{
  logs: AuditLogEntry[];
  stats: AuditStats;
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (filter?.actions?.length) searchParams.append('actions', filter.actions.join(','));
  if (filter?.resources?.length) searchParams.append('resources', filter.resources.join(','));
  if (filter?.severity?.length) searchParams.append('severity', filter.severity.join(','));
  if (filter?.userId) searchParams.append('userId', filter.userId);
  if (filter?.facilityId) searchParams.append('facilityId', filter.facilityId);
  if (filter?.resourceId) searchParams.append('resourceId', filter.resourceId);
  if (filter?.outcome) searchParams.append('outcome', filter.outcome);
  if (filter?.searchTerm) searchParams.append('search', filter.searchTerm);
  if (filter?.startDate) searchParams.append('startDate', filter.startDate);
  if (filter?.endDate) searchParams.append('endDate', filter.endDate);
  if (filter?.limit) searchParams.append('limit', filter.limit.toString());
  if (filter?.offset) searchParams.append('offset', filter.offset.toString());

  const response = await fetch(`/api/audit?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }
  return response.json();
}

// ========== Admin Stats Types ==========

export interface AdminDashboardStat {
  name: string;
  value: string;
  activeCount?: number;
  weekValue?: number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface SystemHealthItem {
  status: 'healthy' | 'degraded' | 'down';
  label: string;
}

export interface AdminDashboardStats {
  stats: AdminDashboardStat[];
  roleStats: Record<UserRole, number>;
  recentActivity: {
    id: string;
    action: string;
    user: string;
    target: string;
    time: string;
    outcome: 'SUCCESS' | 'FAILURE';
  }[];
  systemHealth: {
    database: SystemHealthItem;
    api: SystemHealthItem;
    jobs: SystemHealthItem;
    email: SystemHealthItem;
  };
}

// ========== Admin Stats API Functions ==========

async function fetchAdminStats(): Promise<AdminDashboardStats> {
  const response = await fetch('/api/admin/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch admin stats');
  }
  const data = await response.json();
  return data.data;
}

async function fetchRoleStats(): Promise<{
  roles: {
    id: UserRole;
    name: string;
    description: string;
    usersCount: number;
    isSystem: boolean;
  }[];
}> {
  const response = await fetch('/api/admin/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch role stats');
  }
  const data = await response.json();

  // Transform role stats into role objects with counts
  const roleStats = data.data.roleStats as Record<string, number>;
  const roles = Object.entries(ROLE_LABELS).map(([role, name]) => ({
    id: role as UserRole,
    name,
    description: ROLE_DESCRIPTIONS[role as UserRole],
    usersCount: roleStats[role] || 0,
    isSystem: ['SUPER_ADMIN', 'FACILITY_ADMIN', 'MANAGER'].includes(role),
  }));

  return { roles };
}

// ========== React Query Hooks ==========

// Admin Dashboard Stats Hooks
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    staleTime: 30000,
  });
}

export function useAdminStatsLive(options?: { refreshInterval?: number; enabled?: boolean }) {
  const { refreshInterval = 0, enabled = true } = options || {};

  return useQuery({
    queryKey: ['admin', 'stats', 'live'],
    queryFn: fetchAdminStats,
    enabled,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    staleTime: 10000,
  });
}

export function useRoleStats() {
  return useQuery({
    queryKey: ['admin', 'roles', 'stats'],
    queryFn: fetchRoleStats,
    staleTime: 60000,
  });
}

export function useRoleStatsLive(options?: { refreshInterval?: number; enabled?: boolean }) {
  const { refreshInterval = 0, enabled = true } = options || {};

  return useQuery({
    queryKey: ['admin', 'roles', 'stats', 'live'],
    queryFn: fetchRoleStats,
    enabled,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    staleTime: 30000,
  });
}

// Users Hooks
export function useUsers(params?: {
  facilityId?: string;
  role?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => fetchUsers(params),
    staleTime: 30000,
  });
}

export function useUsersLive(
  params?: {
    facilityId?: string;
    role?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  },
  options?: { refreshInterval?: number; enabled?: boolean }
) {
  const { refreshInterval = 0, enabled = true } = options || {};

  return useQuery({
    queryKey: ['admin', 'users', 'live', params],
    queryFn: () => fetchUsers(params),
    enabled,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    staleTime: 10000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// Facilities Hooks
export function useFacilities(params?: {
  organizationId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'facilities', params],
    queryFn: () => fetchFacilities(params),
    staleTime: 60000,
  });
}

export function useFacilitiesLive(
  params?: {
    organizationId?: string;
    search?: string;
  },
  options?: { refreshInterval?: number; enabled?: boolean }
) {
  const { refreshInterval = 0, enabled = true } = options || {};

  return useQuery({
    queryKey: ['admin', 'facilities', 'live', params],
    queryFn: () => fetchFacilities(params),
    enabled,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    staleTime: 30000,
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'facilities'] });
    },
  });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'facilities'] });
    },
  });
}

// Audit Hooks
export function useAuditLogs(filter?: AuditLogFilter) {
  return useQuery({
    queryKey: ['admin', 'audit', filter],
    queryFn: () => fetchAuditLogs(filter),
    staleTime: 30000,
  });
}

export function useAuditLogsLive(
  filter?: AuditLogFilter,
  options?: { refreshInterval?: number; enabled?: boolean }
) {
  const { refreshInterval = 0, enabled = true } = options || {};

  return useQuery({
    queryKey: ['admin', 'audit', 'live', filter],
    queryFn: () => fetchAuditLogs(filter),
    enabled,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    staleTime: 10000,
  });
}

// ========== Helper Functions ==========

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  FACILITY_ADMIN: 'Facility Admin',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  ICE_TECHNICIAN: 'Ice Technician',
  STAFF: 'Staff',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Full platform access with all permissions',
  FACILITY_ADMIN: 'Full access to facility operations',
  MANAGER: 'Manage daily operations and staff',
  SUPERVISOR: 'Supervise shifts and team activities',
  ICE_TECHNICIAN: 'Ice maintenance and monitoring',
  STAFF: 'Basic operational access',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  FACILITY_ADMIN: 'bg-blue-100 text-blue-800',
  MANAGER: 'bg-green-100 text-green-800',
  SUPERVISOR: 'bg-yellow-100 text-yellow-800',
  ICE_TECHNICIAN: 'bg-ice-100 text-ice-800',
  STAFF: 'bg-rink-100 text-rink-600',
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || role;
}

export function getRoleColor(role: UserRole): string {
  return ROLE_COLORS[role] || 'bg-gray-100 text-gray-700';
}

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-700',
  READ: 'bg-gray-100 text-gray-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-purple-100 text-purple-700',
  EXPORT: 'bg-orange-100 text-orange-700',
  IMPORT: 'bg-orange-100 text-orange-700',
  APPROVE: 'bg-green-100 text-green-700',
  REJECT: 'bg-red-100 text-red-700',
  ASSIGN: 'bg-blue-100 text-blue-700',
  UNASSIGN: 'bg-yellow-100 text-yellow-700',
  ENABLE: 'bg-green-100 text-green-700',
  DISABLE: 'bg-red-100 text-red-700',
  SEND: 'bg-blue-100 text-blue-700',
  ARCHIVE: 'bg-gray-100 text-gray-700',
  RESTORE: 'bg-green-100 text-green-700',
};

export function getAuditActionColor(action: AuditAction): string {
  return AUDIT_ACTION_COLORS[action] || 'bg-gray-100 text-gray-700';
}

export const SEVERITY_CONFIG: Record<AuditSeverity, { color: string; textColor: string }> = {
  LOW: { color: 'text-gray-500', textColor: 'text-gray-500' },
  MEDIUM: { color: 'text-blue-500', textColor: 'text-blue-500' },
  HIGH: { color: 'text-yellow-500', textColor: 'text-yellow-500' },
  CRITICAL: { color: 'text-red-500', textColor: 'text-red-500' },
};

export function getSeverityColor(severity: AuditSeverity): string {
  return SEVERITY_CONFIG[severity]?.color || 'text-gray-500';
}

export function formatUserInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getUserFacilities(user: AdminUser): string[] {
  return user.facilityUsers?.map((fu) => fu.facility.name) || [];
}
