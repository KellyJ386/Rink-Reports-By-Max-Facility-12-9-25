import { UserRole, FormCategory, FieldType, SeverityLevel, ThresholdModule, NotificationChannel } from '@prisma/client';

// Re-export Prisma enums
export { UserRole, FormCategory, FieldType, SeverityLevel, ThresholdModule, NotificationChannel };

// Threshold Configuration types
export interface ThresholdConfig {
  id: string;
  facilityId: string;
  rinkId?: string | null;
  rinkName?: string;
  module: ThresholdModule;
  parameterName: string;
  minValue?: number | null;
  maxValue?: number | null;
  warningMin?: number | null;
  warningMax?: number | null;
  alertEnabled: boolean;
  alertSeverity: SeverityLevel;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationConfigData {
  id: string;
  facilityId: string;
  module: ThresholdModule;
  alertSeverity: SeverityLevel;
  recipientRole?: UserRole | null;
  recipientUserId?: string | null;
  recipientName?: string;
  channels: NotificationChannel[];
  isEnabled: boolean;
  requiresAck: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Default threshold values for different modules
export const DEFAULT_THRESHOLDS: Record<ThresholdModule, Record<string, { min?: number; max?: number; warningMin?: number; warningMax?: number; unit: string; label: string }>> = {
  ICE_DEPTH: {
    ice_depth: { min: 0.75, max: 1.5, warningMin: 0.85, warningMax: 1.4, unit: 'inches', label: 'Ice Depth' },
  },
  REFRIGERATION: {
    brine_supply: { min: 10, max: 22, warningMin: 12, warningMax: 20, unit: '°F', label: 'Brine Supply Temp' },
    brine_return: { min: 14, max: 26, warningMin: 16, warningMax: 24, unit: '°F', label: 'Brine Return Temp' },
    compressor_suction: { min: 20, max: 40, warningMin: 22, warningMax: 38, unit: 'PSI', label: 'Compressor Suction' },
    compressor_discharge: { min: 150, max: 250, warningMin: 160, warningMax: 240, unit: 'PSI', label: 'Compressor Discharge' },
    condenser_in: { min: 70, max: 105, warningMin: 75, warningMax: 100, unit: '°F', label: 'Condenser In Temp' },
    condenser_out: { min: 80, max: 115, warningMin: 85, warningMax: 110, unit: '°F', label: 'Condenser Out Temp' },
    oil_pressure: { min: 30, max: 80, warningMin: 35, warningMax: 75, unit: 'PSI', label: 'Oil Pressure' },
  },
  AIR_QUALITY: {
    co2_level: { max: 1000, warningMax: 800, unit: 'ppm', label: 'CO2 Level' },
    co_level: { max: 25, warningMax: 15, unit: 'ppm', label: 'CO Level' },
    temperature: { min: 45, max: 65, warningMin: 48, warningMax: 62, unit: '°F', label: 'Temperature' },
    humidity: { min: 30, max: 60, warningMin: 35, warningMax: 55, unit: '%', label: 'Humidity' },
  },
};

// User types
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: UserRole;
}

export interface UserWithFacilities extends SessionUser {
  facilityUsers: {
    facilityId: string;
    role: UserRole;
    facility: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

// Form Builder types
export interface FormFieldOption {
  value: string;
  label: string;
}

export interface ConditionalLogic {
  showIf: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number | boolean;
  };
}

export interface FormFieldConfig {
  id: string;
  fieldType: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: FormFieldOption[];
  orderIndex: number;
  sectionId?: string;
  width: 'full' | 'half' | 'third';
  conditionalLogic?: ConditionalLogic;
  defaultValue?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  isCollapsible: boolean;
  fields: FormFieldConfig[];
}

export interface FormTemplateConfig {
  id: string;
  name: string;
  description?: string;
  category: FormCategory;
  includeWeather: boolean;
  includeTimestamp: boolean;
  includeUser: boolean;
  includeFacility: boolean;
  sections: FormSection[];
}

// Weather types
export interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  icon?: string;
}

// Ice Depth types
export interface IceDepthPoint {
  pointId: string;
  x: number;
  y: number;
  depth: number | null;
  label?: string; // Optional custom label for the point
}

export interface IceDepthConfig {
  points: number; // Now supports any number of points
  layout: IceDepthPoint[];
}

// Custom Diagram Configuration
export interface CustomDiagramConfig {
  id: string;
  name: string;
  description?: string;
  rinkType: 'standard' | 'olympic' | 'recreational' | 'curling' | 'custom';
  dimensions: {
    length: number; // feet
    width: number;  // feet
  };
  points: IceDepthPoint[];
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
}

// Preset diagram types
export type PresetDiagramType = '25-point' | '35-point' | '47-point' | 'custom';

// Bluetooth Device types for ice depth measurement
export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  lastReading?: number;
  lastReadingTime?: Date;
}

export interface BluetoothReading {
  deviceId: string;
  value: number;
  unit: 'inches' | 'mm' | 'cm';
  timestamp: Date;
  signalStrength?: number;
}

export interface BluetoothConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  device: BluetoothDevice | null;
  error?: string;
}

// Incident Report types
export interface BodyInjury {
  id: string;
  bodyPart: string;
  x: number;
  y: number;
  description: string;
}

export interface BodyDiagramData {
  injuries: BodyInjury[];
}

// Schedule types
export interface ShiftData {
  id: string;
  userId: string;
  userName: string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  position?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard Analytics
export interface DashboardStats {
  totalSubmissions: number;
  pendingReviews: number;
  activeIncidents: number;
  scheduledShifts: number;
  alertsCount: number;
}

// Role permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  FACILITY_ADMIN: [
    'forms:create',
    'forms:edit',
    'forms:delete',
    'forms:submit',
    'users:manage',
    'reports:view',
    'settings:manage',
    'ice:manage',
    'schedule:manage',
    'incidents:manage',
  ],
  MANAGER: [
    'forms:submit',
    'reports:view',
    'schedule:manage',
    'incidents:view',
    'ice:view',
  ],
  SUPERVISOR: [
    'forms:submit',
    'schedule:view',
    'schedule:approve_timeoff',
    'incidents:view',
    'ice:view',
  ],
  ICE_TECHNICIAN: [
    'forms:submit',
    'ice:manage',
    'schedule:view',
  ],
  STAFF: [
    'forms:submit',
    'schedule:view',
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

export function canAccessFormBuilder(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'FACILITY_ADMIN';
}
