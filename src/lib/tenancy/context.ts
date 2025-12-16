// Tenant Context Management

import type { Tenant, TenantContext } from './types';

// Server-side context storage (using AsyncLocalStorage for request isolation)
let currentTenant: Tenant | null = null;
let currentFacilityId: string | null = null;

// Set the current tenant context
export function setTenantContext(tenant: Tenant | null, facilityId?: string): void {
  currentTenant = tenant;
  currentFacilityId = facilityId || null;
}

// Get the current tenant
export function getCurrentTenant(): Tenant | null {
  return currentTenant;
}

// Get the current facility ID
export function getCurrentFacilityId(): string | null {
  return currentFacilityId;
}

// Clear the tenant context
export function clearTenantContext(): void {
  currentTenant = null;
  currentFacilityId = null;
}

// Get full context
export function getTenantContext(): TenantContext {
  return {
    tenant: currentTenant,
    facilityId: currentFacilityId,
    isLoading: false,
    error: null,
  };
}

// Check if feature is available for current tenant
export function hasFeature(feature: keyof Tenant['settings']['features']): boolean {
  if (!currentTenant) return false;
  return currentTenant.settings.features[feature] as boolean;
}

// Check if limit is exceeded
export function isLimitExceeded(limit: keyof Tenant['limits']): boolean {
  if (!currentTenant) return true;
  const { used, max } = currentTenant.limits[limit];
  if (max === -1) return false; // unlimited
  return used >= max;
}

// Get remaining quota
export function getRemainingQuota(limit: keyof Tenant['limits']): number {
  if (!currentTenant) return 0;
  const { used, max } = currentTenant.limits[limit];
  if (max === -1) return Infinity;
  return Math.max(0, max - used);
}

// Build tenant-scoped query filter
export function getTenantFilter(additionalFilters?: Record<string, unknown>): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (currentTenant) {
    filter.tenantId = currentTenant.id;
  }

  if (currentFacilityId) {
    filter.facilityId = currentFacilityId;
  }

  return { ...filter, ...additionalFilters };
}

// Validate tenant access to a resource
export function validateTenantAccess(resourceTenantId: string): boolean {
  if (!currentTenant) return false;
  return currentTenant.id === resourceTenantId;
}

// Validate facility access
export function validateFacilityAccess(
  resourceFacilityId: string,
  userFacilityIds: string[]
): boolean {
  // Super admins can access all facilities
  if (!currentFacilityId) return true;

  // Check if user has access to the facility
  return userFacilityIds.includes(resourceFacilityId);
}
