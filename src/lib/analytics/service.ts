// Analytics Service

import type {
  KPI,
  TimeSeriesData,
  ChartData,
  FacilityMetrics,
  TrendAnalysis,
  Benchmark,
  AnalyticsFilter,
  TimeGranularity,
} from './types';

// Get KPI data
export async function getKPIs(filter?: AnalyticsFilter): Promise<KPI[]> {
  // Mock KPI data - would query database in production
  return [
    {
      id: 'ice-quality',
      name: 'Ice Quality Score',
      value: 94.2,
      previousValue: 91.8,
      change: 2.4,
      changePercent: 2.6,
      trend: 'up',
      unit: '%',
      format: 'percentage',
      target: 95,
      status: 'good',
    },
    {
      id: 'incident-rate',
      name: 'Incident Rate',
      value: 2.3,
      previousValue: 3.1,
      change: -0.8,
      changePercent: -25.8,
      trend: 'down',
      unit: 'per 1000 visitors',
      format: 'number',
      target: 2.0,
      status: 'warning',
    },
    {
      id: 'maintenance-compliance',
      name: 'Maintenance Compliance',
      value: 98.5,
      previousValue: 96.2,
      change: 2.3,
      changePercent: 2.4,
      trend: 'up',
      unit: '%',
      format: 'percentage',
      target: 99,
      status: 'good',
    },
    {
      id: 'staff-utilization',
      name: 'Staff Utilization',
      value: 87.3,
      previousValue: 85.1,
      change: 2.2,
      changePercent: 2.6,
      trend: 'up',
      unit: '%',
      format: 'percentage',
      target: 90,
      status: 'good',
    },
    {
      id: 'avg-ice-depth',
      name: 'Average Ice Depth',
      value: 1.12,
      previousValue: 1.08,
      change: 0.04,
      changePercent: 3.7,
      trend: 'up',
      unit: 'inches',
      format: 'number',
      target: 1.1,
      status: 'good',
    },
    {
      id: 'energy-usage',
      name: 'Energy Efficiency',
      value: 82.5,
      previousValue: 79.8,
      change: 2.7,
      changePercent: 3.4,
      trend: 'up',
      unit: '%',
      format: 'percentage',
      status: 'good',
    },
  ];
}

// Get time series data for a metric
export async function getTimeSeriesData(
  metric: string,
  filter?: AnalyticsFilter
): Promise<TimeSeriesData[]> {
  const granularity = filter?.granularity || 'day';
  const points = granularity === 'hour' ? 24 : granularity === 'day' ? 30 : 12;

  const data: TimeSeriesData[] = [];
  const now = new Date();

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);

    switch (granularity) {
      case 'hour':
        date.setHours(date.getHours() - i);
        break;
      case 'day':
        date.setDate(date.getDate() - i);
        break;
      case 'week':
        date.setDate(date.getDate() - i * 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - i);
        break;
    }

    // Generate mock data with some variance
    let baseValue = 90;
    switch (metric) {
      case 'ice-quality':
        baseValue = 92 + Math.random() * 6;
        break;
      case 'incidents':
        baseValue = Math.floor(Math.random() * 5);
        break;
      case 'ice-depth':
        baseValue = 1.0 + Math.random() * 0.3;
        break;
      case 'visitors':
        baseValue = 500 + Math.floor(Math.random() * 300);
        break;
    }

    data.push({
      timestamp: date,
      value: Number(baseValue.toFixed(2)),
    });
  }

  return data;
}

// Get chart data for dashboard widgets
export async function getChartData(
  metrics: string[],
  chartType: string,
  filter?: AnalyticsFilter
): Promise<ChartData> {
  const timeSeriesData = await Promise.all(
    metrics.map((metric) => getTimeSeriesData(metric, filter))
  );

  const labels = timeSeriesData[0]?.map((d) =>
    d.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  ) || [];

  const colors = [
    '#0ea5e9', // primary
    '#22c55e', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
  ];

  return {
    labels,
    datasets: metrics.map((metric, index) => ({
      label: metric.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      data: timeSeriesData[index]?.map((d) => d.value) || [],
      borderColor: colors[index % colors.length],
      backgroundColor:
        chartType === 'line' || chartType === 'area'
          ? `${colors[index % colors.length]}20`
          : colors,
      fill: chartType === 'area',
    })),
  };
}

