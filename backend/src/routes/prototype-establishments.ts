import { Router } from 'express';
import { prototypeDb } from '../services/prototypeDatabase';

const router = Router();

// Get all establishments for prototype
router.get('/', async (req, res) => {
  try {
    const establishments = await prototypeDb.getEstablishments();
    
    res.json({
      success: true,
      data: establishments,
      pagination: {
        total: establishments.length,
        page: 1,
        limit: establishments.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching prototype establishments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch establishments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get single establishment for prototype
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const establishment = await prototypeDb.getEstablishment(id);
    
    if (!establishment) {
      return res.status(404).json({
        success: false,
        error: 'Establishment not found'
      });
    }
    
    res.json({
      success: true,
      data: establishment
    });
  } catch (error) {
    console.error('Error fetching prototype establishment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch establishment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
