// Push Notification Management

import type { PushSubscriptionData, PushNotificationPayload } from './types';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Get current notification permission
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined') return 'default';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported');
  }

  return await Notification.requestPermission();
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported');
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
      expirationTime: subscription.expirationTime,
    };

    // Send subscription to server
    await saveSubscriptionToServer(subscriptionData);

    return subscriptionData;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscriptionFromServer(subscription.endpoint);
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

// Check current subscription status
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

// Send subscription to server
async function saveSubscriptionToServer(subscription: PushSubscriptionData): Promise<void> {
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
}

// Remove subscription from server
async function removeSubscriptionFromServer(endpoint: string): Promise<void> {
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
}

// Show local notification (for testing or when app is open)
export async function showLocalNotification(
  payload: PushNotificationPayload
): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/badge-72x72.png',
    image: payload.image,
    tag: payload.tag,
    data: payload.data,
    actions: payload.actions,
    requireInteraction: payload.requireInteraction,
    silent: payload.silent,
  });
}

// Utility: Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Utility: Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
