'use client';

import { useState } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submitRentalRequest } from '@/lib/customer-portal';
import type { RentalRequest } from '@/lib/customer-portal';
import { cn } from '@/lib/utils';

interface RentalRequestFormProps {
  facilityId: string;
  facilityName: string;
  rinks: { id: string; name: string }[];
  onSuccess?: (request: RentalRequest) => void;
  onCancel?: () => void;
}

const eventTypes = [
  'Hockey Game',
  'Hockey Practice',
  'Figure Skating Competition',
  'Figure Skating Show',
  'Birthday Party',
  'Corporate Event',
  'Charity Event',
  'School/Youth Group',
  'Wedding/Reception',
  'Film/Photo Shoot',
  'Other',
];

const requirementOptions = [
  'Scoreboard/Timer',
  'Sound System',
  'Microphone',
  'Locker Room Access',
  'Party Room',
  'Catering Area',
  'Equipment Storage',
  'Zamboni Service',
  'Photography Allowed',
  'Alcohol Permitted',
  'Extended Hours',
];

export function RentalRequestForm({
  facilityId,
  facilityName,
  rinks,
  onSuccess,
  onCancel,
}: RentalRequestFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    rinkId: '',
    eventType: '',
    eventName: '',
    expectedAttendees: 50,
    preferredDate: '',
    alternateDate: '',
    preferredTime: '10:00',
    duration: 2,
    requirements: [] as string[],
    additionalNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequirementToggle = (requirement: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.includes(requirement)
        ? prev.requirements.filter((r) => r !== requirement)
        : [...prev.requirements, requirement],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const request = await submitRentalRequest({
        customerId: `customer-${Date.now()}`,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        facilityId,
        rinkId: formData.rinkId || undefined,
        eventType: formData.eventType,
        eventName: formData.eventName,
        expectedAttendees: formData.expectedAttendees,
        preferredDate: formData.preferredDate,
        alternateDate: formData.alternateDate || undefined,
        preferredTime: formData.preferredTime,
        duration: formData.duration,
        requirements: formData.requirements,
        additionalNotes: formData.additionalNotes || undefined,
      });

      setSuccess(true);
      onSuccess?.(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Request Submitted!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We've received your rental request. Our team will review it and contact you within 1-2 business days.
        </p>
        <Button onClick={onCancel}>Close</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Private Rental Request
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Request private ice time at {facilityName}. Our team will contact you to discuss availability and pricing.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Contact Information
          </h4>
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
            <Input
              label="Phone Number *"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="(555) 123-4567"
              required
            />
          </div>
        </div>

        {/* Event Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Event Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Type *
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option value="">Select event type</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <Input
              label="Event Name *"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              placeholder="Company Holiday Party"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preferred Rink
              </label>
              <select
                value={formData.rinkId}
                onChange={(e) => setFormData({ ...formData, rinkId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">No preference</option>
                {rinks.map((rink) => (
                  <option key={rink.id} value={rink.id}>{rink.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Attendees *
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.expectedAttendees}
                onChange={(e) => setFormData({ ...formData, expectedAttendees: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Preferred Date & Time
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Preferred Date *"
              type="date"
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <Input
              label="Alternate Date"
              type="date"
              value={formData.alternateDate}
              onChange={(e) => setFormData({ ...formData, alternateDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
            <Input
              label="Preferred Start Time *"
              type="time"
              value={formData.preferredTime}
              onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (hours) *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
                required
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((hours) => (
                  <option key={hours} value={hours}>{hours} {hours === 1 ? 'hour' : 'hours'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Additional Requirements
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {requirementOptions.map((req) => (
              <label
                key={req}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
                  formData.requirements.includes(req)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  checked={formData.requirements.includes(req)}
                  onChange={() => handleRequirementToggle(req)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{req}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Additional Notes
          </label>
          <textarea
            value={formData.additionalNotes}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
            placeholder="Any additional information about your event..."
          />
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
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          A 50% deposit is required at time of booking confirmation. See our rental policy for full terms.
        </p>
      </form>
    </Card>
  );
}
