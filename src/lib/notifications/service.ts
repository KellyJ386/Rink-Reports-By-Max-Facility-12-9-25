// Notification Service - Core Logic

import { v4 as uuid } from 'uuid';
import type {
  Notification,
  NotificationPreferences,
  CreateNotificationInput,
  NotificationFilter,
  NotificationStats,
  NotificationChannel,
} from './types';

// In-memory store for demo (would use database in production)
const notifications: Map<string, Notification> = new Map();
const preferences: Map<string, NotificationPreferences> = new Map();

// Default notification preferences
export function getDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    channels: {
      in_app: true,
      email: true,
      push: false,
      sms: false,
    },
    categories: {
      incidents: { enabled: true, priority: 'high' },
      ice_depth: { enabled: true, priority: 'high' },
      schedule: { enabled: true, priority: 'medium' },
      maintenance: { enabled: true, priority: 'medium' },
      system: { enabled: true, priority: 'low' },
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
      timezone: 'America/Chicago',
    },
    digestPreference: 'instant',
  };
}

// Create a new notification
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification[]> {
  const createdNotifications: Notification[] = [];
  const userIds = input.userIds || (input.userId ? [input.userId] : []);

  for (const userId of userIds) {
    const notification: Notification = {
      id: uuid(),
      type: input.type,
      priority: input.priority,
      title: input.title,
      message: input.message,
      createdAt: new Date(),
      expiresAt: input.expiresAt,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      metadata: input.metadata,
      userId,
      facilityId: input.facilityId,
    };

    notifications.set(notification.id, notification);
    createdNotifications.push(notification);

    // Dispatch to channels
    const channels = input.channels || ['in_app'];
    await dispatchToChannels(notification, channels, userId);
  }

  return createdNotifications;
}

// Dispatch notification to specified channels
async function dispatchToChannels(
  notification: Notification,
  channels: NotificationChannel[],
  userId: string
): Promise<void> {
  const userPrefs = await getPreferences(userId);

  for (const channel of channels) {
    // Check if channel is enabled in user preferences
    if (!userPrefs.channels[channel]) continue;

    // Check quiet hours
    if (userPrefs.quietHours.enabled && isInQuietHours(userPrefs)) {
      // Queue for later or skip non-urgent notifications
      if (notification.priority !== 'urgent') continue;
    }

    switch (channel) {
      case 'in_app':
        // Already stored in notifications map
        break;
      case 'email':
        await sendEmailNotification(notification, userId);
        break;
      case 'push':
        await sendPushNotification(notification, userId);
        break;
      case 'sms':
        await sendSmsNotification(notification, userId);
        break;
    }
  }
}

// Check if current time is within quiet hours
function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHours.enabled) return false;

  const now = new Date();
  const [startHour, startMin] = prefs.quietHours.start.split(':').map(Number);
  const [endHour, endMin] = prefs.quietHours.end.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Quiet hours span midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

// Send email notification (placeholder - integrates with existing email service)
async function sendEmailNotification(
  notification: Notification,
  _userId: string
): Promise<void> {
  // This would integrate with the existing Resend email service
  console.log(`[Email] Sending notification to user: ${notification.title}`);
}

// Send push notification
async function sendPushNotification(
  notification: Notification,
  _userId: string
): Promise<void> {
  // This would use Web Push API
  console.log(`[Push] Sending notification to user: ${notification.title}`);
}

// Send SMS notification (placeholder)
async function sendSmsNotification(
  notification: Notification,
  _userId: string
): Promise<void> {
  // This would integrate with Twilio or similar
  console.log(`[SMS] Sending notification to user: ${notification.title}`);
}

