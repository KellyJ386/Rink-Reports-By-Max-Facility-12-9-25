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
