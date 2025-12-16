'use client';

import { Fragment, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CheckIcon,
  BellIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotifications, useNotificationSubscription } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationCenterProps {
  position?: 'left' | 'right';
  maxHeight?: string;
}

export function NotificationCenter({
  position = 'right',
  maxHeight = '80vh',
}: NotificationCenterProps) {
  const { isOpen, setOpen } = useNotificationStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh,
  } = useNotifications();

  // Subscribe to real-time notifications
  useNotificationSubscription();

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, setOpen]);

  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter((n) => !n.dismissedAt);

  return (
    <>
      {/* Backdrop */}
      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition-opacity duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
          onClick={() => setOpen(false)}
        />
      </Transition>

      {/* Panel */}
      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition-transform duration-200"
        enterFrom={position === 'right' ? 'translate-x-full' : '-translate-x-full'}
        enterTo="translate-x-0"
        leave="transition-transform duration-150"
        leaveFrom="translate-x-0"
        leaveTo={position === 'right' ? 'translate-x-full' : '-translate-x-full'}
      >
        <div
          className={cn(
            'fixed top-0 z-50 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl',
            position === 'right' ? 'right-0' : 'left-0'
          )}
          style={{ maxHeight }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-3">
              <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/settings/notifications"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Notification settings"
              >
                <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close notifications"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <CheckIcon className="w-4 h-4" />
                Mark all as read
              </button>
              <button
                onClick={refresh}
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
              >
                Refresh
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div
            className="overflow-y-auto"
            style={{ height: 'calc(100% - 120px)' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <BellIcon className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {visibleNotifications.map((notification) => (
                  <div key={notification.id} className="p-2">
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={dismiss}
                      compact
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)}>
              <Button variant="secondary" className="w-full">
                View All Notifications
              </Button>
            </Link>
          </div>
        </div>
      </Transition>
    </>
  );
}
