// Ice Depth hooks
export {
  useIceDepthReadings,
  useIceDepthAnalysis,
  useCreateIceDepthReading,
  useAnalyzeIceDepth,
} from './useIceDepth';
export type {
  IceDepthReading,
  IceDepthAnalysis,
  CreateReadingInput,
  ReadingPoint,
} from './useIceDepth';

// Incident hooks
export {
  useIncidents,
  useIncident,
  useCreateIncident,
  useUpdateIncident,
} from './useIncidents';
export type {
  Incident,
  CreateIncidentInput,
  UpdateIncidentInput,
} from './useIncidents';

// Alert hooks
export {
  useAlerts,
  useAlertStats,
  useAcknowledgeAlert,
  useResolveAlert,
} from './useAlerts';
export type { Alert, AlertStats } from './useAlerts';

// Schedule hooks
export {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useMoveShift,
  useSchedules,
  useCreateSchedule,
  usePublishSchedule,
  useTimeOffRequests,
  useReviewTimeOff,
} from './useSchedule';
export type {
  Shift as ScheduleShift,
  Schedule,
  TimeOffRequest,
} from './useSchedule';

// Form hooks
export {
  useForms,
  useForm,
  useFormSubmissions,
  useCreateForm,
  useCreateSubmission,
  useAllSubmissions,
} from './useFormSubmissions';
export type {
  FormField,
  FormTemplate,
  FormSubmission,
  SubmissionInput,
} from './useFormSubmissions';

// Dashboard hooks
export {
  useDashboardStats,
  useModuleSummaries,
} from './useDashboard';
export type {
  DashboardStats,
  ModuleSummary,
} from './useDashboard';

// Keyboard shortcuts hooks
export {
  useKeyboardShortcuts,
  useNavigationShortcuts,
  KeyboardShortcutsHelp,
  formatShortcut,
} from './useKeyboardShortcuts';
export type { Shortcut } from './useKeyboardShortcuts';

// Air Quality hooks
export {
  useAirQualityReadings,
  useAirQualityReadingsLive,
  useCreateAirQualityReading,
  useLatestReadingsByLocation,
  useThresholdAlerts,
  checkThresholds,
  getCO2Status,
  getCOStatus,
  AIR_QUALITY_THRESHOLDS,
} from './useAirQuality';
export type {
  AirQualityReading,
  AirQualityFilters,
  AirQualityResponse,
  CreateAirQualityData,
  AirQualityAlert,
} from './useAirQuality';

// Refrigeration hooks
export {
  useRefrigerationReadings,
  useRefrigerationReadingsLive,
  useCreateRefrigerationReading,
  checkRefrigerationStatus,
  getEquipmentStatusColor,
  isPressureInRange,
  isBrineInRange,
  REFRIGERATION_THRESHOLDS,
} from './useRefrigeration';
export type {
  RefrigerationReading,
  RefrigerationFilters,
  RefrigerationResponse,
  CreateRefrigerationData,
  EquipmentStatus,
} from './useRefrigeration';

// Reports hooks
export {
  useReports,
  useReportsLive,
  useReport,
  useGenerateReport,
  useScheduleReport,
  useDeleteReport,
  getReportStatusColor,
  getReportTypeName,
  getReportTypeColor,
  formatFileSize,
  formatTimeAgo,
  getFrequencyText,
  getReportTypeConfig,
  REPORT_TYPES,
} from './useReports';
export type {
  Report,
  ReportType,
  ReportFormat,
  ReportStatus,
  ScheduledReport,
  GenerateReportInput,
  CreateScheduledReportInput,
  ReportFrequency,
  ReportTypeConfig,
  ReportParam,
} from './useReports';

// Admin hooks
export {
  useAdminStats,
  useAdminStatsLive,
  useRoleStats,
  useRoleStatsLive,
  useUsers,
  useUsersLive,
  useCreateUser,
  useUpdateUser,
  useFacilities,
  useFacilitiesLive,
  useCreateFacility,
  useUpdateFacility,
  useAuditLogs,
  useAuditLogsLive,
  getRoleLabel,
  getRoleColor,
  getAuditActionColor,
  getSeverityColor,
  formatUserInitials,
  getUserFacilities,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  AUDIT_ACTION_COLORS,
  SEVERITY_CONFIG,
} from './useAdmin';
export type {
  AdminDashboardStat,
  AdminDashboardStats,
  SystemHealthItem,
  AdminUser,
  UserRole,
  CreateUserInput,
  UpdateUserInput,
  Facility,
  CreateFacilityInput,
  UpdateFacilityInput,
  AuditLogEntry,
  AuditAction,
  AuditSeverity,
  AuditStats,
  AuditLogFilter,
} from './useAdmin';

// Threshold hooks
export {
  useThresholds,
  useThresholdsLive,
  useCreateThreshold,
  useBulkSaveThresholds,
  useUpdateThreshold,
  useDeleteThreshold,
  useNotificationConfigs,
  useNotificationConfigsLive,
  useCreateNotificationConfig,
  useUpdateNotificationConfig,
  useDeleteNotificationConfig,
  checkValueAgainstThreshold,
  getThresholdStatusColor,
  getThresholdStatusLabel,
  MODULE_LABELS,
  MODULE_COLORS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  CHANNEL_LABELS,
} from './useThresholds';
export type {
  ThresholdConfigData,
  DefaultThreshold,
  RinkInfo,
  ThresholdsResponse,
  NotificationConfigData,
  FacilityUser,
  NotificationConfigsResponse,
  CreateThresholdInput,
  UpdateThresholdInput,
  BulkThresholdsInput,
  CreateNotificationConfigInput,
  UpdateNotificationConfigInput,
} from './useThresholds';

// User preferences hooks
export {
  useUserPreferences,
  useUpdateUserPreferences,
  formatTime24to12,
  formatTime12to24,
  TIME_OPTIONS,
} from './useUserPreferences';
export type {
  UserNotificationPrefs,
  UpdatePreferencesInput,
} from './useUserPreferences';
