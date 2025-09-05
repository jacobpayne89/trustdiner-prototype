import { Router, Request, Response } from 'express';
import { query } from '../services/database';

const router = Router();

// Restrict debug routes to development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Middleware to restrict debug routes to development
 */
const developmentOnly = (req: Request, res: Response, next: any) => {
  if (!isDevelopment) {
    return res.status(403).json({
      error: 'Debug endpoints are only available in development',
      environment: process.env.NODE_ENV
    });
  }
  next();
};

/**
 * POST /api/debug/clear-venues
 * Clear all venues from the database (development only)
 */

router.post('/clear-venues', developmentOnly, async (req: Request, res: Response) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'yes') {
      return res.status(400).json({
        error: 'Must confirm with {"confirm": "yes"}',
        message: 'This is a destructive operation that requires confirmation'
      });
    }
    
    console.log('🧹 Clearing test data from public.establishments table');
    
    // Clear test venues from the new schema structure
    const venuesResult = await query(
      'DELETE FROM public.establishments WHERE name ILIKE \'%test%\' OR name ILIKE \'%debug%\''
    );
    console.log(`   ✅ Cleared ${venuesResult.rowCount} test venues`);
    
    // Clear test reviews
    const reviewsResult = await query(
      'DELETE FROM reviews.allergen_reviews WHERE general_comment ILIKE \'%test%\''
    );
    console.log(`   ✅ Cleared ${reviewsResult.rowCount} test reviews`);
    
    res.json({
      success: true,
      message: 'Test data cleared from public.establishments and reviews.allergen_reviews',
      deleted: {
        venues: venuesResult.rowCount,
        reviews: reviewsResult.rowCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Clear venues error:', error);
    res.status(500).json({
      error: 'Failed to clear venues',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/debug/insert-venues
 * Insert venues for testing (development only)
 */
router.post('/insert-venues', developmentOnly, async (req: Request, res: Response) => {
  try {
    const { venues } = req.body;
    
    if (!Array.isArray(venues)) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'Expected a "venues" array in request body'
      });
    }
    
    console.log(`🔄 Inserting ${venues.length} venues for testing...`);
    
    let insertedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const venue of venues) {
      try {
        // Insert into the new public.establishments table
        const result = await query(`
          INSERT INTO public.establishments (
            place_id, name, address, latitude, longitude,
            rating, user_ratings_total, price_level, business_status,
            types, cuisine, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (place_id) DO NOTHING
          RETURNING id
        `, [
          venue.place_id,
          venue.name,
          venue.address,
          venue.latitude,
          venue.longitude,
          venue.rating,
          venue.user_ratings_total,
          venue.price_level,
          venue.business_status || 'OPERATIONAL',
          JSON.stringify(venue.types || ['restaurant']),
          venue.primaryCategory || venue.primary_category || 'Restaurant'
        ]);
        
        if (result.rows.length > 0) {
          insertedCount++;
          console.log(`   ✅ Successfully inserted: ${venue.name}`);
        } else {
          console.log(`   ⚠️ Skipped (already exists): ${venue.name}`);
        }
        
      } catch (insertError) {
        errorCount++;
        const errorMsg = `${venue.place_id}: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`;
        console.error('❌ Insert error for venue:', errorMsg);
        errors.push(errorMsg);
      }
    }
    
    console.log(`✅ Insert complete: ${insertedCount} inserted, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: 'Venues inserted successfully',
      inserted: insertedCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 5), // Show first 5 errors for debugging
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Insert venues error:', error);
    res.status(500).json({
      error: 'Failed to insert venues',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/debug/establishments
 * Get debug information about establishments
 */
router.get('/establishments', developmentOnly, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Getting debug information for establishments...');
    
    // Note: venues.establishments table no longer exists (removed during consolidation)
    console.log('⚠️ venues.establishments table no longer exists - using public.establishments only');
    
    // Get count from public.establishments (the consolidated table)
    const estCountResult = await query('SELECT COUNT(*) as total FROM public.establishments');
    
    // Get sample data from consolidated table
    const sampleEstablishments = await query(`
      SELECT 
        id, place_id, name, latitude, longitude,
        (latitude IS NOT NULL AND longitude IS NOT NULL) as has_coordinates
      FROM public.establishments 
      LIMIT 10
    `);
    
    
    // Get coordinates stats from the consolidated table
    const coordsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coords,
        COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as without_coords
      FROM public.establishments
    `);
    
    res.json({
      venues_establishments: {
        status: 'REMOVED - Table no longer exists (consolidated into public.establishments)',
        total: 0,
        sample: [],
        coordinates_stats: { total: 0, with_coords: 0, without_coords: 0 }
      },
      establishments: {
        total: parseInt(estCountResult.rows[0].total),
        sample: sampleEstablishments.rows,
        coordinates_stats: coordsResult.rows[0]
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug query error:', error);
    res.status(500).json({
      error: 'Failed to get debug information',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/debug/schema
 * Get database schema information
 */
router.get('/schema', developmentOnly, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Getting database schema information...');
    
    // Get table information
    const tablesResult = await query(`
      SELECT 
        schemaname, tablename, tableowner
      FROM pg_tables 
      WHERE schemaname IN ('public', 'users', 'venues', 'reviews')
      ORDER BY schemaname, tablename
    `);
    
    // Get column information for key tables
    const columnsResult = await query(`
      SELECT 
        table_schema, table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema IN ('public', 'users', 'venues', 'reviews')
        AND table_name IN ('establishments', 'accounts', 'allergen_reviews')
      ORDER BY table_schema, table_name, ordinal_position
    `);
    
    res.json({
      tables: tablesResult.rows,
      columns: columnsResult.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schema query error:', error);
    res.status(500).json({
      error: 'Failed to get schema information',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as debugRouter };