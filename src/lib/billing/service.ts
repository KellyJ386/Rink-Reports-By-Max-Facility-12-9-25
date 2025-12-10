// Billing & Subscription Service

import type {
  SubscriptionPlan,
  Subscription,
  Invoice,
  PaymentMethodInfo,
  UsageRecord,
  PaymentTransaction,
  BillingStats,
  BillingFilter,
  BillingInterval,
  InvoiceStatus,
} from './types';

// Get subscription plans
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return [
    {
      id: 'plan-starter',
      name: 'Starter',
      description: 'Perfect for small facilities just getting started',
      tier: 'starter',
      features: [
        'Up to 2 facilities',
        '5 user accounts',
        'Basic reporting',
        'Email support',
        'Mobile app access',
        '5GB storage',
      ],
      limits: {
        facilities: 2,
        users: 5,
        rinks: 4,
        storageGb: 5,
        apiCallsPerMonth: 10000,
      },
      pricing: {
        monthly: 99,
        quarterly: 267,
        annually: 950,
      },
    },
    {
      id: 'plan-professional',
      name: 'Professional',
      description: 'For growing facilities with advanced needs',
      tier: 'professional',
      features: [
        'Up to 5 facilities',
        '25 user accounts',
        'Advanced analytics',
        'Priority support',
        'Custom reports',
        'API access',
        '25GB storage',
        'Multi-tenancy',
      ],
      limits: {
        facilities: 5,
        users: 25,
        rinks: 15,
        storageGb: 25,
        apiCallsPerMonth: 100000,
      },
      pricing: {
        monthly: 299,
        quarterly: 807,
        annually: 2868,
      },
      isPopular: true,
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise',
      description: 'Unlimited scale for large organizations',
      tier: 'enterprise',
      features: [
        'Unlimited facilities',
        'Unlimited users',
        'Advanced analytics & BI',
        '24/7 dedicated support',
        'Custom integrations',
        'SLA guarantee',
        'Unlimited storage',
        'White-label options',
        'On-premise option',
      ],
      limits: {
        facilities: -1, // unlimited
        users: -1,
        rinks: -1,
        storageGb: -1,
        apiCallsPerMonth: -1,
      },
      pricing: {
        monthly: 799,
        quarterly: 2157,
        annually: 7668,
      },
      isEnterprise: true,
    },
  ];
}

// Get current subscription
export async function getSubscription(organizationId: string): Promise<Subscription> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    id: 'sub-1',
    organizationId,
    organizationName: 'Central Ice Arena Group',
    planId: 'plan-professional',
    planName: 'Professional',
    tier: 'professional',
    status: 'active',
    billingInterval: 'monthly',
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    quantity: 3,
    unitPrice: 299,
    discount: {
      type: 'percentage',
      value: 10,
      reason: 'Annual commitment discount',
    },
    paymentMethodId: 'pm-1',
    lastPaymentDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    nextPaymentDate: periodEnd,
    createdAt: new Date('2023-01-01'),
    updatedAt: now,
  };
}

// Update subscription
export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<Pick<Subscription, 'planId' | 'billingInterval' | 'quantity' | 'cancelAtPeriodEnd'>>
): Promise<Subscription> {
  const subscription = await getSubscription('org-1');
  return {
    ...subscription,
    ...updates,
    updatedAt: new Date(),
  };
}

// Get invoices
export async function getInvoices(filter?: BillingFilter): Promise<Invoice[]> {
  const now = new Date();

  const invoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2024-001',
      organizationId: 'org-1',
      organizationName: 'Central Ice Arena Group',
      subscriptionId: 'sub-1',
      status: 'paid',
      issueDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      paidDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      subtotal: 897,
      tax: 71.76,
      discount: 89.70,
      total: 879.06,
      amountPaid: 879.06,
      amountDue: 0,
      currency: 'USD',
      lineItems: [
        {
          id: 'li-1',
          description: 'Professional Plan (3 facilities)',
          quantity: 3,
          unitPrice: 299,
          total: 897,
          periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth(), 0),
        },
      ],
      paymentMethod: 'card',
      paymentReference: 'ch_1abc123',
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      updatedAt: new Date(now.getFullYear(), now.getMonth() - 1, 10),
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2024-002',
      organizationId: 'org-1',
      organizationName: 'Central Ice Arena Group',
      subscriptionId: 'sub-1',
      status: 'pending',
      issueDate: new Date(now.getFullYear(), now.getMonth(), 1),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      subtotal: 897,
      tax: 71.76,
      discount: 89.70,
      total: 879.06,
      amountPaid: 0,
      amountDue: 879.06,
      currency: 'USD',
      lineItems: [
        {
          id: 'li-2',
          description: 'Professional Plan (3 facilities)',
          quantity: 3,
          unitPrice: 299,
          total: 897,
          periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        },
      ],
      createdAt: new Date(now.getFullYear(), now.getMonth(), 1),
      updatedAt: new Date(now.getFullYear(), now.getMonth(), 1),
    },
  ];

  let filtered = invoices;
  if (filter?.status) {
    filtered = filtered.filter((i) => i.status === filter.status);
  }

  return filtered;
}

