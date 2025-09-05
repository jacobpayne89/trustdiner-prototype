import { 
  initializeCache, 
  getCache, 
  cacheGet, 
  cacheSet, 
  cacheDelete, 
  cacheClear,
  rateLimit,
  cacheHealthCheck 
} from '../../src/services/cache';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushall: jest.fn(),
    on: jest.fn(),
    ping: jest.fn()
  }));
});

describe('Cache Service', () => {
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    delete process.env.REDIS_URL;
    delete process.env.ENABLE_REDIS;
    
    // Create fresh mock
    const Redis = require('ioredis');
    mockRedis = new Redis();
  });

  describe('initializeCache', () => {
    it('should initialize Redis when REDIS_URL is provided', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.ENABLE_REDIS = 'true';
      
      const cache = initializeCache();
      expect(cache).toBeDefined();
    });

    it('should use mock cache when Redis is disabled', () => {
      process.env.ENABLE_REDIS = 'false';
      
      const cache = initializeCache();
      expect(cache).toBeDefined();
      expect(typeof cache.get).toBe('function');
      expect(typeof cache.set).toBe('function');
    });

    it('should handle Redis connection errors gracefully', () => {
      process.env.REDIS_URL = 'redis://invalid:6379';
      process.env.ENABLE_REDIS = 'true';
      
      // Should not throw, should fall back to mock
      expect(() => initializeCache()).not.toThrow();
    });
  });

  describe('cacheGet', () => {
    beforeEach(() => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      initializeCache();
    });

    it('should retrieve cached data successfully', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheGet<typeof testData>('test-key');
      
      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null for cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheGet('nonexistent-key');
      
      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      mockRedis.get.mockResolvedValue('invalid-json');

      const result = await cacheGet('invalid-key');
      
      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheGet('error-key');
      
      expect(result).toBeNull();
    });
  });

  describe('cacheSet', () => {
    beforeEach(() => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      initializeCache();
    });

    it('should cache data successfully', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedis.set.mockResolvedValue('OK');

      const result = await cacheSet('test-key', testData, 300);
      
      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', JSON.stringify(testData), 'EX', 300);
    });

    it('should use default TTL when not specified', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedis.set.mockResolvedValue('OK');

      await cacheSet('test-key', testData);
      
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', JSON.stringify(testData), 'EX', 300);
    });

    it('should handle Redis set errors', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));

      const result = await cacheSet('error-key', { data: 'test' });
      
      expect(result).toBe(false);
    });
  });

  describe('cacheDelete', () => {
    beforeEach(() => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      initializeCache();
    });

    it('should delete single key successfully', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await cacheDelete('test-key');
      
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should delete multiple keys successfully', async () => {
      mockRedis.del.mockResolvedValue(2);

      const result = await cacheDelete(['key1', 'key2']);
      
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should return false when no keys deleted', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await cacheDelete('nonexistent-key');
      
      expect(result).toBe(false);
    });
  });

  describe('rateLimit', () => {
    beforeEach(() => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      initializeCache();
    });

    it('should allow requests within limit', async () => {
      mockRedis.get.mockResolvedValue('5'); // Current count
      mockRedis.set.mockResolvedValue('OK');

      const result = await rateLimit('user:123', 10, 60);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 10 - 5 - 1
      expect(typeof result.resetTime).toBe('number');
    });

    it('should block requests over limit', async () => {
      mockRedis.get.mockResolvedValue('10'); // At limit

      const result = await rateLimit('user:123', 10, 60);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle first request (no existing count)', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const result = await rateLimit('user:123', 10, 60);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 - 0 - 1
    });

    it('should fail open on Redis errors', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await rateLimit('user:123', 10, 60);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });
  });

  describe('cacheHealthCheck', () => {
    beforeEach(() => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      initializeCache();
    });

    it('should return healthy status when Redis is working', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('ok');

      const result = await cacheHealthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.message).toContain('Redis responsive');
      expect(typeof result.latency).toBe('number');
    });

    it('should return unhealthy status on Redis failure', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis down'));

      const result = await cacheHealthCheck();
      
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Redis error');
    });

    it('should return unhealthy status on incorrect response', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('wrong');

      const result = await cacheHealthCheck();
      
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('health check failed');
    });
  });

  describe('Mock Redis Implementation', () => {
    beforeEach(() => {
      // Force mock Redis usage
      delete process.env.REDIS_URL;
      process.env.ENABLE_REDIS = 'false';
    });

    it('should handle get operations in mock mode', async () => {
      initializeCache();
      
      // Set then get
      await cacheSet('mock-key', { data: 'test' }, 60);
      const result = await cacheGet('mock-key');
      
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle expiration in mock mode', async () => {
      initializeCache();
      
      // Set with very short expiration
      await cacheSet('expire-key', { data: 'test' }, 0.001); // 1ms
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await cacheGet('expire-key');
      expect(result).toBeNull();
    });

    it('should handle delete operations in mock mode', async () => {
      initializeCache();
      
      await cacheSet('delete-key', { data: 'test' });
      const deleted = await cacheDelete('delete-key');
      const result = await cacheGet('delete-key');
      
      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });
  });
});
