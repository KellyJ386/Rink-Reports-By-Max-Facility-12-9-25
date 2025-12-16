'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ServerStackIcon,
  ClockIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { formatBytes, entityNames } from '@/lib/data-management';
import type { DataStats, ExportJob, BackupJob, RetentionPolicy } from '@/lib/data-management/types';

// Mock data
const mockStats: DataStats[] = [
  { entity: 'incidents', totalRecords: 1247, archivedRecords: 352, sizeBytes: 15600000, oldestRecord: new Date('2023-01-01'), newestRecord: new Date() },
  { entity: 'ice_readings', totalRecords: 45230, archivedRecords: 12000, sizeBytes: 89400000, oldestRecord: new Date('2023-06-01'), newestRecord: new Date() },
  { entity: 'schedules', totalRecords: 3456, archivedRecords: 890, sizeBytes: 8700000, oldestRecord: new Date('2023-01-01'), newestRecord: new Date() },
  { entity: 'users', totalRecords: 156, archivedRecords: 23, sizeBytes: 2100000, oldestRecord: new Date('2022-01-01'), newestRecord: new Date() },
  { entity: 'forms', totalRecords: 8934, archivedRecords: 2100, sizeBytes: 34500000, oldestRecord: new Date('2023-01-01'), newestRecord: new Date() },
  { entity: 'maintenance', totalRecords: 567, archivedRecords: 120, sizeBytes: 5600000, oldestRecord: new Date('2023-03-01'), newestRecord: new Date() },
];

const mockExportJobs: ExportJob[] = [
  {
    id: '1',
    status: 'completed',
    options: { entities: ['incidents'], format: 'csv' },
    progress: 100,
    fileUrl: '/api/data/exports/1/download',
    fileSize: 256000,
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    status: 'processing',
    options: { entities: ['all'], format: 'json' },
    progress: 45,
    createdBy: 'user-1',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
  },
];

const mockBackups: BackupJob[] = [
  {
    id: '1',
    type: 'full',
    status: 'completed',
    size: 156000000,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    url: '/api/data/backups/1/download',
  },
  {
    id: '2',
    type: 'incremental',
    status: 'completed',
    size: 12000000,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    url: '/api/data/backups/2/download',
  },
];

