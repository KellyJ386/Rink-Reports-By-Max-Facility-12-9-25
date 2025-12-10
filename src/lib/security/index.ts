/**
 * Security Module
 *
 * Centralized security utilities for the MFO application
 */

// Rate limiting
export {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,
  type RateLimitResult,
} from './rateLimit';

// Input sanitization
export {
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeSearchQuery,
  containsDangerousPatterns,
  isValidContentType,
  ALLOWED_FILE_TYPES,
} from './sanitize';

// CSRF protection
export {
  generateCsrfToken,
  setCsrfToken,
  getCsrfToken,
  validateCsrfToken,
  csrfMiddleware,
} from './csrf';

// Security headers
export {
  SECURITY_HEADERS,
  CSP_DIRECTIVES,
  buildCspHeader,
  getApiSecurityHeaders,
  applySecurityHeaders,
  buildCorsHeaders,
  handleCorsPrelight,
  DEFAULT_CORS_CONFIG,
  type CorsConfig,
} from './headers';

// Re-export types
export type { RateLimitResult } from './rateLimit';
export type { CsrfValidationResult } from './csrf';

/**
 * Security middleware for API routes
 */
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from './rateLimit';
import { csrfMiddleware } from './csrf';
import { getApiSecurityHeaders } from './headers';

export interface SecurityCheckResult {
  passed: boolean;
  response?: Response;
}

/**
 * Combined security middleware for API routes
 */
export async function securityMiddleware(
  request: Request,
  options: {
    rateLimit?: keyof typeof RATE_LIMITS;
    checkCsrf?: boolean;
    requireAuth?: boolean;
  } = {}
): Promise<SecurityCheckResult> {
  const { rateLimit = 'api', checkCsrf = false } = options;

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS[rateLimit]);

  if (!rateLimitResult.success) {
    const headers = createRateLimitHeaders(rateLimitResult);
    const secHeaders = getApiSecurityHeaders();
    secHeaders.forEach((value, key) => headers.set(key, value));

    return {
      passed: false,
      response: NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers }
      ),
    };
  }

  // CSRF validation for state-changing requests
  if (checkCsrf) {
    const csrfResult = await csrfMiddleware(request);
    if (!csrfResult.valid) {
      return {
        passed: false,
        response: NextResponse.json(
          { error: csrfResult.error },
          { status: 403 }
        ),
      };
    }
  }

  return { passed: true };
}

/**
 * Validate request body against schema with sanitization
 */
import { z } from 'zod';
import { sanitizeObject } from './sanitize';

export async function validateAndSanitize<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string; details?: z.ZodError }> {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = schema.parse(sanitized);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error,
      };
    }
    return {
      success: false,
      error: 'Invalid request body',
    };
  }
}
