/**
 * CSRF Protection Utilities
 *
 * Implements CSRF token generation and validation
 */

import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'mfo-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
export function generateCsrfToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // Use Web Crypto API
    const array = new Uint8Array(CSRF_TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  // Fallback for environments without crypto
  return Array.from({ length: CSRF_TOKEN_LENGTH * 2 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
}

/**
 * Set CSRF token cookie (call from server action or API route)
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  return token;
}

/**
 * Get current CSRF token from cookies
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CSRF_COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieToken = await getCsrfToken();
  if (!cookieToken) {
    return false;
  }

  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken && timingSafeEqual(cookieToken, headerToken)) {
    return true;
  }

  // Check form data for non-JSON requests
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.clone().formData();
      const formToken = formData.get('_csrf');
      if (formToken && typeof formToken === 'string') {
        return timingSafeEqual(cookieToken, formToken);
      }
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF validation middleware result
 */
export interface CsrfValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Middleware to validate CSRF on state-changing requests
 */
export async function csrfMiddleware(
  request: Request
): Promise<CsrfValidationResult> {
  // Skip CSRF check for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  // Validate token
  const isValid = await validateCsrfToken(request);
  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid or missing CSRF token',
    };
  }

  return { valid: true };
}
