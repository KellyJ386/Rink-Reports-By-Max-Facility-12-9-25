// API Helper Functions

import { NextResponse } from 'next/server';
import type { APIResponse, PaginationParams, SortParams, RateLimitInfo } from './types';

// Standard success response
export function successResponse<T>(
  data: T,
  meta?: APIResponse<T>['meta'],
  links?: APIResponse<T>['links'],
  status: number = 200
): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
      links,
    },
    { status }
  );
}

// Standard error response
export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
  status: number = 400
): NextResponse<APIResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

// Common error responses
export const errors = {
  unauthorized: () => errorResponse('UNAUTHORIZED', 'Authentication required', undefined, 401),
  forbidden: () => errorResponse('FORBIDDEN', 'Access denied', undefined, 403),
  notFound: (resource: string = 'Resource') =>
    errorResponse('NOT_FOUND', `${resource} not found`, undefined, 404),
  badRequest: (message: string, details?: unknown) =>
    errorResponse('BAD_REQUEST', message, details, 400),
  validationError: (errors: Record<string, string[]>) =>
    errorResponse('VALIDATION_ERROR', 'Validation failed', errors, 422),
  rateLimited: (retryAfter: number) =>
    NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          details: { retryAfter },
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
        },
      }
    ),
  serverError: (message: string = 'Internal server error') =>
    errorResponse('INTERNAL_ERROR', message, undefined, 500),
};

// Parse pagination params from URL
export function parsePaginationParams(url: URL): PaginationParams {
  return {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 100),
    offset: parseInt(url.searchParams.get('offset') || '0'),
    cursor: url.searchParams.get('cursor') || undefined,
  };
}

// Parse sort params from URL
export function parseSortParams(url: URL): SortParams {
  return {
    sortBy: url.searchParams.get('sortBy') || undefined,
    sortOrder: (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };
}

// Build pagination meta
export function buildPaginationMeta(
  params: PaginationParams,
  total: number
): APIResponse['meta'] {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    hasMore: page < totalPages,
  };
}

// Build pagination links
export function buildPaginationLinks(
  baseUrl: string,
  params: PaginationParams,
  total: number
): APIResponse['links'] {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const totalPages = Math.ceil(total / limit);

  const links: APIResponse['links'] = {
    self: `${baseUrl}?page=${page}&limit=${limit}`,
  };

  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }

  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }

  return links;
}

// Add rate limit headers
export function addRateLimitHeaders(
  response: NextResponse,
  info: RateLimitInfo
): NextResponse {
  response.headers.set('X-RateLimit-Limit', info.limit.toString());
  response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
  response.headers.set('X-RateLimit-Reset', info.reset.toISOString());

  if (info.retryAfter) {
    response.headers.set('Retry-After', info.retryAfter.toString());
  }

  return response;
}

// Validate required fields
export function validateRequired(
  body: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field);
    }
  }

  return missing;
}

// Filter object to only include allowed fields
export function filterFields<T extends Record<string, unknown>>(
  obj: T,
  allowedFields: (keyof T)[]
): Partial<T> {
  const filtered: Partial<T> = {};

  for (const field of allowedFields) {
    if (obj[field] !== undefined) {
      filtered[field] = obj[field];
    }
  }

  return filtered;
}

// Serialize dates in response
export function serializeDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeDates) as unknown as T;
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeDates(value);
    }
    return serialized as T;
  }

  return obj;
}

// Validate date string
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Parse date range from params
export function parseDateRange(url: URL): { start?: Date; end?: Date } {
  const startStr = url.searchParams.get('startDate');
  const endStr = url.searchParams.get('endDate');

  return {
    start: startStr && isValidDate(startStr) ? new Date(startStr) : undefined,
    end: endStr && isValidDate(endStr) ? new Date(endStr) : undefined,
  };
}
