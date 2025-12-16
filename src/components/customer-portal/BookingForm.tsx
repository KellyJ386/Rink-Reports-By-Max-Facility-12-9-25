'use client';

import { useState } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createBooking, bookingTypeLabels, formatPrice, formatBookingDateTime } from '@/lib/customer-portal';
import type { TimeSlot, Booking, BookingRequest } from '@/lib/customer-portal';
import { cn } from '@/lib/utils';

interface BookingFormProps {
  slot: TimeSlot;
  facilityId: string;
  onSuccess?: (booking: Booking) => void;
  onCancel?: () => void;
}

export function BookingForm({ slot, facilityId, onSuccess, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    guests: 1,
    notes: '',
    specialRequests: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxGuests = slot.capacity - slot.bookedCount;
  const totalPrice = formData.guests * slot.pricePerPerson;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const request: BookingRequest = {
        facilityId,
        rinkId: slot.rinkId,
        type: slot.type,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        guests: formData.guests,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || undefined,
        notes: formData.notes || undefined,
        specialRequests: formData.specialRequests || undefined,
      };

      const booking = await createBooking(request);
      onSuccess?.(booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Complete Your Booking
      </h3>

      {/* Booking Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className={cn(
            'px-2 py-1 text-sm font-medium rounded',
            'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
          )}>
            {bookingTypeLabels[slot.type]}
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(slot.pricePerPerson)}/person
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{new Date(slot.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            <span>{slot.startTime} - {slot.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4" />
            <span>{maxGuests} spots available</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="John Doe"
            required
          />
          <Input
            label="Email *"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            placeholder="john@example.com"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            placeholder="(555) 123-4567"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Guests *
            </label>
            <select
              value={formData.guests}
              onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
              required
            >
              {Array.from({ length: Math.min(maxGuests, 20) }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Special Requests
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
            placeholder="Any special requirements or requests..."
          />
        </div>

        {/* Price Summary */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">
              {formatPrice(slot.pricePerPerson)} × {formData.guests} guests
            </span>
            <span className="text-gray-900 dark:text-white">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-lg text-primary-600 dark:text-primary-400">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Processing...' : 'Confirm Booking'}
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          By completing this booking, you agree to our terms of service and cancellation policy.
        </p>
      </form>
    </Card>
  );
}
