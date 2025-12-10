'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useAuditLogsLive,
  getAuditActionColor,
  getSeverityColor,
  type AuditLogEntry,
  type AuditAction,
  type AuditSeverity,
} from '@/hooks';
import {
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

// Refresh intervals
const REFRESH_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
];

const severityIcons: Record<AuditSeverity, typeof CheckCircleIcon> = {
  LOW: CheckCircleIcon,
  MEDIUM: CheckCircleIcon,
  HIGH: ExclamationTriangleIcon,
  CRITICAL: XCircleIcon,
};

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | 'all'>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<'SUCCESS' | 'FAILURE' | 'all'>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Build filter
  const filter = {
    actions: selectedAction !== 'all' ? [selectedAction] : undefined,
    severity: selectedSeverity !== 'all' ? [selectedSeverity] : undefined,
    outcome: selectedOutcome !== 'all' ? selectedOutcome : undefined,
    searchTerm: searchQuery || undefined,
    limit: 100,
  };

  // Fetch audit logs with live refresh
  const {
    data,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useAuditLogsLive(filter, { refreshInterval, enabled: true });

  // Update last refresh time
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefresh(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const logs = data?.logs || [];
  const stats = data?.stats || { total: 0, today: 0, failures: 0, highSeverity: 0 };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all system activity and changes
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
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export Logs
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Events</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-primary-600">{stats.today}</p>
          <p className="text-sm text-gray-500">Last 24 Hours</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-red-600">{stats.failures}</p>
          <p className="text-sm text-gray-500">Failed Actions</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-yellow-600">{stats.highSeverity}</p>
          <p className="text-sm text-gray-500">High Severity</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as AuditAction | 'all')}
              className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
            >
              <option value="all">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="EXPORT">Export</option>
              <option value="APPROVE">Approve</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as AuditSeverity | 'all')}
              className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
            >
              <option value="all">All Severity</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value as 'SUCCESS' | 'FAILURE' | 'all')}
              className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
            >
              <option value="all">All Outcomes</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
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
          <h3 className="text-lg font-medium text-rink-700">Failed to load audit logs</h3>
          <p className="text-rink-500 mt-1">Please try again later</p>
          <Button variant="secondary" onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </Card>
      )}

      {/* Logs Table */}
      {!isLoading && !error && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log: AuditLogEntry) => {
                  const SeverityIcon = severityIcons[log.severity];
                  const isExpanded = expandedLog === log.id;

                  return (
                    <>
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getAuditActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <div className="max-w-md truncate">{log.description}</div>
                          {log.resourceName && (
                            <div className="text-xs text-gray-500">{log.resource}: {log.resourceName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {log.userName || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">{log.userRole || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={log.outcome === 'SUCCESS' ? 'success' : 'danger'}>
                            {log.outcome}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <SeverityIcon className={`w-4 h-4 ${getSeverityColor(log.severity)}`} />
                            <span className={`text-sm ${getSeverityColor(log.severity)}`}>
                              {log.severity}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${log.id}-details`}>
                          <td colSpan={6} className="px-4 py-4 bg-gray-50 dark:bg-gray-800">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 text-xs uppercase">Email</p>
                                <p className="text-gray-900 dark:text-white">{log.userEmail || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs uppercase">IP Address</p>
                                <p className="text-gray-900 dark:text-white">{log.ipAddress || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs uppercase">Facility</p>
                                <p className="text-gray-900 dark:text-white">{log.facilityName || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs uppercase">Resource ID</p>
                                <p className="text-gray-900 dark:text-white font-mono text-xs">{log.resourceId || '-'}</p>
                              </div>
                              {log.changes && (
                                <div className="col-span-full">
                                  <p className="text-gray-500 text-xs uppercase mb-2">Changes</p>
                                  <div className="bg-white dark:bg-gray-700 rounded p-3">
                                    {log.changes.fields && (
                                      <p className="text-gray-600 dark:text-gray-300 mb-2">
                                        Fields modified: {log.changes.fields.join(', ')}
                                      </p>
                                    )}
                                    {log.changes.before && (
                                      <div className="mb-2">
                                        <span className="text-red-500 font-medium">Before:</span>
                                        <pre className="text-xs mt-1 overflow-auto">
                                          {JSON.stringify(log.changes.before, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                    {log.changes.after && (
                                      <div>
                                        <span className="text-green-500 font-medium">After:</span>
                                        <pre className="text-xs mt-1 overflow-auto">
                                          {JSON.stringify(log.changes.after, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {log.errorMessage && (
                                <div className="col-span-full">
                                  <p className="text-gray-500 text-xs uppercase">Error</p>
                                  <p className="text-red-600 dark:text-red-400">{log.errorMessage}</p>
                                </div>
                              )}
                              {log.metadata && (
                                <div className="col-span-full">
                                  <p className="text-gray-500 text-xs uppercase mb-1">Metadata</p>
                                  <pre className="text-xs bg-white dark:bg-gray-700 rounded p-2 overflow-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <ClipboardDocumentListIcon className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600" />
              <p>No audit logs match your filters</p>
            </div>
          )}
        </Card>
      )}

      {/* Pagination */}
      {logs.length > 0 && data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {logs.length} of {data.pagination.total} events
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled>
              Previous
            </Button>
            <Button variant="secondary" size="sm">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
