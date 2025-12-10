/**
 * Security Headers Configuration
 *
 * Implements security headers for HTTP responses
 */

/**
 * Content Security Policy directives
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for Next.js
  'style-src': ["'self'", "'unsafe-inline'"], // Needed for inline styles
  'img-src': ["'self'", 'data:', 'blob:', 'https://storage.googleapis.com', 'https://lh3.googleusercontent.com'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://api.openweathermap.org', 'wss:', 'ws:'],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
} as const;

/**
 * Build CSP header string from directives
 */
export function buildCspHeader(
  directives: Record<string, string[]> = CSP_DIRECTIVES
): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS filter in older browsers
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(self), payment=()',

  // Content Security Policy
  'Content-Security-Policy': buildCspHeader(),

  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Cross-Origin policies
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

/**
 * Get security headers for API responses
 */
export function getApiSecurityHeaders(): Headers {
  const headers = new Headers();

  // Core security headers for API
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Cache-Control', 'no-store, max-age=0');

  return headers;
}

/**
 * Apply security headers to a Response
 */
export function applySecurityHeaders(
  response: Response,
  additionalHeaders?: Record<string, string>
): Response {
  const newHeaders = new Headers(response.headers);

  // Apply security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, value);
    }
  }

  // Apply additional headers
  if (additionalHeaders) {
    for (const [key, value] of Object.entries(additionalHeaders)) {
      newHeaders.set(key, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Build CORS headers for response
 */
export function buildCorsHeaders(
  origin: string | null,
  config: CorsConfig = DEFAULT_CORS_CONFIG
): Headers {
  const headers = new Headers();

  // Check if origin is allowed
  const isAllowed =
    origin &&
    (config.allowedOrigins.includes('*') ||
      config.allowedOrigins.includes(origin));

  if (isAllowed && origin) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set(
    'Access-Control-Allow-Methods',
    config.allowedMethods.join(', ')
  );
  headers.set(
    'Access-Control-Allow-Headers',
    config.allowedHeaders.join(', ')
  );

  if (config.exposedHeaders?.length) {
    headers.set(
      'Access-Control-Expose-Headers',
      config.exposedHeaders.join(', ')
    );
  }

  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (config.maxAge) {
    headers.set('Access-Control-Max-Age', config.maxAge.toString());
  }

  return headers;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPrelight(
  origin: string | null,
  config: CorsConfig = DEFAULT_CORS_CONFIG
): Response {
  const headers = buildCorsHeaders(origin, config);
  return new Response(null, { status: 204, headers });
}
