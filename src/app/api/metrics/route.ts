// Prometheus Metrics Endpoint
// Exposes application metrics for monitoring

import { NextResponse } from 'next/server';

// Simple in-memory metrics storage (in production, use prom-client library)
const metrics = {
  httpRequestsTotal: new Map<string, number>(),
  httpRequestDuration: new Map<string, number[]>(),
  businessMetrics: {
    activeFacilities: 0,
    activeUsers: 0,
    bookingsCreated: new Map<string, number>(),
    revenueTotal: 0,
    iceQualityScore: new Map<string, number>(),
    iceTemperature: new Map<string, number>(),
    maintenanceTasksPending: 0,
    equipmentByStatus: new Map<string, number>(),
  },
  cacheMetrics: {
    hits: 0,
    misses: 0,
  },
};

// Metric helpers
export function incrementHttpRequests(method: string, status: number, handler: string) {
  const key = `${method}:${status}:${handler}`;
  metrics.httpRequestsTotal.set(key, (metrics.httpRequestsTotal.get(key) || 0) + 1);
}

export function recordHttpDuration(method: string, handler: string, durationMs: number) {
  const key = `${method}:${handler}`;
  const existing = metrics.httpRequestDuration.get(key) || [];
  existing.push(durationMs / 1000); // Convert to seconds
  // Keep only last 1000 samples
  if (existing.length > 1000) existing.shift();
  metrics.httpRequestDuration.set(key, existing);
}

export function updateBusinessMetrics(data: Partial<typeof metrics.businessMetrics>) {
  Object.assign(metrics.businessMetrics, data);
}

export function incrementCacheHit() {
  metrics.cacheMetrics.hits++;
}

export function incrementCacheMiss() {
  metrics.cacheMetrics.misses++;
}

// Calculate histogram buckets
function calculateHistogram(values: number[]): Map<number, number> {
  const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  const result = new Map<number, number>();

  buckets.forEach(bucket => {
    result.set(bucket, values.filter(v => v <= bucket).length);
  });
  result.set(Infinity, values.length); // +Inf bucket

  return result;
}

