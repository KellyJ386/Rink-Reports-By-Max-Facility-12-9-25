'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarIcon,
  TicketIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookingList } from '@/components/customer-portal';
import { getCustomerBookings } from '@/lib/customer-portal';
import type { Booking } from '@/lib/customer-portal';
import { cn } from '@/lib/utils';

type TabType = 'upcoming' | 'past' | 'all';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [loading, setLoading] = useState(true);

  const customerId = 'customer-1'; // Would come from auth in production

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getCustomerBookings(customerId, activeTab);
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (cancelled: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === cancelled.id ? cancelled : b))
    );
  };

  const tabs = [
    { id: 'upcoming' as const, label: 'Upcoming', icon: CalendarIcon },
    { id: 'past' as const, label: 'Past', icon: TicketIcon },
    { id: 'all' as const, label: 'All Bookings', icon: TicketIcon },
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Bookings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage your reservations
              </p>
            </div>
            <Link href="/portal/book">
              <Button>
                <TicketIcon className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <BookingList
            bookings={bookings}
            onCancel={handleCancel}
            emptyMessage={
              activeTab === 'upcoming'
                ? 'No upcoming bookings. Book your next visit!'
                : activeTab === 'past'
                ? 'No past bookings found.'
                : 'No bookings found.'
            }
          />
        )}

        {/* Help Section */}
        <Card className="p-6 mt-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Need Help?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            If you need to make changes to a booking or have questions, please contact us:
          </p>
          <div className="flex gap-4 text-sm">
            <a href="tel:555-123-4567" className="text-primary-600 hover:underline">
              (555) 123-4567
            </a>
            <a href="mailto:bookings@centralicearena.com" className="text-primary-600 hover:underline">
              bookings@centralicearena.com
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
