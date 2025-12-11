'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  useExportDownload,
  EXPORT_TYPE_LABELS,
  EXPORT_FORMAT_LABELS,
  getDefaultDateRange,
  getDateRangeForPeriod,
  ExportType,
  ExportFormat,
} from '@/hooks/useExport';
import { toast } from '@/components/notifications';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId?: string;
  defaultType?: ExportType;
}

const DATE_RANGE_OPTIONS = [
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'quarter', label: 'Last 90 days' },
  { value: 'year', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
] as const;

export function ExportModal({
  isOpen,
  onClose,
  facilityId,
  defaultType = 'ice_depth',
}: ExportModalProps) {
  const [exportType, setExportType] = useState<ExportType>(defaultType);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRangeOption, setDateRangeOption] = useState<string>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [status, setStatus] = useState<string>('');

  const exportMutation = useExportDownload();

  const getDateRange = () => {
    if (dateRangeOption === 'custom') {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }
    return getDateRangeForPeriod(dateRangeOption as 'week' | 'month' | 'quarter' | 'year');
  };

  const handleExport = async () => {
    try {
      const dateRange = getDateRange();

      await exportMutation.mutateAsync({
        type: exportType,
        format: exportFormat,
        facilityId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        status: status || undefined,
      });

      toast.success('Export Complete', `${EXPORT_TYPE_LABELS[exportType]} exported successfully.`);
      onClose();
    } catch (error) {
      toast.error('Export Failed', (error as Error).message || 'Failed to export data.');
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
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <ArrowDownTrayIcon className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Export Data
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
            {/* Export Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Type
              </label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as ExportType)}
                className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
              >
                {Object.entries(EXPORT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(EXPORT_FORMAT_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setExportFormat(value as ExportFormat)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      exportFormat === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <DocumentArrowDownIcon className="w-5 h-5 mx-auto mb-1" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <select
                value={dateRangeOption}
                onChange={(e) => setDateRangeOption(e.target.value)}
                className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
              >
                {DATE_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range */}
            {dateRangeOption === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Status Filter (for certain types) */}
            {['incidents', 'time_off', 'alerts'].includes(exportType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status (Optional)
                </label>
                <input
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="e.g., OPEN, PENDING, APPROVED"
                  className="w-full p-2.5 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                />
              </div>
            )}

            {/* Info */}
            <p className="text-xs text-gray-500">
              Data will be exported as a {exportFormat.toUpperCase()} file. Large exports may take
              a moment to generate.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={
                exportMutation.isPending ||
                (dateRangeOption === 'custom' && (!customStartDate || !customEndDate))
              }
            >
              {exportMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </span>
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
