// PWA Types and Interfaces

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

export interface OfflineSyncItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: unknown;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export interface CacheConfig {
  name: string;
  maxAge: number; // in milliseconds
  maxEntries: number;
}

export interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  pushSubscription: PushSubscription | null;
  pendingSyncCount: number;
}

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface CameraCapture {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  timestamp: Date;
}

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
}

// Service worker message types
export type SWMessageType =
  | 'SKIP_WAITING'
  | 'GET_VERSION'
  | 'CLEAR_CACHE'
  | 'SYNC_NOW'
  | 'CACHE_URLS';

export interface SWMessage {
  type: SWMessageType;
  payload?: unknown;
}

export interface SWResponse {
  type: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

// Push notification payload
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    id?: string;
  };
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  requireInteraction?: boolean;
  silent?: boolean;
}
