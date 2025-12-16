'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useReportsLive,
  useGenerateReport,
  useDeleteReport,
  getReportStatusColor,
  getReportTypeName,
  formatFileSize,
  formatTimeAgo,
  REPORT_TYPES,
  type ReportTypeConfig,
  type Report,
} from '@/hooks';
import {
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  CloudIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// Icon map for report types
const iconMap: Record<string, typeof DocumentTextIcon> = {
  'ice-depth': ChartBarIcon,
  incident: ExclamationTriangleIcon,
  refrigeration: BeakerIcon,
  'air-quality': CloudIcon,
  schedule: CalendarDaysIcon,
  forms: DocumentTextIcon,
};

// Refresh intervals
const REFRESH_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportTypeConfig | null>(null);
  const [reportParams, setReportParams] = useState<Record<string, string>>({});
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch reports with live refresh
  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useReportsLive(
    { includeScheduled: true },
    { refreshInterval, enabled: true }
  );

  // Mutations
  const generateReport = useGenerateReport();
  const deleteReport = useDeleteReport();

  // Update last refresh time
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefresh(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const handleSelectReport = (report: ReportTypeConfig) => {
    setSelectedReport(report);
    // Initialize default params
    const defaults: Record<string, string> = {};
    report.params.forEach((param) => {
      if (param.type === 'select' && param.options?.[0]) {
        defaults[param.key] = param.options[0].value;
      }
    });
    setReportParams(defaults);
  };

  const handleParamChange = (key: string, value: string) => {
    setReportParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateReport = async (format: 'view' | 'download') => {
    if (!selectedReport) return;

    // Build query string
    const params = new URLSearchParams(reportParams);
    params.set('format', format === 'view' ? 'html' : 'html');

    const url = `${selectedReport.apiEndpoint}?${params.toString()}`;

    if (format === 'view') {
      // Open in new tab
      window.open(url, '_blank');
    } else {
      // Download
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to generate report');

        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${selectedReport.id}-report-${Date.now()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Failed to download report:', error);
        alert('Failed to download report. Please try again.');
      }
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReport.mutateAsync(reportId);
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const reports = reportsData?.reports || [];
  const scheduledReports = reportsData?.scheduled || [];

  // Stats
  const completedReports = reports.filter((r) => r.status === 'completed').length;
  const pendingReports = reports.filter((r) => r.status === 'pending' || r.status === 'generating').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-description">
            Generate and download facility reports for analysis and compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Controls */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-rink-200 p-1">
            {REFRESH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRefreshInterval(opt.value)}
                className={`px-3 py-1 text-sm rounded ${
                  refreshInterval === opt.value
                    ? 'bg-ice-600 text-white'
                    : 'text-rink-600 hover:bg-rink-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => refetch()}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Status Indicator */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-rink-200 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-rink-600">
          {refreshInterval > 0 && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Live updates every {refreshInterval / 1000}s</span>
            </>
          )}
          {refreshInterval === 0 && (
            <>
              <ClockIcon className="w-4 h-4" />
              <span>Manual refresh</span>
            </>
          )}
        </div>
        <span className="text-xs text-rink-400">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-ice-100 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-ice-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{reports.length}</p>
            <p className="text-sm text-rink-500">Total Reports</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{completedReports}</p>
            <p className="text-sm text-rink-500">Completed</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <ClockIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{pendingReports}</p>
            <p className="text-sm text-rink-500">Pending</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{scheduledReports.length}</p>
            <p className="text-sm text-rink-500">Scheduled</p>
          </div>
        </Card>
      </div>

      {/* Report Types Grid */}
      <div>
        <h2 className="text-lg font-semibold text-rink-900 mb-4">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map((report) => {
            const Icon = iconMap[report.id] || DocumentTextIcon;
            const isSelected = selectedReport?.id === report.id;

            return (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-ice-500 shadow-md'
                    : 'hover:shadow-md'
                } ${report.comingSoon ? 'opacity-60' : ''}`}
                onClick={() => !report.comingSoon && handleSelectReport(report)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-rink-900">{report.name}</h3>
                      {report.comingSoon && (
                        <Badge variant="default">Coming Soon</Badge>
                      )}
                    </div>
                    <p className="text-sm text-rink-500 mt-1">{report.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Report Configuration Panel */}
      {selectedReport && !selectedReport.comingSoon && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <FunnelIcon className="w-5 h-5 text-rink-500" />
            <h2 className="text-lg font-semibold text-rink-900">
              Configure {selectedReport.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {selectedReport.params.map((param) => (
              <div key={param.key}>
                <label className="form-label">
                  {param.label}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {param.type === 'select' && param.options ? (
                  <select
                    className="form-input"
                    value={reportParams[param.key] || ''}
                    onChange={(e) => handleParamChange(param.key, e.target.value)}
                  >
                    {param.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={reportParams[param.key] || ''}
                    onChange={(e) => handleParamChange(param.key, e.target.value)}
                    placeholder={`Enter ${param.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-rink-200">
            <Button
              onClick={() => handleGenerateReport('view')}
              leftIcon={<EyeIcon className="w-4 h-4" />}
            >
              View Report
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleGenerateReport('download')}
              leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            >
              Download HTML
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Reports - From API */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-rink-900">Recent Reports</h2>
          <ClockIcon className="w-5 h-5 text-rink-400" />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-600" />
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-red-500">
            <XCircleIcon className="w-12 h-12 mx-auto text-red-300 mb-2" />
            <p>Failed to load reports. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="divide-y divide-rink-100">
            {reports.length === 0 ? (
              <div className="py-8 text-center text-rink-500">
                <DocumentTextIcon className="w-12 h-12 mx-auto text-rink-300 mb-2" />
                <p>No reports generated yet</p>
                <p className="text-sm mt-1">Select a report type above to generate your first report.</p>
              </div>
            ) : (
              reports.slice(0, 10).map((report: Report) => {
                const statusColor = getReportStatusColor(report.status);

                return (
                  <div
                    key={report.id}
                    className="py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${statusColor}`}>
                        <DocumentTextIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-rink-900">{report.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={statusColor}>{report.status}</Badge>
                          <span className="text-sm text-rink-500">
                            {getReportTypeName(report.type)}
                          </span>
                          {report.fileSize && (
                            <span className="text-sm text-rink-400">
                              {formatFileSize(report.fileSize)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-rink-400 mt-1">
                          Created {formatTimeAgo(report.createdAt)}
                          {report.completedAt && ` • Completed ${formatTimeAgo(report.completedAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.fileUrl && report.status === 'completed' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(report.fileUrl, '_blank')}
                            title="View Report"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = report.fileUrl!;
                              link.download = `${report.name}.${report.format}`;
                              link.click();
                            }}
                            title="Download Report"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                        title="Delete Report"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {reports.length > 10 && (
          <div className="pt-4 border-t border-rink-100 text-center">
            <Button variant="ghost" size="sm">
              View All {reports.length} Reports
            </Button>
          </div>
        )}
      </Card>

      {/* Scheduled Reports */}
      {scheduledReports.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-rink-900">Scheduled Reports</h2>
            <CalendarDaysIcon className="w-5 h-5 text-rink-400" />
          </div>

          <div className="divide-y divide-rink-100">
            {scheduledReports.map((scheduled) => (
              <div
                key={scheduled.id}
                className="py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <CalendarDaysIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-rink-900">{scheduled.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={scheduled.isActive ? 'success' : 'default'}>
                        {scheduled.isActive ? 'Active' : 'Paused'}
                      </Badge>
                      <span className="text-sm text-rink-500 capitalize">
                        {scheduled.frequency}
                      </span>
                    </div>
                    <p className="text-xs text-rink-400 mt-1">
                      Next run: {new Date(scheduled.nextRunAt).toLocaleString()}
                      {scheduled.lastRunAt && ` • Last run: ${formatTimeAgo(scheduled.lastRunAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{scheduled.recipients.length} recipients</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Report Types Info */}
      <Card>
        <h2 className="text-lg font-semibold text-rink-900 mb-4">About Reports</h2>
        <div className="prose prose-sm text-rink-600">
          <p>
            Reports are generated as HTML documents that can be viewed in your browser or
            downloaded for offline access. For PDF output, use your browser's print function
            (Ctrl+P / Cmd+P) and select "Save as PDF".
          </p>
          <ul className="mt-4 space-y-2">
            <li>
              <strong>Ice Depth Reports</strong> include SPC control charts, weekly trend
              analysis, and AI-powered insights when available.
            </li>
            <li>
              <strong>Incident Reports</strong> provide detailed documentation suitable for
              insurance claims and safety reviews.
            </li>
            <li>
              <strong>Refrigeration Reports</strong> track plant room metrics against
              operational thresholds.
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
