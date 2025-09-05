import { Router, Request, Response } from 'express';
import { getPool } from '../services/database';

const router = Router();

/**
 * Dashboard endpoint for API usage and statistics
 * Provides analytics data for admin users
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📊 Dashboard data requested');

    const pool = getPool();
    
    // Get basic statistics
    const [
      establishmentsResult,
      reviewsResult,
      usersResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM public.establishments'),
      pool.query('SELECT COUNT(*) as count FROM reviews.allergen_reviews'),
      pool.query('SELECT COUNT(*) as count FROM users.accounts')
    ]);

    const stats = {
      establishments: parseInt(establishmentsResult.rows[0].count),
      reviews: parseInt(reviewsResult.rows[0].count),
      users: parseInt(usersResult.rows[0].count)
    };

    // Mock API usage data (replace with real tracking later)
    const apiUsage = {
      dailyCalls: 45,
      dailyLimit: 1000,
      monthlyCalls: 1250,
      monthlyLimit: 25000,
      costEstimate: 12.50,
      lastUpdated: new Date().toISOString()
    };

    // Recent activity (mock data for now)
    const recentCalls = [
      {
        endpoint: '/api/establishments',
        method: 'GET',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 200,
        responseTime: 120
      },
      {
        endpoint: '/api/search',
        method: 'GET',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        status: 200,
        responseTime: 85
      },
      {
        endpoint: '/api/places/search',
        method: 'GET',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 200,
        responseTime: 340
      }
    ];

    const dashboardData = {
      statistics: stats,
      apiUsage,
      recentCalls,
      serverStatus: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Dashboard data compiled successfully');
    res.json(dashboardData);

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      error: 'Dashboard data unavailable',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Reset dashboard/clear cache endpoint
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Dashboard reset requested');
    
    // Clear any cached data (implement as needed)
    // For now, just return success
    
    res.json({
      message: 'Dashboard reset successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Dashboard reset error:', error);
    res.status(500).json({
      error: 'Dashboard reset failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export { router as dashboardRouter };