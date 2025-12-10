'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import {
  BellIcon,
  FunnelIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { NotificationType, NotificationPriority } from '@/lib/notifications/types';

const typeFilters: { value: NotificationType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'incident', label: 'Incidents' },
  { value: 'ice_depth', label: 'Ice Depth' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'system', label: 'System' },
];

const priorityFilters: { value: NotificationPriority | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Priorities', color: 'gray' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
  { value: 'high', label: 'High', color: 'yellow' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'low', label: 'Low', color: 'gray' },
];

export default function NotificationsPage() {
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
    delete: deleteNotification,
  } = useNotifications({
    unreadOnly: showUnreadOnly,
    types: selectedType !== 'all' ? [selectedType] : undefined,
  });

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (n.dismissedAt) return false;
    if (selectedType !== 'all' && n.type !== selectedType) return false;
    if (selectedPriority !== 'all' && n.priority !== selectedPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllAsRead}>
              <CheckIcon className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedType(filter.value)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  selectedType === filter.value
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden md:block" />

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as NotificationPriority | 'all')}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
          >
            {priorityFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          {/* Unread Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Unread only</span>
          </label>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {notifications.length}
          </p>
          <p className="text-sm text-gray-500">Total</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-primary-600">{unreadCount}</p>
          <p className="text-sm text-gray-500">Unread</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-red-600">
            {notifications.filter((n) => n.priority === 'urgent').length}
          </p>
          <p className="text-sm text-gray-500">Urgent</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-yellow-600">
            {notifications.filter((n) => n.priority === 'high').length}
          </p>
          <p className="text-sm text-gray-500">High Priority</p>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="divide-y dark:divide-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <BellIcon className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600" />
            <p>No notifications match your filters</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div key={notification.id} className="p-4">
              <NotificationItem
                notification={notification}
                onMarkAsRead={markAsRead}
                onDismiss={dismiss}
              />
            </div>
          ))
        )}
      </Card>

      {/* Pagination would go here */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredNotifications.length} notification
            {filteredNotifications.length !== 1 ? 's' : ''}
          </p>
          <Button variant="secondary" size="sm">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
