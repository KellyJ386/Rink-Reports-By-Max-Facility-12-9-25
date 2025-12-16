'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  PlusIcon,
  ClockIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  useScheduledReports,
  useDeleteScheduledReport,
  useRunScheduledReport,
  useUpdateScheduledReport,
  REPORT_TYPE_LABELS,
  SCHEDULE_LABELS,
  formatScheduleDescription as formatSchedule,
  getNextRunDate,
  ScheduledReport,
} from '@/hooks/useScheduledReports';
import { toast } from '@/components/notifications';
import { ScheduledReportModal } from './ScheduledReportModal';

interface ScheduledReportsManagerProps {
  facilityId?: string;
}

export function ScheduledReportsManager({ facilityId }: ScheduledReportsManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { data: reports, isLoading } = useScheduledReports({
    facilityId,
    isActive: showInactive ? undefined : true,
  });
  const deleteMutation = useDeleteScheduledReport();
  const runMutation = useRunScheduledReport();
  const updateMutation = useUpdateScheduledReport();

  const handleDelete = async (report: ScheduledReport) => {
    if (!confirm(`Are you sure you want to delete "${report.name}"?`)) return;

    try {
      await deleteMutation.mutateAsync(report.id);
      toast.success('Report Deleted', 'Scheduled report has been deleted.');
    } catch (error) {
      toast.error('Delete Failed', (error as Error).message);
    }
  };

  const handleRunNow = async (report: ScheduledReport) => {
    try {
      const filename = `${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${report.exportFormat}`;
      await runMutation.mutateAsync({ id: report.id, filename });
      toast.success('Report Generated', 'Report has been generated and downloaded.');
    } catch (error) {
      toast.error('Run Failed', (error as Error).message);
    }
  };

  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      await updateMutation.mutateAsync({
        id: report.id,
        isActive: !report.isActive,
      });
      toast.success(
        report.isActive ? 'Report Paused' : 'Report Activated',
        report.isActive
          ? 'Scheduled report has been paused.'
          : 'Scheduled report is now active.'
      );
    } catch (error) {
      toast.error('Update Failed', (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scheduled Reports
          </h2>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Show inactive
          </label>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Reports List */}
      {reports && reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 ${
                !report.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {report.name}
                    </h3>
                    {!report.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {REPORT_TYPE_LABELS[report.reportType as keyof typeof REPORT_TYPE_LABELS] || report.reportType}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {formatSchedule(report)}
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDaysIcon className="w-4 h-4" />
                      Next: {report.isActive ? getNextRunDate(report).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="mt-2 text-xs text-gray-400">
                    Recipients: {report.recipients.join(', ')}
                  </div>

                  {/* Last Run Status */}
                  {report.lastRunAt && (
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      {report.lastRunStatus === 'success' ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">
                            Last run: {new Date(report.lastRunAt).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">
                            Failed: {report.lastRunError || 'Unknown error'}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRunNow(report)}
                    disabled={runMutation.isPending}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Run Now"
                  >
                    <PlayIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingReport(report)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(report)}
                    className={`p-2 transition-colors ${
                      report.isActive
                        ? 'text-gray-400 hover:text-yellow-500'
                        : 'text-gray-400 hover:text-green-500'
                    }`}
                    title={report.isActive ? 'Pause' : 'Activate'}
                  >
                    {report.isActive ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                      </svg>
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(report)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No scheduled reports yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create a scheduled report to automatically generate and email reports.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
            <PlusIcon className="w-4 h-4 mr-2" />
            Create First Schedule
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <ScheduledReportModal
        isOpen={isCreateModalOpen || !!editingReport}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingReport(null);
        }}
        facilityId={facilityId}
        existingReport={editingReport}
      />
    </div>
  );
}
