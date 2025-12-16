'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BellAlertIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  CalendarIcon,
  WrenchIcon,
  CogIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType, NotificationPriority } from '@/lib/notifications/types';

const typeIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
  alert: BellAlertIcon,
  incident: ExclamationCircleIcon,
  ice_depth: ChartBarIcon,
  schedule: CalendarIcon,
  maintenance: WrenchIcon,
  system: CogIcon,
};

const typeColors: Record<NotificationType, string> = {
  info: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20',
  success: 'text-green-500 bg-green-100 dark:bg-green-900/20',
  warning: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20',
  error: 'text-red-500 bg-red-100 dark:bg-red-900/20',
  alert: 'text-orange-500 bg-orange-100 dark:bg-orange-900/20',
  incident: 'text-red-500 bg-red-100 dark:bg-red-900/20',
  ice_depth: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20',
  schedule: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20',
  maintenance: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
  system: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
};

const priorityColors: Record<NotificationPriority, string> = {
  low: 'border-l-gray-400',
  medium: 'border-l-blue-400',
  high: 'border-l-yellow-400',
  urgent: 'border-l-red-500',
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  compact = false,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || InformationCircleIcon;
  const isUnread = !notification.readAt;

  const handleClick = () => {
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <div
      className={cn(
        'relative flex gap-3 p-4 rounded-lg border-l-4 transition-colors',
        priorityColors[notification.priority],
        isUnread
          ? 'bg-primary-50/50 dark:bg-primary-900/10'
          : 'bg-white dark:bg-gray-800',
        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
        compact && 'p-3'
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          typeColors[notification.type],
          compact && 'w-8 h-8'
        )}
      >
        <Icon className={cn('w-5 h-5', compact && 'w-4 h-4')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium text-gray-900 dark:text-white',
              isUnread && 'font-semibold'
            )}
          >
            {notification.title}
          </p>
          {onDismiss && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDismiss(notification.id);
              }}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        <p
          className={cn(
            'text-sm text-gray-600 dark:text-gray-400 mt-0.5',
            compact && 'line-clamp-2'
          )}
        >
          {notification.message}
        </p>

        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </span>

          {notification.actionLabel && notification.actionUrl && (
            <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              {notification.actionLabel} →
            </span>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary-500" />
      )}
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
