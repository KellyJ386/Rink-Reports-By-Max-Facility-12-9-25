import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotificationRecipient {
  email: string;
  name?: string;
  phone?: string;
}

interface AlertNotification {
  type: 'ICE_THIN' | 'ICE_THICK' | 'EQUIPMENT_FAILURE' | 'AIR_QUALITY' | 'REFRIGERATION' | 'INCIDENT';
  severity: 'INFO' | 'WARNING' | 'SERIOUS' | 'CRITICAL';
  facilityName: string;
  rinkName?: string;
  message: string;
  details?: Record<string, unknown>;
  actionUrl?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Generate email template based on alert type
function generateAlertEmailTemplate(alert: AlertNotification): EmailTemplate {
  const severityColors: Record<string, string> = {
    INFO: '#3b82f6',
    WARNING: '#f59e0b',
    SERIOUS: '#f97316',
    CRITICAL: '#ef4444',
  };

  const severityEmoji: Record<string, string> = {
    INFO: 'ℹ️',
    WARNING: '⚠️',
    SERIOUS: '🚨',
    CRITICAL: '🆘',
  };

  const color = severityColors[alert.severity] || '#64748b';
  const emoji = severityEmoji[alert.severity] || '';

  const subject = `${emoji} [${alert.severity}] ${alert.type.replace(/_/g, ' ')} Alert - ${alert.facilityName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Max Facility Operations</h1>
            <p style="color: #e0f2fe; margin: 8px 0 0 0; font-size: 14px;">Alert Notification</p>
          </td>
        </tr>

        <!-- Alert Badge -->
        <tr>
          <td style="padding: 30px 30px 0 30px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color: ${color}15; border-left: 4px solid ${color}; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                  <span style="display: inline-block; background-color: ${color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                    ${alert.severity}
                  </span>
                  <span style="display: inline-block; margin-left: 10px; color: #475569; font-size: 14px;">
                    ${alert.type.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding: 30px;">
            <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 20px;">${alert.facilityName}</h2>
            ${alert.rinkName ? `<p style="color: #64748b; margin: 0 0 20px 0; font-size: 14px;">${alert.rinkName}</p>` : ''}

            <p style="color: #334155; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
              ${alert.message}
            </p>

            ${alert.details ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 15px;">
                  <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin: 0 0 10px 0;">Details</p>
                  ${Object.entries(alert.details).map(([key, value]) => `
                    <p style="color: #334155; margin: 5px 0; font-size: 14px;">
                      <strong>${key}:</strong> ${value}
                    </p>
                  `).join('')}
                </td>
              </tr>
            </table>
            ` : ''}

            ${alert.actionUrl ? `
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align: center; padding: 10px 0;">
                  <a href="${alert.actionUrl}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                    View Details
                  </a>
                </td>
              </tr>
            </table>
            ` : ''}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              This is an automated alert from Max Facility Operations.
            </p>
            <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} Max Facility Operations. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
${alert.severity} ALERT - ${alert.type.replace(/_/g, ' ')}

Facility: ${alert.facilityName}
${alert.rinkName ? `Rink: ${alert.rinkName}` : ''}

${alert.message}

${alert.details ? Object.entries(alert.details).map(([key, value]) => `${key}: ${value}`).join('\n') : ''}

${alert.actionUrl ? `View Details: ${alert.actionUrl}` : ''}

