'use client';

import { useCallback, useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification, NotificationFilter } from '@/lib/notifications/types';

// Mock API functions (would be real API calls in production)
async function fetchNotifications(filter?: NotificationFilter): Promise<Notification[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Return mock notifications
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'incident',
      priority: 'high',
      title: 'New Incident Reported',
      message: 'A slip and fall incident has been reported at Rink A.',
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      userId: 'current-user',
      facilityId: 'facility-1',
      actionUrl: '/dashboard/incidents/1',
      actionLabel: 'View Incident',
    },
    {
      id: '2',
      type: 'ice_depth',
      priority: 'urgent',
      title: 'Ice Depth Warning',
      message: 'Ice depth at Rink B is below the safe threshold (0.8").',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      userId: 'current-user',
      facilityId: 'facility-1',
      actionUrl: '/dashboard/ice-depth',
      actionLabel: 'Check Readings',
    },
    {
      id: '3',
      type: 'schedule',
      priority: 'medium',
      title: 'Shift Reminder',
      message: 'You have a shift starting in 1 hour.',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      readAt: new Date(Date.now() - 20 * 60 * 1000),
      userId: 'current-user',
    },
    {
      id: '4',
      type: 'maintenance',
      priority: 'low',
      title: 'Maintenance Scheduled',
      message: 'Zamboni maintenance is scheduled for tomorrow at 6:00 AM.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      userId: 'current-user',
    },
    {
      id: '5',
      type: 'system',
      priority: 'low',
      title: 'System Update',
      message: 'MFO has been updated to version 2.1.0 with new features.',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      userId: 'current-user',
    },
  ];

  let filtered = [...mockNotifications];

  if (filter?.unreadOnly) {
    filtered = filtered.filter((n) => !n.readAt);
  }

  if (filter?.types?.length) {
    filtered = filtered.filter((n) => filter.types!.includes(n.type));
  }

  return filtered;
}

async function markNotificationAsRead(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function markAllNotificationsAsRead(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));
}

async function deleteNotificationApi(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

export function useNotifications(filter?: NotificationFilter) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    deleteNotification,
    setLoading,
    setError,
  } = useNotificationStore();

  // Fetch notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const data = await fetchNotifications(filter);
        setNotifications(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [filter?.unreadOnly, filter?.types?.join(',')]);

  // Mark single notification as read
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markNotificationAsRead(notificationId);
        markAsRead(notificationId);
      } catch (err) {
        setError('Failed to mark notification as read');
      }
    },
    [markAsRead, setError]
  );

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      markAllAsRead();
    } catch (err) {
      setError('Failed to mark notifications as read');
    }
  }, [markAllAsRead, setError]);

  // Dismiss notification
  const handleDismiss = useCallback(
    (notificationId: string) => {
      dismissNotification(notificationId);
    },
    [dismissNotification]
  );

  // Delete notification
  const handleDelete = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotificationApi(notificationId);
        deleteNotification(notificationId);
      } catch (err) {
        setError('Failed to delete notification');
      }
    },
    [deleteNotification, setError]
  );

  // Refresh notifications
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications(filter);
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError('Failed to refresh notifications');
    } finally {
      setLoading(false);
    }
  }, [filter, setNotifications, setLoading, setError]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    dismiss: handleDismiss,
    delete: handleDelete,
    refresh,
    addNotification,
  };
}

// Hook for real-time notification updates
export function useNotificationSubscription() {
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // In production, this would connect to WebSocket or SSE
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      addNotification(event.detail);
    };

    window.addEventListener(
      'notification:new',
      handleNewNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        'notification:new',
        handleNewNotification as EventListener
      );
    };
  }, [addNotification]);
}

// Dispatch a notification event (for testing/demo)
export function dispatchNotification(notification: Notification) {
  window.dispatchEvent(
    new CustomEvent('notification:new', { detail: notification })
  );
}
