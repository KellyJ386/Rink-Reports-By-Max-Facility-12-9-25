'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RentalRequestForm } from '@/components/customer-portal';
import { cn } from '@/lib/utils';

const rentalPackages = [
  {
    id: 'hourly',
    name: 'Hourly Rental',
    price: 350,
    unit: 'per hour',
    description: 'Perfect for practices, small events, and private sessions',
    features: [
      'Full rink access',
      'Basic sound system',
      'Locker room access',
      'Standard lighting',
    ],
    minHours: 1,
    maxGuests: 150,
  },
  {
    id: 'half-day',
    name: 'Half Day Package',
    price: 1200,
    unit: 'flat rate',
    description: '4 hours of ice time with enhanced amenities',
    features: [
      'Full rink access',
      'Professional sound system',
      'Both locker rooms',
      'Scoreboard access',
      'Basic event setup',
    ],
    minHours: 4,
    maxGuests: 200,
    popular: true,
  },
  {
    id: 'full-day',
    name: 'Full Day Package',
    price: 2000,
    unit: 'flat rate',
    description: '8 hours of exclusive ice time for major events',
    features: [
      'Exclusive facility access',
      'Full A/V equipment',
      'All locker rooms',
      'Party room included',
      'Zamboni service',
      'Event coordinator support',
    ],
    minHours: 8,
    maxGuests: 300,
  },
];

const additionalServices = [
  { name: 'Skate Rentals', price: 5, unit: 'per pair' },
  { name: 'Hockey Equipment Rental', price: 25, unit: 'per set' },
  { name: 'Photography Package', price: 200, unit: 'flat rate' },
  { name: 'Catering Setup', price: 100, unit: 'flat rate' },
  { name: 'Custom Lighting', price: 150, unit: 'flat rate' },
  { name: 'Extra Zamboni Run', price: 75, unit: 'per run' },
];

export default function RentalsPage() {
  const [showForm, setShowForm] = useState(false);

  const rinks = [
    { id: 'rink-a', name: 'Rink A - Olympic Size' },
    { id: 'rink-b', name: 'Rink B - Olympic Size' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link
            href="/portal"
            className="flex items-center gap-2 text-sm text-primary-100 hover:text-white mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Portal
          </Link>
          <h1 className="text-3xl font-bold mb-2">Private Ice Rentals</h1>
          <p className="text-primary-100 max-w-2xl">
            Host your next event at Central Ice Arena. From birthday parties to corporate
            events, hockey tournaments to figure skating shows, we offer flexible rental
            packages to meet your needs.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {showForm ? (
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="mb-4">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Packages
            </Button>
            <RentalRequestForm
              facilityId="fac-1"
              facilityName="Central Ice Arena"
              rinks={rinks}
              onSuccess={() => {}}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <>
            {/* Rental Packages */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Rental Packages
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rentalPackages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={cn(
                      'p-6 relative',
                      pkg.popular && 'ring-2 ring-primary-500'
                    )}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {pkg.name}
                    </h3>
                    <div className="mt-2 mb-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${pkg.price}
                      </span>
                      <span className="text-gray-500 ml-1">{pkg.unit}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {pkg.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      {pkg.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          <CheckIcon className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        Min {pkg.minHours}h
                      </div>
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4" />
                        Up to {pkg.maxGuests}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant={pkg.popular ? 'primary' : 'secondary'}
                      onClick={() => setShowForm(true)}
                    >
                      Request Quote
                    </Button>
                  </Card>
                ))}
              </div>
            </div>

            {/* Additional Services */}
            <Card className="p-6 mb-12">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Additional Services
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {additionalServices.map((service) => (
                  <div
                    key={service.name}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {service.name}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${service.price}/{service.unit.replace('per ', '').replace('flat rate', 'ea')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* FAQ */}
            <Card className="p-6 mb-12">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    How far in advance should I book?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We recommend booking at least 2-4 weeks in advance for weekday events and
                    4-8 weeks for weekend events. Popular dates during hockey season fill up quickly.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    What is your cancellation policy?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Full refund if cancelled 14+ days before the event. 50% refund for cancellations
                    7-13 days before. No refund for cancellations less than 7 days before.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Can I bring outside food and drinks?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, outside food is allowed in designated party areas. We also offer catering
                    setup services and partnerships with local caterers.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Is there parking available?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, we have free parking for up to 200 vehicles. For larger events,
                    overflow parking is available at the adjacent lot.
                  </p>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Book Your Event?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Submit a rental request and our events team will contact you within 1-2 business days.
              </p>
              <Button size="lg" onClick={() => setShowForm(true)}>
                <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                Request a Rental
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
