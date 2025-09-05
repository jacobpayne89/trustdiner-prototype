import Redis from 'ioredis';

/**
 * Redis caching service for TrustDiner
 * Handles caching of API responses, user sessions, and rate limiting
 */

let redis: Redis | null = null;

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

/**
 * Initialize Redis connection
 */
export function initializeCache(config?: Partial<CacheConfig>): Redis {
  if (redis) {
    return redis;
  }

  // Check if Redis should be enabled
  const redisUrl = process.env.REDIS_URL;
  const enableRedis = process.env.ENABLE_REDIS === 'true' || process.env.NODE_ENV === 'production';
  
  if (!enableRedis || !redisUrl) {
    console.log('📊 Redis disabled - using mock cache for development');
    return createMockRedis();
  }

  const defaultConfig: CacheConfig = {
    host: 'localhost',
    port: 6379,
    keyPrefix: 'trustdiner:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    ...config
  };

  try {
    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      // Use connection string
      redis = new Redis(redisUrl, {
        keyPrefix: defaultConfig.keyPrefix,
        maxRetriesPerRequest: defaultConfig.maxRetriesPerRequest,
        lazyConnect: defaultConfig.lazyConnect
      });
    } else {
      // Use individual config
      redis = new Redis(defaultConfig);
    }

    // Event handlers
    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });

    redis.on('ready', () => {
      console.log('🚀 Redis ready for operations');
    });

    redis.on('close', () => {
      console.log('📊 Redis connection closed');
    });

    console.log('📊 Redis cache initialized');
    return redis;

  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    return createMockRedis();
  }
}

/**
 * Create a mock Redis client for development/fallback
 */
function createMockRedis(): any {
  const mockStorage = new Map<string, { value: string; expiry?: number }>();

  return {
    async get(key: string): Promise<string | null> {
      const item = mockStorage.get(key);
      if (!item) return null;
      
      if (item.expiry && Date.now() > item.expiry) {
        mockStorage.delete(key);
        return null;
      }
      
      return item.value;
    },

    async set(key: string, value: string, ...args: any[]): Promise<'OK'> {
      const item: { value: string; expiry?: number } = { value };
      
      // Handle EX (seconds) and PX (milliseconds) expiration
      for (let i = 0; i < args.length; i += 2) {
        if (args[i] === 'EX') {
          item.expiry = Date.now() + (parseInt(args[i + 1]) * 1000);
        } else if (args[i] === 'PX') {
          item.expiry = Date.now() + parseInt(args[i + 1]);
        }
      }
      
      mockStorage.set(key, item);
      return 'OK';
    },

    async del(key: string | string[]): Promise<number> {
      const keys = Array.isArray(key) ? key : [key];
      let deleted = 0;
      
      keys.forEach(k => {
        if (mockStorage.has(k)) {
          mockStorage.delete(k);
          deleted++;
        }
      });
      
      return deleted;
    },

    async exists(key: string): Promise<number> {
      return mockStorage.has(key) ? 1 : 0;
    },

    async flushall(): Promise<'OK'> {
      mockStorage.clear();
      return 'OK';
    },

    async quit(): Promise<'OK'> {
      mockStorage.clear();
      return 'OK';
    }
  };
}

/**
 * Get Redis instance
 */
export function getCache(): Redis {
  if (!redis) {
    return initializeCache();
  }
  return redis;
}

/**
 * Cache wrapper for API responses
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const cache = getCache();
    const cached = await cache.get(key);
    
    if (cached) {
      console.log(`📊 Cache HIT: ${key}`);
      return JSON.parse(cached);
    }
    
    console.log(`📊 Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.error('❌ Cache get error:', error);
    return null;
  }
}

/**
 * Cache wrapper for setting API responses
 */
export async function cacheSet<T>(
  key: string, 
  value: T, 
  ttlSeconds: number = 300
): Promise<boolean> {
  try {
    const cache = getCache();
    await cache.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    console.log(`📊 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    return true;
  } catch (error) {
    console.error('❌ Cache set error:', error);
    return false;
  }
}

/**
 * Delete cached data
 */
export async function cacheDelete(key: string | string[]): Promise<boolean> {
  try {
    const cache = getCache();
    const deleted = Array.isArray(key) ? await cache.del(...key) : await cache.del(key);
    console.log(`📊 Cache DELETE: ${Array.isArray(key) ? key.join(', ') : key} (${deleted} keys)`);
    return deleted > 0;
  } catch (error) {
    console.error('❌ Cache delete error:', error);
    return false;
  }
}

/**
 * Clear all cache data
 */
export async function cacheClear(): Promise<boolean> {
  try {
    const cache = getCache();
    await cache.flushall();
    console.log('📊 Cache CLEARED');
    return true;
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    return false;
  }
}

/**
 * Rate limiting using Redis
 */
export async function rateLimit(
  key: string, 
  limit: number, 
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const cache = getCache();
    const now = Date.now();
    const window = windowSeconds * 1000;
    const windowStart = Math.floor(now / window) * window;
    const windowKey = `ratelimit:${key}:${windowStart}`;
    
    const current = await cache.get(windowKey);
    const count = current ? parseInt(current) : 0;
    
    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + window
      };
    }
    
    // Increment counter
    await cache.set(windowKey, String(count + 1), 'PX', window);
    
    return {
      allowed: true,
      remaining: limit - count - 1,
      resetTime: windowStart + window
    };
  } catch (error) {
    console.error('❌ Rate limit error:', error);
    // Fail open - allow request if Redis fails
    return {
      allowed: true,
      remaining: 0,
      resetTime: Date.now() + (windowSeconds * 1000)
    };
  }
}

/**
 * Cache middleware for Express routes
 */
export function cacheMiddleware(ttlSeconds: number = 300) {
  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `api:${req.originalUrl}`;
    
    try {
      const cached = await cacheGet(cacheKey);
      
      if (cached) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cached);
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data: any) {
        cacheSet(cacheKey, data, ttlSeconds);
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('❌ Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Health check for Redis
 */
export async function cacheHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  latency?: number;
}> {
  try {
    const cache = getCache();
    const start = Date.now();
    
    await cache.set('health:check', 'ok', 'EX', 10);
    const result = await cache.get('health:check');
    
    const latency = Date.now() - start;
    
    if (result === 'ok') {
      return {
        status: 'healthy',
        message: `Redis responsive in ${latency}ms`,
        latency
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Redis health check failed'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Redis error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Close Redis connection
 */
export async function closeCache(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('📊 Redis connection closed');
  }
}