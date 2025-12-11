'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useForms } from '@/hooks/useFormSubmissions';
import {
  DocumentTextIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CloudIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// Category icons and colors
const categoryConfig: Record<string, { icon: typeof DocumentTextIcon; color: string }> = {
  ICE_OPERATIONS: { icon: BeakerIcon, color: 'bg-ice-100 text-ice-700' },
  INCIDENT_REPORTING: { icon: ExclamationTriangleIcon, color: 'bg-red-100 text-red-700' },
  REFRIGERATION: { icon: CloudIcon, color: 'bg-purple-100 text-purple-700' },
  AIR_QUALITY: { icon: CloudIcon, color: 'bg-green-100 text-green-700' },
  FACILITY_CHECKLIST: { icon: ClipboardDocumentCheckIcon, color: 'bg-yellow-100 text-yellow-700' },
  CUSTOM: { icon: DocumentTextIcon, color: 'bg-rink-100 text-rink-700' },
};

export default function FormsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Use real data from API
  const { data: forms = [], isLoading, error, refetch } = useForms({ published: true });

  // Filter by category if selected
  const filteredForms = selectedCategory
    ? forms.filter((f) => f.category === selectedCategory)
    : forms;

  // Get unique categories from actual data
  const categories = Array.from(new Set(forms.map((f) => f.category)));

  // Calculate stats from real data
  const totalForms = forms.length;
  const totalSubmissions = forms.reduce(
    (sum, f) => sum + (f._count?.submissions || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-600" />
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Forms</h1>
          <p className="page-description">
            Fill out facility forms for logging, reporting, and compliance.
          </p>
        </div>
        <Button variant="secondary" onClick={() => refetch()}>
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-ice-100 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-ice-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{totalForms}</p>
            <p className="text-sm text-rink-500">Available Forms</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{totalSubmissions}</p>
            <p className="text-sm text-rink-500">Total Submissions</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{categories.length}</p>
            <p className="text-sm text-rink-500">Categories</p>
          </div>
        </Card>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Forms
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      )}

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredForms.map((form) => {
          const config = categoryConfig[form.category] || categoryConfig.CUSTOM;
          const Icon = config.icon;

          return (
            <Link key={form.id} href={`/dashboard/forms/${form.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${config.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-rink-900 group-hover:text-ice-600 transition-colors">
                      {form.name}
                    </h3>
                    <Badge className="mt-1" variant="default">
                      {form.category.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-rink-400 group-hover:text-ice-600 transition-colors" />
                </div>

                {form.description && (
                  <p className="text-sm text-rink-500 mt-3 line-clamp-2">
                    {form.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-rink-100 text-xs text-rink-500">
                  <div className="flex items-center gap-1">
                    <DocumentTextIcon className="w-4 h-4" />
                    {form.fields?.length || 0} fields
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    {form._count?.submissions || 0} submissions
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <ClockIcon className="w-4 h-4" />
                    {new Date(form.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredForms.length === 0 && (
        <Card className="text-center py-12">
          <DocumentTextIcon className="w-16 h-16 text-rink-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-rink-900 mb-2">No Forms Available</h3>
          <p className="text-rink-500">
            {selectedCategory
              ? `No forms found in the ${selectedCategory.replace(/_/g, ' ')} category.`
              : 'No published forms are available at this time.'}
          </p>
        </Card>
      )}

      {/* Quick Access */}
      {forms.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-rink-900 mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {forms.slice(0, 4).map((form) => (
              <Link
                key={form.id}
                href={`/dashboard/forms/${form.id}`}
                className="p-4 rounded-lg border border-rink-200 hover:border-ice-300 hover:bg-ice-50 transition-colors text-center"
              >
                <DocumentTextIcon className="w-8 h-8 text-ice-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-rink-700 truncate">{form.name}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
