'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Cog6ToothIcon,
  BellIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ServerIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const settingsSections = [
  { id: 'general', name: 'General', icon: Cog6ToothIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'email', name: 'Email', icon: EnvelopeIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'integrations', name: 'Integrations', icon: ServerIcon },
  { id: 'legal', name: 'Legal', icon: DocumentTextIcon },
];

export default function SystemSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure system-wide settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <Card className="lg:w-64 p-4 h-fit">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <section.icon className="w-5 h-5" />
                {section.name}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'general' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">General Settings</h2>
              <div className="space-y-6">
                <Input label="Application Name" defaultValue="Max Facility Operations" />
                <Input label="Support Email" type="email" defaultValue="support@mfo.com" />
                <Input label="Default Timezone" defaultValue="America/Chicago" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Format</label>
                  <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperature Unit</label>
                  <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                    <option>Fahrenheit</option>
                    <option>Celsius</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Measurement Unit</label>
                  <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                    <option>Imperial (inches)</option>
                    <option>Metric (centimeters)</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Notification Settings</h2>
              <div className="space-y-4">
                {[
                  { id: 'incidents', label: 'Incident Alerts', desc: 'Notify when new incidents are reported' },
                  { id: 'ice', label: 'Ice Depth Warnings', desc: 'Alert when ice depth is outside normal range' },
                  { id: 'schedule', label: 'Schedule Changes', desc: 'Notify staff of schedule modifications' },
                  { id: 'maintenance', label: 'Maintenance Reminders', desc: 'Send maintenance task reminders' },
                  { id: 'system', label: 'System Updates', desc: 'Notify admins of system updates' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'email' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Email Configuration</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Provider</label>
                  <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                    <option>Resend</option>
                    <option>SendGrid</option>
                    <option>Amazon SES</option>
                    <option>SMTP</option>
                  </select>
                </div>
                <Input label="API Key" type="password" defaultValue="re_xxxxxxxxxxxx" />
                <Input label="From Email" type="email" defaultValue="noreply@mfo.com" />
                <Input label="From Name" defaultValue="MFO Notifications" />
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Templates</p>
                  <div className="space-y-2">
                    <button className="text-sm text-primary-600 hover:underline">Edit Welcome Email</button>
                    <button className="text-sm text-primary-600 hover:underline block">Edit Password Reset Email</button>
                    <button className="text-sm text-primary-600 hover:underline block">Edit Notification Email</button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Require 2FA for all admin users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <Input label="Session Timeout (minutes)" type="number" defaultValue="60" />
                <Input label="Max Login Attempts" type="number" defaultValue="5" />
                <Input label="Password Minimum Length" type="number" defaultValue="8" />
                <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Password Complexity</p>
                    <p className="text-sm text-gray-500">Require special characters and numbers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'integrations' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Integrations</h2>
              <div className="space-y-4">
                {[
                  { name: 'Weather API', status: 'connected', provider: 'OpenWeatherMap' },
                  { name: 'Calendar Sync', status: 'disconnected', provider: 'Google Calendar' },
                  { name: 'Slack', status: 'connected', provider: 'Slack Workspace' },
                  { name: 'Accounting', status: 'disconnected', provider: 'QuickBooks' },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{integration.name}</p>
                      <p className="text-sm text-gray-500">{integration.provider}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        integration.status === 'connected'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {integration.status}
                      </span>
                      <Button variant="secondary" size="sm">
                        {integration.status === 'connected' ? 'Configure' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'legal' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Legal & Compliance</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terms of Service URL</label>
                  <Input defaultValue="https://mfo.com/terms" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Privacy Policy URL</label>
                  <Input defaultValue="https://mfo.com/privacy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Retention Period (days)</label>
                  <Input type="number" defaultValue="365" />
                </div>
                <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">GDPR Compliance Mode</p>
                    <p className="text-sm text-gray-500">Enable additional data protection features</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
