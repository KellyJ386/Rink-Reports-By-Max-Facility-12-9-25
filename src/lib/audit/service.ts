// Audit Logging Service

import { v4 as uuid } from 'uuid';
import type {
  AuditLogEntry,
  AuditLogFilter,
  AuditLogStats,
  CreateAuditLogInput,
  AuditAction,
  AuditResource,
} from './types';
import { determineSeverity, generateDescription } from './types';

// In-memory store for demo (would use database in production)
const auditLogs: Map<string, AuditLogEntry> = new Map();

// User context for audit logging
interface AuditContext {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  facilityId?: string;
  facilityName?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

let currentContext: AuditContext = {};

// Set the current audit context (called from middleware)
export function setAuditContext(context: AuditContext): void {
  currentContext = { ...context };
}

// Clear the audit context
export function clearAuditContext(): void {
  currentContext = {};
}

// Get the current audit context
export function getAuditContext(): AuditContext {
  return { ...currentContext };
}

// Create an audit log entry
export async function createAuditLog(
  input: CreateAuditLogInput
): Promise<AuditLogEntry> {
  const context = getAuditContext();

  const entry: AuditLogEntry = {
    id: uuid(),
    timestamp: new Date(),
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    resourceName: input.resourceName,
    userId: input.userId || context.userId,
    userName: context.userName,
    userEmail: context.userEmail,
    userRole: context.userRole,
    facilityId: input.facilityId || context.facilityId,
    facilityName: context.facilityName,
    ipAddress: input.ipAddress || context.ipAddress,
    userAgent: input.userAgent || context.userAgent,
    sessionId: input.sessionId || context.sessionId,
    severity: determineSeverity(input.action, input.resource),
    description:
      input.description ||
      generateDescription(
        input.action,
        input.resource,
        input.resourceName,
        context.userName
      ),
    metadata: input.metadata,
    changes: input.changes,
    outcome: input.outcome || 'SUCCESS',
    errorMessage: input.errorMessage,
  };

  auditLogs.set(entry.id, entry);

  // In production, this would also persist to database
  console.log(`[AUDIT] ${entry.severity} | ${entry.description}`);

  return entry;
}

// Convenience logging functions
export async function logCreate(
  resource: AuditResource,
  resourceId: string,
  resourceName?: string,
  metadata?: Record<string, unknown>
): Promise<AuditLogEntry> {
  return createAuditLog({
    action: 'CREATE',
    resource,
    resourceId,
    resourceName,
    metadata,
  });
}

export async function logUpdate(
  resource: AuditResource,
  resourceId: string,
  resourceName?: string,
  changes?: AuditLogEntry['changes']
): Promise<AuditLogEntry> {
  return createAuditLog({
    action: 'UPDATE',
    resource,
    resourceId,
    resourceName,
    changes,
  });
}

export async function logDelete(
  resource: AuditResource,
  resourceId: string,
  resourceName?: string
): Promise<AuditLogEntry> {
  return createAuditLog({
    action: 'DELETE',
    resource,
    resourceId,
    resourceName,
  });
}

export async function logLogin(
  userId: string,
  success: boolean,
  errorMessage?: string
): Promise<AuditLogEntry> {
  return createAuditLog({
    action: 'LOGIN',
    resource: 'SESSION',
    userId,
    outcome: success ? 'SUCCESS' : 'FAILURE',
    errorMessage,
  });
}

export async function logLogout(userId: string): Promise<AuditLogEntry> {
  return createAuditLog({
    action: 'LOGOUT',
    resource: 'SESSION',
    userId,
  });
}

export async function logExport(
  resource: AuditResource,
  metadata?: Record<string, unknown>
): Promise<AuditLogEntry> {
  return createAuditLog({
    action: 'EXPORT',
    resource,
    metadata,
  });
}

// Query audit logs
export async function getAuditLogs(
  filter?: AuditLogFilter
): Promise<AuditLogEntry[]> {
  let results = Array.from(auditLogs.values());

  if (filter?.startDate) {
    results = results.filter((log) => log.timestamp >= filter.startDate!);
  }

  if (filter?.endDate) {
    results = results.filter((log) => log.timestamp <= filter.endDate!);
  }

  if (filter?.actions?.length) {
    results = results.filter((log) => filter.actions!.includes(log.action));
  }

  if (filter?.resources?.length) {
    results = results.filter((log) => filter.resources!.includes(log.resource));
  }

  if (filter?.severity?.length) {
    results = results.filter((log) => filter.severity!.includes(log.severity));
  }

  if (filter?.userId) {
    results = results.filter((log) => log.userId === filter.userId);
  }

  if (filter?.facilityId) {
    results = results.filter((log) => log.facilityId === filter.facilityId);
  }

  if (filter?.resourceId) {
    results = results.filter((log) => log.resourceId === filter.resourceId);
  }

  if (filter?.outcome) {
    results = results.filter((log) => log.outcome === filter.outcome);
  }

  if (filter?.searchTerm) {
    const term = filter.searchTerm.toLowerCase();
    results = results.filter(
      (log) =>
        log.description.toLowerCase().includes(term) ||
        log.userName?.toLowerCase().includes(term) ||
        log.userEmail?.toLowerCase().includes(term) ||
        log.resourceName?.toLowerCase().includes(term)
    );
  }

  // Sort by timestamp descending
  results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply pagination
  const offset = filter?.offset || 0;
  const limit = filter?.limit || 100;
  results = results.slice(offset, offset + limit);

  return results;
}

// Get a single audit log entry
export async function getAuditLog(id: string): Promise<AuditLogEntry | null> {
  return auditLogs.get(id) || null;
}

// Get audit log statistics
export async function getAuditStats(
  filter?: Pick<AuditLogFilter, 'facilityId' | 'userId' | 'startDate' | 'endDate'>
): Promise<AuditLogStats> {
  let logs = Array.from(auditLogs.values());

  if (filter?.facilityId) {
    logs = logs.filter((log) => log.facilityId === filter.facilityId);
  }

  if (filter?.userId) {
    logs = logs.filter((log) => log.userId === filter.userId);
  }

  if (filter?.startDate) {
    logs = logs.filter((log) => log.timestamp >= filter.startDate!);
  }

  if (filter?.endDate) {
    logs = logs.filter((log) => log.timestamp <= filter.endDate!);
  }

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats: AuditLogStats = {
    total: logs.length,
    byAction: {} as Record<AuditAction, number>,
    byResource: {} as Record<AuditResource, number>,
    bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    byOutcome: { SUCCESS: 0, FAILURE: 0, PARTIAL: 0 },
    recentActivity: {
      lastHour: logs.filter((l) => l.timestamp >= hourAgo).length,
      last24Hours: logs.filter((l) => l.timestamp >= dayAgo).length,
      last7Days: logs.filter((l) => l.timestamp >= weekAgo).length,
    },
  };

  for (const log of logs) {
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
    stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
    stats.byOutcome[log.outcome] = (stats.byOutcome[log.outcome] || 0) + 1;
  }

  return stats;
}

// Get audit trail for a specific resource
export async function getResourceAuditTrail(
  resource: AuditResource,
  resourceId: string
): Promise<AuditLogEntry[]> {
  return getAuditLogs({
    resources: [resource],
    resourceId,
  });
}

// Get user activity
export async function getUserActivity(
  userId: string,
  limit?: number
): Promise<AuditLogEntry[]> {
  return getAuditLogs({
    userId,
    limit: limit || 50,
  });
}

// Clean up old audit logs (retention policy)
export async function cleanupAuditLogs(
  retentionDays: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  let deletedCount = 0;
  auditLogs.forEach((log, id) => {
    if (log.timestamp < cutoffDate) {
      auditLogs.delete(id);
      deletedCount++;
    }
  });

  return deletedCount;
}

// Seed some demo audit logs
export function seedDemoAuditLogs(): void {
  const demoLogs: CreateAuditLogInput[] = [
    {
      action: 'LOGIN',
      resource: 'SESSION',
      userId: 'user-1',
      outcome: 'SUCCESS',
    },
    {
      action: 'CREATE',
      resource: 'INCIDENT',
      resourceId: 'inc-1',
      resourceName: 'Slip and Fall - Rink A',
    },
    {
      action: 'UPDATE',
      resource: 'USER',
      resourceId: 'user-2',
      resourceName: 'John Smith',
      changes: {
        fields: ['role', 'email'],
        before: { role: 'STAFF', email: 'old@email.com' },
        after: { role: 'MANAGER', email: 'new@email.com' },
      },
    },
    {
      action: 'EXPORT',
      resource: 'REPORT',
      metadata: { format: 'PDF', records: 150 },
    },
    {
      action: 'DELETE',
      resource: 'FORM_SUBMISSION',
      resourceId: 'form-1',
    },
    {
      action: 'APPROVE',
      resource: 'SHIFT',
      resourceId: 'shift-1',
      resourceName: 'Time-off request',
    },
  ];

  setAuditContext({
    userId: 'demo-user',
    userName: 'Demo Admin',
    userEmail: 'admin@demo.com',
    userRole: 'SUPER_ADMIN',
    ipAddress: '192.168.1.1',
  });

  demoLogs.forEach((log) => {
    createAuditLog(log);
  });

  clearAuditContext();
}
