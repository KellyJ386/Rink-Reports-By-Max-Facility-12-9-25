'use client';

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode, Suspense } from 'react';

/**
 * Loading skeleton component for lazy-loaded content
 */
interface LoadingSkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
}

export function LoadingSkeleton({
  className = '',
  height = 200,
  width = '100%',
  variant = 'rectangular',
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
      }}
    />
  );
}

/**
 * Card loading skeleton
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800 p-4 space-y-3">
      <LoadingSkeleton height={20} width="60%" variant="text" />
      <LoadingSkeleton height={16} width="80%" variant="text" />
      <LoadingSkeleton height={16} width="40%" variant="text" />
    </div>
  );
}

/**
 * Table loading skeleton
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <LoadingSkeleton height={40} className="rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} height={50} className="rounded-md" />
      ))}
    </div>
  );
}

/**
 * Chart loading skeleton
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
      <LoadingSkeleton height={20} width="30%" variant="text" className="mb-4" />
      <LoadingSkeleton height={height} />
    </div>
  );
}

/**
 * Form loading skeleton
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <LoadingSkeleton height={16} width="20%" variant="text" />
          <LoadingSkeleton height={40} className="rounded-md" />
        </div>
      ))}
      <LoadingSkeleton height={40} width={120} className="rounded-md mt-6" />
    </div>
  );
}

/**
 * Page loading skeleton
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <LoadingSkeleton height={32} width={200} variant="text" />
        <LoadingSkeleton height={40} width={120} className="rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

/**
 * Suspense wrapper with fallback
 */
interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SuspenseWrapper({
  children,
  fallback = <LoadingSkeleton height={200} />,
}: SuspenseWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * Create a lazy-loaded component with custom loading state
 */
export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent?: ReactNode
) {
  return dynamic(importFn, {
    loading: () => <>{loadingComponent || <LoadingSkeleton height={200} />}</>,
    ssr: true,
  });
}

/**
 * Create a lazy-loaded component that only loads on client side
 */
export function createClientOnlyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent?: ReactNode
) {
  return dynamic(importFn, {
    loading: () => <>{loadingComponent || <LoadingSkeleton height={200} />}</>,
    ssr: false,
  });
}

// Lazy-loaded heavy components
export const LazyChart = createClientOnlyComponent(
  () => import('@/components/ui/MonitoringCharts').then((mod) => ({ default: mod.IceDepthChart })),
  <ChartSkeleton />
);

export const LazyCalendar = createClientOnlyComponent(
  () => import('@/components/schedule/CalendarView').then((mod) => ({ default: mod.CalendarView })),
  <ChartSkeleton height={400} />
);

export const LazyBodyDiagram = createClientOnlyComponent(
  () => import('@/components/incidents/BodyDiagram').then((mod) => ({ default: mod.BodyDiagram })),
  <LoadingSkeleton height={400} />
);

export const LazyMarkdownEditor = createClientOnlyComponent(
  () => import('@/components/ui/MarkdownEditor').then((mod) => ({ default: mod.default })),
  <FormSkeleton fields={1} />
);

// Export loading components for use in other lazy loading scenarios
export const LoadingComponents = {
  Card: CardSkeleton,
  Table: TableSkeleton,
  Chart: ChartSkeleton,
  Form: FormSkeleton,
  Page: PageSkeleton,
  Skeleton: LoadingSkeleton,
};
