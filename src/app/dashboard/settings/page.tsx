'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  UserCircleIcon,
  BellIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface UserSettings {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  status: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      incidents: boolean;
      maintenance: boolean;
      scheduleChanges: boolean;
      reports: boolean;
    };
    dashboard: {
      defaultView: string;
      refreshInterval: number;
      showWeatherWidget: boolean;
    };
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  facility: { id: string; name: string } | null;
  organization: { id: string; name: string } | null;
  createdAt: string;
}

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'preferences';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    theme: 'light' as 'light' | 'dark' | 'system',
    notifications: {
      email: true,
      push: true,
      incidents: true,
      maintenance: true,
      scheduleChanges: true,
      reports: false,
    },
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h' as '12h' | '24h',
    refreshInterval: 30,
  });

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/user/settings');
        const data = await response.json();

        if (response.ok) {
          setSettings(data.data);
          setFormData({
            name: data.data.name || '',
            phone: data.data.phone || '',
            theme: data.data.preferences?.theme || 'light',
            notifications: data.data.preferences?.notifications || {
              email: true,
              push: true,
              incidents: true,
              maintenance: true,
              scheduleChanges: true,
              reports: false,
            },
            timezone: data.data.preferences?.timezone || 'America/New_York',
            dateFormat: data.data.preferences?.dateFormat || 'MM/DD/YYYY',
            timeFormat: data.data.preferences?.timeFormat || '12h',
            refreshInterval: data.data.preferences?.dashboard?.refreshInterval || 30,
          });
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          preferences: {
            theme: formData.theme,
            notifications: formData.notifications,
            timezone: formData.timezone,
            dateFormat: formData.dateFormat,
            timeFormat: formData.timeFormat,
            dashboard: {
              refreshInterval: formData.refreshInterval,
            },
          },
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        // Update session if name changed
        if (formData.name !== session?.user?.name) {
          await updateSession({ name: formData.name });
        }
        // Apply theme
        applyTheme(formData.theme);
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const data = await response.json();
        setError(data.error);
        setSaveStatus('error');
      }
    } catch (err) {
      setError('Failed to save settings');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Apply theme
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', theme);
  };

  const tabs = [
    { id: 'profile' as const, name: 'Profile', icon: UserCircleIcon },
    { id: 'notifications' as const, name: 'Notifications', icon: BellIcon },
    { id: 'appearance' as const, name: 'Appearance', icon: PaintBrushIcon },
    { id: 'preferences' as const, name: 'Preferences', icon: GlobeAltIcon },
  ];

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ice-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-2 text-rink-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Manage your profile and preferences.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          leftIcon={
            saveStatus === 'success' ? (
              <CheckIcon className="w-4 h-4" />
            ) : saveStatus === 'error' ? (
              <ExclamationTriangleIcon className="w-4 h-4" />
            ) : undefined
          }
        >
          {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-ice-50 text-ice-700 font-medium'
                      : 'text-rink-600 hover:bg-rink-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-lg font-semibold text-rink-900 mb-6">Profile Information</h2>

              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-ice-100 flex items-center justify-center text-ice-700 text-2xl font-bold">
                    {formData.name?.charAt(0) || settings?.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-rink-900">{formData.name || 'User'}</p>
                    <p className="text-sm text-rink-500">{settings?.email}</p>
                    <Badge variant="primary" className="mt-1">
                      {settings?.role}
                    </Badge>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input bg-rink-50"
                    value={settings?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-rink-500 mt-1">
                    Contact an administrator to change your email.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Organization Info */}
                {(settings?.organization || settings?.facility) && (
                  <div className="pt-4 border-t border-rink-200">
                    <h3 className="text-sm font-medium text-rink-900 mb-3">Organization</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {settings?.organization && (
                        <div>
                          <p className="text-rink-500">Organization</p>
                          <p className="font-medium text-rink-900">{settings.organization.name}</p>
                        </div>
                      )}
                      {settings?.facility && (
                        <div>
                          <p className="text-rink-500">Facility</p>
                          <p className="font-medium text-rink-900">{settings.facility.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-lg font-semibold text-rink-900 mb-6">Notification Preferences</h2>

              <div className="space-y-6">
                {/* Notification Channels */}
                <div>
                  <h3 className="text-sm font-medium text-rink-900 mb-3">Notification Channels</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-rink-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-rink-900">Email Notifications</p>
                        <p className="text-sm text-rink-500">Receive notifications via email</p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle"
                        checked={formData.notifications.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifications: { ...formData.notifications, email: e.target.checked },
                          })
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-rink-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-rink-900">Push Notifications</p>
                        <p className="text-sm text-rink-500">Receive browser push notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle"
                        checked={formData.notifications.push}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifications: { ...formData.notifications, push: e.target.checked },
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                {/* Notification Types */}
                <div className="pt-4 border-t border-rink-200">
                  <h3 className="text-sm font-medium text-rink-900 mb-3">Notification Types</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-rink-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-rink-900">Incidents</p>
                        <p className="text-sm text-rink-500">
                          New incidents and status updates
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle"
                        checked={formData.notifications.incidents}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              incidents: e.target.checked,
                            },
                          })
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-rink-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-rink-900">Maintenance</p>
                        <p className="text-sm text-rink-500">
                          Equipment maintenance reminders
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle"
                        checked={formData.notifications.maintenance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              maintenance: e.target.checked,
                            },
                          })
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-rink-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-rink-900">Schedule Changes</p>
                        <p className="text-sm text-rink-500">
                          Shift assignments and schedule updates
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle"
                        checked={formData.notifications.scheduleChanges}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              scheduleChanges: e.target.checked,
                            },
                          })
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-rink-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-rink-900">Reports</p>
                        <p className="text-sm text-rink-500">
                          Daily and weekly report summaries
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle"
                        checked={formData.notifications.reports}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              reports: e.target.checked,
                            },
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <h2 className="text-lg font-semibold text-rink-900 mb-6">Appearance</h2>

              <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <label className="form-label">Theme</label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {[
                      { value: 'light', label: 'Light', icon: '☀️' },
                      { value: 'dark', label: 'Dark', icon: '🌙' },
                      { value: 'system', label: 'System', icon: '💻' },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            theme: theme.value as 'light' | 'dark' | 'system',
                          })
                        }
                        className={`p-4 rounded-lg border-2 transition-colors text-center ${
                          formData.theme === theme.value
                            ? 'border-ice-500 bg-ice-50'
                            : 'border-rink-200 hover:border-rink-300'
                        }`}
                      >
                        <span className="text-2xl">{theme.icon}</span>
                        <p className="mt-2 font-medium text-rink-900">{theme.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dashboard Refresh Interval */}
                <div className="pt-4 border-t border-rink-200">
                  <label className="form-label">Dashboard Auto-Refresh</label>
                  <select
                    className="form-input"
                    value={formData.refreshInterval}
                    onChange={(e) =>
                      setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })
                    }
                  >
                    <option value={0}>Disabled</option>
                    <option value={15}>Every 15 seconds</option>
                    <option value={30}>Every 30 seconds</option>
                    <option value={60}>Every minute</option>
                    <option value={300}>Every 5 minutes</option>
                  </select>
                  <p className="text-xs text-rink-500 mt-1">
                    How often the dashboard automatically refreshes data.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <Card>
              <h2 className="text-lg font-semibold text-rink-900 mb-6">Regional Preferences</h2>

              <div className="space-y-6">
                {/* Timezone */}
                <div>
                  <label className="form-label">Timezone</label>
                  <select
                    className="form-input"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <label className="form-label">Date Format</label>
                  <select
                    className="form-input"
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/25/2024)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (25/12/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-25)</option>
                  </select>
                </div>

                {/* Time Format */}
                <div>
                  <label className="form-label">Time Format</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="12h"
                        checked={formData.timeFormat === '12h'}
                        onChange={() => setFormData({ ...formData, timeFormat: '12h' })}
                        className="text-ice-600 focus:ring-ice-500"
                      />
                      <span className="text-sm text-rink-700">12-hour (2:30 PM)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="24h"
                        checked={formData.timeFormat === '24h'}
                        onChange={() => setFormData({ ...formData, timeFormat: '24h' })}
                        className="text-ice-600 focus:ring-ice-500"
                      />
                      <span className="text-sm text-rink-700">24-hour (14:30)</span>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
