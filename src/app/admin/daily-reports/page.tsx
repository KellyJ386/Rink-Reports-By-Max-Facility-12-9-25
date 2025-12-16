'use client';

import { useState, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  Bars3Icon,
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import {
  useDailyReportTabs,
  useCreateDailyReportTab,
  useUpdateDailyReportTab,
  useDeleteDailyReportTab,
  useReorderDailyReportTabs,
  TAB_CATEGORY_META,
  DailyReportTab,
  DailyReportTabCategory,
} from '@/hooks/useDailyReports';
import { useForms } from '@/hooks';
import { useSession } from 'next-auth/react';

// Icon mapping for lucide-style icons
const ICON_OPTIONS = [
  { value: 'Inbox', label: 'Inbox' },
  { value: 'Sparkles', label: 'Sparkles' },
  { value: 'ShoppingBag', label: 'Shopping Bag' },
  { value: 'Coffee', label: 'Coffee' },
  { value: 'GraduationCap', label: 'Graduation Cap' },
  { value: 'Users', label: 'Users' },
  { value: 'AlertTriangle', label: 'Alert Triangle' },
  { value: 'Building', label: 'Building' },
  { value: 'DoorClosed', label: 'Door' },
  { value: 'Wrench', label: 'Wrench' },
  { value: 'Calendar', label: 'Calendar' },
  { value: 'Trophy', label: 'Trophy' },
  { value: 'Sparkle', label: 'Sparkle' },
  { value: 'Key', label: 'Key' },
  { value: 'Settings', label: 'Settings' },
  { value: 'ClipboardList', label: 'Clipboard' },
  { value: 'Shield', label: 'Shield' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Star', label: 'Star' },
  { value: 'Flag', label: 'Flag' },
];

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { value: 'green', label: 'Green', bg: 'bg-green-500' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
  { value: 'red', label: 'Red', bg: 'bg-red-500' },
  { value: 'gray', label: 'Gray', bg: 'bg-gray-500' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500' },
  { value: 'violet', label: 'Violet', bg: 'bg-violet-500' },
  { value: 'slate', label: 'Slate', bg: 'bg-slate-500' },
  { value: 'rose', label: 'Rose', bg: 'bg-rose-500' },
  { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
];

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'FACILITY_ADMIN', label: 'Facility Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'ICE_TECHNICIAN', label: 'Ice Technician' },
  { value: 'STAFF', label: 'Staff' },
];

const CATEGORY_OPTIONS = Object.entries(TAB_CATEGORY_META).map(([value, meta]) => ({
  value: value as DailyReportTabCategory,
  label: meta.label,
}));

interface TabFormData {
  name: string;
  category: DailyReportTabCategory;
  description: string;
  icon: string;
  color: string;
  formTemplateId: string | null;
  requiresCompletion: boolean;
  allowMultipleSubmissions: boolean;
  roleAssignments: Array<{
    role: string;
    canView: boolean;
    canSubmit: boolean;
    canReview: boolean;
  }>;
}

const defaultFormData: TabFormData = {
  name: '',
  category: 'CUSTOM',
  description: '',
  icon: 'Settings',
  color: 'gray',
  formTemplateId: null,
  requiresCompletion: false,
  allowMultipleSubmissions: true,
  roleAssignments: [],
};

export default function DailyReportsAdminPage() {
  const { data: session } = useSession();
  const facilityId = session?.user?.facilityId || '';

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<DailyReportTab | null>(null);
  const [deleteTab, setDeleteTab] = useState<DailyReportTab | null>(null);
  const [formData, setFormData] = useState<TabFormData>(defaultFormData);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);

  // Queries
  const { data: tabs = [], isLoading, refetch } = useDailyReportTabs({
    facilityId,
    includeInactive: true,
  });
  const { data: forms = [] } = useForms({ facilityId, published: true });

  // Mutations
  const createMutation = useCreateDailyReportTab();
  const updateMutation = useUpdateDailyReportTab(editingTab?.id || '');
  const deleteMutation = useDeleteDailyReportTab();
  const reorderMutation = useReorderDailyReportTabs();

  // Stats
  const activeTabs = tabs.filter((t) => t.isActive).length;
  const totalSubmissions = tabs.reduce((acc, t) => acc + (t._count?.submissions || 0), 0);

  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (tab: DailyReportTab) => {
    setFormData({
      name: tab.name,
      category: tab.category,
      description: tab.description || '',
      icon: tab.icon || TAB_CATEGORY_META[tab.category].icon,
      color: tab.color || TAB_CATEGORY_META[tab.category].defaultColor,
      formTemplateId: tab.formTemplateId || null,
      requiresCompletion: tab.requiresCompletion,
      allowMultipleSubmissions: tab.allowMultipleSubmissions,
      roleAssignments: tab.roleAssignments.map((ra) => ({
        role: ra.role,
        canView: ra.canView,
        canSubmit: ra.canSubmit,
        canReview: ra.canReview,
      })),
    });
    setEditingTab(tab);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        facilityId,
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        color: formData.color || undefined,
        formTemplateId: formData.formTemplateId,
        requiresCompletion: formData.requiresCompletion,
        allowMultipleSubmissions: formData.allowMultipleSubmissions,
        roleAssignments: formData.roleAssignments.length > 0
          ? formData.roleAssignments.map((ra) => ({
              role: ra.role as 'SUPER_ADMIN' | 'FACILITY_ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'ICE_TECHNICIAN' | 'STAFF',
              canView: ra.canView,
              canSubmit: ra.canSubmit,
              canReview: ra.canReview,
            }))
          : undefined,
      });
      setIsCreateDialogOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to create tab:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingTab) return;
    try {
      await updateMutation.mutateAsync({
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon || null,
        color: formData.color || null,
        formTemplateId: formData.formTemplateId,
        requiresCompletion: formData.requiresCompletion,
        allowMultipleSubmissions: formData.allowMultipleSubmissions,
        roleAssignments: formData.roleAssignments.map((ra) => ({
          role: ra.role as 'SUPER_ADMIN' | 'FACILITY_ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'ICE_TECHNICIAN' | 'STAFF',
          canView: ra.canView,
          canSubmit: ra.canSubmit,
          canReview: ra.canReview,
        })),
      });
      setEditingTab(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to update tab:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTab) return;
    try {
      await deleteMutation.mutateAsync(deleteTab.id);
      setDeleteTab(null);
    } catch (error) {
      console.error('Failed to delete tab:', error);
    }
  };

  const handleToggleActive = async (tab: DailyReportTab) => {
    try {
      const mutation = useUpdateDailyReportTab(tab.id);
      await reorderMutation.mutateAsync({
        facilityId,
        tabOrder: tabs.map((t) => t.id),
      });
      // Refetch to get updated data
      refetch();
    } catch (error) {
      console.error('Failed to toggle tab:', error);
    }
  };

  const handleDragStart = (tabId: string) => {
    setIsDragging(true);
    setDraggedTab(tabId);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTab(null);
  };

  const handleDragOver = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (!draggedTab || draggedTab === targetTabId) return;

    const newOrder = [...tabs];
    const draggedIndex = newOrder.findIndex((t) => t.id === draggedTab);
    const targetIndex = newOrder.findIndex((t) => t.id === targetTabId);

    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Update order immediately (optimistic)
    reorderMutation.mutate({
      facilityId,
      tabOrder: newOrder.map((t) => t.id),
    });
  };

  const handleCategoryChange = (category: DailyReportTabCategory) => {
    const meta = TAB_CATEGORY_META[category];
    setFormData({
      ...formData,
      category,
      icon: meta.icon,
      color: meta.defaultColor,
      name: formData.name || meta.label,
    });
  };

  const handleAddRole = () => {
    setFormData({
      ...formData,
      roleAssignments: [
        ...formData.roleAssignments,
        { role: 'STAFF', canView: true, canSubmit: true, canReview: false },
      ],
    });
  };

  const handleRemoveRole = (index: number) => {
    setFormData({
      ...formData,
      roleAssignments: formData.roleAssignments.filter((_, i) => i !== index),
    });
  };

  const handleRoleChange = (
    index: number,
    field: 'role' | 'canView' | 'canSubmit' | 'canReview',
    value: string | boolean
  ) => {
    const newAssignments = [...formData.roleAssignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setFormData({ ...formData, roleAssignments: newAssignments });
  };

  if (!facilityId) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          No Facility Selected
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please select a facility to manage daily report tabs.
        </p>
      </div>
    );
  }

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
              <div className="animate-pulse text-center p-4">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Daily Report Tabs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure tabs for your facility&apos;s daily reports. Maximum 15 tabs allowed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            disabled={tabs.length >= 15}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Tab
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-ice-600 dark:text-ice-400">
              {tabs.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tabs</div>
          </div>
        </Card>
        <Card>
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {activeTabs}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Tabs</div>
          </div>
        </Card>
        <Card>
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {totalSubmissions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Submissions</div>
          </div>
        </Card>
      </div>

      {/* Tabs List */}
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configured Tabs
            </h2>
            <span className="text-sm text-gray-500">
              {tabs.length} / 15 tabs configured
            </span>
          </div>
        </div>

        {tabs.length === 0 ? (
          <div className="p-8 text-center">
            <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tabs configured
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add your first tab to get started with daily reports.
            </p>
            <Button onClick={handleOpenCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add First Tab
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tabs.map((tab, index) => {
              const colorClass = `bg-${tab.color || TAB_CATEGORY_META[tab.category].defaultColor}-500`;
              return (
                <div
                  key={tab.id}
                  draggable
                  onDragStart={() => handleDragStart(tab.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, tab.id)}
                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    draggedTab === tab.id ? 'opacity-50' : ''
                  } ${!tab.isActive ? 'opacity-60' : ''}`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab text-gray-400 hover:text-gray-600">
                    <Bars3Icon className="h-5 w-5" />
                  </div>

                  {/* Order Number */}
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                    {index + 1}
                  </div>

                  {/* Color Indicator */}
                  <div
                    className={`w-3 h-10 rounded-full ${colorClass}`}
                    title={tab.color || TAB_CATEGORY_META[tab.category].defaultColor}
                  />

                  {/* Tab Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {tab.name}
                      </span>
                      <StatusBadge
                        status={tab.isActive ? 'success' : 'warning'}
                        size="sm"
                      >
                        {tab.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                      {tab.requiresCompletion && (
                        <StatusBadge status="info" size="sm">
                          Required
                        </StatusBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{TAB_CATEGORY_META[tab.category].label}</span>
                      {tab.formTemplate && (
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="h-4 w-4" />
                          {tab.formTemplate.name}
                        </span>
                      )}
                      <span>{tab._count?.submissions || 0} submissions</span>
                    </div>
                  </div>

                  {/* Role Indicators */}
                  {tab.roleAssignments.length > 0 && (
                    <div className="flex items-center gap-1">
                      {tab.roleAssignments.slice(0, 3).map((ra) => (
                        <span
                          key={ra.id}
                          className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        >
                          {ra.role.split('_').map(w => w[0]).join('')}
                        </span>
                      ))}
                      {tab.roleAssignments.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{tab.roleAssignments.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(tab)}
                      title="Edit tab"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTab(tab)}
                      title="Delete tab"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Transition appear show={isCreateDialogOpen || !!editingTab} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            setIsCreateDialogOpen(false);
            setEditingTab(null);
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      {editingTab ? 'Edit Tab' : 'Create New Tab'}
                    </Dialog.Title>
                    <button
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingTab(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Category Selection (only for create) */}
                    {!editingTab && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {CATEGORY_OPTIONS.map((cat) => (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => handleCategoryChange(cat.value)}
                              className={`p-3 rounded-lg border text-left transition-colors ${
                                formData.category === cat.value
                                  ? 'border-ice-500 bg-ice-50 dark:bg-ice-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {cat.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tab Name
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Enter tab name"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Form Template
                        </label>
                        <select
                          value={formData.formTemplateId || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              formTemplateId: e.target.value || null,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">No form (checklist only)</option>
                          {forms.map((form) => (
                            <option key={form.id} value={form.id}>
                              {form.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Optional description for this tab"
                        rows={2}
                        maxLength={500}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      />
                    </div>

                    {/* Appearance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Icon
                        </label>
                        <select
                          value={formData.icon}
                          onChange={(e) =>
                            setFormData({ ...formData, icon: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {ICON_OPTIONS.map((icon) => (
                            <option key={icon.value} value={icon.value}>
                              {icon.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, color: color.value })
                              }
                              className={`w-8 h-8 rounded-full ${color.bg} ${
                                formData.color === color.value
                                  ? 'ring-2 ring-offset-2 ring-ice-500'
                                  : ''
                              }`}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requiresCompletion}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              requiresCompletion: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-ice-600 focus:ring-ice-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Required for shift completion
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowMultipleSubmissions}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              allowMultipleSubmissions: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-ice-600 focus:ring-ice-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Allow multiple submissions per shift
                        </span>
                      </label>
                    </div>

                    {/* Role Assignments */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Role Permissions (Optional)
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddRole}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Role
                        </Button>
                      </div>
                      {formData.roleAssignments.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No role restrictions. All users can access this tab.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {formData.roleAssignments.map((ra, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                            >
                              <select
                                value={ra.role}
                                onChange={(e) =>
                                  handleRoleChange(index, 'role', e.target.value)
                                }
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={ra.canView}
                                  onChange={(e) =>
                                    handleRoleChange(index, 'canView', e.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                View
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={ra.canSubmit}
                                  onChange={(e) =>
                                    handleRoleChange(index, 'canSubmit', e.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                Submit
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={ra.canReview}
                                  onChange={(e) =>
                                    handleRoleChange(index, 'canReview', e.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                Review
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveRole(index)}
                                className="ml-auto text-red-500 hover:text-red-700"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingTab(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingTab ? handleUpdate : handleCreate}
                      disabled={
                        !formData.name ||
                        createMutation.isPending ||
                        updateMutation.isPending
                      }
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : editingTab ? (
                        'Save Changes'
                      ) : (
                        'Create Tab'
                      )}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Dialog */}
      <Transition appear show={!!deleteTab} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setDeleteTab(null)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                        Delete Tab
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Are you sure you want to delete the tab &quot;{deleteTab?.name}&quot;?
                    {(deleteTab?._count?.submissions || 0) > 0 && (
                      <span className="block mt-2 text-amber-600 dark:text-amber-400">
                        This tab has {deleteTab?._count?.submissions} submissions and will be
                        deactivated instead of deleted.
                      </span>
                    )}
                  </p>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setDeleteTab(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Tab'
                      )}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
