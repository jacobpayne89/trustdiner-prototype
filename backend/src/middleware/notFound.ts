import { Request, Response, NextFunction } from 'express';

/**
 * 404 Not Found middleware
 * Handles requests to non-existent routes
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  console.log(`❓ Route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    suggestion: 'Check the API documentation for available endpoints'
  });
};