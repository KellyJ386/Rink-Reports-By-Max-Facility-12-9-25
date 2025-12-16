// API Types and Interfaces

export interface APIKey {
  id: string;
  name: string;
  key: string; // hashed
  keyPrefix: string; // first 8 chars for display
  tenantId: string;
  facilityId?: string;
  permissions: APIPermission[];
  rateLimit: number; // requests per hour
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export type APIPermission =
  | 'read:incidents'
  | 'write:incidents'
  | 'read:ice_depth'
  | 'write:ice_depth'
  | 'read:schedules'
  | 'write:schedules'
  | 'read:users'
  | 'write:users'
  | 'read:forms'
  | 'write:forms'
  | 'read:reports'
  | 'write:reports'
  | 'admin';

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | string[] | number | boolean | undefined;
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  tenantId: string;
  facilityId?: string;
  isActive: boolean;
  retryCount: number;
  lastTriggeredAt?: Date;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export type WebhookEvent =
  | 'incident.created'
  | 'incident.updated'
  | 'incident.resolved'
  | 'ice_depth.recorded'
  | 'ice_depth.alert'
  | 'schedule.created'
  | 'schedule.updated'
  | 'user.created'
  | 'user.updated'
  | 'form.submitted'
  | 'maintenance.scheduled'
  | 'maintenance.completed';

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: Date;
  data: unknown;
  tenantId: string;
  facilityId?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  payload: WebhookPayload;
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  responseBody?: string;
  error?: string;
  attempts: number;
  nextRetryAt?: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export interface APIVersion {
  version: string;
  status: 'current' | 'deprecated' | 'sunset';
  sunsetDate?: Date;
  documentation: string;
}

export const API_VERSIONS: APIVersion[] = [
  {
    version: 'v1',
    status: 'current',
    documentation: '/api/docs/v1',
  },
];

export const WEBHOOK_EVENTS: { event: WebhookEvent; description: string }[] = [
  { event: 'incident.created', description: 'When a new incident is reported' },
  { event: 'incident.updated', description: 'When an incident is updated' },
  { event: 'incident.resolved', description: 'When an incident is resolved' },
  { event: 'ice_depth.recorded', description: 'When ice depth is recorded' },
  { event: 'ice_depth.alert', description: 'When ice depth triggers an alert' },
  { event: 'schedule.created', description: 'When a schedule is created' },
  { event: 'schedule.updated', description: 'When a schedule is updated' },
  { event: 'user.created', description: 'When a user is created' },
  { event: 'user.updated', description: 'When a user is updated' },
  { event: 'form.submitted', description: 'When a form is submitted' },
  { event: 'maintenance.scheduled', description: 'When maintenance is scheduled' },
  { event: 'maintenance.completed', description: 'When maintenance is completed' },
];

export const API_PERMISSIONS: { permission: APIPermission; description: string }[] = [
  { permission: 'read:incidents', description: 'Read incident data' },
  { permission: 'write:incidents', description: 'Create and update incidents' },
  { permission: 'read:ice_depth', description: 'Read ice depth data' },
  { permission: 'write:ice_depth', description: 'Record ice depth measurements' },
  { permission: 'read:schedules', description: 'Read schedule data' },
  { permission: 'write:schedules', description: 'Create and update schedules' },
  { permission: 'read:users', description: 'Read user data' },
  { permission: 'write:users', description: 'Create and update users' },
  { permission: 'read:forms', description: 'Read form submissions' },
  { permission: 'write:forms', description: 'Submit forms' },
  { permission: 'read:reports', description: 'Read and generate reports' },
  { permission: 'write:reports', description: 'Create report templates' },
  { permission: 'admin', description: 'Full administrative access' },
];
