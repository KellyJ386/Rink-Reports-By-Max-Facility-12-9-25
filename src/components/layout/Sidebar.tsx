'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CogIcon,
  ChartBarIcon,
  BeakerIcon,
  CloudIcon,
  CheckCircleIcon,
  XMarkIcon,
  Bars3Icon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { canAccessFormBuilder } from '@/types';
import { UserRole } from '@prisma/client';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

const mainNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Ice Depth', href: '/dashboard/ice-depth', icon: ChartBarIcon },
  { name: 'Ice Operations', href: '/dashboard/ice-ops', icon: WrenchScrewdriverIcon },
  { name: 'Incidents', href: '/dashboard/incidents', icon: ExclamationTriangleIcon },
  { name: 'Refrigeration', href: '/dashboard/refrigeration', icon: BeakerIcon },
  { name: 'Air Quality', href: '/dashboard/air-quality', icon: CloudIcon },
  { name: 'Scheduling', href: '/dashboard/scheduling', icon: CalendarDaysIcon },
  { name: 'Checklists', href: '/dashboard/checklists', icon: CheckCircleIcon },
];

const adminNavigation: NavigationItem[] = [
  { name: 'Form Builder', href: '/admin/forms', icon: DocumentTextIcon },
  { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
  { name: 'Facilities', href: '/admin/facilities', icon: ClipboardDocumentListIcon },
  { name: 'Settings', href: '/admin/settings', icon: CogIcon },
];

function NavItem({ item, isActive }: { item: NavigationItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={clsx(
        'nav-item',
        isActive && 'active'
      )}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || 'STAFF';
  const showAdmin = canAccessFormBuilder(userRole);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-rink-200">
        <div className="w-10 h-10 bg-gradient-to-br from-ice-500 to-ice-700 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <div>
          <h1 className="font-bold text-rink-900">Max Facility</h1>
          <p className="text-xs text-rink-500">Operations</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {mainNavigation.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            />
          ))}
        </div>

        {showAdmin && (
          <>
            <div className="mt-8 mb-3 px-4">
              <p className="text-xs font-semibold text-rink-400 uppercase tracking-wider">
                Administration
              </p>
            </div>
            <div className="space-y-1">
              {adminNavigation.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User info */}
      {session?.user && (
        <div className="p-4 border-t border-rink-200">
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-9 h-9 rounded-full"
              />
            ) : (
              <div className="w-9 h-9 bg-ice-100 rounded-full flex items-center justify-center">
                <span className="text-ice-700 font-medium text-sm">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-rink-900 truncate">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-rink-500 truncate">{session.user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-rink-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                {sidebarContent}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col border-r border-rink-200 bg-white">
          {sidebarContent}
        </div>
      </div>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-rink-700"
      onClick={onClick}
    >
      <span className="sr-only">Open sidebar</span>
      <Bars3Icon className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
