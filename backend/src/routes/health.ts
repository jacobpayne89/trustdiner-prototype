import { Router, Request, Response } from 'express';
import { healthCheck, getPoolStats } from '../services/database';
import { cacheHealthCheck } from '../services/cache';
import { logger } from '../services/logger';

const router = Router();

/**
 * GET /health
 * Health check endpoint for the API
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbHealth = await healthCheck();
    const cacheHealth = await cacheHealthCheck();
    const poolStats = getPoolStats();
    
    const overallHealthy = dbHealth.status === 'healthy' && cacheHealth.status === 'healthy';
    
    const healthData = {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      database: {
        status: dbHealth.status,
        message: dbHealth.message,
        pool: poolStats
      },
      cache: {
        status: cacheHealth.status,
        message: cacheHealth.message,
        latency: cacheHealth.latency
      }
    };
    
    // Return appropriate status code
    const statusCode = overallHealthy ? 200 : 503;
    
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/health',
      requestId: (req as any).requestId,
    });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/ECS
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbHealth = await healthCheck();
    
    if (dbHealth.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: dbHealth.message
      });
    }
    
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /health/live
 * Liveness probe for Kubernetes/ECS
 */
router.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - just return that the process is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { router as healthRouter };