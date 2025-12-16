import { prisma } from './prisma';
import { ThresholdModule, SeverityLevel, NotificationChannel } from '@prisma/client';

interface ThresholdCheckResult {
  exceeded: boolean;
  status: 'ok' | 'warning' | 'critical';
  parameterName: string;
  value: number;
  threshold: {
    minValue: number | null;
    maxValue: number | null;
    warningMin: number | null;
    warningMax: number | null;
  };
  severity: SeverityLevel;
  message: string;
}

interface ThresholdConfig {
  id: string;
  minValue: number | null;
  maxValue: number | null;
  warningMin: number | null;
  warningMax: number | null;
  alertEnabled: boolean;
  alertSeverity: SeverityLevel;
}

// Default threshold values (used when no custom thresholds are configured)
const DEFAULT_THRESHOLDS: Record<ThresholdModule, Record<string, Partial<ThresholdConfig>>> = {
  ICE_DEPTH: {
    ice_depth: {
      minValue: 0.75,
      maxValue: 1.5,
      warningMin: 0.85,
      warningMax: 1.4,
      alertSeverity: 'SERIOUS',
    },
  },
  REFRIGERATION: {
    brine_supply: { minValue: 10, maxValue: 22, warningMin: 12, warningMax: 20, alertSeverity: 'MODERATE' },
    brine_return: { minValue: 14, maxValue: 26, warningMin: 16, warningMax: 24, alertSeverity: 'MODERATE' },
    compressor_suction: { minValue: 20, maxValue: 40, warningMin: 22, warningMax: 38, alertSeverity: 'MODERATE' },
    compressor_discharge: { minValue: 150, maxValue: 250, warningMin: 160, warningMax: 240, alertSeverity: 'MODERATE' },
    condenser_in: { minValue: 70, maxValue: 105, warningMin: 75, warningMax: 100, alertSeverity: 'MODERATE' },
    condenser_out: { minValue: 80, maxValue: 115, warningMin: 85, warningMax: 110, alertSeverity: 'MODERATE' },
    oil_pressure: { minValue: 30, maxValue: 80, warningMin: 35, warningMax: 75, alertSeverity: 'SERIOUS' },
  },
  AIR_QUALITY: {
    co2_level: { maxValue: 1000, warningMax: 800, alertSeverity: 'MODERATE' },
    co_level: { maxValue: 25, warningMax: 15, alertSeverity: 'CRITICAL' },
    temperature: { minValue: 45, maxValue: 65, warningMin: 48, warningMax: 62, alertSeverity: 'MINOR' },
    humidity: { minValue: 30, maxValue: 60, warningMin: 35, warningMax: 55, alertSeverity: 'MINOR' },
  },
};

/**
 * Get configured thresholds for a facility/rink, falling back to defaults
 */
export async function getThresholds(
  facilityId: string,
  module: ThresholdModule,
  rinkId?: string
): Promise<Record<string, ThresholdConfig>> {
  // Fetch configured thresholds
  const configured = await prisma.thresholdConfig.findMany({
    where: {
      facilityId,
      module,
      isActive: true,
      OR: [
        { rinkId: null }, // Facility-wide thresholds
        { rinkId: rinkId || null }, // Rink-specific thresholds
      ],
    },
  });

  // Build threshold map, preferring rink-specific over facility-wide
  const thresholdMap: Record<string, ThresholdConfig> = {};

  // Start with defaults
  const defaults = DEFAULT_THRESHOLDS[module] || {};
  for (const [param, defaultConfig] of Object.entries(defaults)) {
    thresholdMap[param] = {
      id: `default-${param}`,
      minValue: defaultConfig.minValue ?? null,
      maxValue: defaultConfig.maxValue ?? null,
      warningMin: defaultConfig.warningMin ?? null,
      warningMax: defaultConfig.warningMax ?? null,
      alertEnabled: true,
      alertSeverity: defaultConfig.alertSeverity || 'MODERATE',
    };
  }

  // Override with configured facility-wide thresholds
  for (const config of configured.filter((c) => !c.rinkId)) {
    thresholdMap[config.parameterName] = {
      id: config.id,
      minValue: config.minValue,
      maxValue: config.maxValue,
      warningMin: config.warningMin,
      warningMax: config.warningMax,
      alertEnabled: config.alertEnabled,
      alertSeverity: config.alertSeverity,
    };
  }

  // Override with rink-specific thresholds
  if (rinkId) {
    for (const config of configured.filter((c) => c.rinkId === rinkId)) {
      thresholdMap[config.parameterName] = {
        id: config.id,
        minValue: config.minValue,
        maxValue: config.maxValue,
        warningMin: config.warningMin,
        warningMax: config.warningMax,
        alertEnabled: config.alertEnabled,
        alertSeverity: config.alertSeverity,
      };
    }
  }

  return thresholdMap;
}

