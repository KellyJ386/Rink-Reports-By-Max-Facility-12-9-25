'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShiftSwapCard } from './ShiftSwapCard';
import {
  useMySwapRequests,
  usePendingSwapApprovals,
  useReviewSwapRequest,
  useCancelSwapRequest,
  SwapStatus,
  SWAP_STATUS_LABELS,
} from '@/hooks/useShiftSwaps';
import { hasPermission } from '@/types';
import { toast } from '@/components/notifications';
import {
  ArrowsRightLeftIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface ShiftSwapsListProps {
  currentUserId?: string;
  userRole?: string;
  facilityId?: string;
}

export function ShiftSwapsList({
  currentUserId,
  userRole = 'STAFF',
  facilityId,
}: ShiftSwapsListProps) {
  const [statusFilter, setStatusFilter] = useState<SwapStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'my' | 'pending'>('my');

  const isManager = hasPermission(userRole, 'schedule:manage');

  // Fetch swap requests
  const {
    data: mySwaps,
    isLoading: mySwapsLoading,
    refetch: refetchMy,
  } = useMySwapRequests();

  const {
    data: pendingSwaps,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = usePendingSwapApprovals(facilityId);

  // Mutations
  const reviewMutation = useReviewSwapRequest();
  const cancelMutation = useCancelSwapRequest();

  const handleApprove = async (swapId: string, notes?: string) => {
    try {
      await reviewMutation.mutateAsync({ swapId, action: 'approve', notes });
      toast.success('Swap Approved', 'The shift swap has been approved and schedules updated.');
      refetchMy();
      refetchPending();
    } catch (error) {
      toast.error('Failed', (error as Error).message || 'Failed to approve swap request.');
    }
  };

  const handleDeny = async (swapId: string, notes?: string) => {
    try {
      await reviewMutation.mutateAsync({ swapId, action: 'deny', notes });
      toast.success('Swap Denied', 'The shift swap request has been denied.');
      refetchMy();
      refetchPending();
    } catch (error) {
      toast.error('Failed', (error as Error).message || 'Failed to deny swap request.');
    }
  };

  const handleCancel = async (swapId: string) => {
    try {
      await cancelMutation.mutateAsync({ swapId });
      toast.success('Request Cancelled', 'Your swap request has been cancelled.');
      refetchMy();
    } catch (error) {
      toast.error('Failed', (error as Error).message || 'Failed to cancel swap request.');
    }
  };

  const isLoading = viewMode === 'my' ? mySwapsLoading : pendingLoading;
  const swapsList = viewMode === 'my' ? mySwaps?.items : pendingSwaps?.items;
  const filteredSwaps = swapsList?.filter(
    (swap) => statusFilter === 'ALL' || swap.status === statusFilter
  );

  const isProcessing = reviewMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowsRightLeftIcon className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Shift Swaps
          </h3>
        </div>
        <button
          onClick={() => {
            refetchMy();
            refetchPending();
          }}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Refresh"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      {/* View Mode Tabs (for managers) */}
      {isManager && (
        <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
          <button
            onClick={() => setViewMode('my')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              viewMode === 'my'
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setViewMode('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
              viewMode === 'pending'
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Pending Approval
            {(pendingSwaps?.total ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingSwaps?.total}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SwapStatus | 'ALL')}
            className="text-sm border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(SWAP_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {filteredSwaps?.length || 0} request(s)
        </span>
      </div>

      {/* Swaps List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse border dark:border-gray-700 rounded-lg p-4">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSwaps && filteredSwaps.length > 0 ? (
        <div className="space-y-4">
          {filteredSwaps.map((swap) => (
            <ShiftSwapCard
              key={swap.id}
              swap={swap}
              currentUserId={currentUserId}
              isManager={isManager}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onCancel={handleCancel}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ArrowsRightLeftIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {viewMode === 'pending'
              ? 'No pending swap requests to review'
              : 'No swap requests found'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {viewMode === 'my'
              ? 'Click on a shift in the calendar to request a swap'
              : 'Swap requests from staff will appear here'}
          </p>
        </div>
      )}
    </div>
  );
}
