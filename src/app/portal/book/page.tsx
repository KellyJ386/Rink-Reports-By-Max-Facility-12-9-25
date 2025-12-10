'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScheduleViewer, BookingForm } from '@/components/customer-portal';
import { getAvailableSlots, bookingTypeLabels, formatPrice } from '@/lib/customer-portal';
import type { TimeSlot, Booking, BookingType } from '@/lib/customer-portal';
import { cn } from '@/lib/utils';

export default function BookPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'select' | 'form' | 'success'>('select');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedType, setSelectedType] = useState<BookingType | undefined>();
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  const facilityId = 'fac-1';

  useEffect(() => {
    // Check for pre-selected slot from URL
    const slotId = searchParams.get('slot');
    const date = searchParams.get('date');
    const rinkId = searchParams.get('rink');
    const type = searchParams.get('type') as BookingType;

    if (slotId && date && rinkId && type) {
      // Create a slot object from URL params
      const preselectedSlot: TimeSlot = {
        id: slotId,
        rinkId,
        rinkName: rinkId === 'rink-a' ? 'Rink A' : 'Rink B',
        date,
        startTime: slotId.split('-').pop() + ':00' || '10:00',
        endTime: (parseInt(slotId.split('-').pop() || '10') + 2) + ':00',
        type,
        capacity: 150,
        bookedCount: 50,
        pricePerPerson: type === 'hockey' ? 15 : type === 'figure_skating' ? 10 : 12,
        isAvailable: true,
      };
      setSelectedSlot(preselectedSlot);
      setStep('form');
    }
  }, [searchParams]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleBookingSuccess = (booking: Booking) => {
    setCompletedBooking(booking);
    setStep('success');
  };

  const handleBack = () => {
    if (step === 'form') {
      setSelectedSlot(null);
      setStep('select');
    }
  };

  const sessionTypes: { type: BookingType; label: string; description: string }[] = [
    { type: 'public_skate', label: 'Public Skating', description: 'Open skate for all ages and skill levels' },
    { type: 'hockey', label: 'Drop-in Hockey', description: 'Pick-up hockey games for experienced players' },
    { type: 'figure_skating', label: 'Figure Skating', description: 'Figure skating practice sessions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/portal"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Portal
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Book a Session
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select a time slot and complete your reservation
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm',
              step === 'select' ? 'bg-primary-600 text-white' : 'bg-green-500 text-white'
            )}>
              {step !== 'select' ? <CheckCircleIcon className="w-5 h-5" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Select Time</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600 mx-2" />
          <div className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm',
              step === 'form' ? 'bg-primary-600 text-white' :
              step === 'success' ? 'bg-green-500 text-white' :
              'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            )}>
              {step === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Your Details</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600 mx-2" />
          <div className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm',
              step === 'success' ? 'bg-green-500 text-white' :
              'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            )}>
              {step === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : '3'}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Confirmation</span>
          </div>
        </div>

        {/* Step Content */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Session Type Filter */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                What type of session?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedType(undefined)}
                  className={cn(
                    'p-4 rounded-lg border text-left transition-all',
                    !selectedType
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">All Sessions</h4>
                  <p className="text-sm text-gray-500">Show all available times</p>
                </button>
                {sessionTypes.map(({ type, label, description }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      'p-4 rounded-lg border text-left transition-all',
                      selectedType === type
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    )}
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
                    <p className="text-sm text-gray-500">{description}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Schedule */}
            <ScheduleViewer
              facilityId={facilityId}
              onSlotSelect={handleSlotSelect}
              filterType={selectedType}
            />
          </div>
        )}

        {step === 'form' && selectedSlot && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Schedule
            </Button>
            <BookingForm
              slot={selectedSlot}
              facilityId={facilityId}
              onSuccess={handleBookingSuccess}
              onCancel={handleBack}
            />
          </div>
        )}

        {step === 'success' && completedBooking && (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your reservation has been submitted. Check your email for confirmation details.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {completedBooking.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Session</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {bookingTypeLabels[completedBooking.type]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(completedBooking.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {completedBooking.startTime} - {completedBooking.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Guests</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {completedBooking.guests}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold text-primary-600">
                    {formatPrice(completedBooking.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link href="/portal/my-bookings">
                <Button variant="secondary">View My Bookings</Button>
              </Link>
              <Link href="/portal">
                <Button>Back to Portal</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
