// Customer Portal Service

import type {
  Booking,
  BookingRequest,
  BookingType,
  TimeSlot,
  FacilitySchedule,
  CustomerAccount,
  RentalRequest,
  Review,
  FacilityInfo,
  Announcement,
} from './types';

// Get facility information
export async function getFacilityInfo(facilityId: string): Promise<FacilityInfo> {
  // Mock data - would fetch from database in production
  return {
    id: facilityId,
    name: 'Central Ice Arena',
    description: 'Premier ice skating facility offering public skating, hockey programs, figure skating lessons, and private rentals. Our state-of-the-art facility features two Olympic-size rinks and modern amenities.',
    address: {
      street: '123 Ice Way',
      city: 'Frostville',
      state: 'MN',
      zipCode: '55001',
    },
    phone: '(555) 123-4567',
    email: 'info@centralicearena.com',
    website: 'https://centralicearena.com',
    hours: [
      { day: 'Monday', open: '6:00 AM', close: '10:00 PM', isClosed: false },
      { day: 'Tuesday', open: '6:00 AM', close: '10:00 PM', isClosed: false },
      { day: 'Wednesday', open: '6:00 AM', close: '10:00 PM', isClosed: false },
      { day: 'Thursday', open: '6:00 AM', close: '10:00 PM', isClosed: false },
      { day: 'Friday', open: '6:00 AM', close: '11:00 PM', isClosed: false },
      { day: 'Saturday', open: '7:00 AM', close: '11:00 PM', isClosed: false },
      { day: 'Sunday', open: '8:00 AM', close: '9:00 PM', isClosed: false },
    ],
    amenities: [
      'Skate Rental',
      'Pro Shop',
      'Snack Bar',
      'Locker Rooms',
      'Free WiFi',
      'Heated Viewing Area',
      'Party Rooms',
      'Parking',
    ],
    images: [
      '/images/facility/main.jpg',
      '/images/facility/rink-a.jpg',
      '/images/facility/rink-b.jpg',
      '/images/facility/lobby.jpg',
    ],
    rinks: [
      { id: 'rink-a', name: 'Rink A', size: '200x85 ft (Olympic)', features: ['Hockey Lines', 'Scoreboard', 'Sound System'] },
      { id: 'rink-b', name: 'Rink B', size: '200x85 ft (Olympic)', features: ['Figure Skating Circles', 'Mirrors', 'Sound System'] },
    ],
    pricing: [
      { type: 'public_skate', label: 'Public Skating', price: 12, unit: 'per person', description: 'Includes skate rental' },
      { type: 'hockey', label: 'Drop-in Hockey', price: 15, unit: 'per person' },
      { type: 'figure_skating', label: 'Figure Skating Session', price: 10, unit: 'per person' },
      { type: 'private_rental', label: 'Private Ice Rental', price: 350, unit: 'per hour' },
      { type: 'party', label: 'Birthday Party Package', price: 250, unit: 'per party', description: 'Up to 15 guests, 2 hours' },
      { type: 'lesson', label: 'Private Lesson', price: 45, unit: 'per 30 min' },
    ],
    policies: {
      cancellation: 'Cancellations must be made at least 24 hours in advance for a full refund. Cancellations within 24 hours will receive a 50% refund.',
      safety: 'All skaters must wear approved helmets (provided free of charge). Protective gear is recommended. Children under 12 must be accompanied by an adult.',
      rental: 'Private rentals require a signed rental agreement and 50% deposit at time of booking. Full payment is due 7 days before the event.',
    },
    rating: 4.6,
    reviewCount: 328,
  };
}

