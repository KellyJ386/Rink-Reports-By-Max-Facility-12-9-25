// Equipment & Asset Management Service

import type {
  Asset,
  AssetCategory,
  AssetLocation,
  AssetStatus,
  AssetCondition,
  AssetFilter,
  AssetStats,
  EquipmentCheckout,
  MaintenanceRecord,
  MaintenanceSchedule,
  MaintenanceFilter,
  InventoryItem,
  InventoryTransaction,
} from './types';

// Get asset categories
export async function getAssetCategories(): Promise<AssetCategory[]> {
  return [
    { id: 'cat-1', name: 'Skates', description: 'Ice skates for rental', assetCount: 250, requiresDeposit: true, depositAmount: 25 },
    { id: 'cat-2', name: 'Hockey Equipment', description: 'Hockey sticks, helmets, pads', assetCount: 150, requiresDeposit: true, depositAmount: 50 },
    { id: 'cat-3', name: 'Figure Skating Equipment', description: 'Practice aids and accessories', assetCount: 45 },
    { id: 'cat-4', name: 'Maintenance Equipment', description: 'Ice maintenance tools and machines', assetCount: 25 },
    { id: 'cat-5', name: 'Safety Equipment', description: 'First aid, AEDs, safety gear', assetCount: 35 },
    { id: 'cat-6', name: 'AV Equipment', description: 'Sound systems, displays, projectors', assetCount: 15 },
    { id: 'cat-7', name: 'Furniture', description: 'Tables, chairs, benches', assetCount: 80 },
  ];
}

// Get assets
export async function getAssets(filter?: AssetFilter): Promise<Asset[]> {
  const now = new Date();
  const assets: Asset[] = [
    {
      id: 'asset-1',
      assetTag: 'SKT-001',
      name: 'Rental Skates - Size 8',
      categoryId: 'cat-1',
      categoryName: 'Skates',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      locationId: 'loc-1',
      locationName: 'Rental Counter',
      status: 'available',
      condition: 'good',
      manufacturer: 'Bauer',
      model: 'Rental Pro',
      purchaseDate: new Date('2023-01-15'),
      purchasePrice: 89.99,
      totalCheckouts: 127,
      createdAt: new Date('2023-01-15'),
      updatedAt: now,
    },
    {
      id: 'asset-2',
      assetTag: 'ZAM-001',
      name: 'Zamboni 552',
      categoryId: 'cat-4',
      categoryName: 'Maintenance Equipment',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      locationId: 'loc-3',
      locationName: 'Equipment Bay',
      status: 'available',
      condition: 'excellent',
      serialNumber: 'ZM552-2022-1234',
      manufacturer: 'Zamboni',
      model: '552',
      purchaseDate: new Date('2022-06-01'),
      purchasePrice: 125000,
      warrantyExpiration: new Date('2025-06-01'),
      expectedLifespan: 180,
      currentValue: 95000,
      lastMaintenanceDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      nextMaintenanceDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
      totalCheckouts: 0,
      createdAt: new Date('2022-06-01'),
      updatedAt: now,
    },
    {
      id: 'asset-3',
      assetTag: 'HCK-015',
      name: 'Hockey Helmet - Medium',
      categoryId: 'cat-2',
      categoryName: 'Hockey Equipment',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      locationId: 'loc-1',
      locationName: 'Rental Counter',
      status: 'in_use',
      condition: 'fair',
      manufacturer: 'CCM',
      model: 'Tacks 310',
      purchaseDate: new Date('2023-03-20'),
      purchasePrice: 65,
      totalCheckouts: 89,
      createdAt: new Date('2023-03-20'),
      updatedAt: now,
    },
    {
      id: 'asset-4',
      assetTag: 'AED-001',
      name: 'AED Defibrillator',
      categoryId: 'cat-5',
      categoryName: 'Safety Equipment',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      locationId: 'loc-2',
      locationName: 'Main Lobby',
      status: 'available',
      condition: 'excellent',
      serialNumber: 'AED-2023-5678',
      manufacturer: 'Philips',
      model: 'HeartStart FRx',
      purchaseDate: new Date('2023-09-01'),
      purchasePrice: 1800,
      warrantyExpiration: new Date('2028-09-01'),
      lastMaintenanceDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      nextMaintenanceDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      totalCheckouts: 0,
      createdAt: new Date('2023-09-01'),
      updatedAt: now,
    },
    {
      id: 'asset-5',
      assetTag: 'SKT-142',
      name: 'Rental Skates - Size 10',
      categoryId: 'cat-1',
      categoryName: 'Skates',
      facilityId: 'fac-1',
      facilityName: 'Central Ice Arena',
      locationId: 'loc-1',
      locationName: 'Rental Counter',
      status: 'maintenance',
      condition: 'needs_repair',
      manufacturer: 'Bauer',
      model: 'Rental Pro',
      purchaseDate: new Date('2022-11-10'),
      purchasePrice: 89.99,
      totalCheckouts: 203,
      notes: 'Blade needs sharpening, left boot liner worn',
      createdAt: new Date('2022-11-10'),
      updatedAt: now,
    },
  ];

  // Apply filters
  let filtered = assets;
  if (filter?.categoryId) {
    filtered = filtered.filter((a) => a.categoryId === filter.categoryId);
  }
  if (filter?.status) {
    filtered = filtered.filter((a) => a.status === filter.status);
  }
  if (filter?.condition) {
    filtered = filtered.filter((a) => a.condition === filter.condition);
  }
  if (filter?.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(search) ||
        a.assetTag.toLowerCase().includes(search) ||
        a.serialNumber?.toLowerCase().includes(search)
    );
  }

  return filtered;
}

