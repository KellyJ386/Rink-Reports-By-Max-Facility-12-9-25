// Offline Storage Utilities using IndexedDB

const DB_NAME = 'mfo-local-data';
const DB_VERSION = 1;

// Store names
export const STORES = {
  FORMS: 'forms',
  ICE_DEPTH: 'ice-depth',
  INCIDENTS: 'incidents',
  AIR_QUALITY: 'air-quality',
  REFRIGERATION: 'refrigeration',
  SCHEDULES: 'schedules',
  USER_DATA: 'user-data',
  OFFLINE_QUEUE: 'offline-queue',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbInstance: IDBDatabase | null = null;

// Initialize database
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });

          // Add indexes based on store type
          if (storeName === STORES.OFFLINE_QUEUE) {
            store.createIndex('timestamp', 'timestamp', { unique: false });
          } else {
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('syncStatus', 'syncStatus', { unique: false });
          }
        }
      });
    };
  });
}

// Get item from store
export async function getItem<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get all items from store
export async function getAllItems<T>(storeName: StoreName): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Put item in store (insert or update)
export async function putItem<T extends { id: string }>(
  storeName: StoreName,
  item: T
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Delete item from store
export async function deleteItem(storeName: StoreName, id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Clear all items in store
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get items by index
export async function getItemsByIndex<T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Get unsynced items
export async function getUnsyncedItems<T>(storeName: StoreName): Promise<T[]> {
  return getItemsByIndex<T>(storeName, 'syncStatus', 'pending');
}

// Count items in store
export async function countItems(storeName: StoreName): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Batch put items
export async function batchPutItems<T extends { id: string }>(
  storeName: StoreName,
  items: T[]
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    let completed = 0;
    const total = items.length;

    if (total === 0) {
      resolve();
      return;
    }

    items.forEach((item) => {
      const request = store.put(item);
      request.onsuccess = () => {
        completed++;
        if (completed === total) resolve();
      };
      request.onerror = () => reject(request.error);
    });
  });
}

// Export types for offline items
export interface OfflineItem {
  id: string;
  syncStatus: 'pending' | 'synced' | 'error';
  syncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

// Check if browser supports IndexedDB
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

// Get storage usage estimate
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    return {
      usage,
      quota,
      percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }
  return null;
}
