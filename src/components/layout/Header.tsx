'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { signOut, useSession } from 'next-auth/react';
import {
  BellIcon,
  ChevronDownIcon,
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { MobileMenuButton } from './Sidebar';
import { RoleBadge } from '@/components/ui/Badge';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from '@/components/providers/ThemeProvider';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-rink-200 dark:border-rink-700 bg-white dark:bg-rink-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <MobileMenuButton onClick={onMenuClick} />

      {/* Separator */}
      <div className="h-6 w-px bg-rink-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Global Search */}
        <div className="flex flex-1 items-center">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-rink-400 hover:text-rink-500 dark:hover:text-rink-300 relative"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-rink-200 dark:bg-rink-700" aria-hidden="true" />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              {session?.user?.image ? (
                <img
                  className="h-8 w-8 rounded-full bg-rink-50"
                  src={session.user.image}
                  alt=""
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-ice-100 flex items-center justify-center">
                  <span className="text-ice-700 font-medium text-sm">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-4 text-sm font-semibold leading-6 text-rink-900 dark:text-rink-100"
                  aria-hidden="true"
                >
                  {session?.user?.name || 'User'}
                </span>
                <ChevronDownIcon className="ml-2 h-5 w-5 text-rink-400" aria-hidden="true" />
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-xl bg-white dark:bg-rink-800 py-2 shadow-lg ring-1 ring-rink-900/5 dark:ring-rink-700 focus:outline-none">
                <div className="px-4 py-3 border-b border-rink-100 dark:border-rink-700">
                  <p className="text-sm font-medium text-rink-900 dark:text-rink-100">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-rink-500 dark:text-rink-400 truncate">{session?.user?.email}</p>
                  <div className="mt-2">
                    {session?.user?.role && <RoleBadge role={session.user.role} />}
                  </div>
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/dashboard/settings"
                      className={clsx(
                        active ? 'bg-rink-50 dark:bg-rink-700' : '',
                        'flex items-center gap-3 px-4 py-2 text-sm text-rink-700 dark:text-rink-300'
                      )}
                    >
                      <UserCircleIcon className="w-5 h-5 text-rink-400" />
                      Your Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/dashboard/settings"
                      className={clsx(
                        active ? 'bg-rink-50 dark:bg-rink-700' : '',
                        'flex items-center gap-3 px-4 py-2 text-sm text-rink-700 dark:text-rink-300'
                      )}
                    >
                      <CogIcon className="w-5 h-5 text-rink-400" />
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <div className="border-t border-rink-100 dark:border-rink-700 mt-2 pt-2">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className={clsx(
                          active ? 'bg-rink-50 dark:bg-rink-700' : '',
                          'flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 w-full text-left'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}
