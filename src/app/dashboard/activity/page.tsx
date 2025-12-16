'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Types
interface AuditLogUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

interface FilterOption {
  id: string;
  name: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

// Action badge colors
const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  VIEW: 'bg-yellow-100 text-yellow-800',
  EXPORT: 'bg-teal-100 text-teal-800',
};

// Action icons
const actionIcons: Record<string, typeof PlusCircleIcon> = {
  CREATE: PlusCircleIcon,
  UPDATE: PencilSquareIcon,
  DELETE: TrashIcon,
  LOGIN: UserIcon,
  LOGOUT: UserIcon,
  VIEW: EyeIcon,
  EXPORT: ArrowDownTrayIcon,
};

export default function ActivityLogPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const [filterOptions, setFilterOptions] = useState<{
    actions: string[];
    entityTypes: string[];
    users: FilterOption[];
  }>({
    actions: [],
    entityTypes: [],
    users: [],
  });

  // Selected log for detail view
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Stats
  const [stats, setStats] = useState<{
    totalLogs: number;
    byAction: Record<string, number>;
    byEntityType: { entityType: string; count: number }[];
  } | null>(null);

  // Fetch logs
  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.action) params.set('action', filters.action);
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.search) params.set('search', filters.search);

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch logs');
      }

      setLogs(data.data);
      setPagination(data.pagination);
      setFilterOptions(data.filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' }),
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchLogs(1);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      userId: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    fetchLogs(1);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  // Format entity type for display
  const formatEntityType = (entityType: string) => {
    return entityType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Render value diff
  const renderValueDiff = (oldVal: unknown, newVal: unknown, key: string) => {
    if (oldVal === newVal) return null;

    const formatValue = (val: unknown) => {
      if (val === null || val === undefined) return 'null';
      if (typeof val === 'object') return JSON.stringify(val, null, 2);
      return String(val);
    };

    return (
      <div key={key} className="py-2 border-b border-rink-100 last:border-0">
        <p className="text-xs font-medium text-rink-600 mb-1">{key}</p>
        <div className="flex gap-4 text-sm">
          {oldVal !== undefined && (
            <div className="flex-1">
              <span className="text-xs text-rink-400">Before:</span>
              <pre className="mt-1 p-2 bg-red-50 rounded text-red-700 text-xs overflow-auto">
                {formatValue(oldVal)}
              </pre>
            </div>
          )}
          {newVal !== undefined && (
            <div className="flex-1">
              <span className="text-xs text-rink-400">After:</span>
              <pre className="mt-1 p-2 bg-green-50 rounded text-green-700 text-xs overflow-auto">
                {formatValue(newVal)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-description">
            Track all actions and changes made across the facility management system.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            fetchLogs(pagination.page);
            fetchStats();
          }}
          leftIcon={<ArrowPathIcon className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ice-100 rounded-lg">
                <ClockIcon className="w-5 h-5 text-ice-600" />
              </div>
              <div>
                <p className="text-sm text-rink-500">Total Actions (30 days)</p>
                <p className="text-2xl font-bold text-rink-900">{stats.totalLogs}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <PlusCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-rink-500">Creates</p>
                <p className="text-2xl font-bold text-rink-900">{stats.byAction.CREATE || 0}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PencilSquareIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-rink-500">Updates</p>
                <p className="text-2xl font-bold text-rink-900">{stats.byAction.UPDATE || 0}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrashIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-rink-500">Deletes</p>
                <p className="text-2xl font-bold text-rink-900">{stats.byAction.DELETE || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-rink-400" />
            <input
              type="text"
              placeholder="Search by entity ID or user..."
              className="form-input pl-10 w-full"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<FunnelIcon className="w-4 h-4" />}
          >
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="primary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <Button onClick={applyFilters}>Search</Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-rink-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Action Filter */}
              <div>
                <label className="form-label">Action</label>
                <select
                  className="form-input"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <option value="">All Actions</option>
                  {filterOptions.actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Type Filter */}
              <div>
                <label className="form-label">Entity Type</label>
                <select
                  className="form-input"
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                >
                  <option value="">All Types</option>
                  {filterOptions.entityTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatEntityType(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div>
                <label className="form-label">User</label>
                <select
                  className="form-input"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                >
                  <option value="">All Users</option>
                  {filterOptions.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="ghost" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Activity Log Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-rink-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-rink-900">
              Activity Log
              {pagination.totalCount > 0 && (
                <span className="ml-2 text-sm font-normal text-rink-500">
                  ({pagination.totalCount} entries)
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center">
            <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-ice-500" />
            <p className="mt-2 text-rink-500">Loading activity log...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => fetchLogs(1)}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && logs.length === 0 && (
          <div className="p-12 text-center">
            <ClockIcon className="w-12 h-12 mx-auto text-rink-300" />
            <p className="mt-2 text-rink-500">No activity logs found</p>
            {activeFilterCount > 0 && (
              <Button variant="ghost" className="mt-2" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Log Entries */}
        {!isLoading && !error && logs.length > 0 && (
          <div className="divide-y divide-rink-100">
            {logs.map((log) => {
              const ActionIcon = actionIcons[log.action] || DocumentTextIcon;
              const actionColor = actionColors[log.action] || 'bg-gray-100 text-gray-800';

              return (
                <div
                  key={log.id}
                  className="px-6 py-4 hover:bg-rink-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start gap-4">
                    {/* Action Icon */}
                    <div className={`p-2 rounded-lg ${actionColor.split(' ')[0]}`}>
                      <ActionIcon className={`w-5 h-5 ${actionColor.split(' ')[1]}`} />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={actionColor}>{log.action}</Badge>
                        <span className="text-sm text-rink-500">on</span>
                        <span className="text-sm font-medium text-rink-900">
                          {formatEntityType(log.entityType)}
                        </span>
                        {log.entityId && (
                          <span className="text-sm text-rink-400 font-mono">
                            #{log.entityId.slice(0, 8)}...
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-4 text-sm text-rink-500">
                        {log.user && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            {log.user.name || log.user.email}
                          </span>
                        )}
                        <span>{formatRelativeTime(log.createdAt)}</span>
                      </div>
                    </div>

                    {/* View Details */}
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-rink-200 flex items-center justify-between">
            <p className="text-sm text-rink-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => fetchLogs(pagination.page - 1)}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <span className="text-sm text-rink-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-rink-200">
              <h3 className="text-lg font-semibold text-rink-900">Activity Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 py-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-rink-500 mb-1">Action</p>
                  <Badge className={actionColors[selectedLog.action] || 'bg-gray-100 text-gray-800'}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-rink-500 mb-1">Entity Type</p>
                  <p className="text-sm font-medium text-rink-900">
                    {formatEntityType(selectedLog.entityType)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-rink-500 mb-1">Entity ID</p>
                  <p className="text-sm font-mono text-rink-700">{selectedLog.entityId}</p>
                </div>
                <div>
                  <p className="text-xs text-rink-500 mb-1">Timestamp</p>
                  <p className="text-sm text-rink-700">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-rink-500 mb-1">User</p>
                  <p className="text-sm text-rink-700">
                    {selectedLog.user?.name || selectedLog.user?.email || 'System'}
                  </p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-xs text-rink-500 mb-1">IP Address</p>
                    <p className="text-sm font-mono text-rink-700">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>

              {/* Value Changes */}
              {(selectedLog.oldValues || selectedLog.newValues) && (
                <div>
                  <h4 className="text-sm font-semibold text-rink-900 mb-3">Changes</h4>
                  <div className="bg-rink-50 rounded-lg p-4">
                    {selectedLog.action === 'CREATE' && selectedLog.newValues && (
                      <div>
                        <p className="text-xs text-rink-500 mb-2">Created with values:</p>
                        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-60">
                          {JSON.stringify(selectedLog.newValues, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.action === 'DELETE' && selectedLog.oldValues && (
                      <div>
                        <p className="text-xs text-rink-500 mb-2">Deleted values:</p>
                        <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-60">
                          {JSON.stringify(selectedLog.oldValues, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.action === 'UPDATE' && (
                      <div>
                        {(() => {
                          const oldVals = selectedLog.oldValues || {};
                          const newVals = selectedLog.newValues || {};
                          const allKeys = new Set([
                            ...Object.keys(oldVals),
                            ...Object.keys(newVals),
                          ]);

                          return Array.from(allKeys).map((key) =>
                            renderValueDiff(
                              oldVals[key as keyof typeof oldVals],
                              newVals[key as keyof typeof newVals],
                              key
                            )
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div className="mt-4">
                  <p className="text-xs text-rink-500 mb-1">User Agent</p>
                  <p className="text-xs font-mono text-rink-600 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-rink-200 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