const mockPolicies: RetentionPolicy[] = [
  { id: '1', entity: 'incidents', retentionDays: 365, archiveFirst: true, isActive: true, lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: '2', entity: 'ice_readings', retentionDays: 90, archiveFirst: false, isActive: true, lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: '3', entity: 'schedules', retentionDays: 180, archiveFirst: true, isActive: true },
  { id: '4', entity: 'forms', retentionDays: 365, archiveFirst: true, isActive: false },
];

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'export' | 'import' | 'backup' | 'retention'>('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const totalSize = mockStats.reduce((sum, s) => sum + s.sizeBytes, 0);
  const totalRecords = mockStats.reduce((sum, s) => sum + s.totalRecords, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Export, import, backup, and manage your data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowExportModal(true)}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
            Import Data
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b dark:border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: ChartBarIcon },
          { id: 'export', label: 'Exports', icon: ArrowDownTrayIcon },
          { id: 'import', label: 'Imports', icon: ArrowUpTrayIcon },
          { id: 'backup', label: 'Backups', icon: ServerStackIcon },
          { id: 'retention', label: 'Retention', icon: ClockIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRecords.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Records</p>
            </Card>
            <Card className="p-4">
              <p className="text-2xl font-bold text-primary-600">{formatBytes(totalSize)}</p>
              <p className="text-sm text-gray-500">Total Size</p>
            </Card>
            <Card className="p-4">
              <p className="text-2xl font-bold text-green-600">
                {mockBackups.filter((b) => b.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-500">Active Backups</p>
            </Card>
            <Card className="p-4">
              <p className="text-2xl font-bold text-yellow-600">
                {mockPolicies.filter((p) => p.isActive).length}
              </p>
              <p className="text-sm text-gray-500">Active Policies</p>
            </Card>
          </div>

          {/* Data by Entity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Data by Entity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="pb-3">Entity</th>
                    <th className="pb-3">Records</th>
                    <th className="pb-3">Archived</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Oldest</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {mockStats.map((stat) => (
                    <tr key={stat.entity}>
                      <td className="py-3 font-medium text-gray-900 dark:text-white">
                        {entityNames[stat.entity]}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {stat.totalRecords.toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {stat.archivedRecords.toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {formatBytes(stat.sizeBytes)}
                      </td>
                      <td className="py-3 text-gray-500 text-sm">
                        {stat.oldestRecord &&
                          formatDistanceToNow(new Date(stat.oldestRecord), { addSuffix: true })}
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Jobs</h3>
            <Button onClick={() => setShowExportModal(true)}>New Export</Button>
          </div>
          <div className="space-y-4">
            {mockExportJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    {job.options.format === 'csv' ? (
                      <TableCellsIcon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {job.options.entities.join(', ')} ({job.options.format.toUpperCase()})
                    </p>
                    <p className="text-sm text-gray-500">
                      Created {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {job.status === 'completed' ? (
                    <>
                      <span className="text-sm text-gray-500">{formatBytes(job.fileSize || 0)}</span>
                      <Badge variant="success">Completed</Badge>
                      <Button variant="secondary" size="sm">
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </>
                  ) : job.status === 'processing' ? (
                    <>
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <Badge variant="info">{job.progress}%</Badge>
                    </>
                  ) : (
                    <Badge variant="danger">Failed</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Backup</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <button className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left">
                <ServerStackIcon className="w-8 h-8 text-primary-600 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">Full Backup</h4>
                <p className="text-sm text-gray-500">Complete backup of all data</p>
              </button>
              <button className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left">
                <ArrowPathIcon className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">Incremental</h4>
                <p className="text-sm text-gray-500">Changes since last backup</p>
              </button>
              <button className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left">
                <ClockIcon className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">Schedule</h4>
                <p className="text-sm text-gray-500">Set up automatic backups</p>
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Backups
            </h3>
            <div className="space-y-4">
              {mockBackups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {backup.type} Backup
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{formatBytes(backup.size || 0)}</span>
                    <Button variant="secondary" size="sm">
                      <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="ghost" size="sm">
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Retention Tab */}
      {activeTab === 'retention' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Retention Policies
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Configure how long data is kept before being archived or deleted.
          </p>
          <div className="space-y-4">
            {mockPolicies.map((policy) => (
              <div
                key={policy.id}
                className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {entityNames[policy.entity]}
                    </p>
                    <p className="text-sm text-gray-500">
                      Retain for {policy.retentionDays} days
                      {policy.archiveFirst && ', archive before delete'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {policy.lastRun && (
                    <span className="text-xs text-gray-500">
                      Last run: {formatDistanceToNow(new Date(policy.lastRun), { addSuffix: true })}
                    </span>
                  )}
                  <Badge variant={policy.isActive ? 'success' : 'neutral'}>
                    {policy.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Data</h3>
            <Button onClick={() => setShowImportModal(true)}>New Import</Button>
          </div>
          <div className="text-center py-12 text-gray-500">
            <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent imports</p>
            <p className="text-sm">Upload a file to import data into the system</p>
          </div>
        </Card>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowExportModal(false)} />
          <Card className="relative z-10 w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Data
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data to Export
                </label>
                <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                  <option value="all">All Data</option>
                  {Object.entries(entityNames).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Format
                </label>
                <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    From Date
                  </label>
                  <input type="date" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To Date
                  </label>
                  <input type="date" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Include archived records</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowExportModal(false)}>Start Export</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowImportModal(false)} />
          <Card className="relative z-10 w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Import Data
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Type
                </label>
                <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                  {Object.entries(entityNames)
                    .filter(([key]) => key !== 'all')
                    .map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Import Mode
                </label>
                <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
                  <option value="append">Append (add new records)</option>
                  <option value="merge">Merge (update existing)</option>
                  <option value="replace">Replace (delete all first)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File
                </label>
                <div className="border-2 border-dashed dark:border-gray-600 rounded-lg p-8 text-center">
                  <ArrowUpTrayIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Drop a file here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">Supports CSV, JSON, Excel</p>
                  <input type="file" className="hidden" accept=".csv,.json,.xlsx" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Validate only (dry run)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowImportModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowImportModal(false)}>Start Import</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