// Get facility schedule
export async function getFacilitySchedule(
  facilityId: string,
  date: string
): Promise<FacilitySchedule> {
  const generateSlots = (rinkId: string, rinkName: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const types: BookingType[] = ['public_skate', 'hockey', 'figure_skating', 'public_skate'];

    for (let hour = 6; hour < 22; hour += 2) {
      const type = types[Math.floor((hour - 6) / 4) % types.length];
      const capacity = type === 'public_skate' ? 150 : type === 'hockey' ? 30 : 40;
      const bookedCount = Math.floor(Math.random() * capacity * 0.8);

      slots.push({
        id: `${rinkId}-${date}-${hour}`,
        rinkId,
        rinkName,
        date,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 2).toString().padStart(2, '0')}:00`,
        type,
        capacity,
        bookedCount,
        pricePerPerson: type === 'public_skate' ? 12 : type === 'hockey' ? 15 : 10,
        isAvailable: bookedCount < capacity,
      });
    }

    return slots;
  };

  return {
    facilityId,
    facilityName: 'Central Ice Arena',
    date,
    rinks: [
      { rinkId: 'rink-a', rinkName: 'Rink A', slots: generateSlots('rink-a', 'Rink A') },
      { rinkId: 'rink-b', rinkName: 'Rink B', slots: generateSlots('rink-b', 'Rink B') },
    ],
  };
}

// Get available time slots
export async function getAvailableSlots(
  facilityId: string,
  rinkId: string,
  type: BookingType,
  startDate: string,
  endDate: string
): Promise<TimeSlot[]> {
  // Mock implementation
  const slots: TimeSlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];

    for (let hour = 6; hour < 22; hour += 2) {
      if (Math.random() > 0.3) { // 70% availability
        slots.push({
          id: `${rinkId}-${dateStr}-${hour}`,
          rinkId,
          rinkName: rinkId === 'rink-a' ? 'Rink A' : 'Rink B',
          date: dateStr,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 2).toString().padStart(2, '0')}:00`,
          type,
          capacity: 150,
          bookedCount: Math.floor(Math.random() * 100),
          pricePerPerson: 12,
          isAvailable: true,
        });
      }
    }
  }

  return slots;
}

// Create a booking
export async function createBooking(request: BookingRequest): Promise<Booking> {
  const now = new Date();
  const hours = parseInt(request.endTime.split(':')[0]) - parseInt(request.startTime.split(':')[0]);

  return {
    id: `booking-${Date.now()}`,
    customerId: `customer-${Date.now()}`,
    customerName: request.customerName,
    customerEmail: request.customerEmail,
    customerPhone: request.customerPhone,
    facilityId: request.facilityId,
    facilityName: 'Central Ice Arena',
    rinkId: request.rinkId,
    rinkName: request.rinkId === 'rink-a' ? 'Rink A' : 'Rink B',
    type: request.type,
    date: request.date,
    startTime: request.startTime,
    endTime: request.endTime,
    guests: request.guests,
    totalPrice: request.guests * 12 * hours,
    status: 'pending',
    paymentStatus: 'pending',
    notes: request.notes,
    specialRequests: request.specialRequests,
    createdAt: now,
    updatedAt: now,
  };
}

