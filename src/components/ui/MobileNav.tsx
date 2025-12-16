'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  PlusIcon,
} from '@heroicons/react/24/outline';

// Bottom navigation items
const navItems = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Forms', href: '/dashboard/forms', icon: DocumentTextIcon },
  { name: 'Add', href: '#', icon: PlusIcon, isAction: true },
  { name: 'Incidents', href: '/dashboard/incidents', icon: ExclamationTriangleIcon },
  { name: 'More', href: '#', icon: Bars3Icon, isMenu: true },
];

// Quick action menu items
const quickActions = [
  { name: 'New Ice Reading', href: '/dashboard/ice-resurfacing/new' },
  { name: 'Report Incident', href: '/dashboard/incidents/new' },
  { name: 'Fill Form', href: '/dashboard/forms' },
  { name: 'Log Equipment', href: '/dashboard/equipment/log' },
];

// More menu items
const moreMenuItems = [
  { name: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
  { name: 'Equipment', href: '/dashboard/equipment' },
  { name: 'Reports', href: '/dashboard/reports' },
  { name: 'Activity', href: '/dashboard/activity' },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleItemClick = (item: (typeof navItems)[0]) => {
    if (item.isAction) {
      setShowQuickActions(!showQuickActions);
      setShowMoreMenu(false);
    } else if (item.isMenu) {
      setShowMoreMenu(!showMoreMenu);
      setShowQuickActions(false);
    }
  };

  return (
    <>
      {/* Quick Actions Popup */}
      {showQuickActions && (
        <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-rink-800 rounded-xl shadow-lg border border-rink-200 dark:border-rink-700 p-2 z-50 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                onClick={() => setShowQuickActions(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-rink-50 dark:hover:bg-rink-700 text-rink-700 dark:text-rink-300"
              >
                <PlusIcon className="w-5 h-5 text-ice-500" />
                <span className="text-sm font-medium">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* More Menu Popup */}
      {showMoreMenu && (
        <div className="fixed bottom-20 right-4 w-56 bg-white dark:bg-rink-800 rounded-xl shadow-lg border border-rink-200 dark:border-rink-700 py-2 z-50 lg:hidden">
          {moreMenuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setShowMoreMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-rink-50 dark:hover:bg-rink-700 text-rink-700 dark:text-rink-300"
            >
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-rink-900 border-t border-rink-200 dark:border-rink-700 safe-area-inset lg:hidden z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = !item.isAction && !item.isMenu && pathname === item.href;
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div className="w-14 h-14 bg-ice-500 rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </button>
              );
            }

            if (item.isMenu) {
              return (
                <button
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  className={`flex flex-col items-center justify-center w-16 py-2 ${
                    showMoreMenu
                      ? 'text-ice-600 dark:text-ice-400'
                      : 'text-rink-500 dark:text-rink-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 py-2 ${
                  isActive
                    ? 'text-ice-600 dark:text-ice-400'
                    : 'text-rink-500 dark:text-rink-400'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Backdrop */}
      {(showQuickActions || showMoreMenu) && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => {
            setShowQuickActions(false);
            setShowMoreMenu(false);
          }}
        />
      )}
    </>
  );
}

// Pull to refresh component
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const threshold = 80;
  let startY = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY) * 0.5);
    setPullDistance(Math.min(distance, threshold * 1.5));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 transition-transform"
        style={{
          top: -40,
          transform: `translateX(-50%) translateY(${pullDistance}px)`,
        }}
      >
        <div
          className={`w-8 h-8 rounded-full border-2 border-ice-500 flex items-center justify-center ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            opacity: pullDistance / threshold,
            transform: `rotate(${pullDistance * 2}deg)`,
          }}
        >
          {isRefreshing ? (
            <div className="w-4 h-4 border-2 border-ice-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-4 h-4 text-ice-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Swipeable card for mobile interactions
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { label: string; color: string };
  rightAction?: { label: string; color: string };
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  let startX = 0;
  const swipeThreshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    // Limit swipe distance
    const maxSwipe = 120;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setTranslateX(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (translateX <= -swipeThreshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (translateX >= swipeThreshold && onSwipeRight) {
      onSwipeRight();
    }
    setTranslateX(0);
    setIsSwiping(false);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background actions */}
      {leftAction && (
        <div
          className="absolute inset-y-0 left-0 flex items-center px-4"
          style={{ backgroundColor: leftAction.color }}
        >
          <span className="text-white font-medium">{leftAction.label}</span>
        </div>
      )}
      {rightAction && (
        <div
          className="absolute inset-y-0 right-0 flex items-center px-4"
          style={{ backgroundColor: rightAction.color }}
        >
          <span className="text-white font-medium">{rightAction.label}</span>
        </div>
      )}

      {/* Swipeable content */}
      <div
        className="relative bg-white dark:bg-rink-800"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default MobileBottomNav;
