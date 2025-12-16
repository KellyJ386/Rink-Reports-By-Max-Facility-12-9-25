'use client';

import { BellIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  onClick?: () => void;
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationBadge({
  onClick,
  className,
  showCount = true,
  size = 'md',
}: NotificationBadgeProps) {
  const { unreadCount, toggleOpen } = useNotificationStore();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      toggleOpen();
    }
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const badgeSizes = {
    sm: 'min-w-[16px] h-4 text-[10px]',
    md: 'min-w-[18px] h-[18px] text-xs',
    lg: 'min-w-[20px] h-5 text-xs',
  };

  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative rounded-lg transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        sizeClasses[size],
        className
      )}
      aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
    >
      {hasUnread ? (
        <BellAlertIcon
          className={cn(iconSizes[size], 'text-primary-600 dark:text-primary-400')}
        />
      ) : (
        <BellIcon
          className={cn(iconSizes[size], 'text-gray-600 dark:text-gray-400')}
        />
      )}

      {showCount && hasUnread && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center',
            'rounded-full bg-red-500 text-white font-medium',
            'animate-pulse',
            badgeSizes[size]
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
