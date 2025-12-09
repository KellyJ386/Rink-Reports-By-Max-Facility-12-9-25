'use client';

import { type ReactNode } from 'react';
import clsx from 'clsx';

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'neutral', size = 'md', dot = false, className }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    info: 'bg-ice-100 text-ice-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-rink-100 text-rink-800',
  };

  const dotColors: Record<BadgeVariant, string> = {
    info: 'bg-ice-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    neutral: 'bg-rink-500',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

// Status-specific badges for common use cases
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    DRAFT: { variant: 'neutral', label: 'Draft' },
    SUBMITTED: { variant: 'info', label: 'Submitted' },
    UNDER_REVIEW: { variant: 'warning', label: 'Under Review' },
    APPROVED: { variant: 'success', label: 'Approved' },
    REJECTED: { variant: 'danger', label: 'Rejected' },
    ARCHIVED: { variant: 'neutral', label: 'Archived' },
    OPEN: { variant: 'warning', label: 'Open' },
    RESOLVED: { variant: 'success', label: 'Resolved' },
    CLOSED: { variant: 'neutral', label: 'Closed' },
    PENDING: { variant: 'warning', label: 'Pending' },
    ACTIVE: { variant: 'success', label: 'Active' },
    INACTIVE: { variant: 'neutral', label: 'Inactive' },
  };

  const config = statusMap[status] || { variant: 'neutral' as BadgeVariant, label: status };

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

// Severity badges for incidents
export function SeverityBadge({ severity }: { severity: string }) {
  const severityMap: Record<string, { variant: BadgeVariant; label: string }> = {
    MINOR: { variant: 'info', label: 'Minor' },
    MODERATE: { variant: 'warning', label: 'Moderate' },
    SERIOUS: { variant: 'danger', label: 'Serious' },
    CRITICAL: { variant: 'danger', label: 'Critical' },
  };

  const config = severityMap[severity] || { variant: 'neutral' as BadgeVariant, label: severity };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Role badges
export function RoleBadge({ role }: { role: string }) {
  const roleMap: Record<string, { variant: BadgeVariant; label: string }> = {
    SUPER_ADMIN: { variant: 'danger', label: 'Super Admin' },
    FACILITY_ADMIN: { variant: 'warning', label: 'Facility Admin' },
    MANAGER: { variant: 'info', label: 'Manager' },
    SUPERVISOR: { variant: 'info', label: 'Supervisor' },
    ICE_TECHNICIAN: { variant: 'success', label: 'Ice Tech' },
    STAFF: { variant: 'neutral', label: 'Staff' },
  };

  const config = roleMap[role] || { variant: 'neutral' as BadgeVariant, label: role };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
