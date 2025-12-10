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