// Get invoice
export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const invoices = await getInvoices();
  return invoices.find((i) => i.id === invoiceId) || null;
}

// Get payment methods
export async function getPaymentMethods(organizationId: string): Promise<PaymentMethodInfo[]> {
  return [
    {
      id: 'pm-1',
      type: 'card',
      isDefault: true,
      card: {
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2026,
      },
      billingAddress: {
        name: 'Central Ice Arena',
        street: '123 Ice Way',
        city: 'Frostville',
        state: 'MN',
        zipCode: '55001',
        country: 'US',
      },
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'pm-2',
      type: 'card',
      isDefault: false,
      card: {
        brand: 'mastercard',
        last4: '5555',
        expiryMonth: 8,
        expiryYear: 2025,
      },
      createdAt: new Date('2023-06-15'),
    },
  ];
}

// Add payment method (would integrate with Stripe in production)
export async function addPaymentMethod(
  organizationId: string,
  paymentMethodToken: string
): Promise<PaymentMethodInfo> {
  return {
    id: `pm-${Date.now()}`,
    type: 'card',
    isDefault: false,
    card: {
      brand: 'visa',
      last4: '1234',
      expiryMonth: 12,
      expiryYear: 2027,
    },
    createdAt: new Date(),
  };
}

// Get usage records
export async function getUsageRecords(
  organizationId: string,
  months: number = 6
): Promise<UsageRecord[]> {
  const records: UsageRecord[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    records.push({
      id: `usage-${i}`,
      organizationId,
      subscriptionId: 'sub-1',
      period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      facilities: 3,
      users: 18 + Math.floor(Math.random() * 5),
      rinks: 6,
      storageUsedGb: 12.5 + Math.random() * 3,
      apiCalls: 45000 + Math.floor(Math.random() * 20000),
      includedLimits: {
        facilities: 5,
        users: 25,
        rinks: 15,
        storageGb: 25,
        apiCallsPerMonth: 100000,
      },
      overages: {
        facilities: 0,
        users: 0,
        rinks: 0,
        storageGb: 0,
        apiCalls: 0,
      },
      overageCharges: 0,
      createdAt: date,
    });
  }

  return records;
}

// Get payment transactions
export async function getPaymentTransactions(
  organizationId: string
): Promise<PaymentTransaction[]> {
  const now = new Date();

  return [
    {
      id: 'txn-1',
      organizationId,
      invoiceId: 'inv-1',
      amount: 879.06,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: 'card',
      paymentMethodDetails: 'Visa ending in 4242',
      description: 'Invoice INV-2024-001',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'txn-2',
      organizationId,
      invoiceId: 'inv-0',
      amount: 879.06,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: 'card',
      paymentMethodDetails: 'Visa ending in 4242',
      description: 'Invoice INV-2023-012',
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
  ];
}

// Get billing stats
export async function getBillingStats(): Promise<BillingStats> {
  return {
    currentMrr: 25470,
    previousMrr: 24180,
    mrrGrowth: 5.3,
    activeSubscriptions: 42,
    trialingSubscriptions: 5,
    churnedThisMonth: 2,
    revenueThisMonth: 28350,
    outstandingInvoices: 8,
    overdueAmount: 2340,
  };
}

// Process payment
export async function processPayment(
  invoiceId: string,
  paymentMethodId: string
): Promise<PaymentTransaction> {
  // In production, this would integrate with Stripe
  return {
    id: `txn-${Date.now()}`,
    organizationId: 'org-1',
    invoiceId,
    amount: 879.06,
    currency: 'USD',
    status: 'succeeded',
    paymentMethod: 'card',
    description: `Invoice ${invoiceId}`,
    createdAt: new Date(),
  };
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Get billing interval label
export function getBillingIntervalLabel(interval: BillingInterval): string {
  const labels: Record<BillingInterval, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annually: 'Annually',
  };
  return labels[interval];
}

// Get invoice status color
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    void: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return colors[status];
}

// Calculate plan savings
export function calculateSavings(plan: SubscriptionPlan, interval: BillingInterval): number {
  const monthlyTotal = plan.pricing.monthly * (interval === 'quarterly' ? 3 : interval === 'annually' ? 12 : 1);
  const actualPrice = plan.pricing[interval];
  return monthlyTotal - actualPrice;
}
