'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  DailyReportSession,
  DailyReportTabSubmission,
  SHIFT_TYPE_META,
  ShiftType,
} from '@/hooks/useDailyReports';

interface ShiftHandoffProps {
  session: DailyReportSession;
  onComplete: (data: { handoffSummary: string; handoffNotes: string }) => Promise<void>;
  isSubmitting: boolean;
  tabCompletionStats: {
    completed: number;
    total: number;
    required: number;
    requiredComplete: number;
  };
}

export function ShiftHandoff({
  session,
  onComplete,
  isSubmitting,
  tabCompletionStats,
}: ShiftHandoffProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [handoffSummary, setHandoffSummary] = useState(session.handoffSummary || '');
  const [handoffNotes, setHandoffNotes] = useState(session.handoffNotes || '');

  const canComplete =
    tabCompletionStats.requiredComplete >= tabCompletionStats.required &&
    session.status === 'IN_PROGRESS';

  // Generate automatic summary suggestions based on completed tabs
  const generateSummary = () => {
    const completedTabs = session.tabSubmissions?.filter(
      (ts) => ts.status === 'COMPLETED' || ts.status === 'REVIEWED'
    ) || [];

    const lines: string[] = [];

    // Add completion stats
    lines.push(`Shift completed: ${tabCompletionStats.completed}/${tabCompletionStats.total} tabs.`);

    // Add any tabs with notes
    const tabsWithNotes = completedTabs.filter((ts) => ts.notes);
    if (tabsWithNotes.length > 0) {
      lines.push('');
      lines.push('Key observations:');
      tabsWithNotes.forEach((ts) => {
        if (ts.tab?.name && ts.notes) {
          lines.push(`- ${ts.tab.name}: ${ts.notes}`);
        }
      });
    }

    // Add skipped tabs
    const skippedTabs = session.tabSubmissions?.filter((ts) => ts.status === 'SKIPPED') || [];
    if (skippedTabs.length > 0) {
      lines.push('');
      lines.push('Skipped tabs:');
      skippedTabs.forEach((ts) => {
        if (ts.tab?.name) {
          lines.push(`- ${ts.tab.name}`);
        }
      });
    }

    setHandoffSummary(lines.join('\n'));
  };

  const handleComplete = async () => {
    await onComplete({
      handoffSummary,
      handoffNotes,
    });
    setIsOpen(false);
  };

  const shiftInfo = SHIFT_TYPE_META[session.shiftType as ShiftType];

  return (
    <>
      {/* Handoff Button */}
      <Button
        onClick={() => setIsOpen(true)}
        disabled={!canComplete}
        title={
          !canComplete
            ? 'Complete all required tabs before shift handoff'
            : 'Complete shift and handoff'
        }
      >
        <ArrowRightIcon className="h-4 w-4 mr-2" />
        Shift Handoff
      </Button>

      {/* Handoff Dialog */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
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
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-ice-100 dark:bg-ice-900/30 flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-ice-600 dark:text-ice-400" />
                      </div>
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                          Shift Handoff
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(session.shiftDate), 'EEEE, MMMM d, yyyy')} -{' '}
                          {shiftInfo.label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Completion Summary */}
                  <Card className="p-4 mb-6 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>{tabCompletionStats.completed}</strong> of{' '}
                            {tabCompletionStats.total} tabs completed
                          </span>
                        </div>
                        {tabCompletionStats.required > 0 && (
                          <div className="flex items-center gap-2">
                            <ClipboardDocumentListIcon className="h-5 w-5 text-amber-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>{tabCompletionStats.requiredComplete}</strong> of{' '}
                              {tabCompletionStats.required} required
                            </span>
                          </div>
                        )}
                      </div>
                      {tabCompletionStats.completed < tabCompletionStats.total && (
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                          Some tabs incomplete
                        </span>
                      )}
                    </div>
                  </Card>

                  {/* Handoff Summary */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Shift Summary
                        </label>
                        <button
                          type="button"
                          onClick={generateSummary}
                          className="flex items-center gap-1 text-xs text-ice-600 dark:text-ice-400 hover:text-ice-700"
                        >
                          <LightBulbIcon className="h-4 w-4" />
                          Auto-generate
                        </button>
                      </div>
                      <textarea
                        value={handoffSummary}
                        onChange={(e) => setHandoffSummary(e.target.value)}
                        placeholder="Summarize your shift: key activities, accomplishments, and overall status..."
                        rows={5}
                        maxLength={5000}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {handoffSummary.length}/5000 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                          Notes for Next Shift
                        </span>
                      </label>
                      <textarea
                        value={handoffNotes}
                        onChange={(e) => setHandoffNotes(e.target.value)}
                        placeholder="Important items for the incoming team: issues to follow up on, pending tasks, equipment concerns..."
                        rows={4}
                        maxLength={2000}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {handoffNotes.length}/2000 characters
                      </p>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>What happens next:</strong> Your shift will be marked as complete, and
                      your handoff notes will be visible to the next shift&apos;s team. A manager can
                      review and approve the daily report.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleComplete} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Complete Shift
                        </>
                      )}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

// Component to display previous shift's handoff notes
interface PreviousHandoffProps {
  session: DailyReportSession;
}

export function PreviousHandoff({ session }: PreviousHandoffProps) {
  if (!session.handoffSummary && !session.handoffNotes) {
    return null;
  }

  const shiftInfo = SHIFT_TYPE_META[session.shiftType as ShiftType];

  return (
    <Card className="p-4 border-l-4 border-l-ice-500">
      <div className="flex items-center gap-2 mb-3">
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-ice-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Previous Shift Handoff
        </h3>
        <span className="text-xs text-gray-500">
          {format(new Date(session.shiftDate), 'MMM d')} - {shiftInfo.label}
        </span>
      </div>

      {session.handoffSummary && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
            Summary
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {session.handoffSummary}
          </p>
        </div>
      )}

      {session.handoffNotes && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <h4 className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase mb-1 flex items-center gap-1">
            <ExclamationTriangleIcon className="h-3 w-3" />
            Notes for Your Shift
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
            {session.handoffNotes}
          </p>
        </div>
      )}

      {session.completedBy && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Completed by {session.completedBy.name}
          {session.completedAt && (
            <> at {format(new Date(session.completedAt), 'h:mm a')}</>
          )}
        </p>
      )}
    </Card>
  );
}
