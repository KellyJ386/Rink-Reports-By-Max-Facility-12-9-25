'use client';

import { useState, useEffect } from 'react';
import {
  CreditCardIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getSubscription,
  getSubscriptionPlans,
  getInvoices,
  getPaymentMethods,
  getUsageRecords,
  getBillingStats,
  formatCurrency,
  getBillingIntervalLabel,
  getInvoiceStatusColor,
  calculateSavings,
} from '@/lib/billing';
import type {
  Subscription,
  SubscriptionPlan,
  Invoice,
  PaymentMethodInfo,
  UsageRecord,
  BillingStats,
  BillingInterval,
} from '@/lib/billing';
import { cn } from '@/lib/utils';

type TabType = 'overview' | 'invoices' | 'subscription' | 'usage';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subData, plansData, invoicesData, pmData, usageData, statsData] = await Promise.all([
        getSubscription('org-1'),
        getSubscriptionPlans(),
        getInvoices(),
        getPaymentMethods('org-1'),
        getUsageRecords('org-1'),
        getBillingStats(),
      ]);

      setSubscription(subData);
      setPlans(plansData);
      setInvoices(invoicesData);
      setPaymentMethods(pmData);
      setUsage(usageData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = plans.find((p) => p.id === subscription?.planId);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: ChartBarIcon },
    { id: 'invoices' as const, label: 'Invoices', icon: DocumentTextIcon },
    { id: 'subscription' as const, label: 'Subscription', icon: CreditCardIcon },
    { id: 'usage' as const, label: 'Usage', icon: ArrowTrendingUpIcon },
  ];

  const getCardBrandIcon = (brand: string) => {
    // In production, would use actual brand icons
    return <CreditCardIcon className="w-8 h-8 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, invoices, and payment methods
          </p>
        </div>
        <Button>
          <CreditCardIcon className="w-4 h-4 mr-2" />
          Update Payment Method
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.currentMrr)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeSubscriptions}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.outstandingInvoices}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.overdueAmount)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b dark:border-gray-700">
        <div className="flex gap-4 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && subscription && currentPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Plan */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Current Plan
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {subscription.planName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {subscription.quantity} facilities • {getBillingIntervalLabel(subscription.billingInterval)}
                    </p>
                  </div>
                  <span className={cn(
                    'px-3 py-1 text-sm font-medium rounded-full',
                    subscription.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700'
                  )}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Plan Price</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(subscription.unitPrice * subscription.quantity)}
                    </span>
                  </div>
                  {subscription.discount && (
                    <div className="flex justify-between mb-2 text-green-600">
                      <span>Discount ({subscription.discount.value}%)</span>
                      <span>
                        -{formatCurrency((subscription.unitPrice * subscription.quantity) * (subscription.discount.value / 100))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t dark:border-gray-700 font-medium">
                    <span className="text-gray-900 dark:text-white">Monthly Total</span>
                    <span className="text-primary-600">
                      {formatCurrency(
                        (subscription.unitPrice * subscription.quantity) *
                        (1 - (subscription.discount?.value || 0) / 100)
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>Next billing date</span>
                  <span>{subscription.nextPaymentDate.toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1">
                    Change Plan
                  </Button>
                  <Button variant="ghost">Manage</Button>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Payment Methods
                  </h3>
                  <Button variant="ghost" size="sm">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg border',
                        pm.isDefault
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                      )}
                    >
                      {getCardBrandIcon(pm.card?.brand || '')}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {pm.card?.brand.toUpperCase()} •••• {pm.card?.last4}
                        </p>
                        <p className="text-sm text-gray-500">
                          Expires {pm.card?.expiryMonth}/{pm.card?.expiryYear}
                        </p>
                      </div>
                      {pm.isDefault && (
                        <span className="text-xs font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Invoices */}
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Recent Invoices
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('invoices')}>
                    View All
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="pb-3">Invoice</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {invoices.slice(0, 5).map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="py-3 font-medium text-gray-900 dark:text-white">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">
                            {invoice.issueDate.toLocaleDateString()}
                          </td>
                          <td className="py-3 text-gray-900 dark:text-white">
                            {formatCurrency(invoice.total)}
                          </td>
                          <td className="py-3 text-center">
                            <span className={cn('px-2 py-1 text-xs font-medium rounded', getInvoiceStatusColor(invoice.status))}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Button variant="ghost" size="sm">
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <Card className="overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">All Invoices</h3>
                  <div className="flex gap-2">
                    <select className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-2">
                      <option>All Status</option>
                      <option>Paid</option>
                      <option>Pending</option>
                      <option>Overdue</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Issue Date</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {invoice.organizationName}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {invoice.issueDate.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {invoice.dueDate.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('px-2 py-1 text-xs font-medium rounded', getInvoiceStatusColor(invoice.status))}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Billing Interval Toggle */}
              <div className="flex justify-center">
                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
                  {(['monthly', 'quarterly', 'annually'] as BillingInterval[]).map((interval) => (
                    <button
                      key={interval}
                      onClick={() => setSelectedInterval(interval)}
                      className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        selectedInterval === interval
                          ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      )}
                    >
                      {getBillingIntervalLabel(interval)}
                      {interval === 'annually' && (
                        <span className="ml-1 text-xs text-green-600">Save 20%</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const isCurrentPlan = subscription?.planId === plan.id;
                  const savings = calculateSavings(plan, selectedInterval);

                  return (
                    <Card
                      key={plan.id}
                      className={cn(
                        'p-6 relative',
                        plan.isPopular && 'ring-2 ring-primary-500',
                        isCurrentPlan && 'border-green-500'
                      )}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      )}
                      {isCurrentPlan && (
                        <span className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                          Current Plan
                        </span>
                      )}

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                      <div className="mb-6">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(plan.pricing[selectedInterval])}
                        </span>
                        <span className="text-gray-500">
                          /{selectedInterval === 'monthly' ? 'mo' : selectedInterval === 'quarterly' ? 'qtr' : 'yr'}
                        </span>
                        {savings > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            Save {formatCurrency(savings)}
                          </p>
                        )}
                      </div>

                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? 'secondary' : plan.isPopular ? 'primary' : 'secondary'}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? 'Current Plan' : plan.isEnterprise ? 'Contact Sales' : 'Select Plan'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && currentPlan && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Current Period Usage
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: 'Facilities', used: usage[0]?.facilities || 0, limit: currentPlan.limits.facilities },
                    { label: 'Users', used: usage[0]?.users || 0, limit: currentPlan.limits.users },
                    { label: 'Rinks', used: usage[0]?.rinks || 0, limit: currentPlan.limits.rinks },
                    { label: 'Storage', used: usage[0]?.storageUsedGb || 0, limit: currentPlan.limits.storageGb, unit: 'GB' },
                    { label: 'API Calls', used: usage[0]?.apiCalls || 0, limit: currentPlan.limits.apiCallsPerMonth, format: 'number' },
                  ].map((metric) => {
                    const percentage = metric.limit === -1 ? 0 : (metric.used / metric.limit) * 100;
                    const isNearLimit = percentage >= 80;

                    return (
                      <div key={metric.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
                          <span className={cn(
                            'font-medium',
                            isNearLimit ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
                          )}>
                            {metric.format === 'number'
                              ? metric.used.toLocaleString()
                              : typeof metric.used === 'number' && metric.unit
                              ? `${metric.used.toFixed(1)} ${metric.unit}`
                              : metric.used}
                            {metric.limit !== -1 && (
                              <span className="text-gray-500">
                                {' / '}
                                {metric.format === 'number'
                                  ? metric.limit.toLocaleString()
                                  : metric.unit
                                  ? `${metric.limit} ${metric.unit}`
                                  : metric.limit}
                              </span>
                            )}
                            {metric.limit === -1 && (
                              <span className="text-gray-500"> (Unlimited)</span>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              isNearLimit ? 'bg-yellow-500' : 'bg-primary-500'
                            )}
                            style={{ width: metric.limit === -1 ? '0%' : `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Usage History */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Usage History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="pb-3">Period</th>
                        <th className="pb-3 text-center">Facilities</th>
                        <th className="pb-3 text-center">Users</th>
                        <th className="pb-3 text-center">Storage</th>
                        <th className="pb-3 text-center">API Calls</th>
                        <th className="pb-3 text-right">Overages</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {usage.map((record) => (
                        <tr key={record.id}>
                          <td className="py-3 font-medium text-gray-900 dark:text-white">
                            {record.period}
                          </td>
                          <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                            {record.facilities}
                          </td>
                          <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                            {record.users}
                          </td>
                          <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                            {record.storageUsedGb.toFixed(1)} GB
                          </td>
                          <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                            {record.apiCalls.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-gray-900 dark:text-white">
                            {record.overageCharges > 0 ? formatCurrency(record.overageCharges) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
