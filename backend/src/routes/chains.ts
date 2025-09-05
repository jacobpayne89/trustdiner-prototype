import { Router, Request, Response } from 'express';
import { EstablishmentService } from '../services/establishmentService';

const router = Router();

/**
 * GET /api/chains
 * Get all restaurant chains (public endpoint)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('🏢 Fetching restaurant chains (public)');

    const result = await EstablishmentService.getChains();
    console.log(`📊 Found ${result.length} restaurant chains`);

    res.json(result);

  } catch (error) {
    console.error('❌ Error fetching chains:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chains',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
