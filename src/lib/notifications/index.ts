// Notification System - Main Export

export * from './types';
export * from './service';

// Re-export email functions from existing notifications
export {
  sendEmailNotification as sendAlertEmail,
  sendIncidentNotification,
  sendThinIceAlert,
  sendRefrigerationAlert,
  sendAirQualityAlert,
} from '../notifications';

// Notification templates
export const notificationTemplates = {
  incident: {
    created: (data: { type: string; location: string }) => ({
      title: 'New Incident Reported',
      message: `A new ${data.type} incident has been reported at ${data.location}.`,
    }),
    resolved: (data: { type: string }) => ({
      title: 'Incident Resolved',
      message: `The ${data.type} incident has been marked as resolved.`,
    }),
    escalated: (data: { type: string }) => ({
      title: 'Incident Escalated',
      message: `The ${data.type} incident has been escalated and requires immediate attention.`,
    }),
  },
  iceDepth: {
    warning: (data: { rink: string; depth: number; threshold: number }) => ({
      title: 'Ice Depth Warning',
      message: `Ice depth at ${data.rink} is ${data.depth}" - below the ${data.threshold}" threshold.`,
    }),
    critical: (data: { rink: string; depth: number }) => ({
      title: 'Critical: Ice Depth Alert',
      message: `Ice depth at ${data.rink} is critically low at ${data.depth}". Immediate action required.`,
    }),
    normalized: (data: { rink: string }) => ({
      title: 'Ice Depth Normalized',
      message: `Ice depth at ${data.rink} has returned to normal levels.`,
    }),
  },
  schedule: {
    shift: (data: { date: string; time: string }) => ({
      title: 'Upcoming Shift Reminder',
      message: `You have a shift scheduled for ${data.date} at ${data.time}.`,
    }),
    change: (data: { oldDate: string; newDate: string }) => ({
      title: 'Schedule Change',
      message: `Your shift has been changed from ${data.oldDate} to ${data.newDate}.`,
    }),
    approval: (data: { type: string; status: string }) => ({
      title: `Time-off ${data.status}`,
      message: `Your ${data.type} request has been ${data.status.toLowerCase()}.`,
    }),
  },
  maintenance: {
    scheduled: (data: { equipment: string; date: string }) => ({
      title: 'Maintenance Scheduled',
      message: `Maintenance for ${data.equipment} is scheduled for ${data.date}.`,
    }),
    overdue: (data: { equipment: string; daysPast: number }) => ({
      title: 'Maintenance Overdue',
      message: `Maintenance for ${data.equipment} is ${data.daysPast} days overdue.`,
    }),
    completed: (data: { equipment: string }) => ({
      title: 'Maintenance Completed',
      message: `Maintenance for ${data.equipment} has been completed.`,
    }),
  },
  system: {
    update: (data: { version: string }) => ({
      title: 'System Update',
      message: `The system has been updated to version ${data.version}.`,
    }),
    maintenance: (data: { startTime: string; duration: string }) => ({
      title: 'Scheduled Maintenance',
      message: `System maintenance will begin at ${data.startTime} and last approximately ${data.duration}.`,
    }),
    welcome: (data: { name: string }) => ({
      title: 'Welcome to MFO',
      message: `Welcome, ${data.name}! Your account has been set up successfully.`,
    }),
  },
};

// Priority configurations
export const priorityConfig = {
  low: {
    color: 'gray',
    icon: 'info',
    channels: ['in_app'],
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  medium: {
    color: 'blue',
    icon: 'bell',
    channels: ['in_app', 'email'],
    ttl: 14 * 24 * 60 * 60 * 1000, // 14 days
  },
  high: {
    color: 'yellow',
    icon: 'exclamation',
    channels: ['in_app', 'email', 'push'],
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  urgent: {
    color: 'red',
    icon: 'alert',
    channels: ['in_app', 'email', 'push', 'sms'],
    ttl: 60 * 24 * 60 * 60 * 1000, // 60 days
  },
};

// Type configurations
export const typeConfig = {
  info: { icon: 'InformationCircleIcon', color: 'blue' },
  success: { icon: 'CheckCircleIcon', color: 'green' },
  warning: { icon: 'ExclamationTriangleIcon', color: 'yellow' },
  error: { icon: 'XCircleIcon', color: 'red' },
  alert: { icon: 'BellAlertIcon', color: 'orange' },
  incident: { icon: 'ExclamationCircleIcon', color: 'red' },
  ice_depth: { icon: 'ChartBarIcon', color: 'blue' },
  schedule: { icon: 'CalendarIcon', color: 'purple' },
  maintenance: { icon: 'WrenchIcon', color: 'gray' },
  system: { icon: 'CogIcon', color: 'gray' },
};
