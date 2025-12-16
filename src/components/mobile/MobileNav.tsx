'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CalendarIcon as CalendarIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconActive: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: HomeIcon,
    iconActive: HomeIconSolid,
  },
  {
    href: '/dashboard/ice-depth',
    label: 'Ice',
    icon: ChartBarIcon,
    iconActive: ChartBarIconSolid,
  },
  {
    href: '/dashboard/schedule',
    label: 'Schedule',
    icon: CalendarIcon,
    iconActive: CalendarIconSolid,
  },
  {
    href: '/dashboard/forms',
    label: 'Forms',
    icon: DocumentTextIcon,
    iconActive: DocumentTextIconSolid,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Cog6ToothIcon,
    iconActive: Cog6ToothIconSolid,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t dark:border-gray-800 md:hidden safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = active ? item.iconActive : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[64px] ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Quick action buttons for common tasks (floating action button style)
export function MobileQuickActions() {
  const pathname = usePathname();

  // Contextual quick actions based on current page
  const getActions = () => {
    if (pathname.includes('ice-depth')) {
      return [
        { href: '/dashboard/ice-depth/new', label: 'New Reading', icon: ChartBarIcon },
      ];
    }
    if (pathname.includes('incidents')) {
      return [
        { href: '/dashboard/incidents/new', label: 'Report Incident', icon: ExclamationTriangleIcon },
      ];
    }
    if (pathname.includes('air-quality')) {
      return [
        { href: '/dashboard/air-quality/new', label: 'New Reading', icon: BeakerIcon },
      ];
    }
    if (pathname.includes('refrigeration')) {
      return [
        { href: '/dashboard/refrigeration/new', label: 'New Log', icon: CpuChipIcon },
      ];
    }
    // Default dashboard actions
    return [];
  };

  const actions = getActions();

  if (actions.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-30 md:hidden flex flex-col gap-2">
      {actions.map((action, index) => (
        <Link
          key={index}
          href={action.href}
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
        >
          <action.icon className="w-6 h-6" />
        </Link>
      ))}
    </div>
  );
}