---
This is an automated alert from Max Facility Operations.
  `.trim();

  return { subject, html, text };
}

// Send email notification
export async function sendEmailNotification(
  recipients: NotificationRecipient[],
  alert: AlertNotification
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email notification');
      return { success: false, error: 'Email service not configured' };
    }

    const template = generateAlertEmailTemplate(alert);
    const emailAddresses = recipients.map((r) => r.email);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'MFO Alerts <alerts@maxfacility.com>',
      to: emailAddresses,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send email notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email notification error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Send incident notification (critical incidents trigger immediate alerts)
export async function sendIncidentNotification(
  recipients: NotificationRecipient[],
  incident: {
    id: string;
    type: string;
    severity: string;
    facilityName: string;
    rinkName?: string;
    description: string;
    occurredAt: Date;
    location?: string;
  },
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const alert: AlertNotification = {
    type: 'INCIDENT',
    severity: incident.severity as AlertNotification['severity'],
    facilityName: incident.facilityName,
    rinkName: incident.rinkName,
    message: incident.description,
    details: {
      'Incident Type': incident.type.replace(/_/g, ' '),
      'Occurred At': incident.occurredAt.toLocaleString(),
      ...(incident.location && { Location: incident.location }),
    },
    actionUrl: `${baseUrl}/dashboard/incidents/${incident.id}`,
  };

  return sendEmailNotification(recipients, alert);
}

// Send thin ice alert
export async function sendThinIceAlert(
  recipients: NotificationRecipient[],
  data: {
    facilityName: string;
    rinkName: string;
    minDepth: number;
    threshold: number;
    affectedPoints: string[];
  },
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const severity = data.minDepth < 0.5 ? 'CRITICAL' : 'SERIOUS';

  const alert: AlertNotification = {
    type: 'ICE_THIN',
    severity,
    facilityName: data.facilityName,
    rinkName: data.rinkName,
    message: `Ice depth has fallen below the safe threshold of ${data.threshold}". Immediate attention required.`,
    details: {
      'Minimum Depth': `${data.minDepth}"`,
      'Safe Threshold': `${data.threshold}"`,
      'Affected Points': data.affectedPoints.join(', ') || 'Multiple areas',
    },
    actionUrl: `${baseUrl}/dashboard/ice-depth`,
  };

  return sendEmailNotification(recipients, alert);
}

// Send refrigeration alert
export async function sendRefrigerationAlert(
  recipients: NotificationRecipient[],
  data: {
    facilityName: string;
    metric: string;
    value: number;
    threshold: number;
    unit: string;
  },
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const isAboveThreshold = data.value > data.threshold;

  const alert: AlertNotification = {
    type: 'REFRIGERATION',
    severity: 'SERIOUS',
    facilityName: data.facilityName,
    message: `Refrigeration ${data.metric} is ${isAboveThreshold ? 'above' : 'below'} the acceptable threshold.`,
    details: {
      Metric: data.metric,
      'Current Value': `${data.value}${data.unit}`,
      Threshold: `${data.threshold}${data.unit}`,
    },
    actionUrl: `${baseUrl}/dashboard/refrigeration`,
  };

  return sendEmailNotification(recipients, alert);
}

// Send air quality alert
export async function sendAirQualityAlert(
  recipients: NotificationRecipient[],
  data: {
    facilityName: string;
    rinkName?: string;
    metric: 'CO' | 'CO2';
    value: number;
    threshold: number;
    unit: string;
  },
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const severity = data.metric === 'CO' && data.value > 35 ? 'CRITICAL' : 'SERIOUS';

  const alert: AlertNotification = {
    type: 'AIR_QUALITY',
    severity,
    facilityName: data.facilityName,
    rinkName: data.rinkName,
    message: `${data.metric} levels have exceeded the safety threshold. ${severity === 'CRITICAL' ? 'Evacuate the area immediately.' : 'Increase ventilation.'}`,
    details: {
      Metric: data.metric,
      'Current Level': `${data.value}${data.unit}`,
      'Safety Threshold': `${data.threshold}${data.unit}`,
    },
    actionUrl: `${baseUrl}/dashboard/air-quality`,
  };

  return sendEmailNotification(recipients, alert);
}

// Get notification recipients for a facility
export async function getNotificationRecipients(
  prisma: unknown,
  facilityId: string,
  alertType: string,
  severity: string
): Promise<NotificationRecipient[]> {
  // This would query the database for users who should receive notifications
  // based on their role, notification preferences, and the alert type/severity

  // For now, return a placeholder implementation
  // In production, this would query User and NotificationPreference tables

  // @ts-expect-error - prisma type not imported
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'SUPER_ADMIN' },
        { role: 'FACILITY_ADMIN', facilityIds: { has: facilityId } },
        { role: 'MANAGER', facilityIds: { has: facilityId } },
      ],
      // Additional filter for notification preferences would go here
    },
    select: {
      email: true,
      name: true,
      phone: true,
    },
  });

  return users;
}

export type { NotificationRecipient, AlertNotification };
