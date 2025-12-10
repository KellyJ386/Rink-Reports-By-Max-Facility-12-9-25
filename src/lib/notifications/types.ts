// Notification Types and Interfaces

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'alert'
  | 'incident'
  | 'ice_depth'
  | 'schedule'
  | 'maintenance'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  createdAt: Date;
  readAt?: Date;
  dismissedAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  userId: string;
  facilityId?: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: {
    incidents: { enabled: boolean; priority: NotificationPriority };
    ice_depth: { enabled: boolean; priority: NotificationPriority };
    schedule: { enabled: boolean; priority: NotificationPriority };
    maintenance: { enabled: boolean; priority: NotificationPriority };
    system: { enabled: boolean; priority: NotificationPriority };
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  digestPreference: 'instant' | 'hourly' | 'daily' | 'weekly';
}

export interface CreateNotificationInput {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  userId?: string;
  userIds?: string[];
  facilityId?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  channels?: NotificationChannel[];
}

export interface NotificationFilter {
  unreadOnly?: boolean;
  types?: NotificationType[];
  priority?: NotificationPriority;
  facilityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}
