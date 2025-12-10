'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useIncidents } from '@/hooks';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import clsx from 'clsx';

const severityColors: Record<string, string> = {
  MINOR: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SERIOUS: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors: Record<string, string> = {
  REPORTED: 'bg-blue-100 text-blue-800',
  INVESTIGATING: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
  REPORTED: 'Reported',
  INVESTIGATING: 'Investigating',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export default function IncidentsPage() {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch incidents using real API
  const { data: incidents = [], isLoading, error } = useIncidents({
    ...(filterSeverity !== 'all' && { severity: filterSeverity }),
    ...(filterStatus !== 'all' && { status: filterStatus }),
  });

  // Filter incidents locally for search and date range
  const filteredIncidents = useMemo(() => {
    let result = [...incidents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (incident) =>
          incident.incidentType?.toLowerCase().includes(query) ||
          incident.description?.toLowerCase().includes(query) ||
          incident.location?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filterDateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = startOfMonth(now);
          break;
        case 'quarter':
          startDate = subDays(now, 90);
          break;
        default:
          startDate = new Date(0);
      }

      result = result.filter((incident) => {
        const incidentDate = new Date(incident.occurredAt || incident.reportedAt);
        return incidentDate >= startDate;
      });
    }

    return result;
  }, [incidents, searchQuery, filterDateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = incidents.filter((i) => {
      const date = new Date(i.occurredAt || i.reportedAt);
      return isWithinInterval(date, {
        start: startOfMonth(now),
        end: endOfMonth(now),
      });
    });

    const lastMonth = incidents.filter((i) => {
      const date = new Date(i.occurredAt || i.reportedAt);
      const lastMonthStart = startOfMonth(subDays(startOfMonth(now), 1));
      const lastMonthEnd = endOfMonth(lastMonthStart);
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    });

    const openCount = incidents.filter(
      (i) => i.status === 'REPORTED' || i.status === 'INVESTIGATING'
    ).length;

    const seriousCount = incidents.filter((i) =>
      ['SERIOUS', 'CRITICAL'].includes(i.severity)
    ).length;

    const ambulanceCount = incidents.filter(
      (i) => (i.injuryDetails as Record<string, unknown>)?.ambulanceCalled
    ).length;

    const trend =
      lastMonth.length > 0
        ? ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100
        : 0;

    return {
      openCount,
      seriousCount,
      ambulanceCount,
      totalThisMonth: thisMonth.length,
      trend: Math.round(trend),
    };
  }, [incidents]);

  // Get incident type breakdown
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIncidents.forEach((i) => {
      const type = i.incidentType || 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredIncidents]);

  // Export to CSV
  const handleExport = () => {
    const headers = [
      'ID',
      'Date',
      'Type',
      'Location',
      'Severity',
      'Status',
      'Description',
    ];
    const rows = filteredIncidents.map((i) => [
      i.id,
      format(new Date(i.occurredAt), 'yyyy-MM-dd HH:mm'),
      i.incidentType,
      i.location,
      i.severity,
      i.status,
      `"${i.description?.replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to Load Incidents
        </h2>
        <p className="text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Incident Reports</h1>
          <p className="page-description">
            Document and track safety incidents across your facility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/dashboard/incidents/new">
            <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
              Report Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.openCount}</p>
            <p className="text-sm text-gray-500">Open Incidents</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.seriousCount}</p>
            <p className="text-sm text-gray-500">Serious/Critical</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <PhoneIcon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.ambulanceCount}</p>
            <p className="text-sm text-gray-500">EMS Called</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-ice-100 rounded-lg">
            <CalendarDaysIcon className="w-6 h-6 text-ice-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalThisMonth}</p>
            <p className="text-sm text-gray-500">This Month</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div
            className={clsx(
              'p-3 rounded-lg',
              stats.trend > 0 ? 'bg-red-100' : 'bg-green-100'
            )}
          >
            {stats.trend > 0 ? (
              <ArrowTrendingUpIcon className="w-6 h-6 text-red-600" />
            ) : (
              <ArrowTrendingDownIcon className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div>
            <p
              className={clsx(
                'text-2xl font-bold',
                stats.trend > 0 ? 'text-red-600' : 'text-green-600'
              )}
            >
              {stats.trend > 0 ? '+' : ''}
              {stats.trend}%
            </p>
            <p className="text-sm text-gray-500">vs Last Month</p>
          </div>
        </Card>
      </div>

      {/* Type Breakdown Mini Chart */}
      {typeBreakdown.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
              Top Incident Types
            </h3>
          </div>
          <div className="space-y-3">
            {typeBreakdown.map(([type, count]) => (
              <div key={type} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600 truncate">{type}</div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ice-500 rounded-full"
                      style={{
                        width: `${(count / filteredIncidents.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-12 text-sm font-medium text-gray-900 text-right">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents..."
              className="form-input pl-10 w-full"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="form-input w-36"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 90 Days</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="form-input w-36"
            >
              <option value="all">All Severities</option>
              <option value="MINOR">Minor</option>
              <option value="MODERATE">Moderate</option>
              <option value="SERIOUS">Serious</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input w-40"
            >
              <option value="all">All Statuses</option>
              <option value="REPORTED">Reported</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-500">
          Showing {filteredIncidents.length} of {incidents.length} incidents
        </div>
      </Card>

      {/* Incidents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => (
            <Card
              key={incident.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                (window.location.href = `/dashboard/incidents/${incident.id}`)
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={clsx(
                      'p-3 rounded-lg',
                      severityColors[incident.severity]
                    )}
                  >
                    <ExclamationTriangleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {incident.incidentType}
                      </h3>
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          severityColors[incident.severity]
                        )}
                      >
                        {incident.severity}
                      </span>
                      {(incident.injuryDetails as Record<string, unknown>)
                        ?.ambulanceCalled && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                          <PhoneIcon className="w-3 h-3" />
                          EMS Called
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      {incident.location || 'Location not specified'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {incident.description}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {format(
                          new Date(incident.occurredAt || incident.reportedAt),
                          'MMM d, yyyy h:mm a'
                        )}
                      </div>
                      {(incident.injuryDetails as Record<string, unknown>)
                        ?.personName && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          {
                            (incident.injuryDetails as Record<string, unknown>)
                              .personName as string
                          }
                        </div>
                      )}
                      {incident.reportedBy && (
                        <div>Reported by: {incident.reportedBy.name}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      'px-3 py-1 text-xs font-medium rounded-full',
                      statusColors[incident.status]
                    )}
                  >
                    {statusLabels[incident.status] ||
                      incident.status?.replace('_', ' ')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/dashboard/incidents/${incident.id}`;
                    }}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredIncidents.length === 0 && !isLoading && (
            <Card className="text-center py-12">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">
                No incidents found
              </h3>
              <p className="text-gray-500 mt-1">
                {searchQuery || filterSeverity !== 'all' || filterStatus !== 'all'
                  ? 'No incidents match your filter criteria'
                  : 'No incidents have been reported yet'}
              </p>
              <Link href="/dashboard/incidents/new" className="inline-block mt-4">
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Report First Incident
                </Button>
              </Link>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
