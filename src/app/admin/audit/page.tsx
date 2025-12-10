'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  ClipboardDocumentListIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import type { AuditLogEntry, AuditAction, AuditResource, AuditSeverity } from '@/lib/audit/types';

// Mock audit logs for demo
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    action: 'LOGIN',
    resource: 'SESSION',
    userId: 'user-1',
    userName: 'Admin User',
    userEmail: 'admin@mfo.com',
    userRole: 'SUPER_ADMIN',
    ipAddress: '192.168.1.100',
    severity: 'MEDIUM',
    description: 'User logged in',
    outcome: 'SUCCESS',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    action: 'CREATE',
    resource: 'INCIDENT',
    resourceId: 'inc-123',
    resourceName: 'Slip and Fall - Rink A',
    userId: 'user-2',
    userName: 'John Manager',
    userEmail: 'john@mfo.com',
    userRole: 'MANAGER',
    facilityId: 'fac-1',
    facilityName: 'Central Ice Arena',
    ipAddress: '192.168.1.101',
    severity: 'MEDIUM',
    description: 'Created incident "Slip and Fall - Rink A"',
    outcome: 'SUCCESS',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    action: 'UPDATE',
    resource: 'USER',
    resourceId: 'user-5',
    resourceName: 'Jane Smith',
    userId: 'user-1',
    userName: 'Admin User',
    userEmail: 'admin@mfo.com',
    userRole: 'SUPER_ADMIN',
    severity: 'HIGH',
    description: 'Updated user "Jane Smith"',
    outcome: 'SUCCESS',
    changes: {
      fields: ['role', 'facilityIds'],
      before: { role: 'STAFF', facilityIds: ['fac-1'] },
      after: { role: 'MANAGER', facilityIds: ['fac-1', 'fac-2'] },
    },
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    action: 'DELETE',
    resource: 'FORM_SUBMISSION',
    resourceId: 'form-456',
    userId: 'user-3',
    userName: 'Mike Tech',
    userEmail: 'mike@mfo.com',
    userRole: 'ICE_TECHNICIAN',
    facilityId: 'fac-1',
    facilityName: 'Central Ice Arena',
    severity: 'HIGH',
    description: 'Deleted form submission',
    outcome: 'SUCCESS',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    action: 'EXPORT',
    resource: 'REPORT',
    userId: 'user-1',
    userName: 'Admin User',
    userEmail: 'admin@mfo.com',
    userRole: 'SUPER_ADMIN',
    severity: 'MEDIUM',
    description: 'Exported report data',
    outcome: 'SUCCESS',
    metadata: { format: 'PDF', records: 150 },
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    action: 'LOGIN',
    resource: 'SESSION',
    userId: 'user-99',
    userName: 'Unknown',
    userEmail: 'hacker@bad.com',
    ipAddress: '10.0.0.1',
    severity: 'HIGH',
    description: 'Failed login attempt',
    outcome: 'FAILURE',
    errorMessage: 'Invalid credentials',
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    action: 'UPDATE',
    resource: 'SETTINGS',
    userId: 'user-1',
    userName: 'Admin User',
    userEmail: 'admin@mfo.com',
    userRole: 'SUPER_ADMIN',
    severity: 'HIGH',
    description: 'Updated system settings',
    outcome: 'SUCCESS',
    changes: {
      fields: ['sessionTimeout', 'passwordComplexity'],
    },
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    action: 'APPROVE',
    resource: 'SHIFT',
    resourceId: 'shift-789',
    resourceName: 'Time-off Request',
    userId: 'user-2',
    userName: 'John Manager',
    userEmail: 'john@mfo.com',
    userRole: 'MANAGER',
    facilityId: 'fac-1',
    facilityName: 'Central Ice Arena',
    severity: 'MEDIUM',
    description: 'Approved time-off request',
    outcome: 'SUCCESS',
  },
];

const actionColors: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  READ: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  LOGIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  LOGOUT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  EXPORT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  IMPORT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  APPROVE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  REJECT: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  ASSIGN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  UNASSIGN: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  ENABLE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  DISABLE: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  SEND: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  ARCHIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  RESTORE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
};

const severityConfig: Record<AuditSeverity, { color: string; icon: React.ElementType }> = {
  LOW: { color: 'text-gray-500', icon: CheckCircleIcon },
  MEDIUM: { color: 'text-blue-500', icon: CheckCircleIcon },
  HIGH: { color: 'text-yellow-500', icon: ExclamationTriangleIcon },
  CRITICAL: { color: 'text-red-500', icon: XCircleIcon },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | 'all'>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<'SUCCESS' | 'FAILURE' | 'all'>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) return false;
    if (selectedOutcome !== 'all' && log.outcome !== selectedOutcome) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.description.toLowerCase().includes(query) ||
        log.userName?.toLowerCase().includes(query) ||
        log.userEmail?.toLowerCase().includes(query) ||
        log.resourceName?.toLowerCase().includes(query) ||
        log.facilityName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: logs.length,
    today: logs.filter((l) => l.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
    failures: logs.filter((l) => l.outcome === 'FAILURE').length,
    highSeverity: logs.filter((l) => l.severity === 'HIGH' || l.severity === 'CRITICAL').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all system activity and changes
          </p>
        </div>
        <Button variant="secondary">
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
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

      {/* Logs Table */}
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
              {filteredLogs.map((log) => {
                const SeverityIcon = severityConfig[log.severity].icon;
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
                        <span className={`px-2 py-1 text-xs font-medium rounded ${actionColors[log.action]}`}>
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
                          <SeverityIcon className={`w-4 h-4 ${severityConfig[log.severity].color}`} />
                          <span className={`text-sm ${severityConfig[log.severity].color}`}>
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

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <ClipboardDocumentListIcon className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600" />
            <p>No audit logs match your filters</p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} events
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
