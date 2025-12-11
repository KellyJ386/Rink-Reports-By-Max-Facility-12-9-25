import { prisma } from '@/lib/prisma';
import { FormActionType, SeverityLevel } from '@prisma/client';

interface FormFieldResponse {
  formFieldId: string;
  value: string | null;
  numericValue: number | null;
  booleanValue: boolean | null;
  jsonValue: unknown;
}

interface ActionConfig {
  alertType?: string;
  severity?: SeverityLevel;
  message?: string;
  notificationChannels?: string[];
  recipientRole?: string;
  recipientUserId?: string;
}

/**
 * Process form actions after a submission
 * Evaluates trigger conditions and executes corresponding actions
 */
export async function processFormActions(
  formTemplateId: string,
  facilityId: string,
  submissionId: string,
  fieldResponses: FormFieldResponse[],
  submittedById: string
): Promise<{ actionsTriggered: number; errors: string[] }> {
  const errors: string[] = [];
  let actionsTriggered = 0;

  try {
    // Get all active form actions for this template
    const formActions = await prisma.formAction.findMany({
      where: {
        formTemplateId,
        isActive: true,
      },
      include: {
        formTemplate: {
          select: {
            name: true,
            fields: {
              select: {
                id: true,
                label: true,
                fieldType: true,
              },
            },
          },
        },
      },
    });

    if (formActions.length === 0) {
      return { actionsTriggered: 0, errors: [] };
    }

    // Create a map of field responses for quick lookup
    const responseMap = new Map<string, FormFieldResponse>();
    for (const response of fieldResponses) {
      responseMap.set(response.formFieldId, response);
    }

    // Evaluate each action's trigger condition
    for (const action of formActions) {
      try {
        const response = responseMap.get(action.triggerFieldId);
        if (!response) {
          continue; // Skip if field wasn't submitted
        }

        const triggerField = action.formTemplate.fields.find(
          (f) => f.id === action.triggerFieldId
        );

        // Evaluate the condition
        const conditionMet = evaluateCondition(
          response,
          action.triggerOperator,
          action.triggerValue
        );

        if (conditionMet) {
          // Execute the action
          await executeAction(
            action.actionType,
            action.actionConfig as ActionConfig | null,
            {
              facilityId,
              submissionId,
              formName: action.formTemplate.name,
              fieldLabel: triggerField?.label || 'Unknown Field',
              fieldValue: getDisplayValue(response),
              triggerValue: action.triggerValue,
              submittedById,
            }
          );
          actionsTriggered++;
        }
      } catch (actionError) {
        const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';
        errors.push(`Action ${action.id}: ${errorMessage}`);
      }
    }

    return { actionsTriggered, errors };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to process form actions: ${errorMessage}`);
    return { actionsTriggered, errors };
  }
}

/**
 * Evaluate a trigger condition against a field response
 */
function evaluateCondition(
  response: FormFieldResponse,
  operator: string,
  triggerValue: string
): boolean {
  // Get the actual value to compare
  const responseValue = response.numericValue ?? response.booleanValue ?? response.value;

  if (responseValue === null || responseValue === undefined) {
    return operator === 'is_empty';
  }

  switch (operator) {
    case 'equals':
    case 'equal':
      return String(responseValue).toLowerCase() === triggerValue.toLowerCase();

    case 'not_equals':
    case 'not_equal':
      return String(responseValue).toLowerCase() !== triggerValue.toLowerCase();

    case 'contains':
      return String(responseValue).toLowerCase().includes(triggerValue.toLowerCase());

    case 'not_contains':
      return !String(responseValue).toLowerCase().includes(triggerValue.toLowerCase());

    case 'less_than':
    case 'lt':
      return typeof responseValue === 'number' && responseValue < parseFloat(triggerValue);

    case 'less_than_or_equal':
    case 'lte':
      return typeof responseValue === 'number' && responseValue <= parseFloat(triggerValue);

    case 'greater_than':
    case 'gt':
      return typeof responseValue === 'number' && responseValue > parseFloat(triggerValue);

    case 'greater_than_or_equal':
    case 'gte':
      return typeof responseValue === 'number' && responseValue >= parseFloat(triggerValue);

    case 'is_empty':
      return responseValue === '' || responseValue === null;

    case 'is_not_empty':
      return responseValue !== '' && responseValue !== null;

    case 'is_true':
      return responseValue === true || responseValue === 'true' || responseValue === '1';

    case 'is_false':
      return responseValue === false || responseValue === 'false' || responseValue === '0';

    default:
      return false;
  }
}

/**
 * Execute a form action
 */
async function executeAction(
  actionType: FormActionType,
  config: ActionConfig | null,
  context: {
    facilityId: string;
    submissionId: string;
    formName: string;
    fieldLabel: string;
    fieldValue: string;
    triggerValue: string;
    submittedById: string;
  }
): Promise<void> {
  switch (actionType) {
    case 'CREATE_ALERT':
      await createAlert(config, context);
      break;

    case 'SEND_NOTIFICATION':
      await sendNotification(config, context);
      break;

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

/**
 * Create an alert based on form submission
 */
async function createAlert(
  config: ActionConfig | null,
  context: {
    facilityId: string;
    submissionId: string;
    formName: string;
    fieldLabel: string;
    fieldValue: string;
    triggerValue: string;
    submittedById: string;
  }
): Promise<void> {
  const alertType = config?.alertType || 'FORM_TRIGGER';
  const severity = config?.severity || 'MEDIUM';
  const customMessage = config?.message;

  const message = customMessage
    ? customMessage
        .replace('{field}', context.fieldLabel)
        .replace('{value}', context.fieldValue)
        .replace('{form}', context.formName)
    : `Form "${context.formName}" triggered an alert: ${context.fieldLabel} is ${context.fieldValue} (threshold: ${context.triggerValue})`;

  await prisma.alert.create({
    data: {
      facilityId: context.facilityId,
      alertType,
      severity,
      message,
      threshold: parseFloat(context.triggerValue) || null,
      actualValue: parseFloat(context.fieldValue) || null,
    },
  });
}

/**
 * Send a notification based on form submission
 */
async function sendNotification(
  config: ActionConfig | null,
  context: {
    facilityId: string;
    submissionId: string;
    formName: string;
    fieldLabel: string;
    fieldValue: string;
    triggerValue: string;
    submittedById: string;
  }
): Promise<void> {
  const customMessage = config?.message;
  const channels = config?.notificationChannels || ['IN_APP'];

  const message = customMessage
    ? customMessage
        .replace('{field}', context.fieldLabel)
        .replace('{value}', context.fieldValue)
        .replace('{form}', context.formName)
    : `Form "${context.formName}" requires attention: ${context.fieldLabel} is ${context.fieldValue}`;

  // Determine recipients
  let recipientIds: string[] = [];

  if (config?.recipientUserId) {
    recipientIds = [config.recipientUserId];
  } else if (config?.recipientRole) {
    // Get users with the specified role at this facility
    const facilityUsers = await prisma.facilityUser.findMany({
      where: {
        facilityId: context.facilityId,
        role: config.recipientRole as any,
        isActive: true,
      },
      select: { userId: true },
    });
    recipientIds = facilityUsers.map((fu) => fu.userId);
  } else {
    // Default: notify facility admins
    const facilityAdmins = await prisma.facilityUser.findMany({
      where: {
        facilityId: context.facilityId,
        role: 'FACILITY_ADMIN',
        isActive: true,
      },
      select: { userId: true },
    });
    recipientIds = facilityAdmins.map((fu) => fu.userId);
  }

  // Create notification queue entries for each recipient and channel
  for (const recipientId of recipientIds) {
    const user = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, phone: true },
    });

    for (const channel of channels) {
      await prisma.notificationQueue.create({
        data: {
          facilityId: context.facilityId,
          recipientId,
          recipientEmail: channel === 'EMAIL' ? user?.email : null,
          recipientPhone: channel === 'SMS' ? user?.phone : null,
          channel: channel as any,
          subject: `Form Alert: ${context.formName}`,
          message,
          link: `/dashboard/forms/submissions/${context.submissionId}`,
          status: 'PENDING',
        },
      });
    }
  }
}

/**
 * Get a display-friendly value from a field response
 */
function getDisplayValue(response: FormFieldResponse): string {
  if (response.booleanValue !== null) {
    return response.booleanValue ? 'Yes' : 'No';
  }
  if (response.numericValue !== null) {
    return String(response.numericValue);
  }
  if (response.jsonValue) {
    if (Array.isArray(response.jsonValue)) {
      return response.jsonValue.join(', ');
    }
    return JSON.stringify(response.jsonValue);
  }
  return response.value || '';
}

/**
 * Operator options for form action conditions
 */
export const TRIGGER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'less_than', label: 'Less than' },
  { value: 'less_than_or_equal', label: 'Less than or equal' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'greater_than_or_equal', label: 'Greater than or equal' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'is_true', label: 'Is true/checked' },
  { value: 'is_false', label: 'Is false/unchecked' },
];

/**
 * Action type options
 */
export const ACTION_TYPES = [
  { value: 'CREATE_ALERT', label: 'Create Alert', description: 'Creates an alert in the system' },
  { value: 'SEND_NOTIFICATION', label: 'Send Notification', description: 'Sends email/SMS/in-app notification' },
];
