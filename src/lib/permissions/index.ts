import { UserRole } from '@prisma/client';

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  FACILITY_ADMIN: [
    'forms:create',
    'forms:edit',
    'forms:delete',
    'forms:submit',
    'forms:manage',
    'forms:view',
    'users:manage',
    'users:read',
    'reports:view',
    'reports:create',
    'reports:update',
    'reports:delete',
    'settings:manage',
    'ice:manage',
    'ice:view',
    'schedule:manage',
    'schedule:view',
    'incidents:manage',
    'incidents:view',
    'admin:view',
    'admin:create',
    'admin:update',
    'admin:delete',
    'audit:view',
  ],
  MANAGER: [
    'forms:submit',
    'forms:view',
    'reports:view',
    'reports:create',
    'schedule:manage',
    'schedule:view',
    'incidents:view',
    'ice:view',
    'admin:view',
  ],
  SUPERVISOR: [
    'forms:submit',
    'forms:view',
    'schedule:view',
    'schedule:approve_timeoff',
    'incidents:view',
    'ice:view',
  ],
  ICE_TECHNICIAN: [
    'forms:submit',
    'forms:view',
    'ice:manage',
    'ice:view',
    'schedule:view',
  ],
  STAFF: [
    'forms:submit',
    'forms:view',
    'schedule:view',
  ],
};

/**
 * Check if a role has a specific permission
 * Supports both 2-argument and 3-argument calling conventions:
 * - hasPermission(role, 'resource:action') - e.g., hasPermission(role, 'forms:manage')
 * - hasPermission(role, 'resource', 'action') - e.g., hasPermission(role, 'reports', 'view')
 */
export function hasPermission(role: UserRole, resourceOrPermission: string, action?: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];

  // Super admin has all permissions
  if (permissions.includes('*')) return true;

  // Build the permission string
  const permission = action
    ? `${resourceOrPermission}:${action}`
    : resourceOrPermission;

  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role can access admin features
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'FACILITY_ADMIN';
}

/**
 * Check if role can access manager features
 */
export function isManagerOrAbove(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'FACILITY_ADMIN' || role === 'MANAGER';
}

/**
 * Check if user can access form builder
 */
export function canAccessFormBuilder(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'FACILITY_ADMIN';
}

/**
 * Permission resources
 */
export type PermissionResource =
  | 'forms'
  | 'users'
  | 'reports'
  | 'settings'
  | 'ice'
  | 'schedule'
  | 'incidents'
  | 'admin'
  | 'audit';

/**
 * Permission actions
 */
export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'update'
  | 'delete'
  | 'manage'
  | 'submit'
  | 'approve_timeoff'
  | 'read';
