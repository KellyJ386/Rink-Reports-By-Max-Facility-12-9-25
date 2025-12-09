import Link from 'next/link';
import {
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';

// Mock data for ice depth readings
const recentReadings = [
  {
    id: '1',
    rinkName: 'Rink A - Main',
    recordedBy: 'John Smith',
    recordedAt: '2024-12-08 14:30',
    averageDepth: 1.25,
    minDepth: 0.95,
    maxDepth: 1.45,
    status: 'ANALYZED',
    trend: 'stable',
  },
  {
    id: '2',
    rinkName: 'Rink B - Practice',
    recordedBy: 'Sarah Johnson',
    recordedAt: '2024-12-08 10:15',
    averageDepth: 1.1,
    minDepth: 0.85,
    maxDepth: 1.3,
    status: 'FLAGGED',
    trend: 'down',
  },
  {
    id: '3',
    rinkName: 'Rink A - Main',
    recordedBy: 'Mike Wilson',
    recordedAt: '2024-12-07 15:00',
    averageDepth: 1.3,
    minDepth: 1.1,
    maxDepth: 1.5,
    status: 'ANALYZED',
    trend: 'up',
  },
];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') {
    return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
  } else if (trend === 'down') {
    return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
  }
  return <div className="w-4 h-4 flex items-center justify-center text-rink-400">-</div>;
}

export default function IceDepthPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ice Depth Monitoring</h1>
          <p className="page-description">
            Track ice thickness with precision measurements and AI analysis
          </p>
        </div>
        <Link href="/dashboard/ice-depth/new">
          <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
            New Reading
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-ice-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-ice-600" />
            </div>
            <div>
              <p className="text-sm text-rink-500">This Week</p>
              <p className="text-2xl font-bold text-rink-900">48</p>
              <p className="text-xs text-rink-500">readings</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-rink-500">Avg Depth</p>
              <p className="text-2xl font-bold text-rink-900">1.22"</p>
              <p className="text-xs text-green-600">+0.05" from last week</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-rink-500">Last Reading</p>
              <p className="text-2xl font-bold text-rink-900">4h ago</p>
              <p className="text-xs text-rink-500">Rink A - Main</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-rink-500">Flagged Areas</p>
              <p className="text-2xl font-bold text-rink-900">2</p>
              <p className="text-xs text-red-600">Need attention</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Rink Selection */}
      <Card padding="none">
        <CardHeader
          title="Select Rink"
          description="Choose a rink to view detailed measurements or take a new reading"
        />
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Rink A - Main', 'Rink B - Practice'].map((rink) => (
              <Link
                key={rink}
                href={`/dashboard/ice-depth/new?rink=${encodeURIComponent(rink)}`}
              >
                <div className="p-4 border border-rink-200 rounded-lg hover:border-ice-300 hover:bg-ice-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-rink-900">{rink}</h3>
                      <p className="text-sm text-rink-500">25-point configuration</p>
                    </div>
                    <Badge variant="info">NHL Size</Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="text-rink-500">Last reading: 4h ago</span>
                    <span className="text-green-600">Avg: 1.25"</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Readings */}
      <Card padding="none">
        <CardHeader
          title="Recent Readings"
          action={<Button variant="ghost" size="sm">View All</Button>}
        />
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Rink</th>
                <th>Recorded By</th>
                <th>Date/Time</th>
                <th>Avg Depth</th>
                <th>Range</th>
                <th>Trend</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentReadings.map((reading) => (
                <tr key={reading.id}>
                  <td className="font-medium text-rink-900">{reading.rinkName}</td>
                  <td>{reading.recordedBy}</td>
                  <td>{reading.recordedAt}</td>
                  <td className="font-medium">{reading.averageDepth}"</td>
                  <td>
                    {reading.minDepth}" - {reading.maxDepth}"
                  </td>
                  <td>
                    <TrendIcon trend={reading.trend} />
                  </td>
                  <td>
                    <StatusBadge status={reading.status} />
                  </td>
                  <td>
                    <Link href={`/dashboard/ice-depth/${reading.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