// Format metrics in Prometheus exposition format
function formatMetrics(): string {
  const lines: string[] = [];

  // HTTP Requests Total
  lines.push('# HELP http_requests_total Total number of HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  metrics.httpRequestsTotal.forEach((count, key) => {
    const [method, status, handler] = key.split(':');
    lines.push(`http_requests_total{method="${method}",status="${status}",handler="${handler}",job="mfo-web"} ${count}`);
  });

  // HTTP Request Duration
  lines.push('');
  lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds');
  lines.push('# TYPE http_request_duration_seconds histogram');
  metrics.httpRequestDuration.forEach((values, key) => {
    const [method, handler] = key.split(':');
    const histogram = calculateHistogram(values);
    histogram.forEach((count, bucket) => {
      const bucketLabel = bucket === Infinity ? '+Inf' : bucket.toString();
      lines.push(`http_request_duration_seconds_bucket{method="${method}",handler="${handler}",job="mfo-web",le="${bucketLabel}"} ${count}`);
    });
    lines.push(`http_request_duration_seconds_sum{method="${method}",handler="${handler}",job="mfo-web"} ${values.reduce((a, b) => a + b, 0)}`);
    lines.push(`http_request_duration_seconds_count{method="${method}",handler="${handler}",job="mfo-web"} ${values.length}`);
  });

  // Business Metrics
  lines.push('');
  lines.push('# HELP mfo_active_facilities_total Number of active facilities');
  lines.push('# TYPE mfo_active_facilities_total gauge');
  lines.push(`mfo_active_facilities_total ${metrics.businessMetrics.activeFacilities}`);

  lines.push('');
  lines.push('# HELP mfo_active_users_total Number of active users');
  lines.push('# TYPE mfo_active_users_total gauge');
  lines.push(`mfo_active_users_total ${metrics.businessMetrics.activeUsers}`);

  lines.push('');
  lines.push('# HELP mfo_bookings_created_total Total bookings created');
  lines.push('# TYPE mfo_bookings_created_total counter');
  metrics.businessMetrics.bookingsCreated.forEach((count, type) => {
    lines.push(`mfo_bookings_created_total{type="${type}"} ${count}`);
  });

  lines.push('');
  lines.push('# HELP mfo_revenue_total Total revenue processed in USD');
  lines.push('# TYPE mfo_revenue_total counter');
  lines.push(`mfo_revenue_total ${metrics.businessMetrics.revenueTotal}`);

  lines.push('');
  lines.push('# HELP mfo_ice_quality_score Ice quality score by facility');
  lines.push('# TYPE mfo_ice_quality_score gauge');
  metrics.businessMetrics.iceQualityScore.forEach((score, facility) => {
    lines.push(`mfo_ice_quality_score{facility="${facility}"} ${score}`);
  });

  lines.push('');
  lines.push('# HELP mfo_ice_temperature_celsius Ice temperature in Celsius');
  lines.push('# TYPE mfo_ice_temperature_celsius gauge');
  metrics.businessMetrics.iceTemperature.forEach((temp, facility) => {
    lines.push(`mfo_ice_temperature_celsius{facility="${facility}"} ${temp}`);
  });

  lines.push('');
  lines.push('# HELP mfo_maintenance_tasks_pending Number of pending maintenance tasks');
  lines.push('# TYPE mfo_maintenance_tasks_pending gauge');
  lines.push(`mfo_maintenance_tasks_pending ${metrics.businessMetrics.maintenanceTasksPending}`);

  lines.push('');
  lines.push('# HELP mfo_equipment_by_status Equipment count by status');
  lines.push('# TYPE mfo_equipment_by_status gauge');
  metrics.businessMetrics.equipmentByStatus.forEach((count, status) => {
    lines.push(`mfo_equipment_by_status{status="${status}"} ${count}`);
  });

  // Cache Metrics
  lines.push('');
  lines.push('# HELP cache_hits_total Total cache hits');
  lines.push('# TYPE cache_hits_total counter');
  lines.push(`cache_hits_total ${metrics.cacheMetrics.hits}`);

  lines.push('');
  lines.push('# HELP cache_misses_total Total cache misses');
  lines.push('# TYPE cache_misses_total counter');
  lines.push(`cache_misses_total ${metrics.cacheMetrics.misses}`);

  // Node.js Runtime Metrics
  lines.push('');
  lines.push('# HELP nodejs_heap_size_total_bytes Total heap size in bytes');
  lines.push('# TYPE nodejs_heap_size_total_bytes gauge');
  const memoryUsage = process.memoryUsage();
  lines.push(`nodejs_heap_size_total_bytes ${memoryUsage.heapTotal}`);

  lines.push('');
  lines.push('# HELP nodejs_heap_size_used_bytes Used heap size in bytes');
  lines.push('# TYPE nodejs_heap_size_used_bytes gauge');
  lines.push(`nodejs_heap_size_used_bytes ${memoryUsage.heapUsed}`);

  lines.push('');
  lines.push('# HELP nodejs_external_memory_bytes External memory in bytes');
  lines.push('# TYPE nodejs_external_memory_bytes gauge');
  lines.push(`nodejs_external_memory_bytes ${memoryUsage.external}`);

  lines.push('');
  lines.push('# HELP process_uptime_seconds Process uptime in seconds');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${process.uptime()}`);

  return lines.join('\n');
}

export async function GET() {
  // In production, fetch real metrics from database/cache
  // For now, generate sample data

  // Sample business metrics update (in real app, this would be fetched from DB)
  metrics.businessMetrics.activeFacilities = 12;
  metrics.businessMetrics.activeUsers = 1847;
  metrics.businessMetrics.maintenanceTasksPending = 8;

  // Sample bookings
  if (metrics.businessMetrics.bookingsCreated.size === 0) {
    metrics.businessMetrics.bookingsCreated.set('public_skate', 450);
    metrics.businessMetrics.bookingsCreated.set('hockey', 285);
    metrics.businessMetrics.bookingsCreated.set('figure_skating', 142);
    metrics.businessMetrics.bookingsCreated.set('private', 67);
  }

  // Sample ice quality scores
  if (metrics.businessMetrics.iceQualityScore.size === 0) {
    metrics.businessMetrics.iceQualityScore.set('facility_main', 94.5);
    metrics.businessMetrics.iceQualityScore.set('facility_north', 92.1);
    metrics.businessMetrics.iceQualityScore.set('facility_south', 96.8);
  }

  // Sample ice temperatures
  if (metrics.businessMetrics.iceTemperature.size === 0) {
    metrics.businessMetrics.iceTemperature.set('facility_main', -4.2);
    metrics.businessMetrics.iceTemperature.set('facility_north', -3.8);
    metrics.businessMetrics.iceTemperature.set('facility_south', -4.5);
  }

  // Sample equipment status
  if (metrics.businessMetrics.equipmentByStatus.size === 0) {
    metrics.businessMetrics.equipmentByStatus.set('operational', 45);
    metrics.businessMetrics.equipmentByStatus.set('needs_maintenance', 5);
    metrics.businessMetrics.equipmentByStatus.set('out_of_service', 2);
  }

  metrics.businessMetrics.revenueTotal = 125847.50;

  const body = formatMetrics();

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
