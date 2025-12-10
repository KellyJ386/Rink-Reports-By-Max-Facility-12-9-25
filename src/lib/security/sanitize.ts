/**
 * Input Sanitization Utilities
 *
 * Functions for sanitizing user input to prevent XSS, injection attacks, etc.
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEscapes[char]);
}

/**
 * Strip HTML tags from string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize string for safe display
 */
export function sanitizeString(str: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  trim?: boolean;
} = {}): string {
  const { maxLength, allowHtml = false, trim = true } = options;

  let result = str;

  // Trim whitespace
  if (trim) {
    result = result.trim();
  }

  // Strip or escape HTML
  if (!allowHtml) {
    result = escapeHtml(result);
  }

  // Truncate if too long
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
}

/**
 * Sanitize object keys and string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    maxStringLength?: number;
    maxDepth?: number;
    allowedKeys?: string[];
  } = {}
): T {
  const { maxStringLength = 10000, maxDepth = 10, allowedKeys } = options;

  function sanitizeValue(value: unknown, depth: number): unknown {
    if (depth > maxDepth) {
      return null;
    }

    if (typeof value === 'string') {
      return sanitizeString(value, { maxLength: maxStringLength });
    }

    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, depth + 1));
    }

    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        // Skip disallowed keys
        if (allowedKeys && !allowedKeys.includes(key)) {
          continue;
        }
        // Sanitize key name
        const sanitizedKey = sanitizeString(key, { maxLength: 100 });
        sanitized[sanitizedKey] = sanitizeValue(val, depth + 1);
      }
      return sanitized;
    }

    return value;
  }

  return sanitizeValue(obj, 0) as T;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  const sanitized = email.toLowerCase().trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return null;
  }

  // Check length
  if (sanitized.length > 254) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-numeric characters except + at start
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Prevent javascript: and data: URLs
    if (parsed.href.toLowerCase().includes('javascript:') ||
        parsed.href.toLowerCase().includes('data:')) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let safe = filename.replace(/[/\\:\0]/g, '');

  // Remove leading dots (hidden files)
  safe = safe.replace(/^\.+/, '');

  // Replace spaces with underscores
  safe = safe.replace(/\s+/g, '_');

  // Remove any remaining potentially dangerous characters
  safe = safe.replace(/[<>:"|?*]/g, '');

  // Limit length
  if (safe.length > 255) {
    const ext = safe.split('.').pop() || '';
    const name = safe.substring(0, 255 - ext.length - 1);
    safe = ext ? `${name}.${ext}` : name;
  }

  return safe || 'unnamed';
}

/**
 * Sanitize SQL-like input (for search queries, not for SQL injection prevention)
 */
export function sanitizeSearchQuery(query: string): string {
  // Remove SQL wildcards and special characters
  return query
    .replace(/[%_'"\\;]/g, '')
    .trim()
    .substring(0, 200);
}

/**
 * Check if string contains potentially dangerous patterns
 */
export function containsDangerousPatterns(str: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /data:/i,
    /vbscript:/i,
    /expression\s*\(/i,
    /url\s*\(/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(str));
}

/**
 * Validate content type
 */
export function isValidContentType(
  contentType: string,
  allowedTypes: string[]
): boolean {
  const normalized = contentType.toLowerCase().split(';')[0].trim();
  return allowedTypes.some(
    (allowed) =>
      normalized === allowed.toLowerCase() ||
      (allowed.endsWith('/*') &&
        normalized.startsWith(allowed.slice(0, -1)))
  );
}

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  text: ['text/plain', 'text/csv'],
} as const;
