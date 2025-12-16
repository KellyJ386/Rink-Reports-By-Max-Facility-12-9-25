// Webhook Management

import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import type { Webhook, WebhookEvent, WebhookPayload, WebhookDelivery } from './types';

// In-memory stores
const webhooks: Map<string, Webhook> = new Map();
const deliveries: Map<string, WebhookDelivery> = new Map();

// Generate webhook secret
function generateSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

// Create webhook signature
export function createSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

// Verify webhook signature
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300
): boolean {
  const parts = signature.split(',');
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const signaturePart = parts.find((p) => p.startsWith('v1='));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = parseInt(timestampPart.replace('t=', ''));
  const expectedSignature = signaturePart.replace('v1=', '');

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) return false;

  // Verify signature
  const signedPayload = `${timestamp}.${payload}`;
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(computedSignature)
  );
}

// Create a webhook
export async function createWebhook(
  url: string,
  events: WebhookEvent[],
  tenantId: string,
  createdBy: string,
  facilityId?: string
): Promise<Webhook> {
  const webhook: Webhook = {
    id: uuid(),
    url,
    events,
    secret: generateSecret(),
    tenantId,
    facilityId,
    isActive: true,
    retryCount: 3,
    createdBy,
    createdAt: new Date(),
  };

  webhooks.set(webhook.id, webhook);
  return webhook;
}

// Get webhooks for a tenant
export async function getWebhooks(
  tenantId: string,
  facilityId?: string
): Promise<Webhook[]> {
  return Array.from(webhooks.values())
    .filter((w) => {
      if (w.tenantId !== tenantId) return false;
      if (facilityId && w.facilityId && w.facilityId !== facilityId) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Get a single webhook
export async function getWebhook(id: string, tenantId: string): Promise<Webhook | null> {
  const webhook = webhooks.get(id);
  if (!webhook || webhook.tenantId !== tenantId) return null;
  return webhook;
}

// Update webhook
export async function updateWebhook(
  id: string,
  tenantId: string,
  updates: Partial<Pick<Webhook, 'url' | 'events' | 'isActive' | 'retryCount'>>
): Promise<Webhook | null> {
  const webhook = webhooks.get(id);
  if (!webhook || webhook.tenantId !== tenantId) return null;

  const updated = { ...webhook, ...updates };
  webhooks.set(id, updated);
  return updated;
}

// Delete webhook
export async function deleteWebhook(id: string, tenantId: string): Promise<boolean> {
  const webhook = webhooks.get(id);
  if (!webhook || webhook.tenantId !== tenantId) return false;
  return webhooks.delete(id);
}

// Rotate webhook secret
export async function rotateWebhookSecret(
  id: string,
  tenantId: string
): Promise<string | null> {
  const webhook = webhooks.get(id);
  if (!webhook || webhook.tenantId !== tenantId) return null;

  webhook.secret = generateSecret();
  webhooks.set(id, webhook);
  return webhook.secret;
}

// Trigger webhooks for an event
export async function triggerWebhooks(
  event: WebhookEvent,
  data: unknown,
  tenantId: string,
  facilityId?: string
): Promise<void> {
  const matchingWebhooks = Array.from(webhooks.values()).filter((w) => {
    if (!w.isActive) return false;
    if (w.tenantId !== tenantId) return false;
    if (!w.events.includes(event)) return false;
    if (facilityId && w.facilityId && w.facilityId !== facilityId) return false;
    return true;
  });

  for (const webhook of matchingWebhooks) {
    const payload: WebhookPayload = {
      id: uuid(),
      event,
      timestamp: new Date(),
      data,
      tenantId,
      facilityId,
    };

    await queueDelivery(webhook, payload);
  }
}

// Queue a webhook delivery
async function queueDelivery(webhook: Webhook, payload: WebhookPayload): Promise<void> {
  const delivery: WebhookDelivery = {
    id: uuid(),
    webhookId: webhook.id,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: new Date(),
  };

  deliveries.set(delivery.id, delivery);

  // Process immediately (in production, this would be a queue)
  processDelivery(delivery.id);
}

// Process a webhook delivery
async function processDelivery(deliveryId: string): Promise<void> {
  const delivery = deliveries.get(deliveryId);
  if (!delivery) return;

  const webhook = webhooks.get(delivery.webhookId);
  if (!webhook) {
    delivery.status = 'failed';
    delivery.error = 'Webhook not found';
    deliveries.set(deliveryId, delivery);
    return;
  }

  delivery.attempts++;
  deliveries.set(deliveryId, delivery);

  try {
    const body = JSON.stringify(delivery.payload);
    const signature = createSignature(body, webhook.secret);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-ID': webhook.id,
        'X-Delivery-ID': delivery.id,
      },
      body,
    });

    delivery.statusCode = response.status;
    delivery.responseBody = await response.text().catch(() => '');

    if (response.ok) {
      delivery.status = 'success';
      delivery.completedAt = new Date();
      webhook.lastSuccessAt = new Date();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    delivery.error = error instanceof Error ? error.message : 'Unknown error';
    webhook.lastFailureAt = new Date();

    if (delivery.attempts < webhook.retryCount) {
      // Schedule retry with exponential backoff
      const delay = Math.pow(2, delivery.attempts) * 1000;
      delivery.nextRetryAt = new Date(Date.now() + delay);
      setTimeout(() => processDelivery(deliveryId), delay);
    } else {
      delivery.status = 'failed';
      delivery.completedAt = new Date();
    }
  }

  webhook.lastTriggeredAt = new Date();
  webhooks.set(webhook.id, webhook);
  deliveries.set(deliveryId, delivery);
}

// Get webhook deliveries
export async function getDeliveries(
  webhookId: string,
  tenantId: string,
  limit: number = 50
): Promise<WebhookDelivery[]> {
  const webhook = webhooks.get(webhookId);
  if (!webhook || webhook.tenantId !== tenantId) return [];

  return Array.from(deliveries.values())
    .filter((d) => d.webhookId === webhookId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// Retry a failed delivery
export async function retryDelivery(
  deliveryId: string,
  tenantId: string
): Promise<boolean> {
  const delivery = deliveries.get(deliveryId);
  if (!delivery || delivery.status !== 'failed') return false;

  const webhook = webhooks.get(delivery.webhookId);
  if (!webhook || webhook.tenantId !== tenantId) return false;

  delivery.status = 'pending';
  delivery.attempts = 0;
  delivery.error = undefined;
  deliveries.set(deliveryId, delivery);

  processDelivery(deliveryId);
  return true;
}
