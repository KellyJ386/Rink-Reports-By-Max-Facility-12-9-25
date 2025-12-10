'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Tenant, TenantContext } from '@/lib/tenancy/types';

const TenantContextValue = createContext<TenantContext & {
  setTenant: (tenant: Tenant | null) => void;
  setFacilityId: (id: string | null) => void;
  switchFacility: (id: string) => void;
  hasFeature: (feature: keyof Tenant['settings']['features']) => boolean;
  isLimitExceeded: (limit: keyof Tenant['limits']) => boolean;
}>({
  tenant: null,
  facilityId: null,
  isLoading: true,
  error: null,
  setTenant: () => {},
  setFacilityId: () => {},
  switchFacility: () => {},
  hasFeature: () => false,
  isLimitExceeded: () => true,
});

interface TenantProviderProps {
  children: ReactNode;
  initialTenant?: Tenant | null;
  initialFacilityId?: string | null;
}

export function TenantProvider({
  children,
  initialTenant = null,
  initialFacilityId = null,
}: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant);
  const [facilityId, setFacilityId] = useState<string | null>(initialFacilityId);
  const [isLoading, setIsLoading] = useState(!initialTenant);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTenant) {
      setIsLoading(false);
      return;
    }

    // Fetch tenant from API if not provided
    async function loadTenant() {
      try {
        const response = await fetch('/api/tenant');
        if (!response.ok) throw new Error('Failed to load tenant');

        const data = await response.json();
        setTenant(data.tenant);
        setFacilityId(data.facilityId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tenant');
      } finally {
        setIsLoading(false);
      }
    }

    loadTenant();
  }, [initialTenant]);

  const switchFacility = (newFacilityId: string) => {
    setFacilityId(newFacilityId);
    // Persist to session/localStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('currentFacilityId', newFacilityId);
    }
  };

  const hasFeature = (feature: keyof Tenant['settings']['features']): boolean => {
    if (!tenant) return false;
    return Boolean(tenant.settings.features[feature]);
  };

  const isLimitExceeded = (limit: keyof Tenant['limits']): boolean => {
    if (!tenant) return true;
    const { used, max } = tenant.limits[limit];
    if (max === -1) return false;
    return used >= max;
  };

  return (
    <TenantContextValue.Provider
      value={{
        tenant,
        facilityId,
        isLoading,
        error,
        setTenant,
        setFacilityId,
        switchFacility,
        hasFeature,
        isLimitExceeded,
      }}
    >
      {children}
    </TenantContextValue.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContextValue);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Hook to check feature availability
export function useFeature(feature: keyof Tenant['settings']['features']): boolean {
  const { hasFeature } = useTenant();
  return hasFeature(feature);
}

// Hook to check if action would exceed limit
export function useLimit(limit: keyof Tenant['limits']): {
  used: number;
  max: number;
  remaining: number;
  isExceeded: boolean;
} {
  const { tenant, isLimitExceeded } = useTenant();

  if (!tenant) {
    return { used: 0, max: 0, remaining: 0, isExceeded: true };
  }

  const { used, max } = tenant.limits[limit];
  const remaining = max === -1 ? Infinity : Math.max(0, max - used);

  return {
    used,
    max,
    remaining,
    isExceeded: isLimitExceeded(limit),
  };
}

// Component to conditionally render based on feature
export function FeatureGate({
  feature,
  children,
  fallback = null,
}: {
  feature: keyof Tenant['settings']['features'];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hasAccess = useFeature(feature);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Component to show upgrade prompt if limit exceeded
export function LimitGate({
  limit,
  children,
  onLimitExceeded,
}: {
  limit: keyof Tenant['limits'];
  children: ReactNode;
  onLimitExceeded?: () => void;
}) {
  const { isExceeded } = useLimit(limit);

  if (isExceeded) {
    if (onLimitExceeded) onLimitExceeded();
    return null;
  }

  return <>{children}</>;
}
