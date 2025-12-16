'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowsRightLeftIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  EnrichedSwapRequest,
  SwapStatus,
  formatSwapShiftDate,
  formatSwapShiftTime,
  getSwapStatusBadgeClass,
  SWAP_STATUS_LABELS,
} from '@/hooks/useShiftSwaps';

interface ShiftSwapCardProps {
  swap: EnrichedSwapRequest;
  currentUserId?: string;
  isManager?: boolean;
  onApprove?: (swapId: string, notes?: string) => void;
  onDeny?: (swapId: string, notes?: string) => void;
  onCancel?: (swapId: string) => void;
  isProcessing?: boolean;
}

export function ShiftSwapCard({
  swap,
  currentUserId,
  isManager = false,
  onApprove,
  onDeny,
  onCancel,
  isProcessing = false,
}: ShiftSwapCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const isRequester = swap.requesterId === currentUserId;
  const isTargetUser = swap.targetUserId === currentUserId;
  const isPending = swap.status === 'PENDING';

  const handleApprove = () => {
    onApprove?.(swap.id, notes || undefined);
    setShowNotes(false);
    setNotes('');
  };

  const handleDeny = () => {
    onDeny?.(swap.id, notes || undefined);
    setShowNotes(false);
    setNotes('');
  };

  return (
    <div className="border dark:border-gray-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <ArrowsRightLeftIcon className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-900 dark:text-white">
            {swap.targetShift ? 'Shift Swap Request' : 'Shift Release Request'}
          </span>
        </div>
        <Badge className={getSwapStatusBadgeClass(swap.status as SwapStatus)}>
          {SWAP_STATUS_LABELS[swap.status as SwapStatus]}
        </Badge>
      </div>

      {/* Requester info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <UserIcon className="w-4 h-4" />
        <span>Requested by </span>
        <span className="font-medium text-gray-900 dark:text-white">
          {swap.requester?.name || 'Unknown'}
          {isRequester && ' (You)'}
        </span>
      </div>

      {/* Shifts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original shift (giving away) */}
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
          <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
            Giving Away
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatSwapShiftDate(swap.originalShift?.shiftDate || '')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {formatSwapShiftTime(swap.originalShift?.startTime || '')} -{' '}
            {formatSwapShiftTime(swap.originalShift?.endTime || '')}
          </div>
          {swap.originalShift?.position && (
            <div className="text-xs text-gray-500 mt-1">
              {swap.originalShift.position}
            </div>
          )}
        </div>

        {/* Target shift (wanting) */}
        {swap.targetShift ? (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
              Wanting
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatSwapShiftDate(swap.targetShift.shiftDate)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {formatSwapShiftTime(swap.targetShift.startTime)} -{' '}
              {formatSwapShiftTime(swap.targetShift.endTime)}
            </div>
            {swap.targetShift.position && (
              <div className="text-xs text-gray-500 mt-1">
                {swap.targetShift.position}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Currently: {swap.targetUser?.name || 'Unknown'}
              {isTargetUser && ' (You)'}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-500 font-medium mb-1">
              Release Request
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Requesting to release this shift (no swap target)
            </div>
          </div>
        )}
      </div>

      {/* Reason */}
      {swap.reason && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-xs text-gray-500 font-medium mb-1">Reason</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{swap.reason}</p>
        </div>
      )}

      {/* Expiration */}
      {isPending && swap.expiresAt && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ClockIcon className="w-4 h-4" />
          <span>
            Expires{' '}
            {new Date(swap.expiresAt).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* Review notes */}
      {swap.reviewNotes && swap.status !== 'PENDING' && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            Manager Notes
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{swap.reviewNotes}</p>
          {swap.reviewer && (
            <div className="text-xs text-gray-500 mt-1">
              - {swap.reviewer.name}
            </div>
          )}
        </div>
      )}

      {/* Notes input for managers */}
      {showNotes && isManager && isPending && (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes (optional)..."
            className="w-full p-2 text-sm border dark:border-gray-600 rounded-lg dark:bg-gray-700"
            rows={2}
          />
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-gray-700">
          {isManager && (
            <>
              {!showNotes ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowNotes(true)}
                    disabled={isProcessing}
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                    Add Notes
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDeny?.(swap.id)}
                    disabled={isProcessing}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onApprove?.(swap.id)}
                    disabled={isProcessing}
                  >
                    <CheckIcon className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowNotes(false);
                      setNotes('');
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDeny}
                    disabled={isProcessing}
                    className="text-red-600"
                  >
                    Deny with Notes
                  </Button>
                  <Button size="sm" onClick={handleApprove} disabled={isProcessing}>
                    Approve with Notes
                  </Button>
                </>
              )}
            </>
          )}
          {isRequester && !isManager && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onCancel?.(swap.id)}
              disabled={isProcessing}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Cancel Request
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
