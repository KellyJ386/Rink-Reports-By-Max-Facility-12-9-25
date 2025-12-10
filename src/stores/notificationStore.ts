import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NotificationPreferences, NotificationStats } from '@/lib/notifications/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => void;
  setPreferences: (preferences: NotificationPreferences) => void;
  setStats: (stats: NotificationStats) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleOpen: () => void;
  setOpen: (isOpen: boolean) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      preferences: null,
      stats: null,
      isLoading: false,
      error: null,
      isOpen: false,

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.readAt).length;
        set({ notifications, unreadCount });
      },

      addNotification: (notification) => {
        set((state) => {
          const exists = state.notifications.some((n) => n.id === notification.id);
          if (exists) return state;

          const notifications = [notification, ...state.notifications];
          const unreadCount = notification.readAt
            ? state.unreadCount
            : state.unreadCount + 1;

          return { notifications, unreadCount };
        });
      },

      markAsRead: (notificationId) => {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === notificationId ? { ...n, readAt: new Date() } : n
          );
          const unreadCount = notifications.filter((n) => !n.readAt).length;
          return { notifications, unreadCount };
        });
      },

      markAllAsRead: () => {
        set((state) => {
          const notifications = state.notifications.map((n) => ({
            ...n,
            readAt: n.readAt || new Date(),
          }));
          return { notifications, unreadCount: 0 };
        });
      },

      dismissNotification: (notificationId) => {
        set((state) => {
          const notification = state.notifications.find(
            (n) => n.id === notificationId
          );
          const notifications = state.notifications.map((n) =>
            n.id === notificationId ? { ...n, dismissedAt: new Date() } : n
          );
          const unreadCount =
            notification && !notification.readAt
              ? state.unreadCount - 1
              : state.unreadCount;
          return { notifications, unreadCount };
        });
      },

      deleteNotification: (notificationId) => {
        set((state) => {
          const notification = state.notifications.find(
            (n) => n.id === notificationId
          );
          const notifications = state.notifications.filter(
            (n) => n.id !== notificationId
          );
          const unreadCount =
            notification && !notification.readAt
              ? state.unreadCount - 1
              : state.unreadCount;
          return { notifications, unreadCount };
        });
      },

      setPreferences: (preferences) => set({ preferences }),

      setStats: (stats) => set({ stats }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      setOpen: (isOpen) => set({ isOpen }),

      clearAll: () =>
        set({
          notifications: [],
          unreadCount: 0,
          stats: null,
          error: null,
        }),
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);

// Selector hooks for performance
export const useUnreadCount = () =>
  useNotificationStore((state) => state.unreadCount);

export const useNotifications = () =>
  useNotificationStore((state) => state.notifications);

export const useNotificationPreferences = () =>
  useNotificationStore((state) => state.preferences);
