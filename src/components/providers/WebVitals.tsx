'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getWebVitalRating, reportWebVitals, reportMetric } from '@/lib/performance';

type Metric = {
  id: string;
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
};

/**
 * Web Vitals monitoring component
 *
 * This component monitors Core Web Vitals and reports them to analytics.
 * Add this to your root layout to enable monitoring.
 */
export function WebVitals() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Report page view with timing info
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      reportMetric({
        name: 'page.duration',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: {
          pathname,
          search: searchParams.toString(),
        },
      });
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    // Only import web-vitals on client side
    import('web-vitals').then(({ onCLS, onFCP, onFID, onINP, onLCP, onTTFB }) => {
      const handleMetric = (metric: Metric) => {
        reportWebVitals({
          id: metric.id,
          name: metric.name,
          value: metric.value,
          rating: getWebVitalRating(metric.name, metric.value),
        });
      };

      onCLS(handleMetric);
      onFCP(handleMetric);
      onFID(handleMetric);
      onINP(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
    }).catch(() => {
      // web-vitals not available
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Perf] web-vitals library not available');
      }
    });
  }, []);

  return null;
}

export default WebVitals;
