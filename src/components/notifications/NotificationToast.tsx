'use client';

import { Fragment, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/notifications/types';

interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastIcons = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
};

const toastColors = {
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
};

const iconColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

interface NotificationToastProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

function NotificationToastItem({ toast, onDismiss }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = toastIcons[toast.type];

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <Transition
      show={isVisible}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={cn(
          'w-full max-w-sm rounded-lg border shadow-lg pointer-events-auto',
          toastColors[toast.type]
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Icon className={cn('w-5 h-5 flex-shrink-0', iconColors[toast.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-sm opacity-90">{toast.message}</p>
              )}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="mt-2 text-sm font-medium underline hover:no-underline"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onDismiss(toast.id), 300);
              }}
              className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  );
}

// Toast container and hook
let toastQueue: ToastNotification[] = [];
let listeners: ((toasts: ToastNotification[]) => void)[] = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...toastQueue]));
}

export function showToast(toast: Omit<ToastNotification, 'id'>) {
  const id = Math.random().toString(36).substring(7);
  toastQueue.push({ ...toast, id });
  notifyListeners();
  return id;
}

export function dismissToast(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  notifyListeners();
}

export function clearAllToasts() {
  toastQueue = [];
  notifyListeners();
}

// Convenience methods
export const toast = {
  info: (title: string, message?: string) => showToast({ type: 'info', title, message }),
  success: (title: string, message?: string) => showToast({ type: 'success', title, message }),
  warning: (title: string, message?: string) => showToast({ type: 'warning', title, message }),
  error: (title: string, message?: string) => showToast({ type: 'error', title, message }),
};

// Toast container component
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex items-end px-4 py-6 pointer-events-none sm:items-start sm:p-6"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((t) => (
          <NotificationToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </div>
  );
}

// Convert real-time notification to toast
export function notificationToToast(notification: Notification): void {
  const typeMap: Record<string, ToastNotification['type']> = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
    alert: 'warning',
    incident: 'error',
    ice_depth: 'warning',
    schedule: 'info',
    maintenance: 'info',
    system: 'info',
  };

  showToast({
    type: typeMap[notification.type] || 'info',
    title: notification.title,
    message: notification.message,
    duration: notification.priority === 'urgent' ? 0 : 5000,
    action: notification.actionUrl
      ? {
          label: notification.actionLabel || 'View',
          onClick: () => {
            window.location.href = notification.actionUrl!;
          },
        }
      : undefined,
  });
}
