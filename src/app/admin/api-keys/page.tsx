'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { API_PERMISSIONS, WEBHOOK_EVENTS } from '@/lib/api/types';
import type { APIKey, APIPermission, Webhook } from '@/lib/api/types';

// Mock API keys
const mockAPIKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'hashed',
    keyPrefix: 'mfo_prod_123',
    tenantId: 'tenant-1',
    permissions: ['read:incidents', 'write:incidents', 'read:ice_depth'],
    rateLimit: 1000,
    lastUsedAt: new Date(Date.now() - 60 * 60 * 1000),
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'hashed',
    keyPrefix: 'mfo_dev_456',
    tenantId: 'tenant-1',
    permissions: ['admin'],
    rateLimit: 100,
    lastUsedAt: new Date(Date.now() - 5 * 60 * 1000),
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    id: '3',
    name: 'Reporting Integration',
    key: 'hashed',
    keyPrefix: 'mfo_rep_789',
    tenantId: 'tenant-1',
    permissions: ['read:reports', 'read:incidents', 'read:ice_depth'],
    rateLimit: 500,
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    isActive: false,
  },
];

const mockWebhooks: Webhook[] = [
  {
    id: '1',
    url: 'https://example.com/webhooks/mfo',
    events: ['incident.created', 'incident.resolved'],
    secret: 'whsec_xxx',
    tenantId: 'tenant-1',
    isActive: true,
    retryCount: 3,
    lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastSuccessAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    url: 'https://slack.com/api/webhooks/xxx',
    events: ['ice_depth.alert'],
    secret: 'whsec_yyy',
    tenantId: 'tenant-1',
    isActive: true,
    retryCount: 3,
    lastTriggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    lastSuccessAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

export default function APIKeysPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys');
  const [apiKeys] = useState<APIKey[]>(mockAPIKeys);
  const [webhooks] = useState<Webhook[]>(mockWebhooks);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [showNewWebhookModal, setShowNewWebhookModal] = useState(false);
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<APIPermission[]>([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API & Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage API keys and webhook integrations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'keys'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <KeyIcon className="w-4 h-4" />
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'webhooks'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          Webhooks
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewKeyModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>

          <Card className="divide-y dark:divide-gray-700">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <KeyIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{key.name}</h3>
                        <Badge variant={key.isActive ? 'success' : 'neutral'}>
                          {key.isActive ? 'Active' : 'Revoked'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {key.keyPrefix}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.keyPrefix)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ClipboardIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {key.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Created {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                        {key.lastUsedAt && (
                          <> • Last used {formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{key.rateLimit}/hr</span>
                    <Button variant="ghost" size="sm">
                      <ArrowPathIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewWebhookModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          <Card className="divide-y dark:divide-gray-700">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <LinkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-medium text-gray-900 dark:text-white">
                          {webhook.url}
                        </code>
                        <Badge variant={webhook.isActive ? 'success' : 'neutral'}>
                          {webhook.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {webhook.lastTriggeredAt && (
                          <>Last triggered {formatDistanceToNow(new Date(webhook.lastTriggeredAt), { addSuffix: true })}</>
                        )}
                        {webhook.lastSuccessAt && (
                          <> • Last success {formatDistanceToNow(new Date(webhook.lastSuccessAt), { addSuffix: true })}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      Test
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Available Events */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Available Events
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WEBHOOK_EVENTS.map(({ event, description }) => (
                <div key={event} className="p-3 border dark:border-gray-700 rounded-lg">
                  <code className="text-sm font-medium text-primary-600">{event}</code>
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowNewKeyModal(false)} />
          <Card className="relative z-10 w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create API Key
            </h3>

            {newKeyRevealed ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                    Copy your API key now. You won't be able to see it again!
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-white dark:bg-gray-800 rounded border text-sm break-all">
                      {newKeyRevealed}
                    </code>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyToClipboard(newKeyRevealed)}
                    >
                      <ClipboardIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={() => { setShowNewKeyModal(false); setNewKeyRevealed(null); }}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input label="Key Name" placeholder="e.g., Production API Key" />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {API_PERMISSIONS.map(({ permission, description }) => (
                      <label key={permission} className="flex items-start gap-2 p-2 border dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-gray-300"
                          checked={selectedPermissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, permission]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter((p) => p !== permission));
                            }
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{permission}</p>
                          <p className="text-xs text-gray-500">{description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <Input label="Rate Limit (requests/hour)" type="number" defaultValue="1000" />

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setShowNewKeyModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setNewKeyRevealed('mfo_prod_' + Math.random().toString(36).substring(2))}>
                    Create Key
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* New Webhook Modal */}
      {showNewWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowNewWebhookModal(false)} />
          <Card className="relative z-10 w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Webhook
            </h3>
            <div className="space-y-4">
              <Input label="Webhook URL" placeholder="https://example.com/webhooks" />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Events
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {WEBHOOK_EVENTS.map(({ event, description }) => (
                    <label key={event} className="flex items-center gap-2 p-2 border dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{event}</p>
                        <p className="text-xs text-gray-500">{description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowNewWebhookModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowNewWebhookModal(false)}>
                  Create Webhook
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