// Get facility comparison metrics
export async function getFacilityMetrics(
  facilityIds?: string[]
): Promise<FacilityMetrics[]> {
  // Mock data for multiple facilities
  const facilities = [
    { id: 'fac-1', name: 'Central Ice Arena' },
    { id: 'fac-2', name: 'North Valley Rink' },
    { id: 'fac-3', name: 'South Shore Ice Center' },
  ];

  return facilities
    .filter((f) => !facilityIds || facilityIds.includes(f.id))
    .map((facility) => ({
      facilityId: facility.id,
      facilityName: facility.name,
      iceQualityScore: 85 + Math.random() * 15,
      incidentRate: 1 + Math.random() * 3,
      maintenanceCompliance: 90 + Math.random() * 10,
      staffUtilization: 75 + Math.random() * 20,
      customerSatisfaction: 80 + Math.random() * 15,
      energyEfficiency: 70 + Math.random() * 25,
    }));
}

// Get trend analysis
export async function getTrendAnalysis(
  metrics: string[],
  filter?: AnalyticsFilter
): Promise<TrendAnalysis[]> {
  return metrics.map((metric) => {
    const currentPeriod = 85 + Math.random() * 15;
    const previousPeriod = 80 + Math.random() * 15;
    const change = currentPeriod - previousPeriod;
    const changePercent = (change / previousPeriod) * 100;

    return {
      metric,
      currentPeriod: Number(currentPeriod.toFixed(2)),
      previousPeriod: Number(previousPeriod.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(1)),
      trend: change > 1 ? 'improving' : change < -1 ? 'declining' : 'stable',
      forecast: [
        currentPeriod + Math.random() * 2,
        currentPeriod + Math.random() * 3,
        currentPeriod + Math.random() * 4,
      ].map((v) => Number(v.toFixed(2))),
    };
  });
}

// Get benchmarks
export async function getBenchmarks(
  facilityId: string,
  metrics: string[]
): Promise<Benchmark[]> {
  return metrics.map((metric) => {
    const facilityValue = 75 + Math.random() * 20;
    const industryAverage = 70 + Math.random() * 15;
    const topPerformer = 90 + Math.random() * 10;

    return {
      metric,
      facilityValue: Number(facilityValue.toFixed(1)),
      industryAverage: Number(industryAverage.toFixed(1)),
      topPerformer: Number(topPerformer.toFixed(1)),
      percentile: Math.floor(
        ((facilityValue - 50) / (topPerformer - 50)) * 100
      ),
    };
  });
}

// Get incident analytics
export async function getIncidentAnalytics(filter?: AnalyticsFilter): Promise<{
  byType: { type: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byLocation: { location: string; count: number }[];
  resolutionTime: { average: number; median: number; min: number; max: number };
}> {
  return {
    byType: [
      { type: 'Slip & Fall', count: 23 },
      { type: 'Equipment', count: 18 },
      { type: 'Ice Quality', count: 12 },
      { type: 'Collision', count: 8 },
      { type: 'Other', count: 6 },
    ],
    bySeverity: [
      { severity: 'Minor', count: 35 },
      { severity: 'Moderate', count: 22 },
      { severity: 'Serious', count: 8 },
      { severity: 'Critical', count: 2 },
    ],
    byLocation: [
      { location: 'Rink A', count: 28 },
      { location: 'Rink B', count: 22 },
      { location: 'Lobby', count: 10 },
      { location: 'Locker Room', count: 7 },
    ],
    resolutionTime: {
      average: 2.3,
      median: 1.8,
      min: 0.5,
      max: 8.2,
    },
  };
}

// Export analytics data
export async function exportAnalytics(
  format: 'csv' | 'json' | 'pdf',
  filter?: AnalyticsFilter
): Promise<Blob> {
  const kpis = await getKPIs(filter);

  if (format === 'json') {
    return new Blob([JSON.stringify(kpis, null, 2)], {
      type: 'application/json',
    });
  }

  if (format === 'csv') {
    const headers = Object.keys(kpis[0]).join(',');
    const rows = kpis.map((kpi) => Object.values(kpi).join(','));
    return new Blob([headers + '\n' + rows.join('\n')], {
      type: 'text/csv',
    });
  }

  // PDF would require a PDF library
  return new Blob(['PDF export not implemented'], { type: 'application/pdf' });
}
