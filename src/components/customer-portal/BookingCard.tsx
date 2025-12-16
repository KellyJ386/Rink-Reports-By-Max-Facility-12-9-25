'use client';

import { useState } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cancelBooking, bookingTypeLabels, formatPrice, formatBookingDateTime } from '@/lib/customer-portal';
import type { Booking, BookingStatus } from '@/lib/customer-portal';
import { cn } from '@/lib/utils';

interface BookingCardProps {
  booking: Booking;
  onCancel?: (booking: Booking) => void;
  onViewDetails?: (booking: Booking) => void;
  showActions?: boolean;
}

export function BookingCard({
  booking,
  onCancel,
  onViewDetails,
  showActions = true,
}: BookingCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const getStatusConfig = (status: BookingStatus) => {
    const configs = {
      pending: {
        icon: ExclamationTriangleIcon,
        color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
        label: 'Pending Confirmation',
      },
      confirmed: {
        icon: CheckCircleIcon,
        color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
        label: 'Confirmed',
      },
      cancelled: {
        icon: XCircleIcon,
        color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
        label: 'Cancelled',
      },
      completed: {
        icon: CheckCircleIcon,
        color: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
        label: 'Completed',
      },
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;
  const isPast = new Date(booking.date) < new Date();
  const canCancel = !isPast && booking.status !== 'cancelled' && booking.status !== 'completed';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await cancelBooking(booking.id, 'Customer requested cancellation');
      onCancel?.(updated);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  return (
    <Card className={cn('p-4', isPast && 'opacity-75')}>
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Date Badge */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase">
            {new Date(booking.date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
            {new Date(booking.date).getDate()}
          </span>
        </div>

        {/* Booking Info */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {bookingTypeLabels[booking.type]}
            </span>
            <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded', statusConfig.color)}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {booking.facilityName} - {booking.rinkName}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              <span>{booking.startTime} - {booking.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4" />
              <span>{booking.guests} guests</span>
            </div>
          </div>

          {booking.specialRequests && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
              "{booking.specialRequests}"
            </p>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(booking.totalPrice)}
            </p>
            <p className={cn(
              'text-xs',
              booking.paymentStatus === 'paid' ? 'text-green-600' :
              booking.paymentStatus === 'refunded' ? 'text-gray-500' :
              'text-yellow-600'
            )}>
              {booking.paymentStatus === 'paid' ? 'Paid' :
               booking.paymentStatus === 'refunded' ? 'Refunded' :
               'Payment pending'}
            </p>
          </div>

          {showActions && (
            <div className="flex gap-2">
              {onViewDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(booking)}
                >
                  Details
                </Button>
              )}

              {canCancel && !showCancelConfirm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation */}
      {showCancelConfirm && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCancelConfirm(false)}
              disabled={cancelling}
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// Compact list view
interface BookingListProps {
  bookings: Booking[];
  onCancel?: (booking: Booking) => void;
  onViewDetails?: (booking: Booking) => void;
  emptyMessage?: string;
}

export function BookingList({
  bookings,
  onCancel,
  onViewDetails,
  emptyMessage = 'No bookings found',
}: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onCancel={onCancel}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
