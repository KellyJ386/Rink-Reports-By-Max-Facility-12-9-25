'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  ClockIcon,
  SunIcon,
  MoonIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import clsx from 'clsx';

interface ChecklistItem {
  id: string;
  label: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string;
}

interface Checklist {
  id: string;
  name: string;
  category: 'OPENING' | 'CLOSING' | 'SAFETY' | 'MAINTENANCE' | 'CLEANING';
  items: ChecklistItem[];
  lastCompleted?: string;
  completedBy?: string;
}

// Mock data
const mockChecklists: Checklist[] = [
  {
    id: '1',
    name: 'Opening Checklist',
    category: 'OPENING',
    lastCompleted: new Date(Date.now() - 86400000).toISOString(),
    completedBy: 'John Smith',
    items: [
      { id: '1a', label: 'Unlock all entrances', isRequired: true, isCompleted: false },
      { id: '1b', label: 'Turn on building lights', isRequired: true, isCompleted: false },
      { id: '1c', label: 'Check ice surface condition', isRequired: true, isCompleted: false },
      { id: '1d', label: 'Verify thermostat settings', isRequired: true, isCompleted: false },
      { id: '1e', label: 'Test emergency lighting', isRequired: true, isCompleted: false },
      { id: '1f', label: 'Check restrooms are stocked', isRequired: false, isCompleted: false },
      { id: '1g', label: 'Review schedule for the day', isRequired: true, isCompleted: false },
      { id: '1h', label: 'Power on POS systems', isRequired: true, isCompleted: false },
    ],
  },
  {
    id: '2',
    name: 'Closing Checklist',
    category: 'CLOSING',
    lastCompleted: new Date(Date.now() - 43200000).toISOString(),
    completedBy: 'Sarah Johnson',
    items: [
      { id: '2a', label: 'Ensure all patrons have left', isRequired: true, isCompleted: false },
      { id: '2b', label: 'Secure all entrance/exit doors', isRequired: true, isCompleted: false },
      { id: '2c', label: 'Turn off non-essential lights', isRequired: true, isCompleted: false },
      { id: '2d', label: 'Set alarm system', isRequired: true, isCompleted: false },
      { id: '2e', label: 'Check refrigeration readings', isRequired: true, isCompleted: false },
      { id: '2f', label: 'Empty trash receptacles', isRequired: false, isCompleted: false },
    ],
  },
  {
    id: '3',
    name: 'Daily Safety Check',
    category: 'SAFETY',
    items: [
      { id: '3a', label: 'Inspect boards and glass', isRequired: true, isCompleted: false },
      { id: '3b', label: 'Check penalty box doors', isRequired: true, isCompleted: false },
      { id: '3c', label: 'Verify first aid kit supplies', isRequired: true, isCompleted: false },
      { id: '3d', label: 'Test AED battery status', isRequired: true, isCompleted: false },
      { id: '3e', label: 'Check fire extinguisher seals', isRequired: true, isCompleted: false },
    ],
  },
];

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  OPENING: SunIcon,
  CLOSING: MoonIcon,
  SAFETY: CheckCircleIcon,
  MAINTENANCE: WrenchScrewdriverIcon,
  CLEANING: SparklesIcon,
};

