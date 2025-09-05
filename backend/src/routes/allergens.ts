import { Router, Request, Response } from 'express';
import { query } from '../services/database';

const router = Router();

/**
 * GET /api/allergens
 * 
 * Fetch all allergens from the database
 */
router.get('/allergens', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Fetching allergens from database...');
    
    const result = await query(`
      SELECT id, code, name, description, created_at, updated_at
      FROM allergens
      ORDER BY name ASC
    `);
    
    console.log(`✅ Retrieved ${result.rows.length} allergens from database`);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching allergens:', error);
    res.status(500).json({
      error: 'Failed to fetch allergens',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export { router as allergensRouter };