// Get customer bookings
export async function getCustomerBookings(
  customerId: string,
  status?: 'upcoming' | 'past' | 'all'
): Promise<Booking[]> {
  const now = new Date();

  // Mock bookings
  const bookings: Booking[] = [
    {
      id: 'booking-1',
      customerId,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      rinkId: 'rink-a',
      rinkName: 'Rink A',
      type: 'public_skate',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '16:00',
      guests: 4,
      totalPrice: 48,
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'booking-2',
      customerId,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      rinkId: 'rink-b',
      rinkName: 'Rink B',
      type: 'party',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '12:00',
      guests: 15,
      totalPrice: 250,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  if (status === 'upcoming') {
    return bookings.filter(b => new Date(b.date) >= now);
  } else if (status === 'past') {
    return bookings.filter(b => new Date(b.date) < now);
  }

  return bookings;
}

// Cancel a booking
export async function cancelBooking(
  bookingId: string,
  reason: string
): Promise<Booking> {
  // Mock implementation
  return {
    id: bookingId,
    customerId: 'customer-1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    facilityId: 'fac-1',
    facilityName: 'Central Ice Arena',
    rinkId: 'rink-a',
    rinkName: 'Rink A',
    type: 'public_skate',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '16:00',
    guests: 4,
    totalPrice: 48,
    status: 'cancelled',
    paymentStatus: 'refunded',
    createdAt: new Date(),
    updatedAt: new Date(),
    cancelledAt: new Date(),
    cancellationReason: reason,
  };
}

// Submit rental request
export async function submitRentalRequest(
  request: Omit<RentalRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<RentalRequest> {
  const now = new Date();

  return {
    ...request,
    id: `rental-${Date.now()}`,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}

// Get customer account
export async function getCustomerAccount(customerId: string): Promise<CustomerAccount> {
  return {
    id: customerId,
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '(555) 987-6543',
    dateOfBirth: '1985-06-15',
    address: {
      street: '456 Oak Street',
      city: 'Frostville',
      state: 'MN',
      zipCode: '55002',
      country: 'USA',
    },
    emergencyContact: {
      name: 'Jane Doe',
      phone: '(555) 987-6544',
      relationship: 'Spouse',
    },
    preferences: {
      notifications: {
        email: true,
        sms: true,
        promotions: false,
      },
      defaultFacility: 'fac-1',
    },
    membershipId: 'MEM-2024-001234',
    membershipTier: 'gold',
    loyaltyPoints: 2450,
    createdAt: new Date('2022-03-15'),
    updatedAt: new Date(),
  };
}

// Update customer account
export async function updateCustomerAccount(
  customerId: string,
  updates: Partial<CustomerAccount>
): Promise<CustomerAccount> {
  const current = await getCustomerAccount(customerId);

  return {
    ...current,
    ...updates,
    updatedAt: new Date(),
  };
}

// Get facility reviews
export async function getFacilityReviews(
  facilityId: string,
  options?: { limit?: number; offset?: number; sortBy?: 'recent' | 'rating' }
): Promise<{ reviews: Review[]; total: number; averageRating: number }> {
  const reviews: Review[] = [
    {
      id: 'review-1',
      customerId: 'customer-1',
      customerName: 'Sarah M.',
      facilityId,
      facilityName: 'Central Ice Arena',
      bookingId: 'booking-100',
      rating: 5,
      title: 'Great experience!',
      comment: 'The ice quality was excellent and the staff were very friendly. Will definitely come back!',
      aspects: {
        iceQuality: 5,
        cleanliness: 5,
        staff: 5,
        value: 4,
        amenities: 4,
      },
      isVerified: true,
      isPublic: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 'review-2',
      customerId: 'customer-2',
      customerName: 'Mike T.',
      facilityId,
      facilityName: 'Central Ice Arena',
      rating: 4,
      title: 'Good facility, minor issues',
      comment: 'Nice rink overall. The public session was a bit crowded but the ice was well maintained.',
      aspects: {
        iceQuality: 5,
        cleanliness: 4,
        staff: 4,
        value: 3,
        amenities: 4,
      },
      response: {
        text: 'Thank you for your feedback! We are working on better managing crowd sizes during peak hours.',
        respondedBy: 'Manager',
        respondedAt: new Date('2024-01-08'),
      },
      isVerified: true,
      isPublic: true,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-08'),
    },
    {
      id: 'review-3',
      customerId: 'customer-3',
      customerName: 'Lisa K.',
      facilityId,
      facilityName: 'Central Ice Arena',
      bookingId: 'booking-102',
      rating: 5,
      title: 'Perfect birthday party!',
      comment: 'Hosted my son\'s birthday party here. The party room was great, staff was helpful, and all the kids had a blast!',
      aspects: {
        iceQuality: 5,
        cleanliness: 5,
        staff: 5,
        value: 5,
        amenities: 5,
      },
      isVerified: true,
      isPublic: true,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  return {
    reviews,
    total: 328,
    averageRating: 4.6,
  };
}

// Submit a review
export async function submitReview(
  review: Omit<Review, 'id' | 'isVerified' | 'createdAt' | 'updatedAt'>
): Promise<Review> {
  const now = new Date();

  return {
    ...review,
    id: `review-${Date.now()}`,
    isVerified: false,
    createdAt: now,
    updatedAt: now,
  };
}

// Get announcements
export async function getAnnouncements(facilityId: string): Promise<Announcement[]> {
  return [
    {
      id: 'ann-1',
      facilityId,
      title: 'Holiday Hours',
      content: 'We will have special holiday hours from December 23rd through January 2nd. Please check our schedule for details.',
      type: 'info',
      startDate: new Date('2024-12-20'),
      endDate: new Date('2025-01-03'),
      isActive: true,
      createdAt: new Date('2024-12-15'),
    },
    {
      id: 'ann-2',
      facilityId,
      title: 'Free Skate Fridays in January!',
      content: 'Join us every Friday in January for free public skating from 2-4 PM. Skate rental not included.',
      type: 'promotion',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      isActive: true,
      createdAt: new Date('2024-12-18'),
    },
  ];
}

// Booking type labels
export const bookingTypeLabels: Record<BookingType, string> = {
  public_skate: 'Public Skating',
  hockey: 'Hockey',
  figure_skating: 'Figure Skating',
  private_rental: 'Private Rental',
  party: 'Party/Event',
  lesson: 'Lesson',
};

// Format booking date/time
export function formatBookingDateTime(date: string, startTime: string, endTime: string): string {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `${formattedDate}, ${startTime} - ${endTime}`;
}

// Format price
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
