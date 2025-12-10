// Audit Logging Module

export * from './types';
export * from './service';

// Audit log configuration
export const auditConfig = {
  // Retention period in days
  retentionDays: 90,

  // Actions that should always be logged
  alwaysLogActions: [
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'EXPORT',
    'ENABLE',
    'DISABLE',
  ] as const,

  // Resources that require audit logging
  auditedResources: [
    'USER',
    'FACILITY',
    'INCIDENT',
    'PERMISSION',
    'ROLE',
    'SETTINGS',
    'API_KEY',
  ] as const,

  // Severity thresholds for alerting
  alertThresholds: {
    CRITICAL: 'immediate',
    HIGH: '5_minutes',
    MEDIUM: 'hourly',
    LOW: 'daily',
  } as const,

  // Log rotation settings
  rotation: {
    enabled: true,
    maxSize: '100MB',
    maxFiles: 10,
    compress: true,
  },
};

// Audit decorator for use with API routes or service functions
export function withAudit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: {
    action: import('./types').AuditAction;
    resource: import('./types').AuditResource;
    getResourceId?: (...args: Parameters<T>) => string | undefined;
    getResourceName?: (...args: Parameters<T>) => string | undefined;
    getMetadata?: (...args: Parameters<T>) => Record<string, unknown> | undefined;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const { createAuditLog } = await import('./service');

    try {
      const result = await fn(...args);

      await createAuditLog({
        action: options.action,
        resource: options.resource,
        resourceId: options.getResourceId?.(...args),
        resourceName: options.getResourceName?.(...args),
        metadata: options.getMetadata?.(...args),
        outcome: 'SUCCESS',
      });

      return result;
    } catch (error) {
      await createAuditLog({
        action: options.action,
        resource: options.resource,
        resourceId: options.getResourceId?.(...args),
        resourceName: options.getResourceName?.(...args),
        metadata: options.getMetadata?.(...args),
        outcome: 'FAILURE',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }) as T;
}

// Hook for components to use audit logging
export function useAuditAction() {
  const { createAuditLog } = require('./service');

  return {
    logAction: async (
      action: import('./types').AuditAction,
      resource: import('./types').AuditResource,
      details?: {
        resourceId?: string;
        resourceName?: string;
        metadata?: Record<string, unknown>;
        changes?: import('./types').AuditLogEntry['changes'];
      }
    ) => {
      return createAuditLog({
        action,
        resource,
        ...details,
      });
    },
  };
}
