// Service Worker for Max Facility Operations PWA

const CACHE_VERSION = 'v1.1.0';
const STATIC_CACHE = `mfo-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mfo-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `mfo-images-${CACHE_VERSION}`;
const OFFLINE_DB = 'mfo-offline-db';
const OFFLINE_QUEUE_STORE = 'offline-queue';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes that should use network-first strategy
const API_ROUTES = ['/api/'];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('/api/')));
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith('mfo-') &&
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== IMAGE_CACHE
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle mutation requests (POST, PUT, DELETE) for offline queue
  if (['POST', 'PUT', 'DELETE'].includes(request.method) && url.pathname.startsWith('/api/')) {
    event.respondWith(handleMutationRequest(request));
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - network first, fallback to cache
  if (API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Images - cache first
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Static assets - cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE).catch(() => {
        return caches.match('/offline') || caches.match('/');
      })
    );
    return;
  }

  // Default - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    throw error;
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(cacheName).then((cache) => {
        cache.put(request, response.clone());
      });
    }
    return response;
  });

  return cached || fetchPromise;
}

// Helper to check if path is a static asset
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff')
  );
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const options = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      image: payload.image,
      tag: payload.tag || 'mfo-notification',
      data: payload.data || {},
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Open specific page
        break;
      case 'dismiss':
        // Just close notification
        return;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // This will be handled by the main thread
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_REQUESTED' });
  });
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.source.postMessage({
        type: 'VERSION',
        data: CACHE_VERSION,
      });
      break;

    case 'CLEAR_CACHE':
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
      break;

    case 'CACHE_URLS':
      if (payload?.urls) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.addAll(payload.urls);
        });
      }
      break;

    case 'GET_OFFLINE_QUEUE':
      getOfflineQueueCount().then((count) => {
        event.source.postMessage({
          type: 'OFFLINE_QUEUE_COUNT',
          data: count,
        });
      });
      break;

    case 'PROCESS_OFFLINE_QUEUE':
      processOfflineQueue();
      break;
  }
});

// Handle mutation requests (POST, PUT, DELETE)
async function handleMutationRequest(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch (error) {
    // Network failed - queue for later
    await queueOfflineRequest(request);

    return new Response(
      JSON.stringify({
        success: true,
        queued: true,
        offline: true,
        message: 'Saved locally. Will sync when online.',
      }),
      {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Queued': 'true',
        },
      }
    );
  }
}

// Queue request for offline sync
async function queueOfflineRequest(request) {
  const url = new URL(request.url);
  const body = await request.clone().text();

  const queueItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: url.pathname + url.search,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const db = await openOfflineDB();
  const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
  await new Promise((resolve, reject) => {
    const request = tx.objectStore(OFFLINE_QUEUE_STORE).add(queueItem);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });

  // Notify clients
  notifyClients({ type: 'OFFLINE_QUEUE_UPDATED', count: await getOfflineQueueCount() });

  // Register for background sync
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('offline-sync');
    } catch (e) {
      console.log('[SW] Background sync registration failed:', e);
    }
  }
}

// Process offline queue
async function processOfflineQueue() {
  const db = await openOfflineDB();
  const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly');
  const items = await new Promise((resolve) => {
    const request = tx.objectStore(OFFLINE_QUEUE_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  let successCount = 0;
  let failCount = 0;

  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (response.ok) {
        // Remove from queue
        const deleteTx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
        await new Promise((resolve) => {
          const request = deleteTx.objectStore(OFFLINE_QUEUE_STORE).delete(item.id);
          request.onsuccess = resolve;
          request.onerror = resolve;
        });
        successCount++;
      } else if (response.status >= 400 && response.status < 500) {
        // Client error - remove from queue (won't retry)
        const deleteTx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
        await new Promise((resolve) => {
          const request = deleteTx.objectStore(OFFLINE_QUEUE_STORE).delete(item.id);
          request.onsuccess = resolve;
          request.onerror = resolve;
        });
        failCount++;
      }
    } catch (error) {
      console.log('[SW] Failed to sync item:', item.id, error);
      failCount++;
    }
  }

  // Notify clients of sync result
  const remainingCount = await getOfflineQueueCount();
  notifyClients({
    type: 'SYNC_COMPLETE',
    successCount,
    failCount,
    remainingCount,
  });
}

// Get offline queue count
async function getOfflineQueueCount() {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly');
    return new Promise((resolve) => {
      const request = tx.objectStore(OFFLINE_QUEUE_STORE).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

// Open IndexedDB
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: 'id' });
      }
    };
  });
}

// Notify all clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage(message);
  });
}
