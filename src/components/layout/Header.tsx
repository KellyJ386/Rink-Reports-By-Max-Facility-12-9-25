'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { signOut, useSession } from 'next-auth/react';
import {
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { MobileMenuButton } from './Sidebar';
import { RoleBadge } from '@/components/ui/Badge';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-rink-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <MobileMenuButton onClick={onMenuClick} />

      {/* Separator */}
      <div className="h-6 w-px bg-rink-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search */}
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-rink-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-rink-900 placeholder:text-rink-400 focus:ring-0 sm:text-sm bg-transparent"
            placeholder="Search forms, incidents, reports..."
            type="search"
            name="search"
          />
        </form>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-rink-400 hover:text-rink-500 relative"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-rink-200" aria-hidden="true" />

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
                  className="ml-4 text-sm font-semibold leading-6 text-rink-900"
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
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-xl bg-white py-2 shadow-lg ring-1 ring-rink-900/5 focus:outline-none">
                <div className="px-4 py-3 border-b border-rink-100">
                  <p className="text-sm font-medium text-rink-900">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-rink-500 truncate">{session?.user?.email}</p>
                  <div className="mt-2">
                    {session?.user?.role && <RoleBadge role={session.user.role} />}
                  </div>
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/profile"
                      className={clsx(
                        active ? 'bg-rink-50' : '',
                        'flex items-center gap-3 px-4 py-2 text-sm text-rink-700'
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
                      href="/settings"
                      className={clsx(
                        active ? 'bg-rink-50' : '',
                        'flex items-center gap-3 px-4 py-2 text-sm text-rink-700'
                      )}
                    >
                      <CogIcon className="w-5 h-5 text-rink-400" />
                      Settings
                    </a>
                  )}
                </Menu.Item>
                <div className="border-t border-rink-100 mt-2 pt-2">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className={clsx(
                          active ? 'bg-rink-50' : '',
                          'flex items-center gap-3 px-4 py-2 text-sm text-red-600 w-full text-left'
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
