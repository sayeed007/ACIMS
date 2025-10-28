import { NextResponse } from 'next/server';

/**
 * CORS Headers for API responses
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Standard API Response Interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp?: string;
  };
}

/**
 * Success Response Helper
 */
export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200, headers: corsHeaders }
  );
}

/**
 * Created Response Helper (201)
 */
export function createdResponse<T>(
  data: T,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 201, headers: corsHeaders }
  );
}

/**
 * Error Response Helper
 */
export function errorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status, headers: corsHeaders }
  );
}

/**
 * Validation Error Response (400)
 */
export function validationError(
  message: string = 'Validation failed',
  details?: any
): NextResponse<ApiResponse> {
  return errorResponse('VALIDATION_ERROR', message, details, 400);
}

/**
 * Unauthorized Error Response (401)
 */
export function unauthorizedError(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse('UNAUTHORIZED', message, undefined, 401);
}

/**
 * Forbidden Error Response (403)
 */
export function forbiddenError(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse('FORBIDDEN', message, undefined, 403);
}

/**
 * Not Found Error Response (404)
 */
export function notFoundError(
  message: string = 'Resource not found'
): NextResponse<ApiResponse> {
  return errorResponse('NOT_FOUND', message, undefined, 404);
}

/**
 * Conflict Error Response (409)
 */
export function conflictError(
  message: string = 'Resource already exists'
): NextResponse<ApiResponse> {
  return errorResponse('CONFLICT', message, undefined, 409);
}

/**
 * Internal Server Error Response (500)
 */
export function internalServerError(
  message: string = 'Internal server error',
  details?: any
): NextResponse<ApiResponse> {
  // Log the error for debugging (in production, send to error tracking service)
  console.error('Internal Server Error:', message, details);

  return errorResponse(
    'INTERNAL_SERVER_ERROR',
    message,
    process.env.NODE_ENV === 'development' ? details : undefined,
    500
  );
}

/**
 * Database Error Response (500)
 */
export function databaseError(
  message: string = 'Database operation failed',
  error?: any
): NextResponse<ApiResponse> {
  console.error('Database Error:', message, error);

  return errorResponse(
    'DATABASE_ERROR',
    message,
    process.env.NODE_ENV === 'development' ? error?.message : undefined,
    500
  );
}

/**
 * Pagination Helper
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  total?: number;
}

export function getPaginationMeta(params: PaginationParams) {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const total = params.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Extract pagination params from request
 */
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  // Validate and cap pagination values
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit,
  };
}
