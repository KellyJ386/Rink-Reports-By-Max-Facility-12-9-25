'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SPCChart } from '@/components/ice-depth/SPCChart';
import { WeeklyComparisonChart } from '@/components/ice-depth/WeeklyComparisonChart';
import { HeatmapVisualization } from '@/components/ice-depth/HeatmapVisualization';

// Mock data for analysis
const weeklyData = [
  { weekStart: '2024-11-11', averageDepth: 1.18, minDepth: 0.92, maxDepth: 1.42, readingsCount: 12 },
  { weekStart: '2024-11-18', averageDepth: 1.22, minDepth: 0.95, maxDepth: 1.45, readingsCount: 14 },
  { weekStart: '2024-11-25', averageDepth: 1.20, minDepth: 0.88, maxDepth: 1.48, readingsCount: 13 },
  { weekStart: '2024-12-02', averageDepth: 1.25, minDepth: 1.02, maxDepth: 1.44, readingsCount: 15 },
];

const comparison = [
  { currentWeek: '2024-11-18', previousWeek: '2024-11-11', depthChange: 0.04, percentChange: 3.4 },
  { currentWeek: '2024-11-25', previousWeek: '2024-11-18', depthChange: -0.02, percentChange: -1.6 },
  { currentWeek: '2024-12-02', previousWeek: '2024-11-25', depthChange: 0.05, percentChange: 4.2 },
];

const latestAnalysis = {
  summary: 'Average ice depth is 1.25" (within optimal range). Ice has increased by 0.05" since last week. No immediate concerns detected.',
  patterns: [
    'Consistent buildup in center ice areas',
    'Slightly thinner ice near team benches due to traffic',
    'Ice quality has improved over the past 3 weeks',
  ],
  risks: [
    'Minor variance detected between goal areas and neutral zone',
  ],
  recommendations: [
    'Maintain current flooding schedule',
    'Consider extra flood before Saturday games',
    'Monitor goal crease areas for wear patterns',
  ],
  weekOverWeekChange: 0.05,
  trendDirection: 'increasing' as const,
  problemAreas: [
    { pointId: 'A3', issue: 'Slightly below average', severity: 'info' },
  ],
};

const trends = {
  trend: 'increasing',
  confidence: 75,
};

type TabType = 'overview' | 'comparison' | 'spc' | 'heatmap';

