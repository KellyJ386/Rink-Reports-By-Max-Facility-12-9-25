'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getFacilitySchedule, bookingTypeLabels, formatPrice } from '@/lib/customer-portal';
import type { FacilitySchedule, TimeSlot, BookingType } from '@/lib/customer-portal';
import { cn } from '@/lib/utils';

interface ScheduleViewerProps {
  facilityId: string;
  onSlotSelect?: (slot: TimeSlot) => void;
  filterType?: BookingType;
}

export function ScheduleViewer({ facilityId, onSlotSelect, filterType }: ScheduleViewerProps) {
  const [schedule, setSchedule] = useState<FacilitySchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, [facilityId, selectedDate]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const data = await getFacilitySchedule(facilityId, dateStr);
      setSchedule(data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    if (newDate >= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const getTypeColor = (type: BookingType): string => {
    const colors: Record<BookingType, string> = {
      public_skate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      hockey: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      figure_skating: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      private_rental: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      party: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      lesson: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return colors[type];
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <Card className="p-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousDay}
          disabled={isToday}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          {isToday && (
            <span className="text-sm text-primary-600">Today</span>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={goToNextDay}>
          <ChevronRightIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(bookingTypeLabels).map(([type, label]) => (
          <span
            key={type}
            className={cn(
              'px-2 py-1 text-xs font-medium rounded',
              getTypeColor(type as BookingType)
            )}
          >
            {label}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {schedule?.rinks.map((rink) => (
            <div key={rink.rinkId}>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                {rink.rinkName}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rink.slots
                  .filter((slot) => !filterType || slot.type === filterType)
                  .map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => slot.isAvailable && onSlotSelect?.(slot)}
                      disabled={!slot.isAvailable}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        slot.isAvailable
                          ? 'border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-md cursor-pointer'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded', getTypeColor(slot.type))}>
                          {bookingTypeLabels[slot.type]}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPrice(slot.pricePerPerson)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <ClockIcon className="w-4 h-4" />
                        {slot.startTime} - {slot.endTime}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <UserGroupIcon className="w-4 h-4" />
                        {slot.isAvailable ? (
                          <span>
                            {slot.capacity - slot.bookedCount} spots left
                          </span>
                        ) : (
                          <span className="text-red-600">Full</span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
