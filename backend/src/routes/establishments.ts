import { Router, Request, Response } from 'express';
import { EstablishmentService } from '../services/establishmentService';
import { EstablishmentServiceSimple } from '../services/establishmentService-simple';
import { cacheDelete } from '../services/cache';
import { photoConverterMiddleware } from '../middleware/photoConverter';

const router = Router();

// Utility function for consistent error handling
const handleError = (res: Response, error: any, message: string) => {
  console.error(`❌ ${message}:`, error);
  res.status(500).json({
    error: message,
    message: error instanceof Error ? error.message : 'Unknown error occurred'
  });
};

// Utility function for request validation
const validateRequest = (req: Request, requiredFields: string[]) => {
  const missing = requiredFields.filter(field => !req.body[field]);
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
};

/**
 * GET /api/establishments
 * 
 * Get establishments with filtering, search, and pagination
 */
// Debug endpoint to test photo conversion
router.get('/debug-photo', (req: Request, res: Response) => {
  const testRef = 'ATKogpeUTdMS4bQZVJIge1wMSCWI6EWjehIsXplqR0XDNuR--gddFV5vbbNeCdcZKQmeYP4OpiMCEHDmMUp3sCvl9ekzx1uxSBWB_923SEymrhWPoX8_ZaEmMqTXpsmrdDx1bz5lBvzNQHV_oDarTdgCsL-Zay4P0lzbqwBW9z2Us0XHefwCS6h-zrGK3Lz9aCl4vLwWuS-pozEiZ9ufZzktYdZ8SAEGqj-B2ItTsY2l6pQB5r4XsPLIEuZ7AzGqEU5ypmkbhE7Raw91Ul07pbKd8Acehohi18YX21KRL6HBKQdlYA';
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  console.log('🧪 Debug photo conversion test');
  console.log('🔑 API Key available:', !!apiKey);
  console.log('📷 Test photo ref:', testRef.substring(0, 50) + '...');
  
  if (apiKey && testRef.startsWith('ATKogp')) {
    const convertedUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${testRef}&key=${apiKey}`;
    console.log('🎯 Converted URL:', convertedUrl.substring(0, 100) + '...');
    
    res.json({
      success: true,
      original: testRef,
      converted: convertedUrl,
      apiKeyAvailable: true
    });
  } else {
    res.json({
      success: false,
      original: testRef,
      converted: null,
      apiKeyAvailable: !!apiKey,
      error: !apiKey ? 'API key not available' : 'Not a Google Places photo reference'
    });
  }
});


router.get('/', photoConverterMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      search,
      chainId,
      hasReviews,
      minRating,
      allergenSafe,
      limit = 50,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    console.log('🏪 Loading establishments with params:', {
      search, chainId, hasReviews, minRating, allergenSafe, limit, offset, sortBy, sortOrder
    });

    const result = await EstablishmentService.getEstablishments({
      search: search as string,
      chainId: chainId ? parseInt(chainId as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    });

    console.log(`✅ EstablishmentService returned:`, {
      establishmentsCount: result.establishments.length,
      total: result.total,
      hasMore: result.hasMore,
      sampleEstablishment: result.establishments[0] ? {
        id: result.establishments[0].id,
        name: result.establishments[0].name,
        place_id: result.establishments[0].place_id
      } : null
    });

    // Ensure we return the expected format for the frontend
    // Convert Google Places photo references to actual URLs
    console.log('🔄 Processing', result.establishments.length, 'establishments for photo conversion');
    const establishmentsWithConvertedPhotos = result.establishments.map((establishment: any) => {
      console.log('🔍 Checking establishment:', establishment.name, 'image URL:', establishment.local_image_url?.substring(0, 30) + '...');
      
      if (establishment.local_image_url && establishment.local_image_url.startsWith('ATKogp')) {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        console.log('🔑 API Key available for conversion:', !!apiKey);
        
        if (apiKey) {
          const convertedUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${establishment.local_image_url}&key=${apiKey}`;
          console.log('🎯 Converting photo for', establishment.name, ':', establishment.local_image_url.substring(0, 30) + '... → Google Photos URL');
          return {
            ...establishment,
            local_image_url: convertedUrl
          };
        } else {
          console.log('❌ No API key available for photo conversion');
        }
      } else {
        console.log('ℹ️ Not a Google Places photo reference, keeping as-is');
      }
      return establishment;
    });

    const response = {
      data: establishmentsWithConvertedPhotos,
      meta: {
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.hasMore
      }
    };

    console.log(`📤 Sending response with ${response.data.length} establishments`);
    res.json(response);

  } catch (error) {
    console.error('❌ CRITICAL ERROR in /api/establishments:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Send detailed error for debugging
    res.status(500).json({
      error: 'Failed to fetch establishments',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : null,
        type: typeof error,
        errorObject: error
      } : undefined
    });
  }
});