const categoryColors: Record<string, string> = {
  OPENING: 'bg-yellow-100 text-yellow-800',
  CLOSING: 'bg-indigo-100 text-indigo-800',
  SAFETY: 'bg-red-100 text-red-800',
  MAINTENANCE: 'bg-blue-100 text-blue-800',
  CLEANING: 'bg-green-100 text-green-800',
};

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>(mockChecklists);
  const [activeChecklist, setActiveChecklist] = useState<string | null>(null);

  const handleToggleItem = (checklistId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((checklist) => {
        if (checklist.id !== checklistId) return checklist;
        return {
          ...checklist,
          items: checklist.items.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              isCompleted: !item.isCompleted,
              completedAt: !item.isCompleted ? new Date().toISOString() : undefined,
            };
          }),
        };
      })
    );
  };

  const getCompletionPercent = (checklist: Checklist) => {
    const completed = checklist.items.filter((i) => i.isCompleted).length;
    return Math.round((completed / checklist.items.length) * 100);
  };

  const handleCompleteChecklist = (checklistId: string) => {
    const checklist = checklists.find((c) => c.id === checklistId);
    if (!checklist) return;

    const allRequiredCompleted = checklist.items
      .filter((i) => i.isRequired)
      .every((i) => i.isCompleted);

    if (!allRequiredCompleted) {
      alert('Please complete all required items before submitting.');
      return;
    }

    setChecklists((prev) =>
      prev.map((c) => {
        if (c.id !== checklistId) return c;
        return {
          ...c,
          lastCompleted: new Date().toISOString(),
          completedBy: 'Current User',
          items: c.items.map((item) => ({ ...item, isCompleted: false, completedAt: undefined })),
        };
      })
    );
    setActiveChecklist(null);
    alert('Checklist submitted successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Facility Checklists</h1>
          <p className="page-description">
            Complete standard operating procedures and daily checklists.
          </p>
        </div>
        <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
          Create Checklist
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">
              {checklists.filter((c) => c.lastCompleted).length}
            </p>
            <p className="text-sm text-rink-500">Completed Today</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <ClockIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">
              {checklists.filter((c) => !c.lastCompleted).length}
            </p>
            <p className="text-sm text-rink-500">Pending</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-ice-100 rounded-lg">
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-ice-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{checklists.length}</p>
            <p className="text-sm text-rink-500">Total Checklists</p>
          </div>
        </Card>
      </div>

      {/* Checklists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {checklists.map((checklist) => {
          const isActive = activeChecklist === checklist.id;
          const completionPercent = getCompletionPercent(checklist);
          const CategoryIcon = categoryIcons[checklist.category] || CheckCircleIcon;

          return (
            <Card key={checklist.id} padding="none" className="overflow-hidden">
              {/* Header */}
              <div
                className="p-4 border-b border-rink-200 cursor-pointer hover:bg-rink-50"
                onClick={() => setActiveChecklist(isActive ? null : checklist.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx('p-2 rounded-lg', categoryColors[checklist.category])}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-rink-900">{checklist.name}</h3>
                      <p className="text-sm text-rink-500">
                        {checklist.items.length} items
                      </p>
                    </div>
                  </div>
                  <Badge variant={checklist.category === 'OPENING' ? 'warning' : 'default'}>
                    {checklist.category}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-rink-500">Progress</span>
                    <span className="font-medium text-rink-700">{completionPercent}%</span>
                  </div>
                  <div className="h-2 bg-rink-100 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        completionPercent === 100 ? 'bg-green-500' : 'bg-ice-500'
                      )}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>

                {checklist.lastCompleted && (
                  <p className="text-xs text-rink-400 mt-3">
                    Last completed: {format(new Date(checklist.lastCompleted), 'MMM d, h:mm a')}
                    {checklist.completedBy && ` by ${checklist.completedBy}`}
                  </p>
                )}
              </div>

              {/* Items (when expanded) */}
              {isActive && (
                <div className="p-4 bg-rink-50">
                  <div className="space-y-2">
                    {checklist.items.map((item) => (
                      <label
                        key={item.id}
                        className={clsx(
                          'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                          item.isCompleted ? 'bg-green-50' : 'bg-white hover:bg-ice-50'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleItem(checklist.id, item.id)}
                          className={clsx(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                            item.isCompleted
                              ? 'bg-green-500 border-green-500'
                              : 'border-rink-300 hover:border-ice-500'
                          )}
                        >
                          {item.isCompleted && (
                            <CheckCircleSolidIcon className="w-5 h-5 text-white" />
                          )}
                        </button>
                        <span
                          className={clsx(
                            'flex-1',
                            item.isCompleted && 'line-through text-rink-400'
                          )}
                        >
                          {item.label}
                          {item.isRequired && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </span>
                        {item.completedAt && (
                          <span className="text-xs text-rink-400">
                            {format(new Date(item.completedAt), 'h:mm a')}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-rink-200">
                    <Button
                      variant="secondary"
                      onClick={() => setActiveChecklist(null)}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => handleCompleteChecklist(checklist.id)}
                      disabled={completionPercent < 100}
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Submit Checklist
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
