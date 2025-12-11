'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import {
  XMarkIcon,
  ArrowsRightLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Shift } from './DraggableScheduleCalendar';
import { useCreateSwapRequest, formatSwapShiftDate, formatSwapShiftTime } from '@/hooks/useShiftSwaps';
import { toast } from '@/components/notifications';

interface ShiftSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift; // The user's shift they want to swap
  availableShifts: Shift[]; // Other shifts they could swap with
  currentUserId: string;
  onSuccess?: () => void;
}

export function ShiftSwapModal({
  isOpen,
  onClose,
  shift,
  availableShifts,
  currentUserId,
  onSuccess,
}: ShiftSwapModalProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [swapType, setSwapType] = useState<'swap' | 'release'>('swap');

  const createSwapMutation = useCreateSwapRequest();

  // Filter to only show other people's shifts
  const swappableShifts = useMemo(() => {
    return availableShifts.filter((s) => {
      // Must be different user
      if (s.userId === currentUserId) return false;
      // Must be future shift
      if (new Date(s.shiftDate) < new Date()) return false;
      // Must match position if positions exist
      if (shift.position && s.position && shift.position !== s.position) return false;
      return true;
    });
  }, [availableShifts, currentUserId, shift.position]);

  const handleSubmit = async () => {
    try {
      const input: { originalShiftId: string; targetShiftId?: string; reason?: string } = {
        originalShiftId: shift.id,
        reason: reason || undefined,
      };

      if (swapType === 'swap' && selectedTargetId) {
        input.targetShiftId = selectedTargetId;
      }

      await createSwapMutation.mutateAsync(input);
      toast.success(
        'Swap Request Submitted',
        swapType === 'swap'
          ? 'Your shift swap request has been submitted for approval.'
          : 'Your shift release request has been submitted for approval.'
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Request Failed', (error as Error).message || 'Failed to submit swap request.');
    }
  };

  const selectedTarget = swappableShifts.find((s) => s.id === selectedTargetId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <ArrowsRightLeftIcon className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Request Shift Swap
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Your shift */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Shift (Giving Away)
              </label>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDaysIcon className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatSwapShiftDate(shift.shiftDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <ClockIcon className="w-4 h-4 text-red-500" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {formatSwapShiftTime(shift.startTime)} - {formatSwapShiftTime(shift.endTime)}
                  </span>
                </div>
                {shift.position && (
                  <div className="text-xs text-gray-500 mt-1">{shift.position}</div>
                )}
              </div>
            </div>

            {/* Swap type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What would you like to do?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSwapType('swap')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    swapType === 'swap'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  Swap with another shift
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSwapType('release');
                    setSelectedTargetId(null);
                  }}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    swapType === 'release'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  Release shift (give up)
                </button>
              </div>
            </div>

            {/* Target shift selection */}
            {swapType === 'swap' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Shift to Swap With
                </label>
                {swappableShifts.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2 border dark:border-gray-700 rounded-lg p-2">
                    {swappableShifts.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedTargetId(s.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          selectedTargetId === s.id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatSwapShiftDate(s.shiftDate)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {formatSwapShiftTime(s.startTime)} - {formatSwapShiftTime(s.endTime)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {s.userName || s.user?.name || 'Unknown'}
                            </div>
                            {s.position && (
                              <div className="text-xs text-gray-400">{s.position}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    No compatible shifts available for swapping. Try releasing the shift instead.
                  </p>
                )}
              </div>
            )}

            {/* Selected target preview */}
            {swapType === 'swap' && selectedTarget && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shift You'll Receive
                </label>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDaysIcon className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatSwapShiftDate(selectedTarget.shiftDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <ClockIcon className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatSwapShiftTime(selectedTarget.startTime)} -{' '}
                      {formatSwapShiftTime(selectedTarget.endTime)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Currently assigned to: {selectedTarget.userName || selectedTarget.user?.name}
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're requesting this swap..."
                className="w-full p-3 border dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                rows={2}
              />
            </div>

            {/* Note */}
            <p className="text-xs text-gray-500">
              Your request will be sent to management for approval.
              {swapType === 'swap' &&
                ' The other employee will also be notified of the swap request.'}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createSwapMutation.isPending ||
                (swapType === 'swap' && !selectedTargetId)
              }
            >
              {createSwapMutation.isPending
                ? 'Submitting...'
                : swapType === 'swap'
                ? 'Request Swap'
                : 'Request Release'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
