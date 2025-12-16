// API Module

export * from './types';
export * from './keys';
export * from './webhooks';
export * from './helpers';

// API configuration
export const apiConfig = {
  version: 'v1',
  baseUrl: '/api/v1',
  defaultLimit: 20,
  maxLimit: 100,
  defaultRateLimit: 1000, // requests per hour
  rateLimitWindow: 60 * 60 * 1000, // 1 hour in ms
};

// Extract API key from request
export function extractAPIKey(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter (not recommended, but sometimes needed)
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('api_key');
  if (queryKey) {
    return queryKey;
  }

  return null;
}

// Check if request is from API (vs browser)
export function isAPIRequest(request: Request): boolean {
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');

  return (
    contentType?.includes('application/json') ||
    accept?.includes('application/json') ||
    !!extractAPIKey(request)
  );
}

// Get client IP from request
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Generate request ID
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

// CORS configuration
export const corsConfig = {
  allowedOrigins: ['*'], // Configure based on environment
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'X-Tenant-ID',
    'X-Facility-ID',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
  ],
  maxAge: 86400, // 24 hours
};
