'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Skip to Content Link
 *
 * Allows keyboard users to skip navigation and jump to main content.
 * Becomes visible when focused.
 */
export function SkipLink({
  href = '#main-content',
  className,
  children = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Visually hidden by default
        'sr-only focus:not-sr-only',
        // Visible when focused
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:px-4 focus:py-2',
        'focus:bg-primary-600 focus:text-white',
        'focus:rounded-md focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600',
        'transition-opacity duration-200',
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Skip Link Target - wrap your main content with this
 */
export function SkipLinkTarget({
  id = 'main-content',
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <main id={id} tabIndex={-1} className="outline-none">
      {children}
    </main>
  );
}

export default SkipLink;
