'use client';

/**
 * Performance Monitoring Utilities
 *
 * This module provides utilities for measuring and tracking performance metrics
 * in the MFO application.
 */

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Thresholds for Core Web Vitals
const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get rating for a Web Vital metric
 */
export function getWebVitalRating(
  name: keyof typeof WEB_VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = WEB_VITALS_THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Performance mark for measuring durations
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    try {
      performance.mark(name);
    } catch {
      // Ignore errors in non-browser environments
    }
  }
}

/**
 * Measure duration between two marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark?: string
): PerformanceMeasure | null {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      if (endMark) {
        return performance.measure(name, startMark, endMark);
      }
      // If no endMark, measure from startMark to now
      mark(`${name}-end`);
      return performance.measure(name, startMark, `${name}-end`);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear performance marks and measures
 */
export function clearMarks(name?: string): void {
  if (typeof performance !== 'undefined') {
    try {
      if (name) {
        performance.clearMarks(name);
        performance.clearMeasures(name);
      } else {
        performance.clearMarks();
        performance.clearMeasures();
      }
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Time a function execution
 */
export async function timeExecution<T>(
  name: string,
  fn: () => T | Promise<T>,
  callback?: (duration: number) => void
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    return result;
  } finally {
    const duration = performance.now() - start;
    if (callback) {
      callback(duration);
    }
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Create a performance timer that can be stopped
 */
export function createTimer(name: string) {
  const start = performance.now();

  return {
    stop: (logToConsole = false): number => {
      const duration = performance.now() - start;
      if (logToConsole && process.env.NODE_ENV === 'development') {
        console.debug(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
      }
      return duration;
    },
  };
}

/**
 * Debounce function with performance tracking
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number,
  trackCalls = false
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let callCount = 0;

  return (...args: Parameters<T>) => {
    if (trackCalls) {
      callCount++;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      if (trackCalls && process.env.NODE_ENV === 'development') {
        console.debug(`[Perf] Debounced ${fn.name}: ${callCount} calls coalesced`);
        callCount = 0;
      }
    }, delay);
  };
}

/**
 * Throttle function with performance tracking
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  limit: number,
  trackCalls = false
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let skippedCalls = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      if (trackCalls && skippedCalls > 0 && process.env.NODE_ENV === 'development') {
        console.debug(`[Perf] Throttled ${fn.name}: ${skippedCalls} calls skipped`);
        skippedCalls = 0;
      }
      fn(...args);
    } else if (trackCalls) {
      skippedCalls++;
    }
  };
}

/**
 * Memory usage snapshot (if available)
 */
export function getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number } | null {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
      };
    }
  }
  return null;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Navigation timing metrics
 */
export function getNavigationTiming(): Record<string, number> | null {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigation) {
      return {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domParsing: navigation.domInteractive - navigation.responseEnd,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.startTime,
      };
    }
  }
  return null;
}

/**
 * Resource timing metrics
 */
export function getResourceTimings(
  filter?: (entry: PerformanceResourceTiming) => boolean
): PerformanceResourceTiming[] {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    if (filter) {
      return resources.filter(filter);
    }
    return resources;
  }
  return [];
}

/**
 * Get slow resources (over threshold)
 */
export function getSlowResources(thresholdMs = 500): PerformanceResourceTiming[] {
  return getResourceTimings((entry) => entry.duration > thresholdMs);
}

/**
 * Performance observer for long tasks
 */
export function observeLongTasks(
  callback: (entries: PerformanceEntry[]) => void,
  threshold = 50
): (() => void) | null {
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const observer = new PerformanceObserver((list) => {
        const longTasks = list.getEntries().filter((entry) => entry.duration > threshold);
        if (longTasks.length > 0) {
          callback(longTasks);
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      return () => observer.disconnect();
    } catch {
      // Long task observation not supported
      return null;
    }
  }
  return null;
}

/**
 * Report performance metrics to analytics
 * In production, this would send to a monitoring service
 */
export function reportMetric(metric: PerformanceMetric): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Perf Metric]', metric);
  }

  // In production, send to monitoring service:
  // Example: sendToAnalytics(metric);
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: WebVitalsMetric): void {
  if (process.env.NODE_ENV === 'development') {
    const color = metric.rating === 'good' ? '\x1b[32m' : metric.rating === 'poor' ? '\x1b[31m' : '\x1b[33m';
    console.debug(`${color}[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})\x1b[0m`);
  }

  // In production, send to monitoring service:
  // Example: sendToAnalytics({ type: 'web-vital', ...metric });
}
