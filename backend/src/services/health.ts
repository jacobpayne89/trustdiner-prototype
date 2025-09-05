/**
 * Health monitoring service for TrustDiner Backend
 * Provides comprehensive health checks and system status
 */

import { query } from './database';
import { logger } from './logger';
import Redis from 'ioredis';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  summary: {
    healthy: number;
    unhealthy: number;
    degraded: number;
    total: number;
  };
}

class HealthMonitor {
  private startTime = Date.now();
  
  async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const result = await query('SELECT 1 as health_check', []);
      const responseTime = Date.now() - startTime;
      
      if (result.rows.length === 1 && result.rows[0].health_check === 1) {
        return {
          name: 'database',
          status: 'healthy',
          responseTime,
          metadata: {
            connectionPool: 'active',
          },
        };
      } else {
        return {
          name: 'database',
          status: 'unhealthy',
          responseTime,
          error: 'Unexpected response from health check query',
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Use imported Redis class
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      
      await redis.ping();
      const responseTime = Date.now() - startTime;
      
      await redis.disconnect();
      
      return {
        name: 'redis',
        status: 'healthy',
        responseTime,
        metadata: {
          connection: 'active',
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'redis',
        status: 'degraded', // Redis is optional, so mark as degraded not unhealthy
        responseTime,
        error: error instanceof Error ? error.message : 'Redis connection failed',
        metadata: {
          note: 'Redis is optional - application can function without it',
        },
      };
    }
  }

  async checkMemory(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const memUsage = process.memoryUsage();
      const responseTime = Date.now() - startTime;
      
      // Convert bytes to MB
      const rss = Math.round(memUsage.rss / 1024 / 1024);
      const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      // Consider unhealthy if using more than 512MB RSS
      const status = rss > 512 ? 'degraded' : 'healthy';
      
      return {
        name: 'memory',
        status,
        responseTime,
        metadata: {
          rss: `${rss}MB`,
          heapUsed: `${heapUsed}MB`,
          heapTotal: `${heapTotal}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'memory',
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Memory check failed',
      };
    }
  }

  async checkDisk(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat('.');
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'disk',
        status: 'healthy',
        responseTime,
        metadata: {
          accessible: true,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'disk',
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Disk access failed',
      };
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    const summary = checks.reduce(
      (acc, check) => {
        acc[check.status]++;
        acc.total++;
        return acc;
      },
      { healthy: 0, unhealthy: 0, degraded: 0, total: 0 }
    );

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const health: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      summary,
    };

    // Log health status
    if (overallStatus === 'unhealthy') {
      logger.error('System health check failed', { health });
    } else if (overallStatus === 'degraded') {
      logger.warn('System health degraded', { health });
    } else {
      logger.debug('System health check passed', { health });
    }

    return health;
  }

  async getQuickHealth(): Promise<{ status: string; uptime: number; timestamp: string }> {
    try {
      // Quick database ping
      await query('SELECT 1', []);
      
      return {
        status: 'healthy',
        uptime: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'unhealthy',
        uptime: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();
