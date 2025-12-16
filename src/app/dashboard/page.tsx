'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BeakerIcon,
  CloudIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDashboardStats, useModuleSummaries } from '@/hooks/useDashboard';
import { formatDistanceToNow } from 'date-fns';

// Stat card icons
const statIcons = {
  formsSubmitted: DocumentTextIcon,
  iceReadings: ChartBarIcon,
  openIncidents: ExclamationTriangleIcon,
  scheduledShifts: CalendarDaysIcon,
};

// Activity type icons
const activityIcons: Record<string, typeof DocumentTextIcon> = {
  ice_depth: ChartBarIcon,
  incident: ExclamationTriangleIcon,
  form: DocumentTextIcon,
  checklist: CheckCircleIcon,
};

// Module card icons and colors
const moduleConfig: Record<string, { icon: typeof ChartBarIcon; bgColor: string; iconColor: string }> = {
  iceDepth: { icon: ChartBarIcon, bgColor: 'bg-ice-100', iconColor: 'text-ice-600' },
  incidents: { icon: ExclamationTriangleIcon, bgColor: 'bg-red-100', iconColor: 'text-red-600' },
  forms: { icon: DocumentTextIcon, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  schedule: { icon: CalendarDaysIcon, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
  refrigeration: { icon: BeakerIcon, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
  airQuality: { icon: CloudIcon, bgColor: 'bg-teal-100', iconColor: 'text-teal-600' },
  alerts: { icon: BellAlertIcon, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
};

// Mock data for fallback
const mockStats = {
  overview: {
    formsSubmitted: { value: 127, weekValue: 24, change: '+12%', changeType: 'positive' as const },
    iceReadings: { value: 48, todayValue: 6, description: 'This week' },
    openIncidents: { value: 3, change: '-2 from yesterday', changeType: 'positive' as const },
    scheduledShifts: { value: 24, todayValue: 4, description: 'This week' },
  },
  alerts: { active: 2, urgent: 1 },
  activity: [
    { id: '1', type: 'ice_depth', title: 'Ice Depth Reading - Rink A', user: 'John Smith', time: new Date(Date.now() - 600000).toISOString(), status: 'completed' },
    { id: '2', type: 'incident', title: 'Minor Incident Report', user: 'Sarah Johnson', time: new Date(Date.now() - 3600000).toISOString(), status: 'pending' },
    { id: '3', type: 'form', title: 'Zamboni Circle Check', user: 'Mike Wilson', time: new Date(Date.now() - 7200000).toISOString(), status: 'completed' },
    { id: '4', type: 'form', title: 'Opening Checklist', user: 'Emily Brown', time: new Date(Date.now() - 14400000).toISOString(), status: 'completed' },
  ],
  weekSummary: { submissions: 24, incidents: 5, iceReadings: 48, shifts: 24 },
};

const mockAlerts = [
  { id: '1', type: 'warning', title: 'CO₂ Level Elevated', message: 'Rink B reading at 950 ppm (threshold: 1000)', time: '15 min ago' },
  { id: '2', type: 'info', title: 'Blade Change Due', message: 'Zamboni #2 approaching 200 hours on current blade', time: '1 hour ago' },
];

function StatCard({ name, value, change, changeType, icon: Icon }: {
  name: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: typeof ChartBarIcon;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-rink-500">{name}</p>
        <p className="mt-2 text-3xl font-bold text-rink-900">{value}</p>
        <div className="mt-1 flex items-center gap-1">
          {changeType === 'positive' && (
            <ArrowTrendingDownIcon className="w-4 h-4 text-green-600" />
          )}
          {changeType === 'negative' && (
            <ArrowTrendingUpIcon className="w-4 h-4 text-red-600" />
          )}
          <span
            className={`text-sm ${
              changeType === 'positive'
                ? 'text-green-600'
                : changeType === 'negative'
                ? 'text-red-600'
                : 'text-rink-500'
            }`}
          >
            {change}
          </span>
        </div>
      </div>
      <div className="p-3 bg-ice-100 rounded-lg">
        <Icon className="w-6 h-6 text-ice-600" />
      </div>
    </Card>
  );
}

function RecentActivityItem({ activity }: {
  activity: { id: string; type: string; title: string; user: string; time: string; status: string };
}) {
  const Icon = activityIcons[activity.type] || DocumentTextIcon;
  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(activity.time), { addSuffix: true });
    } catch {
      return activity.time;
    }
  }, [activity.time]);

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="p-2 bg-rink-100 rounded-lg">
        <Icon className="w-5 h-5 text-rink-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-rink-900 truncate">{activity.title}</p>
        <p className="text-xs text-rink-500">
          {activity.user} • {timeAgo}
        </p>
      </div>
      <StatusBadge status={activity.status.toUpperCase()} />
    </div>
  );
}

