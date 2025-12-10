'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useRoleStatsLive,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type UserRole,
} from '@/hooks';
import {
  ShieldCheckIcon,
  UsersIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// Permission definitions - these are application-level constants
const allPermissions: Permission[] = [
  // Dashboard
  { id: 'dashboard.view', name: 'View Dashboard', description: 'Access the main dashboard', category: 'Dashboard' },
  { id: 'dashboard.analytics', name: 'View Analytics', description: 'Access analytics and reports', category: 'Dashboard' },

  // Incidents
  { id: 'incidents.view', name: 'View Incidents', description: 'View incident reports', category: 'Incidents' },
  { id: 'incidents.create', name: 'Create Incidents', description: 'Create new incident reports', category: 'Incidents' },
  { id: 'incidents.edit', name: 'Edit Incidents', description: 'Edit incident reports', category: 'Incidents' },
  { id: 'incidents.delete', name: 'Delete Incidents', description: 'Delete incident reports', category: 'Incidents' },
  { id: 'incidents.resolve', name: 'Resolve Incidents', description: 'Mark incidents as resolved', category: 'Incidents' },

  // Ice Depth
  { id: 'ice.view', name: 'View Ice Readings', description: 'View ice depth readings', category: 'Ice Depth' },
  { id: 'ice.create', name: 'Create Ice Readings', description: 'Record new ice depth readings', category: 'Ice Depth' },
  { id: 'ice.analyze', name: 'Run Analysis', description: 'Run AI analysis on readings', category: 'Ice Depth' },

  // Air Quality
  { id: 'airquality.view', name: 'View Air Quality', description: 'View air quality readings', category: 'Air Quality' },
  { id: 'airquality.create', name: 'Create Readings', description: 'Record air quality readings', category: 'Air Quality' },

  // Refrigeration
  { id: 'refrigeration.view', name: 'View Refrigeration', description: 'View refrigeration status', category: 'Refrigeration' },
  { id: 'refrigeration.create', name: 'Create Readings', description: 'Record refrigeration readings', category: 'Refrigeration' },

  // Schedule
  { id: 'schedule.view', name: 'View Schedule', description: 'View staff schedules', category: 'Schedule' },
  { id: 'schedule.edit', name: 'Edit Schedule', description: 'Modify staff schedules', category: 'Schedule' },
  { id: 'schedule.approve', name: 'Approve Time Off', description: 'Approve time-off requests', category: 'Schedule' },

  // Forms
  { id: 'forms.view', name: 'View Forms', description: 'View form submissions', category: 'Forms' },
  { id: 'forms.submit', name: 'Submit Forms', description: 'Submit operational forms', category: 'Forms' },
  { id: 'forms.manage', name: 'Manage Forms', description: 'Create and edit form templates', category: 'Forms' },

  // Reports
  { id: 'reports.view', name: 'View Reports', description: 'View generated reports', category: 'Reports' },
  { id: 'reports.generate', name: 'Generate Reports', description: 'Create new reports', category: 'Reports' },
  { id: 'reports.schedule', name: 'Schedule Reports', description: 'Schedule automated reports', category: 'Reports' },

  // Users
  { id: 'users.view', name: 'View Users', description: 'View user list', category: 'Users' },
  { id: 'users.create', name: 'Create Users', description: 'Create new users', category: 'Users' },
  { id: 'users.edit', name: 'Edit Users', description: 'Edit user profiles', category: 'Users' },
  { id: 'users.delete', name: 'Delete Users', description: 'Deactivate users', category: 'Users' },

  // Admin
  { id: 'admin.access', name: 'Admin Access', description: 'Access admin panel', category: 'Admin' },
  { id: 'admin.settings', name: 'System Settings', description: 'Modify system settings', category: 'Admin' },
  { id: 'admin.audit', name: 'View Audit Logs', description: 'Access audit logs', category: 'Admin' },
  { id: 'admin.billing', name: 'Manage Billing', description: 'Access billing settings', category: 'Admin' },
];

// Role permission mappings
const rolePermissions: Record<UserRole, string[]> = {
  SUPER_ADMIN: allPermissions.map(p => p.id),
  FACILITY_ADMIN: allPermissions.filter(p => p.category !== 'Admin' || p.id === 'admin.access').map(p => p.id),
  MANAGER: [
    'dashboard.view', 'dashboard.analytics',
    'incidents.view', 'incidents.create', 'incidents.edit', 'incidents.resolve',
    'ice.view', 'ice.create',
    'airquality.view', 'airquality.create',
    'refrigeration.view', 'refrigeration.create',
    'schedule.view', 'schedule.edit', 'schedule.approve',
    'forms.view', 'forms.submit',
    'reports.view', 'reports.generate',
    'users.view',
  ],
  SUPERVISOR: [
    'dashboard.view',
    'incidents.view', 'incidents.create', 'incidents.edit',
    'ice.view', 'ice.create',
    'airquality.view',
    'refrigeration.view',
    'schedule.view', 'schedule.edit',
    'forms.view', 'forms.submit',
    'reports.view',
  ],
  ICE_TECHNICIAN: [
    'dashboard.view',
    'incidents.view', 'incidents.create',
    'ice.view', 'ice.create', 'ice.analyze',
    'airquality.view', 'airquality.create',
    'refrigeration.view', 'refrigeration.create',
    'forms.view', 'forms.submit',
  ],
  STAFF: [
    'dashboard.view',
    'incidents.view', 'incidents.create',
    'ice.view',
    'airquality.view',
    'schedule.view',
    'forms.view', 'forms.submit',
  ],
};

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
];

