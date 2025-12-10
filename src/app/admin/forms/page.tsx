'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  PlusIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useForms } from '@/hooks';

const CATEGORY_LABELS: Record<string, string> = {
  ICE_OPERATIONS: 'Ice Operations',
  INCIDENT_REPORTING: 'Incident Reporting',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  FACILITY_CHECKLIST: 'Facility Checklist',
  CUSTOM: 'Custom',
};

const categoryColors: Record<string, string> = {
  ICE_OPERATIONS: 'bg-ice-100 text-ice-700',
  INCIDENT_REPORTING: 'bg-red-100 text-red-700',
  REFRIGERATION: 'bg-purple-100 text-purple-700',
  AIR_QUALITY: 'bg-green-100 text-green-700',
  FACILITY_CHECKLIST: 'bg-yellow-100 text-yellow-700',
  CUSTOM: 'bg-rink-100 text-rink-700',
};

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
];

export default function FormsPage() {
  const [refreshInterval, setRefreshInterval] = useState(60000);

  const { data: forms = [], isLoading, error, refetch, dataUpdatedAt } = useForms();

  // Calculate stats
  const stats = useMemo(() => {
    const totalForms = forms.length;
    const publishedForms = forms.filter((f) => f.isPublished).length;
    const totalSubmissions = forms.reduce((acc, f) => acc + (f._count?.submissions || 0), 0);
    return { totalForms, publishedForms, totalSubmissions };
  }, [forms]);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <div className="animate-pulse text-center">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
        <p className="font-medium">Failed to load forms</p>
        <p className="text-sm mt-1">{error.message}</p>
        <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Builder</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage custom forms for your facility operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Updated {formatLastUpdated()}</span>
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
          <Link href="/admin/forms/new">
            <Button leftIcon={<PlusIcon className="w-4 h-4" />}>Create Form</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-rink-900">{stats.totalForms}</p>
            <p className="text-sm text-rink-500 mt-1">Total Forms</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-rink-900">{stats.publishedForms}</p>
            <p className="text-sm text-rink-500 mt-1">Published</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-rink-900">
              {stats.totalSubmissions.toLocaleString()}
            </p>
            <p className="text-sm text-rink-500 mt-1">Total Submissions</p>
          </div>
        </Card>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => (
          <Card key={form.id} padding="none" className="group hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rink-100 rounded-lg">
                    <DocumentTextIcon className="w-5 h-5 text-rink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-rink-900">{form.name}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                        categoryColors[form.category] || categoryColors['CUSTOM']
                      }`}
                    >
                      {CATEGORY_LABELS[form.category] || form.category}
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 text-rink-400 hover:text-rink-600 rounded">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-rink-500">Fields</p>
                  <p className="font-medium text-rink-900">{form.fields?.length || 0}</p>
                </div>
                <div>
                  <p className="text-rink-500">Submissions</p>
                  <p className="font-medium text-rink-900">{form._count?.submissions || 0}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <StatusBadge status={form.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                <span className="text-xs text-rink-500">
                  Updated {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-rink-100 bg-rink-50 flex items-center gap-2">
              <Link href={`/admin/forms/${form.id}/edit`} className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  leftIcon={<PencilIcon className="w-4 h-4" />}
                >
                  Edit
                </Button>
              </Link>
              <Button variant="ghost" size="sm" leftIcon={<EyeIcon className="w-4 h-4" />}>
                Preview
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<DocumentDuplicateIcon className="w-4 h-4" />}>
                Clone
              </Button>
            </div>
          </Card>
        ))}

        {/* Create New Form Card */}
        <Link href="/admin/forms/new">
          <Card className="h-full min-h-[200px] flex items-center justify-center border-2 border-dashed border-rink-300 hover:border-ice-400 hover:bg-ice-50 transition-colors cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-rink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <PlusIcon className="w-6 h-6 text-rink-600" />
              </div>
              <p className="font-medium text-rink-700">Create New Form</p>
              <p className="text-sm text-rink-500 mt-1">Build a custom form from scratch</p>
            </div>
          </Card>
        </Link>
      </div>

      {forms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No forms yet</p>
          <p className="text-sm mt-1">Create your first form to get started</p>
          <Link href="/admin/forms/new" className="mt-4 inline-block">
            <Button leftIcon={<PlusIcon className="w-4 h-4" />}>Create Form</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