/**
 * Check a value against a threshold configuration
 */
export function checkValue(
  value: number,
  parameterName: string,
  threshold: ThresholdConfig
): ThresholdCheckResult {
  const { minValue, maxValue, warningMin, warningMax, alertSeverity } = threshold;

  // Check critical thresholds first
  if (minValue !== null && value < minValue) {
    return {
      exceeded: true,
      status: 'critical',
      parameterName,
      value,
      threshold: { minValue, maxValue, warningMin, warningMax },
      severity: alertSeverity,
      message: `${parameterName} is below minimum threshold: ${value} (min: ${minValue})`,
    };
  }

  if (maxValue !== null && value > maxValue) {
    return {
      exceeded: true,
      status: 'critical',
      parameterName,
      value,
      threshold: { minValue, maxValue, warningMin, warningMax },
      severity: alertSeverity,
      message: `${parameterName} exceeds maximum threshold: ${value} (max: ${maxValue})`,
    };
  }

  // Check warning thresholds
  if (warningMin !== null && value < warningMin) {
    return {
      exceeded: true,
      status: 'warning',
      parameterName,
      value,
      threshold: { minValue, maxValue, warningMin, warningMax },
      severity: alertSeverity === 'CRITICAL' ? 'SERIOUS' : 'MINOR',
      message: `${parameterName} is approaching minimum threshold: ${value} (warning: ${warningMin})`,
    };
  }

  if (warningMax !== null && value > warningMax) {
    return {
      exceeded: true,
      status: 'warning',
      parameterName,
      value,
      threshold: { minValue, maxValue, warningMin, warningMax },
      severity: alertSeverity === 'CRITICAL' ? 'SERIOUS' : 'MINOR',
      message: `${parameterName} is approaching maximum threshold: ${value} (warning: ${warningMax})`,
    };
  }

  return {
    exceeded: false,
    status: 'ok',
    parameterName,
    value,
    threshold: { minValue, maxValue, warningMin, warningMax },
    severity: 'MINOR',
    message: `${parameterName} is within normal range: ${value}`,
  };
}

/**
 * Create an alert and queue notifications for a threshold violation
 */
export async function createThresholdAlert(
  facilityId: string,
  module: ThresholdModule,
  checkResult: ThresholdCheckResult,
  context: {
    rinkId?: string;
    rinkName?: string;
    readingId?: string;
    userId?: string;
  }
): Promise<string | null> {
  if (!checkResult.exceeded) return null;

  // Create the alert
  const alert = await prisma.alert.create({
    data: {
      facilityId,
      alertType: `${module}_${checkResult.parameterName.toUpperCase()}`,
      severity: checkResult.severity,
      message: context.rinkName
        ? `${context.rinkName}: ${checkResult.message}`
        : checkResult.message,
      threshold: checkResult.threshold.minValue ?? checkResult.threshold.maxValue,
      actualValue: checkResult.value,
    },
  });

  // Get notification configs for this module and severity
  const notificationConfigs = await prisma.notificationConfig.findMany({
    where: {
      facilityId,
      module,
      alertSeverity: checkResult.severity,
      isEnabled: true,
    },
  });

  // Queue notifications for each config
  for (const config of notificationConfigs) {
    // Get recipients based on config
    let recipients: { id: string; email: string | null; phone: string | null }[] = [];

    if (config.recipientUserId) {
      // Specific user
      const user = await prisma.user.findUnique({
        where: { id: config.recipientUserId },
        select: { id: true, email: true, phone: true },
      });
      if (user) recipients = [user];
    } else if (config.recipientRole) {
      // All users with this role in the facility
      const facilityUsers = await prisma.facilityUser.findMany({
        where: {
          facilityId,
          role: config.recipientRole,
          isActive: true,
        },
        include: {
          user: {
            select: { id: true, email: true, phone: true },
          },
        },
      });
      recipients = facilityUsers.map((fu) => fu.user);
    }

    // Queue notifications for each recipient and channel
    for (const recipient of recipients) {
      for (const channel of config.channels) {
        // Check user notification preferences
        const prefs = await prisma.userNotificationPrefs.findUnique({
          where: { userId: recipient.id },
        });

        // Check quiet hours
        if (prefs?.quietHoursEnabled) {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const quietStart = prefs.quietHoursStart;
          const quietEnd = prefs.quietHoursEnd;

          // Skip if within quiet hours (except for critical alerts)
          if (checkResult.severity !== 'CRITICAL') {
            if (quietStart < quietEnd) {
              // Normal range (e.g., 22:00 to 06:00 next day)
              if (currentTime >= quietStart || currentTime < quietEnd) continue;
            } else {
              // Overnight range
              if (currentTime >= quietStart && currentTime < quietEnd) continue;
            }
          }
        }

        // Check channel preferences
        if (channel === 'EMAIL' && !prefs?.emailEnabled) continue;
        if (channel === 'SMS' && !prefs?.smsEnabled) continue;
        if (channel === 'PUSH' && !prefs?.pushEnabled) continue;

        // Queue the notification
        await prisma.notificationQueue.create({
          data: {
            facilityId,
            recipientId: recipient.id,
            recipientEmail: channel === 'EMAIL' ? recipient.email : null,
            recipientPhone: channel === 'SMS' ? recipient.phone : null,
            channel,
            subject: `[${checkResult.severity}] ${module} Alert`,
            message: context.rinkName
              ? `${context.rinkName}: ${checkResult.message}`
              : checkResult.message,
            link: context.readingId
              ? `/dashboard/${module.toLowerCase().replace('_', '-')}/${context.readingId}`
              : `/dashboard/${module.toLowerCase().replace('_', '-')}`,
            alertId: alert.id,
            relatedType: module.toLowerCase(),
            relatedId: context.readingId,
          },
        });
      }
    }
  }

  return alert.id;
}

