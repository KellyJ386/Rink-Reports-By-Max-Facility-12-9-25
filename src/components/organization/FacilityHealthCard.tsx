'use client';

import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  BellAlertIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  FacilityStat,
  getHealthStatusColor,
} from '@/hooks/useOrganization';

interface FacilityHealthCardProps {
  facility: FacilityStat;
  health: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
}

export function FacilityHealthCard({ facility, health }: FacilityHealthCardProps) {
  const statusColorClass = getHealthStatusColor(health.status);

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {facility.name}
          </h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColorClass}`}>
            {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`text-2xl font-bold ${
            health.score >= 70
              ? 'text-green-600 dark:text-green-400'
              : health.score >= 50
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {health.score}
          </div>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>

      {/* Health Score Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all ${
            health.score >= 70
              ? 'bg-green-500'
              : health.score >= 50
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${health.score}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className={`w-4 h-4 ${
            facility.openIncidents > 0 ? 'text-red-500' : 'text-gray-400'
          }`} />
          <span className={facility.openIncidents > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500'}>
            {facility.openIncidents} incidents
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BellAlertIcon className={`w-4 h-4 ${
            facility.unacknowledgedAlerts > 0 ? 'text-yellow-500' : 'text-gray-400'
          }`} />
          <span className={facility.unacknowledgedAlerts > 0 ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-gray-500'}>
            {facility.unacknowledgedAlerts} alerts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DocumentTextIcon className={`w-4 h-4 ${
            facility.pendingSubmissions > 0 ? 'text-purple-500' : 'text-gray-400'
          }`} />
          <span className={facility.pendingSubmissions > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}>
            {facility.pendingSubmissions} pending
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500">{facility.totalUsers} users</span>
        </div>
      </div>

      {/* Action Link */}
      <Link
        href={`/dashboard?facilityId=${facility.id}`}
        className="mt-3 flex items-center justify-center gap-1 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
      >
        View Details
        <ChevronRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
}
