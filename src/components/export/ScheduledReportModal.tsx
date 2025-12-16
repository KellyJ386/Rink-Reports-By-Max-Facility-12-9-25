'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { XMarkIcon, ClockIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  useCreateScheduledReport,
  useUpdateScheduledReport,
  REPORT_TYPE_LABELS,
  SCHEDULE_LABELS,
  DAY_OF_WEEK_LABELS,
  ScheduledReport,
  ReportType,
  ReportSchedule,
} from '@/hooks/useScheduledReports';
import { toast } from '@/components/notifications';

interface ScheduledReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId?: string;
  existingReport?: ScheduledReport | null;
}

export function ScheduledReportModal({
  isOpen,
  onClose,
  facilityId,
  existingReport,
}: ScheduledReportModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reportType, setReportType] = useState<ReportType>('ice_depth');
  const [schedule, setSchedule] = useState<ReportSchedule>('WEEKLY');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState('06:00');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [dateRangeDays, setDateRangeDays] = useState(7);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const createMutation = useCreateScheduledReport();
  const updateMutation = useUpdateScheduledReport();

  // Populate form when editing
  useEffect(() => {
    if (existingReport) {
      setName(existingReport.name);
      setDescription(existingReport.description || '');
      setReportType(existingReport.reportType);
      setSchedule(existingReport.schedule);
      setDayOfWeek(existingReport.dayOfWeek ?? 1);
      setDayOfMonth(existingReport.dayOfMonth ?? 1);
      setTimeOfDay(existingReport.timeOfDay);
      setExportFormat(existingReport.exportFormat);
      setRecipients(existingReport.recipients.length > 0 ? existingReport.recipients : ['']);
      setDateRangeDays(existingReport.dateRangeDays);
      setEmailSubject(existingReport.emailSubject || '');
      setEmailBody(existingReport.emailBody || '');
    } else {
      // Reset form
      setName('');
      setDescription('');
      setReportType('ice_depth');
      setSchedule('WEEKLY');
      setDayOfWeek(1);
      setDayOfMonth(1);
      setTimeOfDay('06:00');
      setExportFormat('csv');
      setRecipients(['']);
      setDateRangeDays(7);
      setEmailSubject('');
      setEmailBody('');
    }
  }, [existingReport, isOpen]);

  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleRecipientChange = (index: number, value: string) => {
    const updated = [...recipients];
    updated[index] = value;
    setRecipients(updated);
  };

  const handleSubmit = async () => {
    // Filter out empty recipients
    const validRecipients = recipients.filter((r) => r.trim());

    if (!name.trim()) {
      toast.error('Validation Error', 'Name is required.');
      return;
    }

    if (validRecipients.length === 0) {
      toast.error('Validation Error', 'At least one recipient email is required.');
      return;
    }

    try {
      if (existingReport) {
        await updateMutation.mutateAsync({
          id: existingReport.id,
          name,
          description: description || undefined,
          schedule,
          dayOfWeek: schedule === 'WEEKLY' ? dayOfWeek : null,
          dayOfMonth: schedule === 'MONTHLY' ? dayOfMonth : null,
          timeOfDay,
          exportFormat,
          recipients: validRecipients,
          dateRangeDays,
          emailSubject: emailSubject || null,
          emailBody: emailBody || null,
        });
        toast.success('Schedule Updated', 'Scheduled report has been updated.');
      } else {
        if (!facilityId) {
          toast.error('Error', 'Facility ID is required.');
          return;
        }

        await createMutation.mutateAsync({
          facilityId,
          name,
          description: description || undefined,
          reportType,
          schedule,
          dayOfWeek: schedule === 'WEEKLY' ? dayOfWeek : undefined,
          dayOfMonth: schedule === 'MONTHLY' ? dayOfMonth : undefined,
          timeOfDay,
          exportFormat,
          recipients: validRecipients,
          dateRangeDays,
          emailSubject: emailSubject || undefined,
          emailBody: emailBody || undefined,
        });
        toast.success('Schedule Created', 'Scheduled report has been created.');
      }
      onClose();
    } catch (error) {
      toast.error('Error', (error as Error).message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {existingReport ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Ice Depth Report"
                className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                rows={2}
              />
            </div>

            {/* Report Type (only when creating) */}
            {!existingReport && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Report Type *
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                >
                  {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SCHEDULE_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSchedule(value as ReportSchedule)}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                      schedule === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day of Week (for weekly) */}
            {schedule === 'WEEKLY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Day of Week
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                >
                  {DAY_OF_WEEK_LABELS.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Day of Month (for monthly) */}
            {schedule === 'MONTHLY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Day of Month
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose 1-28 to ensure the report runs every month.
                </p>
              </div>
            )}

            {/* Time of Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time of Day
              </label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Include Data From (Days)
              </label>
              <select
                value={dateRangeDays}
                onChange={(e) => setDateRangeDays(Number(e.target.value))}
                className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    exportFormat === 'csv'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  CSV (Spreadsheet)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('json')}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    exportFormat === 'json'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  JSON (Data)
                </button>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipients (Email) *
              </label>
              <div className="space-y-2">
                {recipients.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleRecipientChange(index, e.target.value)}
                      placeholder="email@example.com"
                      className="flex-1 p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                    />
                    {recipients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(index)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add recipient
                </button>
              </div>
            </div>

            {/* Custom Email Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Subject (Optional)
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Leave blank for default"
                className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex justify-end gap-2 p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : existingReport
                ? 'Update Schedule'
                : 'Create Schedule'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
