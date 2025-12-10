'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheckIcon,
  PencilIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string[];
  isSystem: boolean;
}

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

  // Schedule
  { id: 'schedule.view', name: 'View Schedule', description: 'View staff schedules', category: 'Schedule' },
  { id: 'schedule.edit', name: 'Edit Schedule', description: 'Modify staff schedules', category: 'Schedule' },
  { id: 'schedule.approve', name: 'Approve Time Off', description: 'Approve time-off requests', category: 'Schedule' },

  // Forms
  { id: 'forms.view', name: 'View Forms', description: 'View form submissions', category: 'Forms' },
  { id: 'forms.submit', name: 'Submit Forms', description: 'Submit operational forms', category: 'Forms' },
  { id: 'forms.manage', name: 'Manage Forms', description: 'Create and edit form templates', category: 'Forms' },

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

const mockRoles: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    usersCount: 2,
    permissions: allPermissions.map(p => p.id),
    isSystem: true,
  },
  {
    id: 'facility_admin',
    name: 'Facility Admin',
    description: 'Full access to facility operations',
    usersCount: 5,
    permissions: allPermissions.filter(p => p.category !== 'Admin' || p.id === 'admin.access').map(p => p.id),
    isSystem: true,
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Manage daily operations and staff',
    usersCount: 12,
    permissions: ['dashboard.view', 'dashboard.analytics', 'incidents.view', 'incidents.create', 'incidents.edit', 'incidents.resolve', 'ice.view', 'ice.create', 'schedule.view', 'schedule.edit', 'schedule.approve', 'forms.view', 'forms.submit', 'users.view'],
    isSystem: true,
  },
  {
    id: 'ice_tech',
    name: 'Ice Technician',
    description: 'Ice maintenance and monitoring',
    usersCount: 18,
    permissions: ['dashboard.view', 'incidents.view', 'incidents.create', 'ice.view', 'ice.create', 'ice.analyze', 'forms.view', 'forms.submit'],
    isSystem: false,
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Basic operational access',
    usersCount: 45,
    permissions: ['dashboard.view', 'incidents.view', 'incidents.create', 'ice.view', 'schedule.view', 'forms.view', 'forms.submit'],
    isSystem: false,
  },
];

export default function RolesPage() {
  const [roles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showModal, setShowModal] = useState(false);

  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user roles and access permissions</p>
        </div>
        <Button onClick={() => { setSelectedRole(null); setShowModal(true); }}>
          <ShieldCheckIcon className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
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
                onClick={() => { setSelectedRole(role); setShowModal(true); }}
                disabled={role.isSystem}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <UsersIcon className="w-4 h-4" />
                {role.usersCount} users
              </div>
              <div className="text-sm text-gray-500">
                {role.permissions.length} permissions
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {Object.keys(permissionsByCategory).map((category) => {
                const categoryPerms = permissionsByCategory[category];
                const enabledCount = categoryPerms.filter(p => role.permissions.includes(p.id)).length;
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
        ))}
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

      {/* Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <Card className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {selectedRole ? 'Edit Role' : 'Create Role'}
            </h3>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    defaultValue={selectedRole?.name}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    defaultValue={selectedRole?.description}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permissions</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <div key={category} className="border dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">{category}</h5>
                        <label className="flex items-center gap-2 text-sm text-gray-500">
                          <input type="checkbox" className="rounded" />
                          Select All
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {permissions.map((perm) => (
                          <label key={perm.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="rounded"
                              defaultChecked={selectedRole?.permissions.includes(perm.id)}
                            />
                            {perm.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">{selectedRole ? 'Save Changes' : 'Create Role'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
