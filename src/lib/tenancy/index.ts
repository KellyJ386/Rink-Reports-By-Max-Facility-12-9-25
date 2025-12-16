// Multi-tenancy Module

export * from './types';
export * from './context';
export * from './service';

// Middleware helper for tenant resolution
export async function resolveTenant(request: Request): Promise<{
  tenantId: string | null;
  facilityId: string | null;
}> {
  const url = new URL(request.url);

  // Check for tenant in subdomain
  const host = request.headers.get('host') || '';
  const subdomain = host.split('.')[0];

  // Check for tenant in header
  const headerTenant = request.headers.get('x-tenant-id');

  // Check for tenant in query params
  const queryTenant = url.searchParams.get('tenantId');

  // Check for facility in header or query
  const facilityId =
    request.headers.get('x-facility-id') ||
    url.searchParams.get('facilityId') ||
    null;

  // Priority: header > query > subdomain
  const tenantId = headerTenant || queryTenant || (subdomain !== 'www' && subdomain !== 'app' ? subdomain : null);

  return { tenantId, facilityId };
}

// Tenant isolation decorator for database queries
export function withTenantScope<T extends Record<string, unknown>>(
  query: T,
  tenantId: string,
  facilityId?: string
): T & { tenantId: string; facilityId?: string } {
  return {
    ...query,
    tenantId,
    ...(facilityId && { facilityId }),
  };
}

// Check tenant status
export function isTenantActive(status: string): boolean {
  return status === 'active' || status === 'trial';
}

// Check if trial expired
export function isTrialExpired(trialEndsAt: Date | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date() > trialEndsAt;
}

// Utility to get plan display name
export const planDisplayNames: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

// Utility to get plan pricing (for display)
export const planPricing: Record<string, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 49, yearly: 490 },
  professional: { monthly: 149, yearly: 1490 },
  enterprise: { monthly: 499, yearly: 4990 },
};