/**
 * GET /api/establishments/:identifier
 * 
 * Get a single establishment by ID, UUID, or place_id
 */
router.get('/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    console.log(`🔍 Fetching establishment: ${identifier}`);

    const establishment = await EstablishmentService.getEstablishmentById(identifier);

    if (!establishment) {
      return res.status(404).json({ 
        error: 'Establishment not found',
        identifier 
      });
    }

    console.log(`✅ Found establishment: ${establishment.name}`);

    res.json(establishment);

  } catch (error) {
    handleError(res, error, 'Failed to fetch establishment');
  }
});

/**
 * POST /api/establishments
 * 
 * Create a new establishment
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationError = validateRequest(req, ['name', 'placeId']);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const {
      name,
      placeId,
      address,
      position,
      phone,
      website,
      priceLevel,
      rating,
      userRatingsTotal,
      types,
      businessStatus,
      chainId,
      localImageUrl,
      tags
    } = req.body;

    console.log(`🏗️ Creating establishment: ${name}`);

    const establishment = await EstablishmentService.createEstablishment({
      name,
      placeId,
      address,
      position,
      phone,
      website,
      priceLevel,
      rating,
      userRatingsTotal,
      types,
      businessStatus,
      chainId,
      localImageUrl,
      tags
    });

    console.log(`✅ Establishment created: ${establishment.name} (ID: ${establishment.id})`);

    // Clear establishments cache
    cacheDelete('establishments:*');

    res.status(201).json(establishment);

  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    handleError(res, error, 'Failed to create establishment');
  }
});

/**
 * PUT /api/establishments/:identifier
 * 
 * Update an existing establishment
 */
router.put('/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const updateData = req.body;

    console.log(`📝 Updating establishment: ${identifier}`);

    const updatedEstablishment = await EstablishmentService.updateEstablishment(identifier, updateData);

    console.log(`✅ Establishment updated: ${updatedEstablishment.name}`);

    // Clear relevant caches
    cacheDelete(`establishment:${identifier}`);
    cacheDelete('establishments:*');

    res.json(updatedEstablishment);

  } catch (error) {
    if (error instanceof Error && error.message === 'Establishment not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof Error && error.message === 'No fields to update') {
      return res.status(400).json({ error: error.message });
    }
    handleError(res, error, 'Failed to update establishment');
  }
});

/**
 * DELETE /api/establishments/:identifier
 * 
 * Delete an establishment
 */
router.delete('/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    console.log(`🗑️ Deleting establishment: ${identifier}`);

    const deletedEstablishment = await EstablishmentService.deleteEstablishment(identifier);

    console.log(`✅ Establishment deleted: ${deletedEstablishment.name}`);

    // Clear relevant caches
    cacheDelete(`establishment:${identifier}`);
    cacheDelete('establishments:*');

    res.json({ 
      message: 'Establishment deleted successfully', 
      id: deletedEstablishment.id,
      name: deletedEstablishment.name
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Establishment not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Cannot delete establishment with existing reviews')) {
        return res.status(409).json({ error: error.message });
      }
    }
    handleError(res, error, 'Failed to delete establishment');
  }
});