export default function IceDepthAnalysisPage() {
  const [selectedRink, setSelectedRink] = useState('rink-a');
  const [timeRange, setTimeRange] = useState('4');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'comparison', name: 'Week Comparison', icon: CalendarDaysIcon },
    { id: 'spc', name: 'SPC Charts', icon: ArrowTrendingUpIcon },
    { id: 'heatmap', name: 'Heat Map', icon: ChartBarIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ice-depth">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="page-title">Ice Depth Analysis</h1>
            <p className="page-description">
              AI-powered insights and week-to-week comparison
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedRink}
            onChange={(e) => setSelectedRink(e.target.value)}
            className="input-field"
          >
            <option value="rink-a">Rink A - Main</option>
            <option value="rink-b">Rink B - Practice</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
          >
            <option value="2">Last 2 Weeks</option>
            <option value="4">Last 4 Weeks</option>
            <option value="8">Last 8 Weeks</option>
            <option value="12">Last 12 Weeks</option>
          </select>
        </div>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${
              latestAnalysis.trendDirection === 'increasing'
                ? 'bg-green-100'
                : latestAnalysis.trendDirection === 'decreasing'
                ? 'bg-red-100'
                : 'bg-gray-100'
            }`}>
              {latestAnalysis.trendDirection === 'increasing' ? (
                <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
              ) : latestAnalysis.trendDirection === 'decreasing' ? (
                <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
              ) : (
                <ChartBarIcon className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-rink-500">Week-over-Week</p>
              <p className="text-2xl font-bold text-rink-900">
                {latestAnalysis.weekOverWeekChange !== null
                  ? `${latestAnalysis.weekOverWeekChange > 0 ? '+' : ''}${latestAnalysis.weekOverWeekChange.toFixed(2)}"`
                  : 'N/A'
                }
              </p>
              <p className="text-xs text-rink-500 capitalize">{latestAnalysis.trendDirection}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-ice-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-ice-600" />
            </div>
            <div>
              <p className="text-sm text-rink-500">Current Avg</p>
              <p className="text-2xl font-bold text-rink-900">
                {weeklyData[weeklyData.length - 1].averageDepth}"
              </p>
              <p className="text-xs text-green-600">Optimal: 1.0" - 1.25"</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${
              trends.confidence >= 70 ? 'bg-green-100' : trends.confidence >= 40 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <ArrowTrendingUpIcon className={`w-6 h-6 ${
                trends.confidence >= 70 ? 'text-green-600' : trends.confidence >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-rink-500">Trend Confidence</p>
              <p className="text-2xl font-bold text-rink-900">{trends.confidence}%</p>
              <p className="text-xs text-rink-500 capitalize">{trends.trend}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${
              latestAnalysis.problemAreas.length === 0 ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {latestAnalysis.problemAreas.length === 0 ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-rink-500">Problem Areas</p>
              <p className="text-2xl font-bold text-rink-900">
                {latestAnalysis.problemAreas.length}
              </p>
              <p className="text-xs text-rink-500">
                {latestAnalysis.problemAreas.length === 0 ? 'All clear' : 'Need attention'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-rink-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-ice-500 text-ice-600'
                  : 'border-transparent text-rink-500 hover:text-rink-700 hover:border-rink-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Analysis Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="none">
              <CardHeader title="AI Analysis Summary" />
              <CardContent>
                <p className="text-rink-700 mb-6">{latestAnalysis.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Patterns */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <ChartBarIcon className="w-4 h-4" />
                      Patterns Detected
                    </h4>
                    <ul className="space-y-1">
                      {latestAnalysis.patterns.map((pattern, i) => (
                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risks */}
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Risks
                    </h4>
                    {latestAnalysis.risks.length > 0 ? (
                      <ul className="space-y-1">
                        {latestAnalysis.risks.map((risk, i) => (
                          <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                            <span className="text-amber-400 mt-1">•</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-amber-700">No significant risks detected</p>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <LightBulbIcon className="w-4 h-4" />
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {latestAnalysis.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Trend Chart */}
            <Card padding="none">
              <CardHeader title="Weekly Depth Trend" />
              <CardContent>
                <WeeklyComparisonChart data={weeklyData} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Week-over-Week Changes */}
            <Card padding="none">
              <CardHeader title="Week-over-Week Changes" />
              <CardContent>
                <div className="space-y-3">
                  {comparison.map((week, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-rink-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-rink-900">
                          {new Date(week.currentWeek).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-rink-500">
                          vs {new Date(week.previousWeek).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          week.depthChange > 0 ? 'text-green-600' : week.depthChange < 0 ? 'text-red-600' : 'text-rink-600'
                        }`}>
                          {week.depthChange > 0 ? '+' : ''}{week.depthChange.toFixed(2)}"
                        </p>
                        <p className={`text-xs ${
                          week.percentChange > 0 ? 'text-green-500' : week.percentChange < 0 ? 'text-red-500' : 'text-rink-500'
                        }`}>
                          {week.percentChange > 0 ? '+' : ''}{week.percentChange.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Problem Areas */}
            <Card padding="none">
              <CardHeader
                title="Problem Areas"
                action={
                  <Badge variant={latestAnalysis.problemAreas.length === 0 ? 'success' : 'warning'}>
                    {latestAnalysis.problemAreas.length} found
                  </Badge>
                }
              />
              <CardContent>
                {latestAnalysis.problemAreas.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-rink-600">All measurement points within normal range</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {latestAnalysis.problemAreas.map((area, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg ${
                          area.severity === 'critical'
                            ? 'bg-red-50 border border-red-200'
                            : area.severity === 'warning'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-rink-900">Point {area.pointId}</span>
                          <Badge
                            variant={
                              area.severity === 'critical'
                                ? 'danger'
                                : area.severity === 'warning'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {area.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-rink-600 mt-1">{area.issue}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <Card padding="none">
          <CardHeader title="Detailed Week-to-Week Comparison" />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Week Starting</th>
                    <th>Readings</th>
                    <th>Avg Depth</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Change</th>
                    <th>% Change</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.map((week, i) => {
                    const prevWeek = weeklyData[i - 1];
                    const change = prevWeek ? week.averageDepth - prevWeek.averageDepth : null;
                    const percentChange = prevWeek ? ((change! / prevWeek.averageDepth) * 100) : null;

                    return (
                      <tr key={week.weekStart}>
                        <td className="font-medium">
                          {new Date(week.weekStart).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td>{week.readingsCount}</td>
                        <td className="font-medium">{week.averageDepth.toFixed(2)}"</td>
                        <td>{week.minDepth.toFixed(2)}"</td>
                        <td>{week.maxDepth.toFixed(2)}"</td>
                        <td>
                          {change !== null ? (
                            <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}>
                              {change > 0 ? '+' : ''}{change.toFixed(2)}"
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {percentChange !== null ? (
                            <span className={percentChange > 0 ? 'text-green-600' : percentChange < 0 ? 'text-red-600' : ''}>
                              {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {change !== null ? (
                            change > 0.03 ? (
                              <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                            ) : change < -0.03 ? (
                              <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                            ) : (
                              <span className="text-rink-400">—</span>
                            )
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'spc' && (
        <Card padding="none">
          <CardHeader
            title="Statistical Process Control Chart"
            description="Monitor ice depth variation with control limits"
          />
          <CardContent>
            <SPCChart data={weeklyData} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'heatmap' && (
        <Card padding="none">
          <CardHeader
            title="Ice Depth Heat Map"
            description="Visual representation of ice thickness across the rink"
          />
          <CardContent>
            <HeatmapVisualization />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
