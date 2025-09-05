import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Global error handler middleware
 * Catches all errors and returns a consistent error response
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate error ID for tracking
  const errorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const severity = error.severity || 'medium';

  // Use structured logging
  logger.error('Unhandled error occurred', {
    errorId,
    message: error.message,
    stack: error.stack,
    url: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: (req as any).requestId,
    userId: (req as any).user?.id,
    severity,
  });
  
  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    message = 'Resource not found';
  }
  
  // Create enhanced error response
  const errorResponse: any = {
    success: false,
    error: message,
    errorId,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };
  
  // Add development-only debugging information
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      originalMessage: error.message,
      stack: error.stack,
      requestId: (req as any).requestId,
    };
  }

  // Add error code if available
  if (error.code) {
    errorResponse.code = error.code;
  }
  
  res.status(statusCode).json(errorResponse);
};