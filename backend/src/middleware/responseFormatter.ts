import { Request, Response, NextFunction } from 'express';

/**
 * Standard API response format for TrustDiner
 * Ensures consistent response structure across all endpoints
 */

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
    version: string;
    cached?: boolean;
    processingTime?: number;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Response formatter middleware
 * Adds standard response methods to the response object
 */
export function responseFormatter(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Success response helper
  res.success = function<T>(data: T, message?: string, meta?: any) {
    const processingTime = Date.now() - startTime;
    
    const response: StandardResponse<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        requestId: req.headers['x-request-id'] as string,
        version: '1.0.0',
        processingTime,
        ...meta
      }
    };

    return this.json(response);
  };

  // Error response helper
  res.error = function(error: string, statusCode: number = 500, details?: any) {
    const processingTime = Date.now() - startTime;
    
    const response: StandardResponse = {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        requestId: req.headers['x-request-id'] as string,
        version: '1.0.0',
        processingTime,
        details
      }
    };

    return this.status(statusCode).json(response);
  };

  // Paginated response helper
  res.paginated = function<T>(
    data: T[], 
    total: number, 
    page: number = 1, 
    limit: number = 20,
    message?: string
  ) {
    const processingTime = Date.now() - startTime;
    const totalPages = Math.ceil(total / limit);
    
    const response: StandardResponse<T[]> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        requestId: req.headers['x-request-id'] as string,
        version: '1.0.0',
        processingTime
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    return this.json(response);
  };

  next();
}

/**
 * Global error handler with standardized format
 */
export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error('❌ API Error:', {
    path: req.originalUrl,
    method: req.method,
    error: error.message,
    stack: error.stack
  });

  // Handle specific error types
  let statusCode = 500;
  let message = 'Internal server error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  }

  const response: StandardResponse = {
    success: false,
    error: message,
    meta: {
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      requestId: req.headers['x-request-id'] as string,
      version: '1.0.0'
    }
  };

  // Only include error details in development
  if (process.env.NODE_ENV === 'development') {
    response.meta!.details = {
      originalError: error.message,
      stack: error.stack
    };
  }

  res.status(statusCode).json(response);
}

/**
 * Request ID middleware
 * Adds unique request ID for tracking
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = generateRequestId();
  }
  
  res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
  next();
}

/**
 * Generate a simple request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extend Express Response interface
declare global {
  namespace Express {
    interface Response {
      success<T>(data: T, message?: string, meta?: any): this;
      error(error: string, statusCode?: number, details?: any): this;
      paginated<T>(data: T[], total: number, page?: number, limit?: number, message?: string): this;
    }
  }
}
