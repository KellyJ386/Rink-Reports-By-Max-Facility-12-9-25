// Multi-tenancy Types

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  plan: TenantPlan;
  settings: TenantSettings;
  branding: TenantBranding;
  limits: TenantLimits;
  createdAt: Date;
  updatedAt: Date;
  trialEndsAt?: Date;
  suspendedAt?: Date;
  suspendedReason?: string;
}

export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export interface TenantSettings {
  timezone: string;
  dateFormat: string;
  temperatureUnit: 'fahrenheit' | 'celsius';
  measurementUnit: 'imperial' | 'metric';
  language: string;
  features: TenantFeatures;
}

export interface TenantFeatures {
  maxFacilities: number;
  maxUsersPerFacility: number;
  maxRinks: number;
  aiAnalysis: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  ssoEnabled: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  dataExport: boolean;
  auditLogs: boolean;
  customIntegrations: boolean;
}

export interface TenantBranding {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerText?: string;
  footerText?: string;
  emailFrom?: string;
  emailName?: string;
}

export interface TenantLimits {
  facilities: { used: number; max: number };
  users: { used: number; max: number };
  rinks: { used: number; max: number };
  storage: { used: number; max: number }; // in bytes
  apiCalls: { used: number; max: number }; // per month
}

export interface TenantContext {
  tenant: Tenant | null;
  facilityId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface TenantMember {
  userId: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  joinedAt: Date;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: TenantMember['role'];
  invitedBy: string;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

// Plan feature configurations
export const planFeatures: Record<TenantPlan, TenantFeatures> = {
  free: {
    maxFacilities: 1,
    maxUsersPerFacility: 5,
    maxRinks: 2,
    aiAnalysis: false,
    advancedReports: false,
    apiAccess: false,
    ssoEnabled: false,
    customBranding: false,
    prioritySupport: false,
    dataExport: false,
    auditLogs: false,
    customIntegrations: false,
  },
  starter: {
    maxFacilities: 2,
    maxUsersPerFacility: 15,
    maxRinks: 4,
    aiAnalysis: true,
    advancedReports: false,
    apiAccess: false,
    ssoEnabled: false,
    customBranding: false,
    prioritySupport: false,
    dataExport: true,
    auditLogs: false,
    customIntegrations: false,
  },
  professional: {
    maxFacilities: 5,
    maxUsersPerFacility: 50,
    maxRinks: 20,
    aiAnalysis: true,
    advancedReports: true,
    apiAccess: true,
    ssoEnabled: false,
    customBranding: true,
    prioritySupport: true,
    dataExport: true,
    auditLogs: true,
    customIntegrations: false,
  },
  enterprise: {
    maxFacilities: -1, // unlimited
    maxUsersPerFacility: -1,
    maxRinks: -1,
    aiAnalysis: true,
    advancedReports: true,
    apiAccess: true,
    ssoEnabled: true,
    customBranding: true,
    prioritySupport: true,
    dataExport: true,
    auditLogs: true,
    customIntegrations: true,
  },
};
