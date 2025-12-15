'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  PaperAirplaneIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import {
  useDailyReportTabs,
  useCreateOrGetSession,
  useDailyReportSession,
  useCreateTabSubmission,
  useCompleteSession,
  TAB_CATEGORY_META,
  SHIFT_TYPE_META,
  DailyReportTab,
  DailyReportSession,
  DailyReportTabSubmission,
  ShiftType,
} from '@/hooks/useDailyReports';
import { useForm, useCreateSubmission } from '@/hooks';
import { useSession } from 'next-auth/react';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { ShiftHandoff, PreviousHandoff } from '@/components/daily-reports/ShiftHandoff';
import { useUpdateDailyReportSession } from '@/hooks/useDailyReports';
import Link from 'next/link';

// Dynamic icon component mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Inbox: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  Sparkles: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  ShoppingBag: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  Coffee: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h1a4 4 0 110 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
    </svg>
  ),
  Users: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  AlertTriangle: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Building: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Settings: ({ className }) => <Cog6ToothIcon className={className} />,
  Calendar: ({ className }) => <CalendarIcon className={className} />,
  Document: ({ className }) => <DocumentTextIcon className={className} />,
};

// Get icon component by name
function getIconComponent(iconName: string) {
  return ICON_MAP[iconName] || ICON_MAP.Document;
}

// Tab status indicator colors
function getTabStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
    case 'REVIEWED':
      return 'bg-green-500';
    case 'IN_PROGRESS':
      return 'bg-yellow-500';
    case 'SKIPPED':
      return 'bg-gray-400';
    default:
      return 'bg-gray-300';
  }
}

interface TabContentProps {
  tab: DailyReportTab;
  session: DailyReportSession;
  submission?: DailyReportTabSubmission;
  onSubmit: (data: { formData: Record<string, unknown>; notes: string }) => Promise<void>;
  isSubmitting: boolean;
}

function TabContent({ tab, session, submission, onSubmit, isSubmitting }: TabContentProps) {
  const [notes, setNotes] = useState(submission?.notes || '');
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Get form template if linked
  const { data: formTemplate, isLoading: formLoading } = useForm(tab.formTemplateId || '');

  const handleSubmit = async () => {
    await onSubmit({
      formData,
      notes,
    });
  };

  const isCompleted = submission?.status === 'COMPLETED' || submission?.status === 'REVIEWED';
  const canSubmit = session.status === 'IN_PROGRESS' && !isCompleted;

  if (formLoading && tab.formTemplateId) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-ice-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {tab.name}
            {tab.requiresCompletion && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                Required
              </span>
            )}
          </h2>
          {tab.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{tab.description}</p>
          )}
        </div>

        {isCompleted && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>

      {/* Form Content */}
      {formTemplate ? (
        <Card className="p-6">
          <FormRenderer
            form={formTemplate}
            values={formData}
            onChange={setFormData}
            readOnly={!canSubmit}
          />
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No form template attached to this tab.</p>
            <p className="text-sm">Use the notes field below for any observations.</p>
          </div>
        </Card>
      )}

      {/* Notes Section */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes or observations..."
          rows={3}
          disabled={!canSubmit}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none disabled:opacity-50"
        />
      </Card>

      {/* Submit Button */}
      {canSubmit && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Mark as Complete
              </>
            )}
          </Button>
        </div>
      )}

      {/* Submission Info */}
      {submission && submission.submittedAt && (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
          <span>
            Submitted by {submission.submittedBy?.name || 'Unknown'} on{' '}
            {format(new Date(submission.submittedAt), 'MMM d, yyyy h:mm a')}
          </span>
          {submission.reviewedBy && (
            <span>
              • Reviewed by {submission.reviewedBy.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function DailyReportsPage() {
  const { data: session } = useSession();
  const facilityId = session?.user?.facilityId || '';
  const userRole = session?.user?.role || 'STAFF';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shiftType, setShiftType] = useState<ShiftType>('ALL_DAY');
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

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

  // Set first tab as active
  useEffect(() => {
    if (visibleTabs.length > 0 && !activeTabId) {
      setActiveTabId(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTabId]);

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

  // Get active tab
  const activeTab = visibleTabs.find((t) => t.id === activeTabId);

  // Get submission for active tab
  const activeTabSubmission = currentSession?.tabSubmissions?.find(
    (ts) => ts.tabId === activeTabId
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
    if (!currentSessionId || !activeTabId) return;

    try {
      await submitTabMutation.mutateAsync({
        sessionId: currentSessionId,
        tabId: activeTabId,
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
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Daily Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete your daily reports for each area
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
              {isToday(selectedDate)
                ? 'Today'
                : format(selectedDate, 'EEE, MMM d, yyyy')}
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

      {/* Session Status Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Progress */}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Progress</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ice-500 transition-all"
                    style={{
                      width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.completed}/{stats.total}
                </span>
              </div>
            </div>

            {/* Required Status */}
            {stats.required > 0 && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Required</div>
                <div className="flex items-center gap-2 mt-1">
                  {stats.requiredComplete === stats.required ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.requiredComplete}/{stats.required} complete
                  </span>
                </div>
              </div>
            )}

            {/* Session Status */}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
              <StatusBadge
                status={
                  currentSession?.status === 'COMPLETED'
                    ? 'success'
                    : currentSession?.status === 'REVIEWED'
                    ? 'info'
                    : 'warning'
                }
                size="sm"
                className="mt-1"
              >
                {currentSession?.status || 'In Progress'}
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

      {/* Tabs Navigation */}
      <div className="flex gap-6">
        {/* Tab List Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {visibleTabs.map((tab) => {
                const IconComponent = getIconComponent(
                  tab.icon || TAB_CATEGORY_META[tab.category].icon
                );
                const submission = currentSession?.tabSubmissions?.find(
                  (ts) => ts.tabId === tab.id
                );
                const isActive = activeTabId === tab.id;
                const statusColor = getTabStatusColor(submission?.status || 'NOT_STARTED');

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-ice-50 dark:bg-ice-900/20 text-ice-700 dark:text-ice-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {/* Status Indicator */}
                    <div className={`w-2 h-2 rounded-full ${statusColor}`} />

                    {/* Icon */}
                    <IconComponent className="h-5 w-5 flex-shrink-0" />

                    {/* Name */}
                    <span className="flex-1 truncate text-sm font-medium">{tab.name}</span>

                    {/* Required Indicator */}
                    {tab.requiresCompletion && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">*</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab ? (
            <TabContent
              tab={activeTab}
              session={currentSession!}
              submission={activeTabSubmission}
              onSubmit={handleTabSubmit}
              isSubmitting={submitTabMutation.isPending}
            />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select a tab from the sidebar to view its content.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
