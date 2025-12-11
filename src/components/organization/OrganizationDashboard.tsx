'use client';

import {
  BuildingOffice2Icon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  useOrganizationDashboard,
  getFacilityHealthScore,
  getHealthStatusColor,
  formatLargeNumber,
} from '@/hooks/useOrganization';
import { FacilityHealthCard } from './FacilityHealthCard';

interface OrganizationDashboardProps {
  organizationId?: string;
}

export function OrganizationDashboard({ organizationId }: OrganizationDashboardProps) {
  const { data, isLoading, error } = useOrganizationDashboard(organizationId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load organization dashboard. Please try again.
      </div>
    );
  }

  const { summary, facilityStats } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Facilities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BuildingOffice2Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Facilities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.facilities.active}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  / {summary.facilities.total}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatLargeNumber(summary.users.active)}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  / {formatLargeNumber(summary.users.total)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Open Incidents */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              summary.incidents.open > 0
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <ExclamationTriangleIcon className={`w-6 h-6 ${
                summary.incidents.open > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Open Incidents</p>
              <p className={`text-2xl font-bold ${
                summary.incidents.open > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {summary.incidents.open}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {summary.incidents.thisMonth} this month
          </p>
        </div>

        {/* Unacknowledged Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              summary.alerts.unacknowledged > 0
                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <BellAlertIcon className={`w-6 h-6 ${
                summary.alerts.unacknowledged > 0
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Alerts</p>
              <p className={`text-2xl font-bold ${
                summary.alerts.unacknowledged > 0
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {summary.alerts.unacknowledged}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {summary.alerts.thisWeek} this week
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Forms</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {summary.forms.pending} pending
          </p>
          <p className="text-xs text-gray-400">{summary.forms.thisMonth} this month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-cyan-500" />
            <span className="text-sm text-gray-500">Ice Depth</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {summary.iceDepth.readingsToday} today
          </p>
          <p className="text-xs text-gray-400">
            {summary.iceDepth.facilitiesWithReadings} facilities reporting
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">Scheduling</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {summary.scheduling.shiftsThisWeek} shifts
          </p>
          <p className="text-xs text-gray-400">
            {summary.scheduling.pendingTimeOff} pending time off
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Air Quality</span>
          </div>
          <p className={`text-xl font-semibold ${
            summary.airQuality.alertsThisWeek > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {summary.airQuality.alertsThisWeek} alerts
          </p>
          <p className="text-xs text-gray-400">this week</p>
        </div>
      </div>

      {/* Facility Health Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Facility Health Overview
          </h2>
          <p className="text-sm text-gray-500">
            Real-time status of all facilities
          </p>
        </div>
        <div className="p-4">
          {facilityStats.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No facilities found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilityStats.map((facility) => {
                const health = getFacilityHealthScore(facility);
                return (
                  <FacilityHealthCard
                    key={facility.id}
                    facility={facility}
                    health={health}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-gray-400 text-right">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </p>
    </div>
  );
}
