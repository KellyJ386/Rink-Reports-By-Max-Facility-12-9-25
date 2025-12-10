'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
} from '@heroicons/react/24/outline';

// Report types configuration
const reportTypes = [
  {
    id: 'ice-depth',
    name: 'Ice Depth Analysis Report',
    description: 'Comprehensive ice depth readings with SPC analysis, weekly comparisons, and AI insights.',
    icon: ChartBarIcon,
    color: 'bg-ice-100 text-ice-700',
    apiEndpoint: '/api/reports/ice-depth',
    params: [
      { key: 'rinkId', label: 'Rink', type: 'select', options: [
        { value: 'rink-a', label: 'Rink A - NHL Size' },
        { value: 'rink-b', label: 'Rink B - Olympic Size' },
      ]},
      { key: 'weeks', label: 'Time Period', type: 'select', options: [
        { value: '1', label: 'Last Week' },
        { value: '2', label: 'Last 2 Weeks' },
        { value: '4', label: 'Last 4 Weeks' },
        { value: '8', label: 'Last 8 Weeks' },
        { value: '12', label: 'Last 12 Weeks' },
      ]},
    ],
  },
  {
    id: 'incident',
    name: 'Incident Report',
    description: 'Detailed incident report for documentation, insurance, and follow-up purposes.',
    icon: ExclamationTriangleIcon,
    color: 'bg-red-100 text-red-700',
    apiEndpoint: '/api/reports/incident',
    params: [
      { key: 'incidentId', label: 'Incident ID', type: 'text' },
    ],
  },
  {
    id: 'refrigeration',
    name: 'Refrigeration Summary',
    description: 'Plant room readings, trends, and maintenance alerts over selected period.',
    icon: BeakerIcon,
    color: 'bg-purple-100 text-purple-700',
    apiEndpoint: '/api/reports/refrigeration',
    params: [
      { key: 'period', label: 'Time Period', type: 'select', options: [
        { value: 'week', label: 'Last Week' },
        { value: 'month', label: 'Last Month' },
        { value: 'quarter', label: 'Last Quarter' },
      ]},
    ],
    comingSoon: true,
  },
  {
    id: 'air-quality',
    name: 'Air Quality Report',
    description: 'CO₂ and CO monitoring trends with OSHA compliance status.',
    icon: CloudIcon,
    color: 'bg-teal-100 text-teal-700',
    apiEndpoint: '/api/reports/air-quality',
    params: [
      { key: 'period', label: 'Time Period', type: 'select', options: [
        { value: 'week', label: 'Last Week' },
        { value: 'month', label: 'Last Month' },
      ]},
    ],
    comingSoon: true,
  },
  {
    id: 'schedule',
    name: 'Schedule Summary',
    description: 'Staff hours, shift coverage, and time-off summary.',
    icon: CalendarDaysIcon,
    color: 'bg-green-100 text-green-700',
    apiEndpoint: '/api/reports/schedule',
    params: [
      { key: 'period', label: 'Time Period', type: 'select', options: [
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
      ]},
    ],
    comingSoon: true,
  },
  {
    id: 'forms',
    name: 'Form Submissions Report',
    description: 'Summary of all form submissions with completion rates.',
    icon: DocumentTextIcon,
    color: 'bg-yellow-100 text-yellow-700',
    apiEndpoint: '/api/reports/forms',
    params: [
      { key: 'category', label: 'Category', type: 'select', options: [
        { value: 'all', label: 'All Forms' },
        { value: 'ICE_OPERATIONS', label: 'Ice Operations' },
        { value: 'REFRIGERATION', label: 'Refrigeration' },
        { value: 'AIR_QUALITY', label: 'Air Quality' },
      ]},
      { key: 'period', label: 'Time Period', type: 'select', options: [
        { value: 'week', label: 'Last Week' },
        { value: 'month', label: 'Last Month' },
      ]},
    ],
    comingSoon: true,
  },
];

// Recently generated reports (mock data)
const recentReports = [
  {
    id: '1',
    type: 'ice-depth',
    name: 'Ice Depth Report - Rink A',
    generatedAt: new Date(Date.now() - 86400000).toISOString(),
    generatedBy: 'John Smith',
    params: { rinkId: 'rink-a', weeks: '4' },
  },
  {
    id: '2',
    type: 'incident',
    name: 'Incident Report #IR-2024-001',
    generatedAt: new Date(Date.now() - 172800000).toISOString(),
    generatedBy: 'Sarah Johnson',
    params: { incidentId: 'IR-2024-001' },
  },
  {
    id: '3',
    type: 'ice-depth',
    name: 'Ice Depth Report - Rink B',
    generatedAt: new Date(Date.now() - 259200000).toISOString(),
    generatedBy: 'Mike Thompson',
    params: { rinkId: 'rink-b', weeks: '2' },
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<typeof reportTypes[0] | null>(null);
  const [reportParams, setReportParams] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReportUrl, setGeneratedReportUrl] = useState<string | null>(null);

  const handleSelectReport = (report: typeof reportTypes[0]) => {
    setSelectedReport(report);
    setGeneratedReportUrl(null);
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

    setIsGenerating(true);
    setGeneratedReportUrl(null);

    try {
      // Build query string
      const params = new URLSearchParams(reportParams);
      params.set('format', format === 'view' ? 'html' : 'html');

      const url = `${selectedReport.apiEndpoint}?${params.toString()}`;

      if (format === 'view') {
        // Open in new tab
        window.open(url, '_blank');
      } else {
        // Download
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
      }

      setGeneratedReportUrl(url);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

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
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
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
                <label className="form-label">{param.label}</label>
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
              isLoading={isGenerating}
              leftIcon={<EyeIcon className="w-4 h-4" />}
            >
              View Report
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleGenerateReport('download')}
              isLoading={isGenerating}
              leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            >
              Download HTML
            </Button>
          </div>

          {generatedReportUrl && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Report generated successfully!
            </div>
          )}
        </Card>
      )}

      {/* Recent Reports */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-rink-900">Recent Reports</h2>
          <ClockIcon className="w-5 h-5 text-rink-400" />
        </div>

        <div className="divide-y divide-rink-100">
          {recentReports.map((report) => {
            const reportType = reportTypes.find((r) => r.id === report.type);
            const Icon = reportType?.icon || DocumentTextIcon;

            return (
              <div
                key={report.id}
                className="py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${reportType?.color || 'bg-rink-100 text-rink-700'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-rink-900">{report.name}</p>
                    <p className="text-sm text-rink-500">
                      Generated by {report.generatedBy} • {formatTimeAgo(report.generatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const rt = reportTypes.find((r) => r.id === report.type);
                      if (rt) {
                        handleSelectReport(rt);
                        setReportParams(report.params);
                      }
                    }}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {recentReports.length === 0 && (
            <div className="py-8 text-center text-rink-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-rink-300 mb-2" />
              <p>No reports generated yet</p>
            </div>
          )}
        </div>
      </Card>

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
