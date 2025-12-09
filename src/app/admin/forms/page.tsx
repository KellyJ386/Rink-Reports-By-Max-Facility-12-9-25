import Link from 'next/link';
import {
  PlusIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';

// Mock data for forms
const forms = [
  {
    id: '1',
    name: 'Ice Make Logbook',
    category: 'Ice Operations',
    fieldsCount: 12,
    submissions: 234,
    lastUpdated: '2024-12-08',
    status: 'PUBLISHED',
  },
  {
    id: '2',
    name: 'Zamboni Circle Check',
    category: 'Ice Operations',
    fieldsCount: 18,
    submissions: 456,
    lastUpdated: '2024-12-07',
    status: 'PUBLISHED',
  },
  {
    id: '3',
    name: 'Incident Report',
    category: 'Incident Reporting',
    fieldsCount: 15,
    submissions: 23,
    lastUpdated: '2024-12-06',
    status: 'PUBLISHED',
  },
  {
    id: '4',
    name: 'Daily Refrigeration Log',
    category: 'Refrigeration',
    fieldsCount: 20,
    submissions: 180,
    lastUpdated: '2024-12-05',
    status: 'PUBLISHED',
  },
  {
    id: '5',
    name: 'Air Quality Check',
    category: 'Air Quality',
    fieldsCount: 8,
    submissions: 150,
    lastUpdated: '2024-12-04',
    status: 'DRAFT',
  },
];

const categoryColors: Record<string, string> = {
  'Ice Operations': 'bg-ice-100 text-ice-700',
  'Incident Reporting': 'bg-red-100 text-red-700',
  'Refrigeration': 'bg-purple-100 text-purple-700',
  'Air Quality': 'bg-green-100 text-green-700',
  'Facility Checklist': 'bg-yellow-100 text-yellow-700',
  'Custom': 'bg-rink-100 text-rink-700',
};

export default function FormsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Form Builder</h1>
          <p className="page-description">
            Create and manage custom forms for your facility operations
          </p>
        </div>
        <Link href="/admin/forms/new">
          <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
            Create Form
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-rink-900">{forms.length}</p>
            <p className="text-sm text-rink-500 mt-1">Total Forms</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-rink-900">
              {forms.filter((f) => f.status === 'PUBLISHED').length}
            </p>
            <p className="text-sm text-rink-500 mt-1">Published</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-rink-900">
              {forms.reduce((acc, f) => acc + f.submissions, 0)}
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
                        categoryColors[form.category] || categoryColors['Custom']
                      }`}
                    >
                      {form.category}
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
                  <p className="font-medium text-rink-900">{form.fieldsCount}</p>
                </div>
                <div>
                  <p className="text-rink-500">Submissions</p>
                  <p className="font-medium text-rink-900">{form.submissions}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <StatusBadge status={form.status} />
                <span className="text-xs text-rink-500">
                  Updated {form.lastUpdated}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-rink-100 bg-rink-50 flex items-center gap-2">
              <Link href={`/admin/forms/${form.id}/edit`} className="flex-1">
                <Button variant="ghost" size="sm" className="w-full" leftIcon={<PencilIcon className="w-4 h-4" />}>
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
              <p className="text-sm text-rink-500 mt-1">
                Build a custom form from scratch
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
