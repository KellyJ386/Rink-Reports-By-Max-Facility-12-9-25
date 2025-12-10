'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getRealtimeClient,
  type EventType,
  type RealtimeEvent,
  type ConnectionState,
} from '@/lib/realtime';

/**
 * Hook for managing realtime connection
 */
export function useRealtimeConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    reconnecting: false,
    error: null,
  });

  useEffect(() => {
    const client = getRealtimeClient();

    // Subscribe to connection state changes
    const unsubscribe = client.onConnection(setConnectionState);

    // Connect if not already connected
    if (!client.getConnectionState().connected) {
      client.connect();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const reconnect = useCallback(() => {
    const client = getRealtimeClient();
    client.disconnect();
    client.connect();
  }, []);

  return {
    ...connectionState,
    reconnect,
  };
}

/**
 * Hook for subscribing to realtime events
 *
 * @example
 * useRealtimeEvent('incident:created', (event) => {
 *   console.log('New incident:', event.payload);
 * });
 */
export function useRealtimeEvent<T = unknown>(
  type: EventType,
  handler: (event: RealtimeEvent<T>) => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const client = getRealtimeClient();

    const unsubscribe = client.on<T>(type, (event) => {
      handlerRef.current(event);
    });

    return unsubscribe;
  }, [type]);
}

/**
 * Hook for subscribing to multiple realtime events
 *
 * @example
 * useRealtimeEvents(['incident:created', 'incident:updated'], (event) => {
 *   console.log('Incident event:', event);
 * });
 */
export function useRealtimeEvents<T = unknown>(
  types: EventType[],
  handler: (event: RealtimeEvent<T>) => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const client = getRealtimeClient();

    const unsubscribers = types.map((type) =>
      client.on<T>(type, (event) => {
        handlerRef.current(event);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [types.join(',')]);
}

/**
 * Hook for sending realtime events
 */
export function useRealtimeSend() {
  const send = useCallback(<T>(type: EventType, payload: T) => {
    const client = getRealtimeClient();
    client.send(type, payload);
  }, []);

  return send;
}

/**
 * Hook for presence tracking (online users)
 */
export function usePresence(userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const client = getRealtimeClient();

    // Announce presence
    client.send('user:online', { userId });

    // Listen for user status changes
    const unsubOnline = client.on<{ userId: string }>('user:online', (event) => {
      setOnlineUsers((prev) => {
        if (!prev.includes(event.payload.userId)) {
          return [...prev, event.payload.userId];
        }
        return prev;
      });
    });

    const unsubOffline = client.on<{ userId: string }>('user:offline', (event) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== event.payload.userId));
    });

    // Announce offline on unmount
    return () => {
      client.send('user:offline', { userId });
      unsubOnline();
      unsubOffline();
    };
  }, [userId]);

  return {
    onlineUsers,
    isOnline: (id: string) => onlineUsers.includes(id),
    onlineCount: onlineUsers.length,
  };
}

/**
 * Hook for live notifications
 */
export interface LiveNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export function useLiveNotifications() {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useRealtimeEvent<LiveNotification>('notification:new', (event) => {
    const notification: LiveNotification = {
      ...event.payload,
      id: event.payload.id || crypto.randomUUID(),
      timestamp: event.timestamp,
      read: false,
    };

    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount((prev) => prev + 1);
  });

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

/**
 * Hook for optimistic updates with realtime sync
 */
export function useOptimisticUpdate<T>(
  eventType: EventType,
  initialData: T[],
  idField: keyof T = 'id' as keyof T
) {
  const [data, setData] = useState<T[]>(initialData);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  // Listen for realtime updates
  useRealtimeEvent<T>(eventType, (event) => {
    const itemId = String(event.payload[idField]);

    // Remove from pending if this is a confirmation
    if (pendingUpdates.has(itemId)) {
      setPendingUpdates((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }

    // Update data
    setData((prev) => {
      const index = prev.findIndex((item) => item[idField] === event.payload[idField]);
      if (index >= 0) {
        const next = [...prev];
        next[index] = event.payload;
        return next;
      }
      return [event.payload, ...prev];
    });
  });

  // Optimistic add/update
  const optimisticUpdate = useCallback((item: T, send = true) => {
    const itemId = String(item[idField]);

    // Mark as pending
    setPendingUpdates((prev) => new Set(prev).add(itemId));

    // Optimistically update local state
    setData((prev) => {
      const index = prev.findIndex((i) => i[idField] === item[idField]);
      if (index >= 0) {
        const next = [...prev];
        next[index] = item;
        return next;
      }
      return [item, ...prev];
    });

    // Send to server
    if (send) {
      const client = getRealtimeClient();
      client.send(eventType, item);
    }
  }, [eventType, idField]);

  return {
    data,
    setData,
    optimisticUpdate,
    isPending: (id: string) => pendingUpdates.has(id),
    pendingCount: pendingUpdates.size,
  };
}

export default useRealtimeConnection;