export default function RolesPage() {
  const [refreshInterval, setRefreshInterval] = useState(60000);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, error, refetch, dataUpdatedAt } = useRoleStatsLive({
    refreshInterval,
    enabled: true,
  });

  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return 'Never';
    return formatDistanceToNow(dataUpdatedAt, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
        <p className="font-medium">Failed to load role statistics</p>
        <p className="text-sm mt-1">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const roles = data?.roles || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user roles and access permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Updated {formatLastUpdated()}
          </span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          >
            {REFRESH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Refresh now"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => {
          const permissions = rolePermissions[role.id];
          return (
            <Card key={role.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                      {role.isSystem && (
                        <Badge variant="info">System</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedRole(role.id); setShowModal(true); }}
                >
                  View
                </Button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <UsersIcon className="w-4 h-4" />
                  {role.usersCount} users
                </div>
                <div className="text-sm text-gray-500">
                  {permissions.length} permissions
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {Object.keys(permissionsByCategory).map((category) => {
                  const categoryPerms = permissionsByCategory[category];
                  const enabledCount = categoryPerms.filter(p => permissions.includes(p.id)).length;
                  if (enabledCount === 0) return null;
                  return (
                    <span
                      key={category}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                    >
                      {category}: {enabledCount}/{categoryPerms.length}
                    </span>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Permissions Reference */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permission Reference</h2>
        <div className="space-y-6">
          {Object.entries(permissionsByCategory).map(([category, permissions]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {permissions.map((perm) => (
                  <div key={perm.id} className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                    <ShieldCheckIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{perm.name}</p>
                      <p className="text-xs text-gray-500">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* View Role Modal */}
      {showModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <Card className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {ROLE_LABELS[selectedRole]}
                  </h3>
                  <p className="text-sm text-gray-500">{ROLE_DESCRIPTIONS[selectedRole]}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </div>

            <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4" />
                {roles.find(r => r.id === selectedRole)?.usersCount || 0} users with this role
              </div>
              <div>
                {rolePermissions[selectedRole].length} permissions
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Permissions for this role</h4>
              {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                const rolePerms = rolePermissions[selectedRole];
                const categoryPermissions = permissions.filter(p => rolePerms.includes(p.id));
                if (categoryPermissions.length === 0) return null;

                return (
                  <div key={category} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 dark:text-white">{category}</h5>
                      <span className="text-xs text-gray-500">
                        {categoryPermissions.length}/{permissions.length} enabled
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {permissions.map((perm) => {
                        const isEnabled = rolePerms.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            className={`flex items-center gap-2 text-sm p-2 rounded ${
                              isEnabled
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={isEnabled}
                              readOnly
                              disabled
                            />
                            {perm.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
