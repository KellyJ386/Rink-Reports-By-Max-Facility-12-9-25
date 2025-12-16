'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { format, isToday } from 'date-fns';
import { Dialog, Transition } from '@headlessui/react';
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  XMarkIcon,
  CheckIcon,
  InboxIcon,
  SparklesIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  KeyIcon,
  AcademicCapIcon,
  HeartIcon,
  TruckIcon,
  SunIcon,
  FireIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import {
  useDailyReportTabs,
  useCreateOrGetSession,
  useDailyReportSession,
  useCreateTabSubmission,
  TAB_CATEGORY_META,
  DailyReportTab,
  DailyReportSession,
  DailyReportTabSubmission,
  ShiftType,
} from '@/hooks/useDailyReports';
import { useForm } from '@/hooks';
import { useSession } from 'next-auth/react';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { ShiftHandoff } from '@/components/daily-reports/ShiftHandoff';
import { useUpdateDailyReportSession } from '@/hooks/useDailyReports';
import Link from 'next/link';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FRONT_DESK: InboxIcon,
  CUSTODIAL: SparklesIcon,
  PRO_SHOP: ShoppingBagIcon,
  CONCESSIONS: CubeIcon,
  LEARN_TO_SKATE: AcademicCapIcon,
  PUBLIC_SESSIONS: UserGroupIcon,
  SAFETY_EMERGENCY: ShieldExclamationIcon,
  GENERAL_FACILITY: BuildingOfficeIcon,
  LOCKER_ROOMS: KeyIcon,
  MAINTENANCE: WrenchScrewdriverIcon,
  EVENTS: CalendarDaysIcon,
  HOCKEY_PROGRAMS: HeartIcon,
  FIGURE_SKATING: SparklesIcon,
  RENTALS: TruckIcon,
  CUSTOM: Cog6ToothIcon,
};

// Color schemes for cards
const CATEGORY_COLORS: Record<string, { bg: string; border: string; icon: string; text: string; hover: string }> = {
  FRONT_DESK: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-900 dark:text-blue-100',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300',
  },
  CUSTODIAL: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-900 dark:text-emerald-100',
    hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:border-emerald-300',
  },
  PRO_SHOP: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    text: 'text-purple-900 dark:text-purple-100',
    hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:border-purple-300',
  },
  CONCESSIONS: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
    text: 'text-orange-900 dark:text-orange-100',
    hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:border-orange-300',
  },
  LEARN_TO_SKATE: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    icon: 'text-pink-600 dark:text-pink-400',
    text: 'text-pink-900 dark:text-pink-100',
    hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/40 hover:border-pink-300',
  },
  PUBLIC_SESSIONS: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    icon: 'text-cyan-600 dark:text-cyan-400',
    text: 'text-cyan-900 dark:text-cyan-100',
    hover: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/40 hover:border-cyan-300',
  },
  SAFETY_EMERGENCY: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-900 dark:text-red-100',
    hover: 'hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-300',
  },
  GENERAL_FACILITY: {
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-200 dark:border-slate-800',
    icon: 'text-slate-600 dark:text-slate-400',
    text: 'text-slate-900 dark:text-slate-100',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-900/40 hover:border-slate-300',
  },
  LOCKER_ROOMS: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'text-indigo-600 dark:text-indigo-400',
    text: 'text-indigo-900 dark:text-indigo-100',
    hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:border-indigo-300',
  },
  MAINTENANCE: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-900 dark:text-amber-100',
    hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300',
  },
  EVENTS: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    icon: 'text-violet-600 dark:text-violet-400',
    text: 'text-violet-900 dark:text-violet-100',
    hover: 'hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:border-violet-300',
  },
  HOCKEY_PROGRAMS: {
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    icon: 'text-sky-600 dark:text-sky-400',
    text: 'text-sky-900 dark:text-sky-100',
    hover: 'hover:bg-sky-100 dark:hover:bg-sky-900/40 hover:border-sky-300',
  },
  FIGURE_SKATING: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    icon: 'text-rose-600 dark:text-rose-400',
    text: 'text-rose-900 dark:text-rose-100',
    hover: 'hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:border-rose-300',
  },
  RENTALS: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    icon: 'text-teal-600 dark:text-teal-400',
    text: 'text-teal-900 dark:text-teal-100',
    hover: 'hover:bg-teal-100 dark:hover:bg-teal-900/40 hover:border-teal-300',
  },
  CUSTOM: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800',
    icon: 'text-gray-600 dark:text-gray-400',
    text: 'text-gray-900 dark:text-gray-100',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-900/40 hover:border-gray-300',
  },
};

// Get colors for a tab
function getTabColors(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.CUSTOM;
}

// Get icon for a tab
function getTabIcon(category: string) {
  return CATEGORY_ICONS[category] || Cog6ToothIcon;
}

// Tab Form Modal
interface TabFormModalProps {
  tab: DailyReportTab;
  session: DailyReportSession;
  submission?: DailyReportTabSubmission;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { formData: Record<string, unknown>; notes: string }) => Promise<void>;
  isSubmitting: boolean;
}

