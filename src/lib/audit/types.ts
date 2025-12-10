// Audit Log Types and Interfaces

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

export type AuditResource =
  | 'USER'
  | 'FACILITY'
  | 'RINK'
  | 'INCIDENT'
  | 'ICE_DEPTH'
  | 'SCHEDULE'
  | 'SHIFT'
  | 'FORM'
  | 'FORM_SUBMISSION'
  | 'REPORT'
  | 'NOTIFICATION'
  | 'SETTINGS'
  | 'ROLE'
  | 'PERMISSION'
  | 'SESSION'
  | 'API_KEY'
  | 'INTEGRATION'
  | 'EXPORT'
  | 'SYSTEM';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  resource: AuditResource;
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
  sessionId?: string;
  severity: AuditSeverity;
  description: string;
  metadata?: Record<string, unknown>;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    fields?: string[];
  };
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  errorMessage?: string;
}

export interface AuditLogFilter {
  startDate?: Date;
  endDate?: Date;
  actions?: AuditAction[];
  resources?: AuditResource[];
  severity?: AuditSeverity[];
  userId?: string;
  facilityId?: string;
  resourceId?: string;
  outcome?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogStats {
  total: number;
  byAction: Record<AuditAction, number>;
  byResource: Record<AuditResource, number>;
  bySeverity: Record<AuditSeverity, number>;
  byOutcome: Record<string, number>;
  recentActivity: {
    lastHour: number;
    last24Hours: number;
    last7Days: number;
  };
}

export interface CreateAuditLogInput {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  resourceName?: string;
  userId?: string;
  facilityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  changes?: AuditLogEntry['changes'];
  outcome?: AuditLogEntry['outcome'];
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

// Determine severity based on action and resource
export function determineSeverity(
  action: AuditAction,
  resource: AuditResource
): AuditSeverity {
  // Critical severity for security-related actions
  if (
    ['LOGIN', 'LOGOUT'].includes(action) &&
    resource === 'USER'
  ) {
    return 'MEDIUM';
  }

  if (
    resource === 'PERMISSION' ||
    resource === 'ROLE' ||
    resource === 'API_KEY' ||
    resource === 'SYSTEM'
  ) {
    return 'HIGH';
  }

  if (action === 'DELETE') {
    return 'HIGH';
  }

  if (['UPDATE', 'ENABLE', 'DISABLE', 'ASSIGN', 'UNASSIGN'].includes(action)) {
    return 'MEDIUM';
  }

  if (['CREATE', 'IMPORT', 'EXPORT'].includes(action)) {
    return 'MEDIUM';
  }

  return 'LOW';
}

// Generate description if not provided
export function generateDescription(
  action: AuditAction,
  resource: AuditResource,
  resourceName?: string,
  userName?: string
): string {
  const resourceLabel = resource.toLowerCase().replace(/_/g, ' ');
  const name = resourceName ? ` "${resourceName}"` : '';
  const by = userName ? ` by ${userName}` : '';

  const actionDescriptions: Record<AuditAction, string> = {
    CREATE: `Created ${resourceLabel}${name}${by}`,
    READ: `Viewed ${resourceLabel}${name}${by}`,
    UPDATE: `Updated ${resourceLabel}${name}${by}`,
    DELETE: `Deleted ${resourceLabel}${name}${by}`,
    LOGIN: `User logged in${by}`,
    LOGOUT: `User logged out${by}`,
    EXPORT: `Exported ${resourceLabel} data${by}`,
    IMPORT: `Imported ${resourceLabel} data${by}`,
    APPROVE: `Approved ${resourceLabel}${name}${by}`,
    REJECT: `Rejected ${resourceLabel}${name}${by}`,
    ASSIGN: `Assigned ${resourceLabel}${name}${by}`,
    UNASSIGN: `Unassigned ${resourceLabel}${name}${by}`,
    ENABLE: `Enabled ${resourceLabel}${name}${by}`,
    DISABLE: `Disabled ${resourceLabel}${name}${by}`,
    SEND: `Sent ${resourceLabel}${name}${by}`,
    ARCHIVE: `Archived ${resourceLabel}${name}${by}`,
    RESTORE: `Restored ${resourceLabel}${name}${by}`,
  };

  return actionDescriptions[action] || `${action} ${resourceLabel}${name}${by}`;
}
