// Billing & Subscription Types

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'void' | 'refunded';
export type PaymentMethod = 'card' | 'bank_transfer' | 'check' | 'cash';
export type BillingInterval = 'monthly' | 'quarterly' | 'annually';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: 'starter' | 'professional' | 'enterprise';
  features: string[];
  limits: {
    facilities: number;
    users: number;
    rinks: number;
    storageGb: number;
    apiCallsPerMonth: number;
  };
  pricing: {
    monthly: number;
    quarterly: number;
    annually: number;
  };
  isPopular?: boolean;
  isEnterprise?: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  planName: string;
  tier: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  quantity: number; // number of facilities
  unitPrice: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  paymentMethodId?: string;
  lastPaymentDate?: Date;
  nextPaymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  organizationId: string;
  organizationName: string;
  subscriptionId?: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  billingAddress?: BillingAddress;
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface BillingAddress {
  name: string;
  company?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethodInfo {
  id: string;
  type: 'card' | 'bank_account';
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  bankAccount?: {
    bankName: string;
    last4: string;
    accountType: 'checking' | 'savings';
  };
  billingAddress?: BillingAddress;
  createdAt: Date;
}

export interface UsageRecord {
  id: string;
  organizationId: string;
  subscriptionId: string;
  period: string; // YYYY-MM
  facilities: number;
  users: number;
  rinks: number;
  storageUsedGb: number;
  apiCalls: number;
  includedLimits: {
    facilities: number;
    users: number;
    rinks: number;
    storageGb: number;
    apiCallsPerMonth: number;
  };
  overages: {
    facilities: number;
    users: number;
    rinks: number;
    storageGb: number;
    apiCalls: number;
  };
  overageCharges: number;
  createdAt: Date;
}

export interface PaymentTransaction {
  id: string;
  organizationId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: string;
  description: string;
  failureReason?: string;
  refundedAmount?: number;
  refundReason?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

export interface BillingStats {
  currentMrr: number;
  previousMrr: number;
  mrrGrowth: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  churnedThisMonth: number;
  revenueThisMonth: number;
  outstandingInvoices: number;
  overdueAmount: number;
}

export interface BillingFilter {
  organizationId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}