// Get single asset
export async function getAsset(assetId: string): Promise<Asset | null> {
  const assets = await getAssets();
  return assets.find((a) => a.id === assetId) || null;
}

// Create asset
export async function createAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'totalCheckouts'>): Promise<Asset> {
  const now = new Date();
  return {
    ...asset,
    id: `asset-${Date.now()}`,
    totalCheckouts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

// Update asset
export async function updateAsset(assetId: string, updates: Partial<Asset>): Promise<Asset> {
  const asset = await getAsset(assetId);
  if (!asset) throw new Error('Asset not found');

  return {
    ...asset,
    ...updates,
    updatedAt: new Date(),
  };
}

// Get asset locations
export async function getAssetLocations(facilityId?: string): Promise<AssetLocation[]> {
  return [
    { id: 'loc-1', name: 'Rental Counter', facilityId: 'fac-1', facilityName: 'Central Ice Arena', floor: '1', assetCount: 350 },
    { id: 'loc-2', name: 'Main Lobby', facilityId: 'fac-1', facilityName: 'Central Ice Arena', floor: '1', assetCount: 45 },
    { id: 'loc-3', name: 'Equipment Bay', facilityId: 'fac-1', facilityName: 'Central Ice Arena', floor: 'B1', assetCount: 30 },
    { id: 'loc-4', name: 'Storage Room A', facilityId: 'fac-1', facilityName: 'Central Ice Arena', floor: '1', assetCount: 75 },
    { id: 'loc-5', name: 'Locker Room 1', facilityId: 'fac-1', facilityName: 'Central Ice Arena', floor: '1', assetCount: 25 },
  ];
}

// Get equipment checkouts
export async function getCheckouts(options?: { status?: string; assetId?: string }): Promise<EquipmentCheckout[]> {
  const now = new Date();
  const checkouts: EquipmentCheckout[] = [
    {
      id: 'checkout-1',
      assetId: 'asset-3',
      assetTag: 'HCK-015',
      assetName: 'Hockey Helmet - Medium',
      borrowerId: 'customer-1',
      borrowerName: 'John Smith',
      borrowerType: 'customer',
      borrowerContact: 'john@example.com',
      checkoutDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      expectedReturnDate: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      status: 'active',
      conditionAtCheckout: 'fair',
      depositPaid: 50,
      checkedOutBy: 'staff-1',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'checkout-2',
      assetId: 'asset-1',
      assetTag: 'SKT-001',
      assetName: 'Rental Skates - Size 8',
      borrowerId: 'customer-2',
      borrowerName: 'Jane Doe',
      borrowerType: 'customer',
      checkoutDate: new Date(now.getTime() - 25 * 60 * 60 * 1000),
      expectedReturnDate: new Date(now.getTime() - 23 * 60 * 60 * 1000),
      status: 'overdue',
      conditionAtCheckout: 'good',
      depositPaid: 25,
      checkedOutBy: 'staff-2',
      createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
      updatedAt: now,
    },
  ];

  let filtered = checkouts;
  if (options?.status) {
    filtered = filtered.filter((c) => c.status === options.status);
  }
  if (options?.assetId) {
    filtered = filtered.filter((c) => c.assetId === options.assetId);
  }

  return filtered;
}

// Create checkout
export async function createCheckout(
  checkout: Omit<EquipmentCheckout, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<EquipmentCheckout> {
  const now = new Date();
  return {
    ...checkout,
    id: `checkout-${Date.now()}`,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

// Return checkout
export async function returnCheckout(
  checkoutId: string,
  conditionAtReturn: AssetCondition,
  notes?: string
): Promise<EquipmentCheckout> {
  const checkouts = await getCheckouts();
  const checkout = checkouts.find((c) => c.id === checkoutId);
  if (!checkout) throw new Error('Checkout not found');

  return {
    ...checkout,
    status: 'returned',
    conditionAtReturn,
    actualReturnDate: new Date(),
    notes,
    updatedAt: new Date(),
  };
}

// Get maintenance records
export async function getMaintenanceRecords(filter?: MaintenanceFilter): Promise<MaintenanceRecord[]> {
  const now = new Date();
  const records: MaintenanceRecord[] = [
    {
      id: 'maint-1',
      assetId: 'asset-2',
      assetTag: 'ZAM-001',
      assetName: 'Zamboni 552',
      type: 'scheduled',
      status: 'completed',
      title: 'Monthly Service',
      description: 'Regular monthly maintenance check',
      scheduledDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      completedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      performedBy: 'Mike Johnson',
      cost: 450,
      laborHours: 3,
      findings: 'All systems operating normally',
      resolution: 'Oil changed, blade inspected, filters replaced',
      nextMaintenanceDue: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
      createdBy: 'admin-1',
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'maint-2',
      assetId: 'asset-5',
      assetTag: 'SKT-142',
      assetName: 'Rental Skates - Size 10',
      type: 'repair',
      status: 'in_progress',
      title: 'Blade Sharpening & Boot Repair',
      description: 'Blade needs sharpening, left boot liner replacement',
      scheduledDate: now,
      performedBy: 'Equipment Team',
      createdBy: 'staff-1',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
    {
      id: 'maint-3',
      assetId: 'asset-4',
      assetTag: 'AED-001',
      assetName: 'AED Defibrillator',
      type: 'inspection',
      status: 'scheduled',
      title: 'Quarterly Inspection',
      description: 'Required quarterly AED inspection and battery check',
      scheduledDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      createdBy: 'admin-1',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
  ];

  let filtered = records;
  if (filter?.assetId) {
    filtered = filtered.filter((r) => r.assetId === filter.assetId);
  }
  if (filter?.type) {
    filtered = filtered.filter((r) => r.type === filter.type);
  }
  if (filter?.status) {
    filtered = filtered.filter((r) => r.status === filter.status);
  }

  return filtered;
}

// Create maintenance record
export async function createMaintenanceRecord(
  record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MaintenanceRecord> {
  const now = new Date();
  return {
    ...record,
    id: `maint-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
}

// Get maintenance schedules
export async function getMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
  const now = new Date();
  return [
    {
      id: 'sched-1',
      assetId: 'asset-2',
      name: 'Zamboni Monthly Service',
      type: 'scheduled',
      frequency: 'monthly',
      instructions: 'Check oil, filters, blade condition, hydraulics',
      estimatedDuration: 180,
      estimatedCost: 450,
      lastPerformed: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      nextDue: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date('2022-06-01'),
      updatedAt: now,
    },
    {
      id: 'sched-2',
      categoryId: 'cat-5',
      name: 'Safety Equipment Inspection',
      type: 'inspection',
      frequency: 'quarterly',
      instructions: 'Inspect all safety equipment, check expiration dates, test functionality',
      estimatedDuration: 120,
      nextDue: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: now,
    },
    {
      id: 'sched-3',
      categoryId: 'cat-1',
      name: 'Skate Blade Sharpening',
      type: 'scheduled',
      frequency: 'weekly',
      instructions: 'Sharpen all rental skate blades, inspect boots',
      estimatedDuration: 240,
      nextDue: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: now,
    },
  ];
}

// Get inventory items
export async function getInventoryItems(): Promise<InventoryItem[]> {
  return [
    {
      id: 'inv-1',
      name: 'Skate Laces - Standard',
      categoryId: 'cat-1',
      categoryName: 'Skates',
      sku: 'SL-001',
      unitOfMeasure: 'pair',
      currentQuantity: 45,
      minimumQuantity: 50,
      reorderQuantity: 100,
      unitCost: 2.50,
      supplier: 'Sports Supply Co',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'inv-2',
      name: 'First Aid Kit Refill',
      categoryId: 'cat-5',
      categoryName: 'Safety Equipment',
      sku: 'FA-REF-001',
      unitOfMeasure: 'kit',
      currentQuantity: 8,
      minimumQuantity: 5,
      reorderQuantity: 10,
      unitCost: 35,
      supplier: 'Medical Supplies Inc',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'inv-3',
      name: 'Zamboni Blade',
      categoryId: 'cat-4',
      categoryName: 'Maintenance Equipment',
      sku: 'ZB-552',
      unitOfMeasure: 'each',
      currentQuantity: 2,
      minimumQuantity: 2,
      reorderQuantity: 4,
      unitCost: 850,
      supplier: 'Zamboni Parts Direct',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'inv-4',
      name: 'Hockey Tape - White',
      categoryId: 'cat-2',
      categoryName: 'Hockey Equipment',
      sku: 'HT-WHT',
      unitOfMeasure: 'roll',
      currentQuantity: 120,
      minimumQuantity: 50,
      reorderQuantity: 200,
      unitCost: 3.25,
      supplier: 'Hockey Pro Shop',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

// Get inventory transactions
export async function getInventoryTransactions(itemId?: string): Promise<InventoryTransaction[]> {
  const now = new Date();
  return [
    {
      id: 'trans-1',
      itemId: 'inv-1',
      itemName: 'Skate Laces - Standard',
      type: 'issue',
      quantity: -5,
      previousQuantity: 50,
      newQuantity: 45,
      reason: 'Rental counter restock',
      performedBy: 'Staff Member',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'trans-2',
      itemId: 'inv-1',
      itemName: 'Skate Laces - Standard',
      type: 'receive',
      quantity: 100,
      previousQuantity: 50,
      newQuantity: 150,
      unitCost: 2.50,
      totalCost: 250,
      referenceNumber: 'PO-2024-001',
      performedBy: 'Inventory Manager',
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  ];
}

// Get asset stats
export async function getAssetStats(): Promise<AssetStats> {
  const assets = await getAssets();
  const checkouts = await getCheckouts();
  const inventory = await getInventoryItems();

  const byStatus: Record<AssetStatus, number> = {
    available: 0,
    in_use: 0,
    maintenance: 0,
    retired: 0,
    lost: 0,
  };

  const byCondition: Record<AssetCondition, number> = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
    needs_repair: 0,
  };

  let totalValue = 0;

  assets.forEach((asset) => {
    byStatus[asset.status]++;
    byCondition[asset.condition]++;
    totalValue += asset.currentValue || asset.purchasePrice || 0;
  });

  return {
    totalAssets: assets.length,
    byStatus,
    byCondition,
    totalValue,
    maintenanceDueSoon: assets.filter(
      (a) => a.nextMaintenanceDate && a.nextMaintenanceDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length,
    overdueCheckouts: checkouts.filter((c) => c.status === 'overdue').length,
    lowStockItems: inventory.filter((i) => i.currentQuantity <= i.minimumQuantity).length,
  };
}

// Status and condition labels
export const statusLabels: Record<AssetStatus, string> = {
  available: 'Available',
  in_use: 'In Use',
  maintenance: 'Under Maintenance',
  retired: 'Retired',
  lost: 'Lost',
};

export const conditionLabels: Record<AssetCondition, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  needs_repair: 'Needs Repair',
};

export const maintenanceTypeLabels: Record<string, string> = {
  scheduled: 'Scheduled Maintenance',
  repair: 'Repair',
  inspection: 'Inspection',
  cleaning: 'Cleaning',
};

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
