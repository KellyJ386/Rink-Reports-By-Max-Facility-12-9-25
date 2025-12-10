'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { toast } from '@/components/notifications';

interface NotificationSettings {
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: {
    incidents: boolean;
    iceDepth: boolean;
    schedule: boolean;
    maintenance: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  digest: 'instant' | 'hourly' | 'daily' | 'weekly';
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    channels: {
      inApp: true,
      email: true,
      push: false,
      sms: false,
    },
    categories: {
      incidents: true,
      iceDepth: true,
      schedule: true,
      maintenance: true,
      system: true,
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
    digest: 'instant',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('Settings Saved', 'Your notification preferences have been updated.');
  };

  const updateChannel = (channel: keyof NotificationSettings['channels'], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      channels: { ...prev.channels, [channel]: value },
    }));
  };

  const updateCategory = (category: keyof NotificationSettings['categories'], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      categories: { ...prev.categories, [category]: value },
    }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Notification Channels */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Channels
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Choose how you want to receive notifications
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ComputerDesktopIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">In-App Notifications</p>
                <p className="text-sm text-gray-500">Notifications in the application</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.channels.inApp}
                onChange={(e) => updateChannel('inApp', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <EnvelopeIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive alerts via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.channels.email}
                onChange={(e) => updateChannel('email', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <BellIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-500">Browser push notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.channels.push}
                onChange={(e) => updateChannel('push', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <DevicePhoneMobileIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                <p className="text-sm text-gray-500">Text message alerts (urgent only)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.channels.sms}
                onChange={(e) => updateChannel('sms', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Notification Categories */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Categories
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Select which types of notifications you want to receive
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'incidents', label: 'Incidents', desc: 'New incidents and updates' },
            { key: 'iceDepth', label: 'Ice Depth', desc: 'Ice depth warnings and alerts' },
            { key: 'schedule', label: 'Schedule', desc: 'Shift reminders and changes' },
            { key: 'maintenance', label: 'Maintenance', desc: 'Maintenance tasks and reminders' },
            { key: 'system', label: 'System', desc: 'System updates and announcements' },
          ].map((category) => (
            <label
              key={category.key}
              className="flex items-center gap-3 p-4 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-gray-600"
                checked={settings.categories[category.key as keyof typeof settings.categories]}
                onChange={(e) =>
                  updateCategory(
                    category.key as keyof NotificationSettings['categories'],
                    e.target.checked
                  )
                }
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{category.label}</p>
                <p className="text-sm text-gray-500">{category.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quiet Hours</h2>
              <p className="text-sm text-gray-500">Pause notifications during specific hours</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.quietHours.enabled}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  quietHours: { ...prev.quietHours, enabled: e.target.checked },
                }))
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {settings.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={settings.quietHours.start}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, start: e.target.value },
                  }))
                }
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={settings.quietHours.end}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, end: e.target.value },
                  }))
                }
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2">
          Note: Urgent notifications will still be delivered during quiet hours.
        </p>
      </Card>

      {/* Digest Preference */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Email Digest
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          How often would you like to receive email summaries?
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: 'instant', label: 'Instant', desc: 'As they happen' },
            { value: 'hourly', label: 'Hourly', desc: 'Every hour' },
            { value: 'daily', label: 'Daily', desc: 'Once a day' },
            { value: 'weekly', label: 'Weekly', desc: 'Once a week' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-colors ${
                settings.digest === option.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="digest"
                value={option.value}
                checked={settings.digest === option.value}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    digest: e.target.value as NotificationSettings['digest'],
                  }))
                }
                className="sr-only"
              />
              <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
              <span className="text-xs text-gray-500">{option.desc}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
