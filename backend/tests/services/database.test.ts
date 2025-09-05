import { getPool, testConnection, query } from '../../src/services/database';
import { Pool } from 'pg';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  }))
}));

describe('Database Service', () => {
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = new Pool() as jest.Mocked<Pool>;
    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPool);
  });

  describe('getPool', () => {
    it('should return a database pool instance', () => {
      const pool = getPool();
      expect(pool).toBeDefined();
      expect(Pool).toHaveBeenCalled();
    });

    it('should return the same pool instance on subsequent calls', () => {
      const pool1 = getPool();
      const pool2 = getPool();
      expect(pool1).toBe(pool2);
    });
  });

  describe('testConnection', () => {
    it('should successfully test database connection', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ now: new Date() }] }),
        release: jest.fn()
      };
      mockPool.connect.mockResolvedValue(mockClient as any);

      await expect(testConnection()).resolves.not.toThrow();
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      const connectionError = new Error('Connection failed');
      mockPool.connect.mockRejectedValue(connectionError);

      await expect(testConnection()).rejects.toThrow('Connection failed');
    });

    it('should handle query errors gracefully', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        release: jest.fn()
      };
      mockPool.connect.mockResolvedValue(mockClient as any);

      await expect(testConnection()).rejects.toThrow('Query failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should execute queries successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'Test' }], rowCount: 1 };
      mockPool.query.mockResolvedValue(mockResult);

      const result = await query('SELECT * FROM test WHERE id = $1', [1]);
      
      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [1]);
    });

    it('should handle query without parameters', async () => {
      const mockResult = { rows: [], rowCount: 0 };
      mockPool.query.mockResolvedValue(mockResult);

      const result = await query('SELECT NOW()');
      
      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT NOW()', undefined);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValue(dbError);

      await expect(query('SELECT * FROM nonexistent')).rejects.toThrow('Database error');
    });

    it('should handle connection timeout', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockPool.query.mockRejectedValue(timeoutError);

      await expect(query('SELECT * FROM test')).rejects.toThrow('Connection timeout');
    });
  });

  describe('Connection Pool Configuration', () => {
    it('should configure pool with correct settings', () => {
      // Reset the module to test initialization
      jest.resetModules();
      
      // Set environment variables
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
      process.env.DB_POOL_MIN = '5';
      process.env.DB_POOL_MAX = '20';
      
      // Re-import to trigger initialization
      require('../../src/services/database');
      
      expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
        connectionString: 'postgresql://user:pass@localhost:5432/testdb',
        min: 5,
        max: 20
      }));
    });
  });
});
