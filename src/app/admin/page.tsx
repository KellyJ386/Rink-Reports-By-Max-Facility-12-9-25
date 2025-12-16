'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAdminStatsLive } from '@/hooks';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const quickActions = [
  { name: 'Add User', href: '/admin/users', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { name: 'Add Facility', href: '/admin/facilities', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { name: 'View Reports', href: '/dashboard/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'System Settings', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
];

export default function AdminDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(30000);

  const { data, isLoading, error, refetch, dataUpdatedAt } = useAdminStatsLive({
    refreshInterval,
    enabled: true,
  });

  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return 'Never';
    return formatDistanceToNow(dataUpdatedAt, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
        <p className="font-medium">Failed to load admin stats</p>
        <p className="text-sm mt-1">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const stats = data?.stats || [];
  const recentActivity = data?.recentActivity || [];
  const systemHealth = data?.systemHealth;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">System overview and quick actions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Updated {formatLastUpdated()}
          </span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          >
            {REFRESH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Refresh now"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-green-600 dark:text-green-400'
                    : stat.changeType === 'negative'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="divide-y dark:divide-gray-700">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No recent activity to display
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activity.outcome === 'SUCCESS' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.user} → {activity.target}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t dark:border-gray-700">
          <Link
            href="/admin/audit"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            View all activity →
          </Link>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h2>
          <div className="space-y-4">
            {systemHealth && Object.entries(systemHealth).map(([key, item]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {key === 'api' ? 'API Services' : key === 'jobs' ? 'Background Jobs' : key === 'email' ? 'Email Service' : key}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.status === 'healthy'
                        ? 'bg-green-500'
                        : item.status === 'degraded'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      item.status === 'healthy'
                        ? 'text-green-600 dark:text-green-400'
                        : item.status === 'degraded'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
          <div className="space-y-4">
            {data?.roleStats && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Super Admins</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.roleStats.SUPER_ADMIN || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Facility Admins</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.roleStats.FACILITY_ADMIN || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Managers</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.roleStats.MANAGER || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ice Technicians</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.roleStats.ICE_TECHNICIAN || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Staff Members</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.roleStats.STAFF || 0}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <Link
              href="/admin/roles"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Manage roles & permissions →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
