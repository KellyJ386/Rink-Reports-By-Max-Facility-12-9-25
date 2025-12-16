// Tenant Service

import { v4 as uuid } from 'uuid';
import type {
  Tenant,
  TenantPlan,
  TenantSettings,
  TenantBranding,
  TenantMember,
  TenantInvitation,
} from './types';
import { planFeatures } from './types';

// In-memory stores
const tenants: Map<string, Tenant> = new Map();
const members: Map<string, TenantMember[]> = new Map();
const invitations: Map<string, TenantInvitation> = new Map();

// Create a new tenant
export async function createTenant(
  name: string,
  slug: string,
  plan: TenantPlan = 'free',
  ownerId: string
): Promise<Tenant> {
  const id = uuid();
  const features = planFeatures[plan];

  const tenant: Tenant = {
    id,
    name,
    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    status: plan === 'free' ? 'active' : 'trial',
    plan,
    settings: {
      timezone: 'America/Chicago',
      dateFormat: 'MM/DD/YYYY',
      temperatureUnit: 'fahrenheit',
      measurementUnit: 'imperial',
      language: 'en',
      features,
    },
    branding: {},
    limits: {
      facilities: { used: 0, max: features.maxFacilities },
      users: { used: 1, max: features.maxUsersPerFacility * features.maxFacilities },
      rinks: { used: 0, max: features.maxRinks },
      storage: { used: 0, max: plan === 'enterprise' ? -1 : 10 * 1024 * 1024 * 1024 }, // 10GB
      apiCalls: { used: 0, max: plan === 'enterprise' ? -1 : 10000 },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    trialEndsAt: plan !== 'free' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : undefined,
  };

  tenants.set(id, tenant);

  // Add owner as member
  const memberList: TenantMember[] = [
    {
      userId: ownerId,
      tenantId: id,
      role: 'owner',
      permissions: ['*'],
      joinedAt: new Date(),
    },
  ];
  members.set(id, memberList);

  return tenant;
}

// Get tenant by ID
export async function getTenant(id: string): Promise<Tenant | null> {
  return tenants.get(id) || null;
}

// Get tenant by slug
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return Array.from(tenants.values()).find((t) => t.slug === slug) || null;
}

// Get tenant by domain
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  return Array.from(tenants.values()).find((t) => t.domain === domain) || null;
}

// Update tenant
export async function updateTenant(
  id: string,
  updates: Partial<Pick<Tenant, 'name' | 'domain' | 'settings' | 'branding'>>
): Promise<Tenant | null> {
  const tenant = tenants.get(id);
  if (!tenant) return null;

  const updated = {
    ...tenant,
    ...updates,
    settings: { ...tenant.settings, ...updates.settings },
    branding: { ...tenant.branding, ...updates.branding },
    updatedAt: new Date(),
  };

  tenants.set(id, updated);
  return updated;
}

// Upgrade/downgrade plan
export async function changePlan(id: string, newPlan: TenantPlan): Promise<Tenant | null> {
  const tenant = tenants.get(id);
  if (!tenant) return null;

  const features = planFeatures[newPlan];

  tenant.plan = newPlan;
  tenant.settings.features = features;
  tenant.limits = {
    ...tenant.limits,
    facilities: { ...tenant.limits.facilities, max: features.maxFacilities },
    users: { ...tenant.limits.users, max: features.maxUsersPerFacility * features.maxFacilities },
    rinks: { ...tenant.limits.rinks, max: features.maxRinks },
  };
  tenant.updatedAt = new Date();

  if (newPlan !== 'free' && tenant.status === 'trial') {
    tenant.status = 'active';
    tenant.trialEndsAt = undefined;
  }

  tenants.set(id, tenant);
  return tenant;
}

// Suspend tenant
export async function suspendTenant(id: string, reason: string): Promise<Tenant | null> {
  const tenant = tenants.get(id);
  if (!tenant) return null;

  tenant.status = 'suspended';
  tenant.suspendedAt = new Date();
  tenant.suspendedReason = reason;
  tenant.updatedAt = new Date();

  tenants.set(id, tenant);
  return tenant;
}

// Reactivate tenant
export async function reactivateTenant(id: string): Promise<Tenant | null> {
  const tenant = tenants.get(id);
  if (!tenant || tenant.status !== 'suspended') return null;

  tenant.status = 'active';
  tenant.suspendedAt = undefined;
  tenant.suspendedReason = undefined;
  tenant.updatedAt = new Date();

  tenants.set(id, tenant);
  return tenant;
}

// Get tenant members
export async function getTenantMembers(tenantId: string): Promise<TenantMember[]> {
  return members.get(tenantId) || [];
}

// Add member to tenant
export async function addTenantMember(
  tenantId: string,
  userId: string,
  role: TenantMember['role'] = 'member'
): Promise<TenantMember | null> {
  const tenant = tenants.get(tenantId);
  if (!tenant) return null;

  const memberList = members.get(tenantId) || [];

  // Check if already a member
  if (memberList.some((m) => m.userId === userId)) {
    return null;
  }

  const newMember: TenantMember = {
    userId,
    tenantId,
    role,
    permissions: role === 'owner' ? ['*'] : role === 'admin' ? ['manage'] : ['view'],
    joinedAt: new Date(),
  };

  memberList.push(newMember);
  members.set(tenantId, memberList);

  // Update user count
  tenant.limits.users.used++;
  tenants.set(tenantId, tenant);

  return newMember;
}

// Remove member from tenant
export async function removeTenantMember(
  tenantId: string,
  userId: string
): Promise<boolean> {
  const tenant = tenants.get(tenantId);
  if (!tenant) return false;

  const memberList = members.get(tenantId) || [];
  const index = memberList.findIndex((m) => m.userId === userId);

  if (index === -1) return false;

  // Prevent removing the owner
  if (memberList[index].role === 'owner') return false;

  memberList.splice(index, 1);
  members.set(tenantId, memberList);

  tenant.limits.users.used--;
  tenants.set(tenantId, tenant);

  return true;
}

// Create invitation
export async function createInvitation(
  tenantId: string,
  email: string,
  role: TenantMember['role'],
  invitedBy: string
): Promise<TenantInvitation> {
  const invitation: TenantInvitation = {
    id: uuid(),
    tenantId,
    email,
    role,
    invitedBy,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };

  invitations.set(invitation.id, invitation);
  return invitation;
}

// Accept invitation
export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<TenantMember | null> {
  const invitation = invitations.get(invitationId);
  if (!invitation) return null;

  if (invitation.expiresAt < new Date()) {
    invitations.delete(invitationId);
    return null;
  }

  invitation.acceptedAt = new Date();
  invitations.set(invitationId, invitation);

  return addTenantMember(invitation.tenantId, userId, invitation.role);
}

// Get user's tenants
export async function getUserTenants(userId: string): Promise<Tenant[]> {
  const userTenants: Tenant[] = [];

  members.forEach((memberList, tenantId) => {
    if (memberList.some((m) => m.userId === userId)) {
      const tenant = tenants.get(tenantId);
      if (tenant) userTenants.push(tenant);
    }
  });

  return userTenants;
}

// Update usage limits
export async function updateUsage(
  tenantId: string,
  limit: keyof Tenant['limits'],
  delta: number
): Promise<void> {
  const tenant = tenants.get(tenantId);
  if (!tenant) return;

  tenant.limits[limit].used += delta;
  tenants.set(tenantId, tenant);
}
