'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import clsx from 'clsx';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  facilities: string[];
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'John Admin',
    phone: '555-123-4567',
    role: 'FACILITY_ADMIN',
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    facilities: ['Main Arena', 'North Campus'],
  },
  {
    id: '2',
    email: 'manager@example.com',
    name: 'Sarah Manager',
    phone: '555-234-5678',
    role: 'MANAGER',
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    facilities: ['Main Arena'],
  },
  {
    id: '3',
    email: 'tech@example.com',
    name: 'Mike Technician',
    role: 'ICE_TECHNICIAN',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    facilities: ['Main Arena'],
  },
  {
    id: '4',
    email: 'staff@example.com',
    name: 'Emily Staff',
    role: 'STAFF',
    isActive: false,
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    facilities: ['North Campus'],
  },
];

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  FACILITY_ADMIN: 'bg-blue-100 text-blue-800',
  MANAGER: 'bg-green-100 text-green-800',
  SUPERVISOR: 'bg-yellow-100 text-yellow-800',
  ICE_TECHNICIAN: 'bg-ice-100 text-ice-800',
  STAFF: 'bg-rink-100 text-rink-600',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  FACILITY_ADMIN: 'Facility Admin',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  ICE_TECHNICIAN: 'Ice Technician',
  STAFF: 'Staff',
};

export default function UsersPage() {
  const [users] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = users.filter((user) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !user.name.toLowerCase().includes(query) &&
        !user.email.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterStatus === 'active' && !user.isActive) return false;
    if (filterStatus === 'inactive' && user.isActive) return false;
    return true;
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-description">
            Manage user accounts, roles, and facility access.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setShowModal(true);
          }}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-ice-100 rounded-lg">
            <UserGroupIcon className="w-6 h-6 text-ice-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{users.length}</p>
            <p className="text-sm text-rink-500">Total Users</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <ShieldCheckIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">
              {users.filter((u) => u.isActive).length}
            </p>
            <p className="text-sm text-rink-500">Active</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ShieldExclamationIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">
              {users.filter((u) => ['FACILITY_ADMIN', 'MANAGER'].includes(u.role)).length}
            </p>
            <p className="text-sm text-rink-500">Admins/Managers</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-rink-100 rounded-lg">
            <UserGroupIcon className="w-6 h-6 text-rink-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">
              {users.filter((u) => !u.isActive).length}
            </p>
            <p className="text-sm text-rink-500">Inactive</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rink-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="form-input w-44"
            >
              <option value="all">All Roles</option>
              <option value="FACILITY_ADMIN">Facility Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ICE_TECHNICIAN">Ice Technician</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input w-32"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-rink-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Facilities</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rink-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-rink-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-ice-100 rounded-full flex items-center justify-center">
                        <span className="text-ice-700 font-medium">
                          {user.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-rink-900">{user.name}</p>
                        <p className="text-sm text-rink-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', roleColors[user.role])}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.facilities.map((facility) => (
                        <span key={facility} className="px-2 py-0.5 text-xs bg-rink-100 text-rink-600 rounded">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="default">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-rink-600">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="w-12 h-12 mx-auto text-rink-300 mb-4" />
            <h3 className="text-lg font-medium text-rink-700">No users found</h3>
            <p className="text-rink-500 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </Card>

      {/* User Modal (simplified placeholder) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <Card className="relative z-10 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-rink-900 mb-4">
              {selectedUser ? 'Edit User' : 'Add User'}
            </h3>
            <form className="space-y-4">
              <Input
                label="Full Name"
                defaultValue={selectedUser?.name}
                placeholder="Enter full name"
                required
              />
              <Input
                label="Email"
                type="email"
                defaultValue={selectedUser?.email}
                placeholder="Enter email address"
                required
              />
              <Input
                label="Phone"
                type="tel"
                defaultValue={selectedUser?.phone}
                placeholder="Enter phone number"
              />
              <div>
                <label className="form-label">Role</label>
                <select className="form-input" defaultValue={selectedUser?.role || 'STAFF'}>
                  <option value="FACILITY_ADMIN">Facility Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ICE_TECHNICIAN">Ice Technician</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>
              {!selectedUser && (
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password (min 8 characters)"
                  required
                />
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedUser ? 'Save Changes' : 'Create User'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
