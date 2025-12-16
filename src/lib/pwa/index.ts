// PWA Module

export * from './types';
export * from './offline-sync';
export * from './push-notifications';
export * from './camera';

// Service worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Check for updates on registration
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            window.dispatchEvent(new CustomEvent('sw-update-available'));
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

// Update service worker
export async function updateServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  await registration.update();
}

// Skip waiting and activate new service worker
export async function skipWaiting(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

// Check online status
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

// Listen for online/offline events
export function onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Check if app is installed (standalone mode)
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Check if install prompt is available
let deferredPrompt: Event | null = null;

export function setupInstallPrompt(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('install-prompt-available'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('app-installed'));
  });
}

export function canInstall(): boolean {
  return deferredPrompt !== null;
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;

  const promptEvent = deferredPrompt as unknown as {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };

  await promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;

  deferredPrompt = null;
  return outcome === 'accepted';
}

// Cache management
export async function clearAppCache(): Promise<void> {
  if (!('caches' in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

export async function getCacheSize(): Promise<number> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return 0;
  }

  const estimate = await navigator.storage.estimate();
  return estimate.usage || 0;
}

// App version
export const APP_VERSION = '1.0.0';

// PWA configuration
export const pwaConfig = {
  name: 'Max Facility Operations',
  shortName: 'MFO',
  description: 'Ice Rink Management Platform',
  themeColor: '#0ea5e9',
  backgroundColor: '#ffffff',
  display: 'standalone' as const,
  orientation: 'portrait' as const,
  scope: '/',
  startUrl: '/dashboard',
  icons: {
    small: '/icons/icon-72x72.png',
    medium: '/icons/icon-192x192.png',
    large: '/icons/icon-512x512.png',
    maskable: '/icons/icon-maskable-512x512.png',
  },
};
