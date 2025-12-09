import { Suspense } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  BellAlertIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge, SeverityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// Stats cards data
const stats = [
  {
    name: 'Forms Submitted',
    value: '127',
    change: '+12%',
    changeType: 'positive' as const,
    icon: DocumentTextIcon,
  },
  {
    name: 'Ice Depth Readings',
    value: '48',
    change: 'This week',
    changeType: 'neutral' as const,
    icon: ChartBarIcon,
  },
  {
    name: 'Open Incidents',
    value: '3',
    change: '-2 from yesterday',
    changeType: 'negative' as const,
    icon: ExclamationTriangleIcon,
  },
  {
    name: 'Scheduled Shifts',
    value: '24',
    change: 'This week',
    changeType: 'neutral' as const,
    icon: CalendarDaysIcon,
  },
];

// Recent activity data
const recentActivity = [
  {
    id: 1,
    type: 'ice_depth',
    title: 'Ice Depth Reading - Rink A',
    user: 'John Smith',
    time: '10 minutes ago',
    status: 'completed',
  },
  {
    id: 2,
    type: 'incident',
    title: 'Minor Incident Report',
    user: 'Sarah Johnson',
    time: '1 hour ago',
    status: 'pending',
  },
  {
    id: 3,
    type: 'form',
    title: 'Zamboni Circle Check',
    user: 'Mike Wilson',
    time: '2 hours ago',
    status: 'completed',
  },
  {
    id: 4,
    type: 'checklist',
    title: 'Opening Checklist',
    user: 'Emily Brown',
    time: '4 hours ago',
    status: 'completed',
  },
];

// Alerts data
const activeAlerts = [
  {
    id: 1,
    type: 'warning',
    title: 'CO₂ Level Elevated',
    message: 'Rink B reading at 950 ppm (threshold: 1000)',
    time: '15 min ago',
  },
  {
    id: 2,
    type: 'info',
    title: 'Blade Change Due',
    message: 'Zamboni #2 approaching 200 hours on current blade',
    time: '1 hour ago',
  },
];

function StatCard({ stat }: { stat: typeof stats[0] }) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-rink-500">{stat.name}</p>
        <p className="mt-2 text-3xl font-bold text-rink-900">{stat.value}</p>
        <p
          className={`mt-1 text-sm ${
            stat.changeType === 'positive'
              ? 'text-green-600'
              : stat.changeType === 'negative'
              ? 'text-red-600'
              : 'text-rink-500'
          }`}
        >
          {stat.change}
        </p>
      </div>
      <div className="p-3 bg-ice-100 rounded-lg">
        <stat.icon className="w-6 h-6 text-ice-600" />
      </div>
    </Card>
  );
}

function RecentActivityItem({ activity }: { activity: typeof recentActivity[0] }) {
  const icons = {
    ice_depth: ChartBarIcon,
    incident: ExclamationTriangleIcon,
    form: DocumentTextIcon,
    checklist: CheckCircleIcon,
  };

  const Icon = icons[activity.type as keyof typeof icons] || DocumentTextIcon;

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="p-2 bg-rink-100 rounded-lg">
        <Icon className="w-5 h-5 text-rink-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-rink-900 truncate">{activity.title}</p>
        <p className="text-xs text-rink-500">
          {activity.user} • {activity.time}
        </p>
      </div>
      <StatusBadge status={activity.status.toUpperCase()} />
    </div>
  );
}

function AlertItem({ alert }: { alert: typeof activeAlerts[0] }) {
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

export default function DashboardPage() {
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
          <Button variant="secondary">View Reports</Button>
          <Button>New Form Submission</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.name} stat={stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2" padding="none">
          <div className="px-6 py-4 border-b border-rink-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-rink-900">Recent Activity</h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </div>
          <div className="px-6 divide-y divide-rink-100">
            {recentActivity.map((activity) => (
              <RecentActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </Card>

        {/* Active Alerts */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-rink-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-rink-900">Active Alerts</h2>
              <Badge variant="warning">{activeAlerts.length}</Badge>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {activeAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
            {activeAlerts.length === 0 && (
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
            { name: 'Circle Check', icon: CheckCircleIcon, href: '/dashboard/ice-ops/circle-check' },
            { name: 'Incident', icon: ExclamationTriangleIcon, href: '/dashboard/incidents/new' },
            { name: 'Refrigeration', icon: DocumentTextIcon, href: '/dashboard/refrigeration/new' },
            { name: 'Air Quality', icon: DocumentTextIcon, href: '/dashboard/air-quality/new' },
            { name: 'Checklist', icon: CheckCircleIcon, href: '/dashboard/checklists' },
          ].map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-rink-200 hover:border-ice-300 hover:bg-ice-50 transition-colors text-center"
            >
              <action.icon className="w-8 h-8 text-ice-600" />
              <span className="text-sm font-medium text-rink-700">{action.name}</span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