// Get notifications for a user
export async function getNotifications(
  userId: string,
  filter?: NotificationFilter
): Promise<Notification[]> {
  let results = Array.from(notifications.values()).filter(
    (n) => n.userId === userId
  );

  if (filter?.unreadOnly) {
    results = results.filter((n) => !n.readAt);
  }

  if (filter?.types?.length) {
    results = results.filter((n) => filter.types!.includes(n.type));
  }

  if (filter?.priority) {
    results = results.filter((n) => n.priority === filter.priority);
  }

  if (filter?.facilityId) {
    results = results.filter((n) => n.facilityId === filter.facilityId);
  }

  if (filter?.startDate) {
    results = results.filter((n) => n.createdAt >= filter.startDate!);
  }

  if (filter?.endDate) {
    results = results.filter((n) => n.createdAt <= filter.endDate!);
  }

  // Filter out expired notifications
  results = results.filter((n) => !n.expiresAt || n.expiresAt > new Date());

  // Sort by date descending
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Apply pagination
  const offset = filter?.offset || 0;
  const limit = filter?.limit || 50;
  results = results.slice(offset, offset + limit);

  return results;
}

// Get a single notification
export async function getNotification(
  notificationId: string,
  userId: string
): Promise<Notification | null> {
  const notification = notifications.get(notificationId);
  if (!notification || notification.userId !== userId) return null;
  return notification;
}

// Mark notification as read
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<Notification | null> {
  const notification = notifications.get(notificationId);
  if (!notification || notification.userId !== userId) return null;

  notification.readAt = new Date();
  notifications.set(notificationId, notification);
  return notification;
}

// Mark all notifications as read
export async function markAllAsRead(userId: string): Promise<number> {
  let count = 0;
  notifications.forEach((notification) => {
    if (notification.userId === userId && !notification.readAt) {
      notification.readAt = new Date();
      count++;
    }
  });
  return count;
}

// Dismiss notification
export async function dismissNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const notification = notifications.get(notificationId);
  if (!notification || notification.userId !== userId) return false;

  notification.dismissedAt = new Date();
  notifications.set(notificationId, notification);
  return true;
}

// Delete notification
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const notification = notifications.get(notificationId);
  if (!notification || notification.userId !== userId) return false;

  return notifications.delete(notificationId);
}

// Get notification stats for a user
export async function getNotificationStats(
  userId: string
): Promise<NotificationStats> {
  const userNotifications = Array.from(notifications.values()).filter(
    (n) => n.userId === userId && !n.dismissedAt
  );

  const stats: NotificationStats = {
    total: userNotifications.length,
    unread: userNotifications.filter((n) => !n.readAt).length,
    byType: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
  };

  for (const notification of userNotifications) {
    stats.byType[notification.type] =
      (stats.byType[notification.type] || 0) + 1;
    stats.byPriority[notification.priority] =
      (stats.byPriority[notification.priority] || 0) + 1;
  }

  return stats;
}

// Get user preferences
export async function getPreferences(
  userId: string
): Promise<NotificationPreferences> {
  return preferences.get(userId) || getDefaultPreferences(userId);
}

// Update user preferences
export async function updatePreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current = await getPreferences(userId);
  const updated = {
    ...current,
    ...updates,
    channels: { ...current.channels, ...updates.channels },
    categories: { ...current.categories, ...updates.categories },
    quietHours: { ...current.quietHours, ...updates.quietHours },
  };
  preferences.set(userId, updated);
  return updated;
}

// Clean up expired and old notifications
export async function cleanupNotifications(
  maxAgeDays: number = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

  let deletedCount = 0;
  notifications.forEach((notification, id) => {
    const shouldDelete =
      notification.createdAt < cutoffDate ||
      (notification.expiresAt && notification.expiresAt < new Date());

    if (shouldDelete) {
      notifications.delete(id);
      deletedCount++;
    }
  });

  return deletedCount;
}

// Broadcast notification to all users in a facility
export async function broadcastToFacility(
  facilityId: string,
  input: Omit<CreateNotificationInput, 'userId' | 'userIds' | 'facilityId'>
): Promise<Notification[]> {
  // In production, this would query users by facility
  // For demo, we'll just create with the facility ID
  return createNotification({
    ...input,
    facilityId,
    userId: 'broadcast',
  });
}

// System-wide broadcast
export async function broadcastSystem(
  input: Omit<CreateNotificationInput, 'userId' | 'userIds'>
): Promise<Notification[]> {
  // In production, this would send to all users
  return createNotification({
    ...input,
    userId: 'system-broadcast',
  });
}