function AlertItem({ alert }: {
  alert: { id: string; type: string; title: string; message: string; time: string };
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        alert.type === 'warning'
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-ice-50 border-ice-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <BellAlertIcon
          className={`w-5 h-5 flex-shrink-0 ${
            alert.type === 'warning' ? 'text-yellow-600' : 'text-ice-600'
          }`}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              alert.type === 'warning' ? 'text-yellow-800' : 'text-ice-800'
            }`}
          >
            {alert.title}
          </p>
          <p
            className={`text-sm mt-1 ${
              alert.type === 'warning' ? 'text-yellow-700' : 'text-ice-700'
            }`}
          >
            {alert.message}
          </p>
          <p
            className={`text-xs mt-2 ${
              alert.type === 'warning' ? 'text-yellow-600' : 'text-ice-600'
            }`}
          >
            {alert.time}
          </p>
        </div>
      </div>
    </div>
  );
}

function ModuleSummaryCard({ moduleKey, title, description, stats, quickActions }: {
  moduleKey: string;
  title: string;
  description: string;
  stats: Array<{ label: string; value: string | number; trend?: 'up' | 'down' | 'neutral'; trendValue?: string }>;
  quickActions: Array<{ label: string; href: string }>;
}) {
  const config = moduleConfig[moduleKey] || moduleConfig.forms;
  const Icon = config.icon;

  return (
    <Card className="h-full">
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-lg ${config.bgColor}`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-rink-900">{title}</h3>
          <p className="text-sm text-rink-500">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-rink-50 rounded-lg p-3">
            <p className="text-xs text-rink-500 mb-1">{stat.label}</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-rink-900">{stat.value}</p>
              {stat.trend && stat.trend !== 'neutral' && (
                <span className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trendValue}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, i) => (
          <Link key={i} href={action.href}>
            <Button variant={i === 0 ? 'primary' : 'secondary'} size="sm">
              {action.label}
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  // Use real data from API, fallback to mock
  const { data: stats, isLoading } = useDashboardStats();
  const displayStats = stats || mockStats;
  const alerts = mockAlerts; // Use mock alerts for now

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Welcome back! Here's an overview of your facility operations.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/reports">
            <Button variant="secondary">View Reports</Button>
          </Link>
          <Link href="/dashboard/forms">
            <Button>New Form Submission</Button>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-24 bg-rink-100 rounded" />
            </Card>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            name="Forms Submitted"
            value={displayStats.overview.formsSubmitted.value}
            change={displayStats.overview.formsSubmitted.change}
            changeType={displayStats.overview.formsSubmitted.changeType}
            icon={statIcons.formsSubmitted}
          />
          <StatCard
            name="Ice Depth Readings"
            value={displayStats.overview.iceReadings.value}
            change={displayStats.overview.iceReadings.description}
            changeType="neutral"
            icon={statIcons.iceReadings}
          />
          <StatCard
            name="Open Incidents"
            value={displayStats.overview.openIncidents.value}
            change={displayStats.overview.openIncidents.change}
            changeType={displayStats.overview.openIncidents.changeType}
            icon={statIcons.openIncidents}
          />
          <StatCard
            name="Scheduled Shifts"
            value={displayStats.overview.scheduledShifts.value}
            change={displayStats.overview.scheduledShifts.description}
            changeType="neutral"
            icon={statIcons.scheduledShifts}
          />
        </div>
      )}

      {/* Module Summaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModuleSummaryCard
          moduleKey="iceDepth"
          title="Ice Depth Analysis"
          description="Monitor ice thickness and quality"
          stats={[
            { label: 'This Week', value: displayStats.weekSummary.iceReadings },
            { label: 'Today', value: displayStats.overview.iceReadings.todayValue },
          ]}
          quickActions={[
            { label: 'New Reading', href: '/dashboard/ice-depth/new' },
            { label: 'View Analysis', href: '/dashboard/ice-depth' },
          ]}
        />
        <ModuleSummaryCard
          moduleKey="incidents"
          title="Incident Reporting"
          description="Track and manage facility incidents"
          stats={[
            { label: 'Open', value: displayStats.overview.openIncidents.value, trend: displayStats.overview.openIncidents.changeType === 'positive' ? 'down' : 'up', trendValue: displayStats.overview.openIncidents.change },
            { label: 'This Week', value: displayStats.weekSummary.incidents },
          ]}
          quickActions={[
            { label: 'Report Incident', href: '/dashboard/incidents/new' },
            { label: 'View All', href: '/dashboard/incidents' },
          ]}
        />
        <ModuleSummaryCard
          moduleKey="forms"
          title="Form Submissions"
          description="Operational forms and logs"
          stats={[
            { label: 'Total', value: displayStats.overview.formsSubmitted.value, trend: displayStats.overview.formsSubmitted.changeType === 'positive' ? 'up' : 'down', trendValue: displayStats.overview.formsSubmitted.change },
            { label: 'This Week', value: displayStats.overview.formsSubmitted.weekValue },
          ]}
          quickActions={[
            { label: 'Fill Out Form', href: '/dashboard/forms' },
            { label: 'View Submissions', href: '/dashboard/forms' },
          ]}
        />
        <ModuleSummaryCard
          moduleKey="schedule"
          title="Staff Schedule"
          description="Employee shifts and time-off"
          stats={[
            { label: 'This Week', value: displayStats.overview.scheduledShifts.value },
            { label: 'Today', value: displayStats.overview.scheduledShifts.todayValue },
          ]}
          quickActions={[
            { label: 'View Schedule', href: '/dashboard/schedule' },
            { label: 'Add Shift', href: '/dashboard/schedule' },
          ]}
        />
        <ModuleSummaryCard
          moduleKey="refrigeration"
          title="Refrigeration"
          description="Plant room monitoring"
          stats={[
            { label: 'Status', value: 'Normal' },
            { label: 'Last Check', value: 'Today' },
          ]}
          quickActions={[
            { label: 'New Reading', href: '/dashboard/refrigeration' },
            { label: 'View Logs', href: '/dashboard/refrigeration' },
          ]}
        />
        <ModuleSummaryCard
          moduleKey="airQuality"
          title="Air Quality"
          description="CO₂ and CO monitoring"
          stats={[
            { label: 'Alerts', value: displayStats.alerts.active },
            { label: 'Urgent', value: displayStats.alerts.urgent, trend: displayStats.alerts.urgent > 0 ? 'up' : 'neutral' },
          ]}
          quickActions={[
            { label: 'New Reading', href: '/dashboard/air-quality' },
            { label: 'View Trends', href: '/dashboard/air-quality' },
          ]}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2" padding="none">
          <div className="px-6 py-4 border-b border-rink-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-rink-900">Recent Activity</h2>
              <Link href="/dashboard/activity">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </div>
          <div className="px-6 divide-y divide-rink-100">
            {displayStats.activity.map((activity) => (
              <RecentActivityItem key={activity.id} activity={activity} />
            ))}
            {displayStats.activity.length === 0 && (
              <div className="py-8 text-center text-rink-500">
                <ClockIcon className="w-12 h-12 mx-auto text-rink-300 mb-2" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </Card>

        {/* Active Alerts */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-rink-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-rink-900">Active Alerts</h2>
              <Badge variant={displayStats.alerts.urgent > 0 ? 'error' : 'warning'}>
                {displayStats.alerts.active}
              </Badge>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-rink-500">
                <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p>All systems operating normally</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-rink-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Ice Depth', icon: ChartBarIcon, href: '/dashboard/ice-depth/new' },
            { name: 'Circle Check', icon: ClipboardDocumentCheckIcon, href: '/dashboard/forms' },
            { name: 'Incident', icon: ExclamationTriangleIcon, href: '/dashboard/incidents/new' },
            { name: 'Refrigeration', icon: BeakerIcon, href: '/dashboard/refrigeration' },
            { name: 'Air Quality', icon: CloudIcon, href: '/dashboard/air-quality' },
            { name: 'Schedule', icon: CalendarDaysIcon, href: '/dashboard/schedule' },
          ].map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-rink-200 hover:border-ice-300 hover:bg-ice-50 transition-colors text-center"
            >
              <action.icon className="w-8 h-8 text-ice-600" />
              <span className="text-sm font-medium text-rink-700">{action.name}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Week Summary */}
      <Card>
        <h2 className="text-lg font-semibold text-rink-900 mb-4">This Week's Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-ice-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-ice-700">{displayStats.weekSummary.submissions}</p>
            <p className="text-sm text-rink-500 mt-1">Form Submissions</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-700">{displayStats.weekSummary.iceReadings}</p>
            <p className="text-sm text-rink-500 mt-1">Ice Readings</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{displayStats.weekSummary.incidents}</p>
            <p className="text-sm text-rink-500 mt-1">Incidents</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{displayStats.weekSummary.shifts}</p>
            <p className="text-sm text-rink-500 mt-1">Shifts Scheduled</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
