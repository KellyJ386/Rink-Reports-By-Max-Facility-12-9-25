// Customer Portal Types

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BookingType = 'public_skate' | 'hockey' | 'figure_skating' | 'private_rental' | 'party' | 'lesson';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface TimeSlot {
  id: string;
  rinkId: string;
  rinkName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: BookingType;
  capacity: number;
  bookedCount: number;
  pricePerPerson: number;
  pricePerHour?: number;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  facilityId: string;
  facilityName: string;
  rinkId: string;
  rinkName: string;
  type: BookingType;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  notes?: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface BookingRequest {
  facilityId: string;
  rinkId: string;
  type: BookingType;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  specialRequests?: string;
}

export interface RentalRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  facilityId: string;
  rinkId?: string;
  eventType: string;
  eventName: string;
  expectedAttendees: number;
  preferredDate: string;
  alternateDate?: string;
  preferredTime: string;
  duration: number;
  requirements: string[];
  additionalNotes?: string;
  status: 'pending' | 'reviewing' | 'approved' | 'declined' | 'booked';
  quotedPrice?: number;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

export interface CustomerAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      promotions: boolean;
    };
    defaultFacility?: string;
  };
  membershipId?: string;
  membershipTier?: 'basic' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacilitySchedule {
  facilityId: string;
  facilityName: string;
  date: string;
  rinks: {
    rinkId: string;
    rinkName: string;
    slots: TimeSlot[];
  }[];
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  facilityId: string;
  facilityName: string;
  bookingId?: string;
  rating: number;
  title?: string;
  comment: string;
  aspects?: {
    iceQuality?: number;
    cleanliness?: number;
    staff?: number;
    value?: number;
    amenities?: number;
  };
  response?: {
    text: string;
    respondedBy: string;
    respondedAt: Date;
  };
  isVerified: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacilityInfo {
  id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  email: string;
  website?: string;
  hours: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  amenities: string[];
  images: string[];
  rinks: {
    id: string;
    name: string;
    size: string;
    features: string[];
  }[];
  pricing: {
    type: BookingType;
    label: string;
    price: number;
    unit: string;
    description?: string;
  }[];
  policies: {
    cancellation: string;
    safety: string;
    rental: string;
  };
  rating: number;
  reviewCount: number;
}

export interface Announcement {
  id: string;
  facilityId: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'promotion' | 'closure';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
}
