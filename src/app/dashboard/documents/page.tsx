'use client';

import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  FolderIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getDocuments,
  getDocumentCategories,
  getDocumentStats,
  getDocumentAuditLog,
  documentTypeLabels,
  documentStatusLabels,
  formatFileSize,
  getFileTypeIcon,
  getDocumentStatusColor,
} from '@/lib/documents';
import type {
  Document,
  DocumentCategory,
  DocumentStats,
  DocumentAuditLog,
  DocumentType,
  DocumentStatus,
} from '@/lib/documents';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [auditLog, setAuditLog] = useState<DocumentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | ''>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, catsData, statsData, auditData] = await Promise.all([
        getDocuments(),
        getDocumentCategories(),
        getDocumentStats(),
        getDocumentAuditLog(),
      ]);

      setDocuments(docsData);
      setCategories(catsData);
      setStats(statsData);
      setAuditLog(auditData);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || doc.categoryId === selectedCategory;
    const matchesType = !selectedType || doc.type === selectedType;
    const matchesStatus = !selectedStatus || doc.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const getFileIcon = (fileType: string) => {
    const iconType = getFileTypeIcon(fileType);
    const colors: Record<string, string> = {
      pdf: 'text-red-500',
      doc: 'text-blue-500',
      xls: 'text-green-500',
      ppt: 'text-orange-500',
      img: 'text-purple-500',
      file: 'text-gray-500',
    };
    return <DocumentTextIcon className={cn('w-8 h-8', colors[iconType])} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage, share, and track all facility documents
          </p>
        </div>
        <Button>
          <CloudArrowUpIcon className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDocuments}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FolderIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatFileSize(stats.totalStorageUsed)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingReview}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.expiringThisMonth}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                  !selectedCategory
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                )}
              >
                <span>All Documents</span>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {documents.length}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    selectedCategory === cat.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  )}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {cat.documentCount}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
            <div className="space-y-3">
              {auditLog.slice(0, 5).map((log) => (
                <div key={log.id} className="text-sm">
                  <p className="text-gray-900 dark:text-white">{log.documentTitle}</p>
                  <p className="text-gray-500 text-xs">
                    {log.action.replace('_', ' ')} by {log.userName} •{' '}
                    {log.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType | '')}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
            >
              <option value="">All Types</option>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as DocumentStatus | '')}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
            >
              <option value="">All Status</option>
              {Object.entries(documentStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-2',
                  viewMode === 'list'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-3 py-2',
                  viewMode === 'grid'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Document List/Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : viewMode === 'list' ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Document</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Modified</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {getFileIcon(doc.fileType)}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{doc.title}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">{doc.description}</p>
                              <div className="flex gap-1 mt-1">
                                {doc.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {documentTypeLabels[doc.type]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatFileSize(doc.fileSize)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('px-2 py-1 text-xs font-medium rounded', getDocumentStatusColor(doc.status))}>
                            {documentStatusLabels[doc.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {doc.updatedAt.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" title="View">
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Download">
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Share">
                              <ShareIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatFileSize(doc.fileSize)}
                    </p>
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded', getDocumentStatusColor(doc.status))}>
                      {documentStatusLabels[doc.status]}
                    </span>
                    {doc.expirationDate && doc.expirationDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                      <span className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3 h-3" />
                        Expires {doc.expirationDate.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {filteredDocuments.length === 0 && (
            <Card className="p-12 text-center">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No documents found
              </h3>
              <p className="text-gray-500">
                {searchQuery || selectedCategory || selectedType || selectedStatus
                  ? 'Try adjusting your filters'
                  : 'Upload your first document to get started'}
              </p>
              <Button className="mt-4">
                <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
