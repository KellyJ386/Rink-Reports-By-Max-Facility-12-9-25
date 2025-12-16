// Equipment & Asset Management Types

export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired' | 'lost';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair';
export type MaintenanceType = 'scheduled' | 'repair' | 'inspection' | 'cleaning';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  defaultCheckoutDuration?: number; // in hours
  requiresDeposit?: boolean;
  depositAmount?: number;
  assetCount: number;
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  facilityId: string;
  facilityName: string;
  locationId?: string;
  locationName?: string;
  status: AssetStatus;
  condition: AssetCondition;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiration?: Date;
  expectedLifespan?: number; // in months
  currentValue?: number;
  specifications?: Record<string, string>;
  images?: string[];
  notes?: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  totalCheckouts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentCheckout {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  borrowerId: string;
  borrowerName: string;
  borrowerType: 'customer' | 'staff' | 'team';
  borrowerContact?: string;
  checkoutDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  status: 'active' | 'returned' | 'overdue' | 'lost';
  conditionAtCheckout: AssetCondition;
  conditionAtReturn?: AssetCondition;
  depositPaid?: number;
  depositReturned?: boolean;
  notes?: string;
  checkedOutBy: string;
  checkedInBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  title: string;
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  performedBy?: string;
  cost?: number;
  vendor?: string;
  parts?: { name: string; quantity: number; cost: number }[];
  laborHours?: number;
  findings?: string;
  resolution?: string;
  nextMaintenanceDue?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceSchedule {
  id: string;
  assetId?: string;
  categoryId?: string;
  name: string;
  description?: string;
  type: MaintenanceType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'custom';
  customIntervalDays?: number;
  instructions?: string;
  estimatedDuration?: number; // in minutes
  estimatedCost?: number;
  lastPerformed?: Date;
  nextDue: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  sku?: string;
  barcode?: string;
  unitOfMeasure: string;
  currentQuantity: number;
  minimumQuantity: number;
  reorderQuantity: number;
  unitCost: number;
  supplier?: string;
  supplierPartNumber?: string;
  locationId?: string;
  locationName?: string;
  lastRestocked?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'receive' | 'issue' | 'adjust' | 'return' | 'write_off';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  referenceNumber?: string;
  performedBy: string;
  createdAt: Date;
}

export interface AssetLocation {
  id: string;
  name: string;
  facilityId: string;
  facilityName: string;
  description?: string;
  floor?: string;
  room?: string;
  parentLocationId?: string;
  assetCount: number;
}

export interface AssetFilter {
  categoryId?: string;
  facilityId?: string;
  locationId?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  search?: string;
}

export interface MaintenanceFilter {
  assetId?: string;
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface AssetStats {
  totalAssets: number;
  byStatus: Record<AssetStatus, number>;
  byCondition: Record<AssetCondition, number>;
  totalValue: number;
  maintenanceDueSoon: number;
  overdueCheckouts: number;
  lowStockItems: number;
}
