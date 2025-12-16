import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers for all responses
 */
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
};

/**
 * Next.js Middleware
 *
 * Handles:
 * - Security headers
 * - Rate limiting headers
 * - Request logging
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Add request ID for tracing
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-Id', requestId);

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');

    // Allow same-origin and configured origins
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-CSRF-Token, X-Request-Id'
      );
      response.headers.set(
        'Access-Control-Expose-Headers',
        'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Request-Id'
      );
    }

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  return response;
}

/**
 * Configure which paths the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
