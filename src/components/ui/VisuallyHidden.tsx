'use client';

import { cn } from '@/lib/utils';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  focusable?: boolean;
}

/**
 * Visually Hidden Component
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Use for additional context that screen reader users need.
 *
 * @example
 * <button>
 *   <IconTrash />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
  className,
  focusable = false,
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        'sr-only',
        focusable && 'focus:not-sr-only',
        className
      )}
      tabIndex={focusable ? 0 : undefined}
    >
      {children}
    </Component>
  );
}

/**
 * Live Region Component
 *
 * Creates an ARIA live region for dynamic announcements.
 *
 * @example
 * <LiveRegion politeness="assertive">
 *   {errorMessage && `Error: ${errorMessage}`}
 * </LiveRegion>
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  className,
}: {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

/**
 * Loading Announcement Component
 *
 * Announces loading state to screen readers.
 */
export function LoadingAnnouncement({
  isLoading,
  loadingMessage = 'Loading...',
  completedMessage = 'Content loaded',
}: {
  isLoading: boolean;
  loadingMessage?: string;
  completedMessage?: string;
}) {
  return (
    <LiveRegion politeness="polite">
      {isLoading ? loadingMessage : completedMessage}
    </LiveRegion>
  );
}

export default VisuallyHidden;
