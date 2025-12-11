'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  initDB,
  STORES,
  StoreName,
  getAllItems,
  putItem,
  deleteItem,
  countItems,
  getStorageEstimate,
  OfflineQueueItem,
} from '@/lib/offline/storage';

// Types
export interface OfflineStatus {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  queuedChangesCount: number;
  lastSyncTime: Date | null;
  storageEstimate: {
    usage: number;
    quota: number;
    percentUsed: number;
  } | null;
}

export interface SyncResult {
  successCount: number;
  failCount: number;
  remainingCount: number;
}

// Hook for overall offline status
export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isServiceWorkerReady: false,
    queuedChangesCount: 0,
    lastSyncTime: null,
    storageEstimate: null,
  });

  useEffect(() => {
    // Initialize database
    initDB().catch(console.error);

    // Online/offline listeners
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      // Trigger sync when coming back online
      triggerSync();
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service worker ready check
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setStatus((prev) => ({ ...prev, isServiceWorkerReady: true }));
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // Initial queue count
    updateQueueCount();

    // Get storage estimate
    updateStorageEstimate();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const handleSWMessage = useCallback((event: MessageEvent) => {
    const { type, data, successCount, failCount, remainingCount, count } = event.data || {};

    switch (type) {
      case 'OFFLINE_QUEUE_UPDATED':
        setStatus((prev) => ({ ...prev, queuedChangesCount: count }));
        break;

      case 'SYNC_COMPLETE':
        setStatus((prev) => ({
          ...prev,
          queuedChangesCount: remainingCount,
          lastSyncTime: new Date(),
        }));
        break;

      case 'OFFLINE_QUEUE_COUNT':
        setStatus((prev) => ({ ...prev, queuedChangesCount: data }));
        break;
    }
  }, []);

  const updateQueueCount = useCallback(async () => {
    try {
      const count = await countItems(STORES.OFFLINE_QUEUE);
      setStatus((prev) => ({ ...prev, queuedChangesCount: count }));
    } catch (error) {
      console.error('Failed to get queue count:', error);
    }
  }, []);

  const updateStorageEstimate = useCallback(async () => {
    const estimate = await getStorageEstimate();
    if (estimate) {
      setStatus((prev) => ({ ...prev, storageEstimate: estimate }));
    }
  }, []);

  const triggerSync = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' });
    }
  }, []);

  return {
    ...status,
    triggerSync,
    updateQueueCount,
  };
}

// Hook for service worker registration
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    }
  }, []);

  const skipWaiting = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  const clearCache = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
  }, []);

  return {
    registration,
    updateAvailable,
    skipWaiting,
    clearCache,
  };
}

// Hook for local data caching
export function useLocalData<T extends { id: string }>(storeName: StoreName) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getAllItems<T>(storeName);
      setData(items);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [storeName]);

  // Save item to IndexedDB
  const saveItem = useCallback(
    async (item: T) => {
      try {
        await putItem(storeName, item);
        setData((prev) => {
          const index = prev.findIndex((i) => i.id === item.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = item;
            return updated;
          }
          return [...prev, item];
        });
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [storeName]
  );

  // Remove item from IndexedDB
  const removeItem = useCallback(
    async (id: string) => {
      try {
        await deleteItem(storeName, id);
        setData((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [storeName]
  );

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    loadData,
    saveItem,
    removeItem,
  };
}

// Hook for push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscription(sub);
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  const subscribe = useCallback(async (vapidPublicKey: string) => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    const reg = await navigator.serviceWorker.ready;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    setSubscription(subscription);
    return subscription;
  }, []);

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
    }
  }, [subscription]);

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

// Helper function for VAPID key conversion
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Hook for network status with auto-retry
export function useNetworkAwareRequest<T>(
  fetchFn: () => Promise<T>,
  options: {
    retryOnReconnect?: boolean;
    maxRetries?: number;
  } = {}
) {
  const { retryOnReconnect = true, maxRetries = 3 } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (retryOnReconnect && error) {
        execute();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, retryOnReconnect]);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await fetchFn();
        setData(result);
        setIsLoading(false);
        return result;
      } catch (err) {
        lastError = err as Error;
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    setError(lastError);
    setIsLoading(false);
    throw lastError;
  }, [fetchFn, maxRetries]);

  return {
    data,
    isLoading,
    error,
    isOnline,
    execute,
  };
}