/**
 * Check ice depth readings against thresholds
 */
export async function checkIceDepthThresholds(
  facilityId: string,
  rinkId: string,
  rinkName: string,
  minDepth: number | null,
  maxDepth: number | null,
  averageDepth: number | null,
  readingId: string,
  userId: string
): Promise<ThresholdCheckResult[]> {
  const results: ThresholdCheckResult[] = [];
  const thresholds = await getThresholds(facilityId, 'ICE_DEPTH', rinkId);

  const iceDepthThreshold = thresholds['ice_depth'];
  if (!iceDepthThreshold || !iceDepthThreshold.alertEnabled) return results;

  // Check minimum depth (most critical for ice safety)
  if (minDepth !== null) {
    const result = checkValue(minDepth, 'ice_depth', iceDepthThreshold);
    if (result.exceeded) {
      result.message = `Minimum ice depth (${minDepth}") is ${result.status === 'critical' ? 'below safe threshold' : 'approaching minimum threshold'}`;
      results.push(result);
      await createThresholdAlert(facilityId, 'ICE_DEPTH', result, {
        rinkId,
        rinkName,
        readingId,
        userId,
      });
    }
  }

  return results;
}

/**
 * Check refrigeration readings against thresholds
 */
export async function checkRefrigerationThresholds(
  facilityId: string,
  readings: Record<string, number | null>,
  readingId: string,
  userId: string
): Promise<ThresholdCheckResult[]> {
  const results: ThresholdCheckResult[] = [];
  const thresholds = await getThresholds(facilityId, 'REFRIGERATION');

  const parameterMapping: Record<string, string> = {
    brineSupply: 'brine_supply',
    brineReturn: 'brine_return',
    compressor1Suction: 'compressor_suction',
    compressor1Discharge: 'compressor_discharge',
    compressor2Suction: 'compressor_suction',
    compressor2Discharge: 'compressor_discharge',
    condenserIn: 'condenser_in',
    condenserOut: 'condenser_out',
    oilPressure: 'oil_pressure',
  };

  for (const [fieldName, value] of Object.entries(readings)) {
    if (value === null) continue;

    const paramName = parameterMapping[fieldName];
    if (!paramName) continue;

    const threshold = thresholds[paramName];
    if (!threshold || !threshold.alertEnabled) continue;

    const result = checkValue(value, paramName, threshold);
    if (result.exceeded) {
      results.push(result);
      await createThresholdAlert(facilityId, 'REFRIGERATION', result, {
        readingId,
        userId,
      });
    }
  }

  return results;
}

/**
 * Check air quality readings against thresholds
 */
export async function checkAirQualityThresholds(
  facilityId: string,
  readings: Record<string, number | null>,
  readingId: string,
  userId: string
): Promise<ThresholdCheckResult[]> {
  const results: ThresholdCheckResult[] = [];
  const thresholds = await getThresholds(facilityId, 'AIR_QUALITY');

  const parameterMapping: Record<string, string> = {
    co2Level: 'co2_level',
    coLevel: 'co_level',
    temperature: 'temperature',
    humidity: 'humidity',
  };

  for (const [fieldName, value] of Object.entries(readings)) {
    if (value === null) continue;

    const paramName = parameterMapping[fieldName];
    if (!paramName) continue;

    const threshold = thresholds[paramName];
    if (!threshold || !threshold.alertEnabled) continue;

    const result = checkValue(value, paramName, threshold);
    if (result.exceeded) {
      results.push(result);
      await createThresholdAlert(facilityId, 'AIR_QUALITY', result, {
        readingId,
        userId,
      });
    }
  }

  return results;
}