function TabFormModal({ tab, session, submission, isOpen, onClose, onSubmit, isSubmitting }: TabFormModalProps) {
  const [notes, setNotes] = useState(submission?.notes || '');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const colors = getTabColors(tab.category);
  const IconComponent = getTabIcon(tab.category);

  // Get form template if linked
  const { data: formTemplate, isLoading: formLoading } = useForm(tab.formTemplateId || '');

  const handleSubmit = async () => {
    await onSubmit({ formData, notes });
    onClose();
  };

  const isCompleted = submission?.status === 'COMPLETED' || submission?.status === 'REVIEWED';
  const canSubmit = session.status === 'IN_PROGRESS' && !isCompleted;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                {/* Header */}
                <div className={`px-6 py-4 border-b ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${colors.bg} border ${colors.border}`}>
                        <IconComponent className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      <div>
                        <Dialog.Title className={`text-lg font-semibold ${colors.text}`}>
                          {tab.name}
                        </Dialog.Title>
                        {tab.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{tab.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {tab.requiresCompletion && (
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                          Required
                        </span>
                      )}
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Completed
                        </span>
                      )}
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {formLoading && tab.formTemplateId ? (
                    <div className="flex items-center justify-center py-12">
                      <ArrowPathIcon className="h-8 w-8 animate-spin text-ice-500" />
                    </div>
                  ) : formTemplate ? (
                    <FormRenderer
                      form={formTemplate}
                      values={formData}
                      onChange={setFormData}
                      readOnly={!canSubmit}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No form template attached</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Use notes below for observations</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes & Observations
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes or observations for this area..."
                      rows={3}
                      disabled={!canSubmit}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                  {submission?.submittedAt && (
                    <p className="text-xs text-gray-500">
                      Last submitted: {format(new Date(submission.submittedAt), 'MMM d, h:mm a')}
                      {submission.submittedBy?.name && ` by ${submission.submittedBy.name}`}
                    </p>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    {canSubmit && (
                      <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Module Card Component
interface ModuleCardProps {
  tab: DailyReportTab;
  submission?: DailyReportTabSubmission;
  onClick: () => void;
}

function ModuleCard({ tab, submission, onClick }: ModuleCardProps) {
  const colors = getTabColors(tab.category);
  const IconComponent = getTabIcon(tab.category);
  const isCompleted = submission?.status === 'COMPLETED' || submission?.status === 'REVIEWED';
  const isInProgress = submission?.status === 'IN_PROGRESS';

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full p-6 rounded-2xl border-2 transition-all duration-200 text-left
        ${colors.bg} ${colors.border} ${colors.hover}
        ${isCompleted ? 'ring-2 ring-green-500 ring-offset-2' : ''}
        group
      `}
    >
      {/* Status Badge */}
      {isCompleted && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            Done
          </div>
        </div>
      )}
      {isInProgress && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-full text-xs font-medium">
            <ClockIcon className="h-3.5 w-3.5" />
            In Progress
          </div>
        </div>
      )}
      {tab.requiresCompletion && !isCompleted && (
        <div className="absolute top-3 right-3">
          <div className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            Required
          </div>
        </div>
      )}

      {/* Icon */}
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center mb-4
        ${colors.bg} border ${colors.border}
        group-hover:scale-110 transition-transform duration-200
      `}>
        <IconComponent className={`h-7 w-7 ${colors.icon}`} />
      </div>

      {/* Content */}
      <h3 className={`text-lg font-semibold ${colors.text} mb-1`}>
        {tab.name}
      </h3>
      {tab.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {tab.description}
        </p>
      )}

      {/* Form indicator */}
      {tab.formTemplateId && (
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
          <DocumentTextIcon className="h-3.5 w-3.5" />
          Has form
        </div>
      )}
    </button>
  );
}

export default function DailyReportsPage() {
  const { data: session } = useSession();
  const facilityId = session?.user?.facilityId || '';
  const userRole = session?.user?.role || 'STAFF';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shiftType] = useState<ShiftType>('ALL_DAY');
  const [selectedTab, setSelectedTab] = useState<DailyReportTab | null>(null);

  // Queries
  const { data: tabs = [], isLoading: tabsLoading } = useDailyReportTabs({
    facilityId,
  });

  // Get or create session for selected date
  const createOrGetSessionMutation = useCreateOrGetSession();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const {
    data: currentSession,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useDailyReportSession(currentSessionId || '');

  // Mutations
  const submitTabMutation = useCreateTabSubmission();
  const updateSessionMutation = useUpdateDailyReportSession(currentSessionId || '');

  // Filter tabs by user role
  const visibleTabs = useMemo(() => {
    return tabs.filter((tab) => {
      if (!tab.isActive) return false;
      const roleAssignment = tab.roleAssignments.find((ra) => ra.role === userRole);
      return !roleAssignment || roleAssignment.canView;
    });
  }, [tabs, userRole]);

  // Load or create session when date changes
  useEffect(() => {
    if (!facilityId) return;

    const loadSession = async () => {
      try {
        const result = await createOrGetSessionMutation.mutateAsync({
          facilityId,
          shiftDate: format(selectedDate, 'yyyy-MM-dd'),
          shiftType,
        });
        setCurrentSessionId(result.session.id);
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    loadSession();
  }, [facilityId, selectedDate, shiftType]);

  // Get submission for selected tab
  const selectedTabSubmission = currentSession?.tabSubmissions?.find(
    (ts) => ts.tabId === selectedTab?.id
  );

  // Calculate completion stats
  const stats = useMemo(() => {
    if (!currentSession?.tabSubmissions) {
      return { completed: 0, total: visibleTabs.length, required: 0, requiredComplete: 0 };
    }

    const completed = currentSession.tabSubmissions.filter(
      (ts) => ts.status === 'COMPLETED' || ts.status === 'REVIEWED'
    ).length;

    const requiredTabs = visibleTabs.filter((t) => t.requiresCompletion);
    const requiredComplete = currentSession.tabSubmissions.filter(
      (ts) =>
        visibleTabs.find((t) => t.id === ts.tabId)?.requiresCompletion &&
        (ts.status === 'COMPLETED' || ts.status === 'REVIEWED')
    ).length;

    return {
      completed,
      total: visibleTabs.length,
      required: requiredTabs.length,
      requiredComplete,
    };
  }, [currentSession?.tabSubmissions, visibleTabs]);

  const handleTabSubmit = async (data: { formData: Record<string, unknown>; notes: string }) => {
    if (!currentSessionId || !selectedTab) return;

    try {
      await submitTabMutation.mutateAsync({
        sessionId: currentSessionId,
        tabId: selectedTab.id,
        notes: data.notes || null,
        checklistData: data.formData || null,
        status: 'COMPLETED',
      });
      refetchSession();
    } catch (error) {
      console.error('Failed to submit tab:', error);
    }
  };

  const handleShiftHandoff = async (data: { handoffSummary: string; handoffNotes: string }) => {
    if (!currentSessionId) return;

    try {
      await updateSessionMutation.mutateAsync({
        status: 'COMPLETED',
        handoffSummary: data.handoffSummary || null,
        handoffNotes: data.handoffNotes || null,
      });
      refetchSession();
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  if (!facilityId) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          No Facility Selected
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please select a facility to view daily reports.
        </p>
      </div>
    );
  }

  if (tabsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (visibleTabs.length === 0) {
    return (
      <div className="text-center py-12">
        <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          No Daily Report Tabs Configured
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-4">
          An administrator needs to set up daily report tabs for this facility.
        </p>
        <Link href="/admin/daily-reports">
          <Button variant="outline">
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Configure Tabs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Daily Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete your facility area reports
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleDateChange('prev')}>
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEE, MMM d, yyyy')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDateChange('next')}
            disabled={isToday(selectedDate)}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
          {!isToday(selectedDate) && (
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Progress Card */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            {/* Progress */}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Overall Progress</div>
              <div className="flex items-center gap-3">
                <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-ice-500 to-ice-600 transition-all duration-500"
                    style={{
                      width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.completed}/{stats.total}
                </span>
              </div>
            </div>

            {/* Required */}
            {stats.required > 0 && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Required</div>
                <div className="flex items-center gap-2">
                  {stats.requiredComplete === stats.required ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  ) : (
                    <ClockIcon className="h-6 w-6 text-amber-500" />
                  )}
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.requiredComplete}/{stats.required}
                  </span>
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Shift Status</div>
              <StatusBadge
                status={
                  currentSession?.status === 'COMPLETED'
                    ? 'success'
                    : currentSession?.status === 'REVIEWED'
                    ? 'info'
                    : 'warning'
                }
              >
                {currentSession?.status === 'COMPLETED' ? 'Completed' :
                 currentSession?.status === 'REVIEWED' ? 'Reviewed' : 'In Progress'}
              </StatusBadge>
            </div>
          </div>

          {/* Shift Handoff Button */}
          {currentSession && currentSession.status === 'IN_PROGRESS' && (
            <ShiftHandoff
              session={currentSession}
              onComplete={handleShiftHandoff}
              isSubmitting={updateSessionMutation.isPending}
              tabCompletionStats={stats}
            />
          )}
        </div>
      </Card>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleTabs.map((tab) => {
          const submission = currentSession?.tabSubmissions?.find((ts) => ts.tabId === tab.id);
          return (
            <ModuleCard
              key={tab.id}
              tab={tab}
              submission={submission}
              onClick={() => setSelectedTab(tab)}
            />
          );
        })}
      </div>

      {/* Tab Form Modal */}
      {selectedTab && currentSession && (
        <TabFormModal
          tab={selectedTab}
          session={currentSession}
          submission={selectedTabSubmission}
          isOpen={!!selectedTab}
          onClose={() => setSelectedTab(null)}
          onSubmit={handleTabSubmit}
          isSubmitting={submitTabMutation.isPending}
        />
      )}
    </div>
  );
}
