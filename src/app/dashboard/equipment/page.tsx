'use client';

import { useState, useEffect } from 'react';
import {
  WrenchScrewdriverIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  getAssets,
  getAssetCategories,
  getAssetStats,
  getCheckouts,
  getMaintenanceRecords,
  getInventoryItems,
  statusLabels,
  conditionLabels,
  formatCurrency,
} from '@/lib/equipment';
import type {
  Asset,
  AssetCategory,
  AssetStats,
  EquipmentCheckout,
  MaintenanceRecord,
  InventoryItem,
  AssetStatus,
} from '@/lib/equipment';
import { cn } from '@/lib/utils';

type TabType = 'assets' | 'checkouts' | 'maintenance' | 'inventory';

export default function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('assets');
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [checkouts, setCheckouts] = useState<EquipmentCheckout[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | ''>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, categoriesData, assetsData, checkoutsData, maintenanceData, inventoryData] =
        await Promise.all([
          getAssetStats(),
          getAssetCategories(),
          getAssets(),
          getCheckouts(),
          getMaintenanceRecords(),
          getInventoryItems(),
        ]);

      setStats(statsData);
      setCategories(categoriesData);
      setAssets(assetsData);
      setCheckouts(checkoutsData);
      setMaintenance(maintenanceData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Failed to load equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      !searchQuery ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || asset.categoryId === selectedCategory;
    const matchesStatus = !selectedStatus || asset.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: AssetStatus) => {
    const colors: Record<AssetStatus, string> = {
      available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      in_use: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      retired: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
      lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status];
  };

  const tabs = [
    { id: 'assets' as const, label: 'Assets', icon: CubeIcon },
    { id: 'checkouts' as const, label: 'Checkouts', icon: ArrowPathIcon },
    { id: 'maintenance' as const, label: 'Maintenance', icon: WrenchScrewdriverIcon },
    { id: 'inventory' as const, label: 'Inventory', icon: CubeIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Equipment & Assets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage equipment, track assets, and schedule maintenance
          </p>
        </div>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CubeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalAssets}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.byStatus.available}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <WrenchScrewdriverIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Maintenance Due</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.maintenanceDueSoon}
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
                <p className="text-sm text-gray-500">Overdue Returns</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.overdueCheckouts}
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

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as AssetStatus | '')}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                >
                  <option value="">All Status</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Asset List */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Asset</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Category</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Location</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Condition</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {filteredAssets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{asset.name}</p>
                              <p className="text-sm text-gray-500">{asset.assetTag}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {asset.categoryName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {asset.locationName || '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn('px-2 py-1 text-xs font-medium rounded', getStatusColor(asset.status))}>
                              {statusLabels[asset.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                            {conditionLabels[asset.condition]}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Checkouts Tab */}
          {activeTab === 'checkouts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">Active Checkouts</h3>
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Checkout
                </Button>
              </div>

              <div className="grid gap-4">
                {checkouts.map((checkout) => (
                  <Card key={checkout.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-2 rounded-lg',
                          checkout.status === 'overdue'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        )}>
                          <CubeIcon className={cn(
                            'w-6 h-6',
                            checkout.status === 'overdue'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-blue-600 dark:text-blue-400'
                          )} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{checkout.assetName}</h4>
                          <p className="text-sm text-gray-500">{checkout.assetTag}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Borrowed by: {checkout.borrowerName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Expected Return</p>
                          <p className={cn(
                            'font-medium',
                            checkout.status === 'overdue'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          )}>
                            {checkout.expectedReturnDate.toLocaleString()}
                          </p>
                          {checkout.status === 'overdue' && (
                            <span className="text-xs text-red-600 font-medium">OVERDUE</span>
                          )}
                        </div>
                        <Button variant="secondary" size="sm">
                          Return
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {checkouts.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No active checkouts</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">Maintenance Records</h3>
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Schedule Maintenance
                </Button>
              </div>

              <div className="grid gap-4">
                {maintenance.map((record) => (
                  <Card key={record.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-2 rounded-lg',
                          record.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : record.status === 'in_progress'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30'
                            : 'bg-gray-100 dark:bg-gray-700'
                        )}>
                          <WrenchScrewdriverIcon className={cn(
                            'w-6 h-6',
                            record.status === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : record.status === 'in_progress'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-600 dark:text-gray-400'
                          )} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{record.title}</h4>
                          <p className="text-sm text-gray-500">{record.assetName} ({record.assetTag})</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {record.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={cn(
                            'px-2 py-1 text-xs font-medium rounded',
                            record.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : record.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                          )}>
                            {record.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {record.scheduledDate.toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">Inventory Items</h3>
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Item</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Category</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">In Stock</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Min Qty</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Unit Cost</th>
                        <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {inventory.map((item) => {
                        const isLow = item.currentQuantity <= item.minimumQuantity;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.sku}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {item.categoryName}
                            </td>
                            <td className={cn(
                              'px-4 py-3 text-center font-medium',
                              isLow ? 'text-red-600' : 'text-gray-900 dark:text-white'
                            )}>
                              {item.currentQuantity} {item.unitOfMeasure}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                              {item.minimumQuantity}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                              {formatCurrency(item.unitCost)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isLow ? (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm">Adjust</Button>
                            </td>
                          </tr>
                        );
                      })}
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
