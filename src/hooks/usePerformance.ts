'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  mark,
  measure,
  createTimer,
  getNavigationTiming,
  reportMetric,
  observeLongTasks,
} from '@/lib/performance';

/**
 * Hook for tracking component render performance
 *
 * @example
 * function MyComponent() {
 *   useRenderTracking('MyComponent');
 *   return <div>...</div>;
 * }
 */
export function useRenderTracking(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current++;

    if (renderCount.current === 1) {
      // First render (mount)
      mountTime.current = performance.now();
      mark(`${componentName}-mount-start`);
    }

    return () => {
      if (renderCount.current === 1 && process.env.NODE_ENV === 'development') {
        const duration = performance.now() - mountTime.current;
        console.debug(`[Perf] ${componentName} mounted in ${duration.toFixed(2)}ms`);
      }
    };
  });

  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development' && renderCount.current > 1) {
        console.debug(`[Perf] ${componentName} rendered ${renderCount.current} times`);
      }
    };
  }, [componentName]);
}

/**
 * Hook for tracking component mount/unmount lifecycle
 *
 * @example
 * function MyComponent() {
 *   const { mountDuration } = useComponentLifecycle('MyComponent');
 *   return <div>Mounted in {mountDuration}ms</div>;
 * }
 */
export function useComponentLifecycle(componentName: string) {
  const mountStart = useRef<number>(performance.now());
  const mountDuration = useRef<number>(0);

  useEffect(() => {
    mountDuration.current = performance.now() - mountStart.current;

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Perf] ${componentName} mounted in ${mountDuration.current.toFixed(2)}ms`);
    }

    reportMetric({
      name: `component.mount.${componentName}`,
      value: mountDuration.current,
      unit: 'ms',
      timestamp: Date.now(),
    });

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Perf] ${componentName} unmounted`);
      }
    };
  }, [componentName]);

  return { mountDuration: mountDuration.current };
}

/**
 * Hook for tracking async operation performance
 *
 * @example
 * function MyComponent() {
 *   const { trackAsync } = useAsyncTracking('MyComponent');
 *
 *   const fetchData = async () => {
 *     await trackAsync('fetchData', async () => {
 *       const response = await fetch('/api/data');
 *       return response.json();
 *     });
 *   };
 * }
 */
export function useAsyncTracking(namespace: string) {
  const trackAsync = useCallback(
    async <T>(operationName: string, fn: () => Promise<T>): Promise<T> => {
      const timer = createTimer(`${namespace}.${operationName}`);

      try {
        const result = await fn();
        const duration = timer.stop(process.env.NODE_ENV === 'development');

        reportMetric({
          name: `async.${namespace}.${operationName}`,
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
          tags: { status: 'success' },
        });

        return result;
      } catch (error) {
        const duration = timer.stop(false);

        reportMetric({
          name: `async.${namespace}.${operationName}`,
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
          tags: { status: 'error' },
        });

        throw error;
      }
    },
    [namespace]
  );

  return { trackAsync };
}

/**
 * Hook for monitoring long tasks in a component
 *
 * @example
 * function MyComponent() {
 *   useTaskMonitor('MyComponent', (tasks) => {
 *     console.warn('Long tasks detected:', tasks);
 *   });
 * }
 */
export function useTaskMonitor(
  componentName: string,
  onLongTask?: (tasks: PerformanceEntry[]) => void,
  threshold = 50
) {
  useEffect(() => {
    const callback = (tasks: PerformanceEntry[]) => {
      if (process.env.NODE_ENV === 'development') {
        tasks.forEach((task) => {
          console.warn(`[Perf] Long task in ${componentName}: ${task.duration.toFixed(2)}ms`);
        });
      }

      onLongTask?.(tasks);
    };

    const disconnect = observeLongTasks(callback, threshold);

    return () => {
      disconnect?.();
    };
  }, [componentName, onLongTask, threshold]);
}

/**
 * Hook for tracking page navigation timing
 *
 * @example
 * function App() {
 *   const timing = useNavigationTiming();
 *
 *   useEffect(() => {
 *     if (timing) {
 *       console.log('Page load time:', timing.total);
 *     }
 *   }, [timing]);
 * }
 */
export function useNavigationTiming() {
  const timingRef = useRef<Record<string, number> | null>(null);

  useEffect(() => {
    // Wait for load event to complete
    const handleLoad = () => {
      // Give a small delay to ensure all timing data is available
      setTimeout(() => {
        timingRef.current = getNavigationTiming();

        if (timingRef.current && process.env.NODE_ENV === 'development') {
          console.debug('[Perf] Navigation Timing:', timingRef.current);
        }
      }, 0);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return timingRef.current;
}

/**
 * Hook for marking performance milestones
 *
 * @example
 * function MyComponent() {
 *   const { markStart, markEnd, getMeasure } = usePerformanceMarks('MyComponent');
 *
 *   useEffect(() => {
 *     markStart('dataLoad');
 *     fetchData().then(() => {
 *       const duration = markEnd('dataLoad');
 *       console.log('Data loaded in', duration, 'ms');
 *     });
 *   }, []);
 * }
 */
export function usePerformanceMarks(namespace: string) {
  const markStart = useCallback(
    (name: string) => {
      mark(`${namespace}-${name}-start`);
    },
    [namespace]
  );

  const markEnd = useCallback(
    (name: string): number | null => {
      mark(`${namespace}-${name}-end`);
      const measurement = measure(
        `${namespace}-${name}`,
        `${namespace}-${name}-start`,
        `${namespace}-${name}-end`
      );
      return measurement?.duration ?? null;
    },
    [namespace]
  );

  const getMeasure = useCallback(
    (name: string): number | null => {
      const entries = performance.getEntriesByName(`${namespace}-${name}`);
      return entries.length > 0 ? entries[entries.length - 1].duration : null;
    },
    [namespace]
  );

  return { markStart, markEnd, getMeasure };
}

export default useRenderTracking;