/**
 * GET /api/establishments/search/:query
 * 
 * Search establishments by text query
 */
router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const { 
      limit = 20, 
      includeChains = 'true',
      allergenSafe 
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    console.log(`🔍 Searching establishments: "${query}"`);

    const results = await EstablishmentService.searchEstablishments(query, {
      limit: parseInt(limit as string),
      includeChains: includeChains === 'true',
      allergenSafe: allergenSafe ? (allergenSafe as string).split(',') : undefined
    });

    console.log(`✅ Found ${results.length} establishments matching "${query}"`);

    res.json({
      query,
      results,
      count: results.length
    });

  } catch (error) {
    handleError(res, error, 'Failed to search establishments');
  }
});

/**
 * GET /api/establishments/stats
 * 
 * Get establishment statistics
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    console.log('📊 Fetching establishment statistics...');

    const stats = await EstablishmentService.getEstablishmentStats();

    console.log(`✅ Statistics loaded: ${stats.totalEstablishments} total establishments`);

    res.json(stats);

  } catch (error) {
    handleError(res, error, 'Failed to fetch establishment statistics');
  }
});

/**
 * PUT /api/establishments/:identifier/allergen-scores
 * 
 * Update allergen scores for an establishment based on reviews
 */
router.put('/:identifier/allergen-scores', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    // First get the establishment to get its ID
    const establishment = await EstablishmentService.getEstablishmentById(identifier);
    
    if (!establishment) {
      return res.status(404).json({ 
        error: 'Establishment not found',
        identifier 
      });
    }

    console.log(`🧮 Updating allergen scores for: ${establishment.name}`);

    const result = await EstablishmentService.updateAllergenScores(establishment.id);

    if (!result) {
      return res.status(404).json({ 
        error: 'No reviews found to calculate allergen scores' 
      });
    }

    console.log(`✅ Allergen scores updated for: ${establishment.name}`);

    // Clear relevant caches
    cacheDelete(`establishment:${identifier}`);

    res.json({
      message: 'Allergen scores updated successfully',
      averageAllergenScores: result.average_allergen_scores
    });

  } catch (error) {
    handleError(res, error, 'Failed to update allergen scores');
  }
});

/**
 * POST /api/establishments/bulk-import
 * 
 * Bulk import establishments from external source
 */
router.post('/bulk-import', async (req: Request, res: Response) => {
  try {
    const { establishments } = req.body;

    if (!Array.isArray(establishments) || establishments.length === 0) {
      return res.status(400).json({ 
        error: 'establishments must be a non-empty array' 
      });
    }

    console.log(`📦 Bulk importing ${establishments.length} establishments...`);

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const establishmentData of establishments) {
      try {
        // Validate required fields
        if (!establishmentData.name || !establishmentData.placeId) {
          results.errors.push(`Missing required fields for establishment: ${JSON.stringify(establishmentData)}`);
          continue;
        }

        await EstablishmentService.createEstablishment(establishmentData);
        results.created++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          results.skipped++;
        } else {
          results.errors.push(`Failed to create ${establishmentData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    console.log(`✅ Bulk import completed: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors`);

    // Clear establishments cache
    cacheDelete('establishments:*');

    res.json({
      message: 'Bulk import completed',
      results
    });

  } catch (error) {
    handleError(res, error, 'Failed to bulk import establishments');
  }
});

/**
 * GET /api/establishments/chains
 * Get all restaurant chains (public endpoint)
 */
router.get('/chains', async (req: Request, res: Response) => {
  try {
    console.log('🏢 Fetching restaurant chains (public)');

    const result = await EstablishmentService.getChains();
    console.log(`📊 Found ${result.length} restaurant chains`);

    res.json(result);

  } catch (error) {
    handleError(res, error, 'Failed to fetch chains');
  }
});

export default router;
