// API Key Management

import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import type { APIKey, APIPermission } from './types';

// In-memory store
const apiKeys: Map<string, APIKey> = new Map();
const keyLookup: Map<string, string> = new Map(); // hash -> id

// Generate a new API key
export function generateAPIKey(): { key: string; hash: string } {
  const key = `mfo_${crypto.randomBytes(32).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, hash };
}

// Create a new API key
export async function createAPIKey(
  name: string,
  tenantId: string,
  permissions: APIPermission[],
  createdBy: string,
  options?: {
    facilityId?: string;
    rateLimit?: number;
    expiresAt?: Date;
  }
): Promise<{ apiKey: APIKey; plainKey: string }> {
  const { key: plainKey, hash } = generateAPIKey();

  const apiKey: APIKey = {
    id: uuid(),
    name,
    key: hash,
    keyPrefix: plainKey.substring(0, 12),
    tenantId,
    facilityId: options?.facilityId,
    permissions,
    rateLimit: options?.rateLimit || 1000,
    expiresAt: options?.expiresAt,
    createdBy,
    createdAt: new Date(),
    isActive: true,
  };

  apiKeys.set(apiKey.id, apiKey);
  keyLookup.set(hash, apiKey.id);

  return { apiKey, plainKey };
}

// Validate an API key
export async function validateAPIKey(key: string): Promise<APIKey | null> {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const keyId = keyLookup.get(hash);

  if (!keyId) return null;

  const apiKey = apiKeys.get(keyId);
  if (!apiKey) return null;

  // Check if active
  if (!apiKey.isActive) return null;

  // Check if expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null;
  }

  // Update last used
  apiKey.lastUsedAt = new Date();
  apiKeys.set(keyId, apiKey);

  return apiKey;
}

// Get API keys for a tenant
export async function getAPIKeys(tenantId: string): Promise<APIKey[]> {
  return Array.from(apiKeys.values())
    .filter((k) => k.tenantId === tenantId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Get a single API key
export async function getAPIKey(id: string, tenantId: string): Promise<APIKey | null> {
  const apiKey = apiKeys.get(id);
  if (!apiKey || apiKey.tenantId !== tenantId) return null;
  return apiKey;
}

// Update API key
export async function updateAPIKey(
  id: string,
  tenantId: string,
  updates: Partial<Pick<APIKey, 'name' | 'permissions' | 'rateLimit' | 'isActive'>>
): Promise<APIKey | null> {
  const apiKey = apiKeys.get(id);
  if (!apiKey || apiKey.tenantId !== tenantId) return null;

  const updated = { ...apiKey, ...updates };
  apiKeys.set(id, updated);
  return updated;
}

// Revoke API key
export async function revokeAPIKey(id: string, tenantId: string): Promise<boolean> {
  const apiKey = apiKeys.get(id);
  if (!apiKey || apiKey.tenantId !== tenantId) return false;

  apiKey.isActive = false;
  apiKeys.set(id, apiKey);
  return true;
}

// Delete API key
export async function deleteAPIKey(id: string, tenantId: string): Promise<boolean> {
  const apiKey = apiKeys.get(id);
  if (!apiKey || apiKey.tenantId !== tenantId) return false;

  keyLookup.delete(apiKey.key);
  return apiKeys.delete(id);
}

// Check if API key has permission
export function hasPermission(apiKey: APIKey, permission: APIPermission): boolean {
  // Admin has all permissions
  if (apiKey.permissions.includes('admin')) return true;

  // Check specific permission
  if (apiKey.permissions.includes(permission)) return true;

  // Check for wildcard read/write permissions
  const [action, resource] = permission.split(':');
  const wildcardPermission = `${action}:*` as APIPermission;
  if (apiKey.permissions.includes(wildcardPermission)) return true;

  return false;
}

// Rotate API key (create new, revoke old)
export async function rotateAPIKey(
  id: string,
  tenantId: string
): Promise<{ apiKey: APIKey; plainKey: string } | null> {
  const oldKey = apiKeys.get(id);
  if (!oldKey || oldKey.tenantId !== tenantId) return null;

  // Create new key with same permissions
  const result = await createAPIKey(
    oldKey.name,
    tenantId,
    oldKey.permissions,
    oldKey.createdBy,
    {
      facilityId: oldKey.facilityId,
      rateLimit: oldKey.rateLimit,
      expiresAt: oldKey.expiresAt,
    }
  );

  // Revoke old key
  await revokeAPIKey(id, tenantId);

  return result;
}
