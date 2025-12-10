// Offline Sync Queue Management

import { v4 as uuid } from 'uuid';
import type { OfflineSyncItem } from './types';

const SYNC_QUEUE_KEY = 'mfo-offline-sync-queue';

// Get all pending sync items
export function getSyncQueue(): OfflineSyncItem[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(SYNC_QUEUE_KEY);
  if (!stored) return [];

  try {
    const items = JSON.parse(stored) as OfflineSyncItem[];
    return items.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  } catch {
    return [];
  }
}

// Add item to sync queue
export function addToSyncQueue(
  entity: string,
  endpoint: string,
  method: OfflineSyncItem['method'],
  data: unknown,
  type: OfflineSyncItem['type'] = 'create'
): OfflineSyncItem {
  const item: OfflineSyncItem = {
    id: uuid(),
    type,
    entity,
    endpoint,
    method,
    data,
    timestamp: new Date(),
    retryCount: 0,
    status: 'pending',
  };

  const queue = getSyncQueue();
  queue.push(item);
  saveSyncQueue(queue);

  // Try to trigger background sync if available
  if ('serviceWorker' in navigator && 'sync' in (window as unknown as { SyncManager?: unknown }).SyncManager!) {
    navigator.serviceWorker.ready.then(registration => {
      (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('offline-sync');
    });
  }

  return item;
}

// Update sync item status
export function updateSyncItem(id: string, updates: Partial<OfflineSyncItem>): void {
  const queue = getSyncQueue();
  const index = queue.findIndex(item => item.id === id);

  if (index !== -1) {
    queue[index] = { ...queue[index], ...updates };
    saveSyncQueue(queue);
  }
}

// Remove item from queue
export function removeSyncItem(id: string): void {
  const queue = getSyncQueue().filter(item => item.id !== id);
  saveSyncQueue(queue);
}

// Clear completed items
export function clearCompletedSync(): void {
  const queue = getSyncQueue().filter(item => item.status !== 'completed');
  saveSyncQueue(queue);
}

// Save queue to localStorage
function saveSyncQueue(queue: OfflineSyncItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

// Process sync queue
export async function processSyncQueue(): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  const queue = getSyncQueue();
  const pendingItems = queue.filter(item => item.status === 'pending' || item.status === 'failed');

  let processed = 0;
  let failed = 0;

  for (const item of pendingItems) {
    if (item.retryCount >= 3) {
      updateSyncItem(item.id, { status: 'failed', error: 'Max retries exceeded' });
      failed++;
      continue;
    }

    updateSyncItem(item.id, { status: 'syncing' });

    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: item.method !== 'DELETE' ? JSON.stringify(item.data) : undefined,
      });

      if (response.ok) {
        updateSyncItem(item.id, { status: 'completed' });
        processed++;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      updateSyncItem(item.id, {
        status: 'failed',
        retryCount: item.retryCount + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      failed++;
    }
  }

  // Clean up completed items
  clearCompletedSync();

  return {
    processed,
    failed,
    remaining: getSyncQueue().filter(item => item.status !== 'completed').length,
  };
}

// Check if there are pending items
export function hasPendingSync(): boolean {
  return getSyncQueue().some(item => item.status === 'pending' || item.status === 'failed');
}

// Get pending count
export function getPendingSyncCount(): number {
  return getSyncQueue().filter(item => item.status === 'pending' || item.status === 'failed').length;
}
