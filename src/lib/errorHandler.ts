/**
 * Error Handling Utilities
 *
 * Provides centralized error handling for the MFO application.
 */

import { logger } from './logger';

/**
 * Application error codes
 */
export const ErrorCodes = {
  // Authentication errors (1xxx)
  UNAUTHORIZED: 'ERR_1001',
  FORBIDDEN: 'ERR_1002',
  SESSION_EXPIRED: 'ERR_1003',
  INVALID_CREDENTIALS: 'ERR_1004',

  // Validation errors (2xxx)
  VALIDATION_FAILED: 'ERR_2001',
  INVALID_INPUT: 'ERR_2002',
  MISSING_REQUIRED_FIELD: 'ERR_2003',

  // Resource errors (3xxx)
  NOT_FOUND: 'ERR_3001',
  ALREADY_EXISTS: 'ERR_3002',
  CONFLICT: 'ERR_3003',

  // Database errors (4xxx)
  DATABASE_ERROR: 'ERR_4001',
  CONNECTION_FAILED: 'ERR_4002',
  QUERY_FAILED: 'ERR_4003',

  // External service errors (5xxx)
  EXTERNAL_SERVICE_ERROR: 'ERR_5001',
  TIMEOUT: 'ERR_5002',
  RATE_LIMITED: 'ERR_5003',

  // Server errors (6xxx)
  INTERNAL_ERROR: 'ERR_6001',
  NOT_IMPLEMENTED: 'ERR_6002',
  SERVICE_UNAVAILABLE: 'ERR_6003',
} as const;

type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Custom application error
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Create common errors
 */
export const createError = {
  unauthorized: (message = 'Unauthorized') =>
    new AppError(message, ErrorCodes.UNAUTHORIZED, 401),

  forbidden: (message = 'Forbidden') =>
    new AppError(message, ErrorCodes.FORBIDDEN, 403),

  notFound: (resource = 'Resource') =>
    new AppError(`${resource} not found`, ErrorCodes.NOT_FOUND, 404),

  badRequest: (message: string, details?: Record<string, unknown>) =>
    new AppError(message, ErrorCodes.INVALID_INPUT, 400, details),

  validation: (details: Record<string, unknown>) =>
    new AppError('Validation failed', ErrorCodes.VALIDATION_FAILED, 400, details),

  conflict: (message: string) =>
    new AppError(message, ErrorCodes.CONFLICT, 409),

  internal: (message = 'Internal server error') =>
    new AppError(message, ErrorCodes.INTERNAL_ERROR, 500),

  rateLimit: () =>
    new AppError('Too many requests', ErrorCodes.RATE_LIMITED, 429),
};

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Normalize error to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message || 'An unexpected error occurred',
      ErrorCodes.INTERNAL_ERROR,
      500,
      { originalError: error.name }
    );
  }

  return new AppError(
    'An unexpected error occurred',
    ErrorCodes.INTERNAL_ERROR,
    500
  );
}

/**
 * Error response for API routes
 */
export function errorResponse(error: unknown) {
  const appError = normalizeError(error);

  // Log the error
  if (appError.statusCode >= 500) {
    logger.error('Server error', error instanceof Error ? error : undefined, {
      code: appError.code,
      statusCode: appError.statusCode,
    });
  } else {
    logger.warn('Client error', {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
    });
  }

  return {
    status: appError.statusCode,
    body: appError.toJSON(),
  };
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const { status, body } = errorResponse(error);
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }) as T;
}

/**
 * Try-catch wrapper that returns Result type
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: normalizeError(error) };
  }
}

/**
 * Assert function for runtime checks
 */
export function assert(
  condition: unknown,
  message: string,
  code: ErrorCode = ErrorCodes.INTERNAL_ERROR
): asserts condition {
  if (!condition) {
    throw new AppError(message, code, 500);
  }
}

/**
 * Assert value is not null/undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AppError(message, ErrorCodes.NOT_FOUND, 404);
  }
}
