import { UserRole, FormCategory, FieldType, SeverityLevel } from '@prisma/client';

// Re-export Prisma enums
export { UserRole, FormCategory, FieldType, SeverityLevel };

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
}

export interface IceDepthConfig {
  points: 25 | 35 | 47;
  layout: IceDepthPoint[];
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
