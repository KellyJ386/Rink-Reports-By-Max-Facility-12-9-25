// Analytics Types and Interfaces

export type MetricType =
  | 'count'
  | 'average'
  | 'sum'
  | 'min'
  | 'max'
  | 'percentage'
  | 'rate';

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'radar' | 'gauge';

export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  target?: number;
  status?: 'good' | 'warning' | 'critical';
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  type: MetricType;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  calculation?: string;
  dataSource: string;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'list' | 'map';
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
}

export interface WidgetConfig {
  metric?: string;
  metrics?: string[];
  chartType?: ChartType;
  timeRange?: string;
  granularity?: TimeGranularity;
  filters?: Record<string, unknown>;
  comparison?: 'previous_period' | 'previous_year' | 'target';
  limit?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
  isShared?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsFilter {
  facilityId?: string;
  rinkId?: string;
  startDate?: Date;
  endDate?: Date;
  granularity?: TimeGranularity;
}

export interface FacilityMetrics {
  facilityId: string;
  facilityName: string;
  iceQualityScore: number;
  incidentRate: number;
  maintenanceCompliance: number;
  staffUtilization: number;
  customerSatisfaction?: number;
  energyEfficiency?: number;
}

export interface TrendAnalysis {
  metric: string;
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'declining' | 'stable';
  forecast?: number[];
}

export interface Benchmark {
  metric: string;
  facilityValue: number;
  industryAverage: number;
  topPerformer: number;
  percentile: number;
}
