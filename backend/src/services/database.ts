import { Pool } from 'pg';
import { mockPool } from './prototypeDatabase';

let pool: Pool | null = null;

export function getPool(): Pool {
  // Use prototype database if PROTOTYPE_MODE is enabled
  if (process.env.PROTOTYPE_MODE === 'true') {
    console.log('🎯 Using prototype in-memory database');
    return mockPool as any;
  }

  if (!pool) {
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    console.log('📊 Database pool created');
  }
  
  return pool;
}

export async function testConnection(): Promise<boolean> {
  try {
    const client = getPool();
    const result = await client.query('SELECT NOW()');
    
    if (process.env.PROTOTYPE_MODE === 'true') {
      console.log('✅ Prototype database connection successful:', result.rows[0].timestamp);
    } else {
      console.log('✅ Database connection successful:', result.rows[0].now);
    }
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('📊 Database pool closed');
  }
}

/**
 * Initialize database schema - DEPRECATED
 * Use migrations instead: ./scripts/apply-migrations.sh
 */
export async function initializeSchema(): Promise<void> {
  throw new Error('initializeSchema is deprecated. Use migrations only. Run: npm run migrate or ./scripts/apply-migrations.sh');
}

// Health check function for monitoring
export async function healthCheck(): Promise<{ status: string; message?: string; timestamp: string }> {
  try {
    const client = getPool();
    const result = await client.query('SELECT NOW() as timestamp');
    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp
    };
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    };
  }
}

// Get pool statistics for monitoring
export function getPoolStats(): { totalCount: number; idleCount: number; waitingCount: number } {
  if (!pool) {
    return { totalCount: 0, idleCount: 0, waitingCount: 0 };
  }
  
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

// Legacy compatibility - these functions maintain backward compatibility
export async function query(text: string, params?: any[]): Promise<any> {
  const client = getPool();
  return client.query(text, params);
}

export { Pool } from 'pg';
