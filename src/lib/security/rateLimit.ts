/**
 * Rate Limiting Middleware
 *
 * Implements token bucket algorithm for API rate limiting
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // Prefix for storage keys
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when limit resets
  retryAfter?: number; // Seconds until retry allowed
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

/**
 * Check rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

  let entry = rateLimitStore.get(fullKey);

  // If no entry or window expired, create new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(fullKey, entry);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(fullKey, entry);

  // Check if over limit
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter,
    };
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyPrefix: 'auth',
  },

  // API endpoints - standard limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyPrefix: 'api',
  },

  // Search endpoints - moderate limits
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
    keyPrefix: 'search',
  },

  // Export endpoints - stricter limits
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 exports per hour
    keyPrefix: 'export',
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 uploads per hour
    keyPrefix: 'upload',
  },
} as const;

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a hash of user-agent + other headers
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `ua:${hashString(userAgent)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());

  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }

  return headers;
}
