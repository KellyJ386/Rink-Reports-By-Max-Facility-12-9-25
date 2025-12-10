'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  useUsersLive,
  useCreateUser,
  useUpdateUser,
  getRoleLabel,
  getRoleColor,
  formatUserInitials,
  getUserFacilities,
  type AdminUser,
  type UserRole,
} from '@/hooks';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import clsx from 'clsx';

// Refresh intervals
const REFRESH_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF' as UserRole,
  });

  // Fetch users with live refresh
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useUsersLive(
    {
      search: searchQuery || undefined,
      role: filterRole !== 'all' ? filterRole : undefined,
    },
    { refreshInterval, enabled: true }
  );

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  // Update last refresh time
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefresh(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // Reset form when modal opens
  useEffect(() => {
    if (showModal && selectedUser) {
      setFormData({
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone || '',
        password: '',
        role: selectedUser.role,
      });
    } else if (showModal) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'STAFF',
      });
    }
  }, [showModal, selectedUser]);

  const users = usersData?.items || [];

  // Client-side status filter
  const filteredUsers = users.filter((user) => {
    if (filterStatus === 'active' && !user.isActive) return false;
    if (filterStatus === 'inactive' && user.isActive) return false;
    return true;
  });

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) =>
    ['SUPER_ADMIN', 'FACILITY_ADMIN', 'MANAGER'].includes(u.role)
  ).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedUser) {
        // Update existing user
        await updateUser.mutateAsync({
          userId: selectedUser.id,
          name: formData.name,
          phone: formData.phone || undefined,
          role: formData.role,
        });
      } else {
        // Create new user
        await createUser.mutateAsync({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          role: formData.role,
        });
      }
      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      await updateUser.mutateAsync({
        userId: user.id,
        isActive: !user.isActive,
      });
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
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
        <div className="flex items-center gap-3">
          {/* Refresh Controls */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-rink-200 p-1">
            {REFRESH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRefreshInterval(opt.value)}
                className={`px-3 py-1 text-sm rounded ${
                  refreshInterval === opt.value
                    ? 'bg-ice-600 text-white'
                    : 'text-rink-600 hover:bg-rink-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => refetch()}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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
      </div>

      {/* Live Status Indicator */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-rink-200 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-rink-600">
          {refreshInterval > 0 && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Live updates every {refreshInterval / 1000}s</span>
            </>
          )}
          {refreshInterval === 0 && (
            <>
              <ClockIcon className="w-4 h-4" />
              <span>Manual refresh</span>
            </>
          )}
        </div>
        <span className="text-xs text-rink-400">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-ice-100 rounded-lg">
            <UserGroupIcon className="w-6 h-6 text-ice-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{totalUsers}</p>
            <p className="text-sm text-rink-500">Total Users</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <ShieldCheckIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{activeUsers}</p>
            <p className="text-sm text-rink-500">Active</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ShieldExclamationIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{adminCount}</p>
            <p className="text-sm text-rink-500">Admins/Managers</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-rink-100 rounded-lg">
            <UserGroupIcon className="w-6 h-6 text-rink-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{inactiveUsers}</p>
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
              <option value="SUPER_ADMIN">Super Admin</option>
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="text-center py-12">
          <XCircleIcon className="w-12 h-12 mx-auto text-red-300 mb-4" />
          <h3 className="text-lg font-medium text-rink-700">Failed to load users</h3>
          <p className="text-rink-500 mt-1">Please try again later</p>
          <Button variant="secondary" onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </Card>
      )}

      {/* Users Table */}
      {!isLoading && !error && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-rink-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">
                    Facilities
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rink-100">
                {filteredUsers.map((user) => {
                  const facilities = getUserFacilities(user);
                  return (
                    <tr key={user.id} className="hover:bg-rink-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-ice-100 rounded-full flex items-center justify-center">
                            <span className="text-ice-700 font-medium">
                              {formatUserInitials(user.name)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-rink-900">{user.name}</p>
                            <p className="text-sm text-rink-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            'px-2 py-1 text-xs font-medium rounded-full',
                            getRoleColor(user.role)
                          )}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {facilities.length > 0 ? (
                            facilities.map((facility) => (
                              <span
                                key={facility}
                                className="px-2 py-0.5 text-xs bg-rink-100 text-rink-600 rounded"
                              >
                                {facility}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-rink-400">No facilities</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={updateUser.isPending}
                        >
                          {user.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="default">Inactive</Badge>
                          )}
                        </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <UserGroupIcon className="w-12 h-12 mx-auto text-rink-300 mb-4" />
              <h3 className="text-lg font-medium text-rink-700">No users found</h3>
              <p className="text-rink-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </Card>
      )}

      {/* Pagination Info */}
      {usersData && (
        <div className="flex items-center justify-between text-sm text-rink-500">
          <span>
            Showing {filteredUsers.length} of {usersData.total} users
          </span>
          {usersData.totalPages > 1 && (
            <span>
              Page {usersData.page} of {usersData.totalPages}
            </span>
          )}
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <Card className="relative z-10 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-rink-900 mb-4">
              {selectedUser ? 'Edit User' : 'Add User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
                disabled={!!selectedUser}
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
              <div>
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (min 8 characters)"
                  required
                />
              )}

              {/* Error Display */}
              {(createUser.error || updateUser.error) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {createUser.error?.message || updateUser.error?.message}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={createUser.isPending || updateUser.isPending}
                >
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
