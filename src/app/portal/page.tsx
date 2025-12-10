'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  TicketIcon,
  InformationCircleIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScheduleViewer } from '@/components/customer-portal';
import { getFacilityInfo, getAnnouncements, getFacilityReviews } from '@/lib/customer-portal';
import type { FacilityInfo, Announcement, Review, TimeSlot } from '@/lib/customer-portal';
import { cn } from '@/lib/utils';

export default function CustomerPortalPage() {
  const [facility, setFacility] = useState<FacilityInfo | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);

  const facilityId = 'fac-1'; // Would come from URL params in production

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [facilityData, announcementsData, reviewsData] = await Promise.all([
        getFacilityInfo(facilityId),
        getAnnouncements(facilityId),
        getFacilityReviews(facilityId, { limit: 3 }),
      ]);

      setFacility(facilityData);
      setAnnouncements(announcementsData);
      setReviews(reviewsData.reviews);
      setAverageRating(reviewsData.averageRating);
    } catch (error) {
      console.error('Failed to load portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    // Navigate to booking form
    window.location.href = `/portal/book?slot=${slot.id}&date=${slot.date}&rink=${slot.rinkId}&type=${slot.type}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {facility?.name}
              </h1>
              <div className="flex items-center gap-4 text-primary-100">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-5 h-5" />
                  <span>{facility?.address.city}, {facility?.address.state}</span>
                </div>
                <div className="flex items-center gap-1">
                  <StarIcon className="w-5 h-5 text-yellow-400" />
                  <span>{averageRating.toFixed(1)} ({facility?.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/portal/book">
                <Button className="bg-white text-primary-600 hover:bg-primary-50">
                  <TicketIcon className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </Link>
              <Link href="/portal/rentals">
                <Button variant="secondary" className="border-white text-white hover:bg-white/10">
                  Private Rentals
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mb-8">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-lg mb-3',
                  announcement.type === 'promotion' && 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
                  announcement.type === 'warning' && 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
                  announcement.type === 'closure' && 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
                  announcement.type === 'info' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                )}
              >
                <MegaphoneIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">{announcement.title}</h4>
                  <p className="text-sm opacity-90">{announcement.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Schedule */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Today's Schedule
                </h2>
                <Link
                  href="/portal/schedule"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Full Schedule
                </Link>
              </div>
              <ScheduleViewer
                facilityId={facilityId}
                onSlotSelect={handleSlotSelect}
              />
            </div>

            {/* About */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                About Us
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {facility?.description}
              </p>

              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Our Rinks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {facility?.rinks.map((rink) => (
                  <div key={rink.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">{rink.name}</h4>
                    <p className="text-sm text-gray-500">{rink.size}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rink.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {facility?.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </Card>

            {/* Reviews */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Reviews
                </h2>
                <Link
                  href="/portal/reviews"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All Reviews
                </Link>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={cn(
                          'w-5 h-5',
                          star <= Math.round(averageRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">{facility?.reviewCount} reviews</p>
                </div>
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b dark:border-gray-700 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {review.customerName}
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={cn(
                              'w-4 h-4',
                              star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Contact & Hours
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {facility?.address.street}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {facility?.address.city}, {facility?.address.state} {facility?.address.zipCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${facility?.phone}`} className="text-sm text-primary-600 hover:underline">
                    {facility?.phone}
                  </a>
                </div>
              </div>

              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Hours</h4>
              <div className="space-y-1">
                {facility?.hours.map((h) => (
                  <div key={h.day} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{h.day}</span>
                    <span className="text-gray-900 dark:text-white">
                      {h.isClosed ? 'Closed' : `${h.open} - ${h.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pricing */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Pricing
              </h3>
              <div className="space-y-3">
                {facility?.pricing.map((p) => (
                  <div key={p.type} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {p.label}
                      </p>
                      {p.description && (
                        <p className="text-xs text-gray-500">{p.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      ${p.price} <span className="text-gray-500">/ {p.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link
                  href="/portal/my-bookings"
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
                >
                  <CalendarIcon className="w-4 h-4" />
                  My Bookings
                </Link>
                <Link
                  href="/portal/rentals"
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
                >
                  <TicketIcon className="w-4 h-4" />
                  Private Rentals
                </Link>
                <Link
                  href="/portal/policies"
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
                >
                  <InformationCircleIcon className="w-4 h-4" />
                  Policies & FAQs
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
