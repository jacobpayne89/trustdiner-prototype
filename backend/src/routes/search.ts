import { Router, Request, Response } from 'express';
import { getPool } from '../services/database';
import { cacheGet, cacheSet, cacheDelete } from '../services/cache';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SearchQuerySchema, PlaceSearchSchema, validateRequest } from '../validation/commonSchemas';

const router = Router();

// Cache TTL for search results
const CACHE_TTL_SECONDS = 300; // 5 minutes for search results

// Normalize search string for caching
function normalizeSearchQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Helper function to download and save Google Places photo
async function downloadGooglePhoto(photoReference: string, apiKey: string): Promise<string | null> {
  try {
    const maxWidth = 800; // Good quality but not too large
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
    
    console.log(`📸 Downloading photo from Google Places API...`);
    
    // Track API usage
    const { APIUsageTracker } = await import('../services/apiUsageTracker');
    const startTime = Date.now();
    
    const response = await fetch(photoUrl);
    
    // Track the API call
    APIUsageTracker.trackAPICall({
      apiService: 'places_photos',
      endpoint: '/maps/api/place/photo',
      requestParams: { maxwidth: maxWidth, photo_reference: photoReference },
      responseStatus: response.status,
      success: response.ok,
      responseTimeMs: Date.now() - startTime
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to download photo: ${response.status}`);
      return null;
    }
    
    // Generate UUID filename
    const filename = `${uuidv4()}.jpg`;
    const storagePath = path.join(process.cwd(), 'storage', 'establishments');
    
    // Ensure storage directory exists
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    
    const filePath = path.join(storagePath, filename);
    
    // Save image to disk
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    console.log(`✅ Photo saved as: ${filename}`);
    return filename;
    
  } catch (error) {
    console.error('❌ Error downloading photo:', error);
    return null;
  }
}

/**
 * Hybrid search endpoint - Database first, Google fallback
 * Step 1: Search local PostgreSQL establishments 
 * Step 2: If <3 results, use Google Places API as fallback
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q: query, google_fallback } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query parameter "q"'
      });
    }

    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      return res.status(400).json({
        error: 'Search query too short',
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Check Redis cache first  
    const normalizedQuery = normalizeSearchQuery(searchTerm);
    const cacheKey = `search:${normalizedQuery}`;
    const cached = await cacheGet<any>(cacheKey);
    
    if (cached) {
      console.log(`💾 Cache HIT: Returning cached results for "${searchTerm}" (${cached.results.length} results)`);
      return res.json({
        ...cached,
        cached: true,
        query: searchTerm
      });
    }

    console.log(`🔍 Step 1: Searching local database for: "${searchTerm}"`);

    const pool = getPool();
    
    // Step 1: Search local establishments database
    // Split search terms for more flexible matching
    const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 1);
    console.log(`🔍 Split search terms:`, searchTerms);
    
    // Optimized unified search query with relevance scoring and chain data
    const searchQuery = `
      SELECT 
        e.uuid as place_id, e.name, e.address, e.latitude, e.longitude,
        NULL as rating, NULL as user_ratings_total, e.price_level, e.business_status,
        e.primary_category, e.cuisine, e.primary_image_ref as local_image_url, NULL as s3_image_url,
        e.chain_id, c.name as chain_name, COALESCE(c.local_logo_path, c.logo_url) as chain_logo_url,
        c.featured_image_path as chain_featured_image_path,
        'database' as source, true as inDatabase, false as addable, 'local' as result_type,
        -- Add relevance scoring for better result ranking
        CASE 
          WHEN e.name ILIKE $1 THEN 100
          WHEN e.address ILIKE $1 THEN 50
          WHEN e.primary_category ILIKE $1 THEN 75
          WHEN e.cuisine ILIKE $1 THEN 75
          ELSE 25
        END as relevance_score
      FROM venues.venues e
      LEFT JOIN venues.chains c ON e.chain_id = c.id
      WHERE 
        (e.name ILIKE $1 OR e.address ILIKE $1 OR e.primary_category ILIKE $1 OR e.cuisine ILIKE $1)
        AND e.latitude IS NOT NULL 
        AND e.longitude IS NOT NULL
        AND e.business_status = 'OPERATIONAL'
      ORDER BY 
        relevance_score DESC,
        e.name ASC
      LIMIT 20
    `;
    
    const searchPattern = `%${searchTerms.join(' ')}%`;
    console.log(`🔍 Optimized search for: "${searchPattern}"`);
    
    const dbResult = await pool.query(searchQuery, [searchPattern]);
    
    console.log(`📊 Step 1 complete: Found ${dbResult.rows.length} local establishments`);

    // Check if Google API is actually available
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const googleActuallyAvailable = !!apiKey && apiKey !== 'your_development_key_here' && apiKey !== 'your_google_maps_api_key_here';
    
    // If we have 3+ results from database, return them (optimal path)
    if (dbResult.rows.length >= 3 && !google_fallback) {
      console.log(`✅ Sufficient local results (${dbResult.rows.length} >= 3), skipping Google API`);
      console.log(`🔑 Google API available: ${googleActuallyAvailable}`);
      
      // Cache the database-only results
      const responseData = {
        results: dbResult.rows,
        source: 'database',
        cached: false,
        query: searchTerm,
        count: dbResult.rows.length,
        google_available: googleActuallyAvailable
      };
      
      await cacheSet(cacheKey, responseData, CACHE_TTL_SECONDS);
      console.log(`💾 Cache SET: Database results for "${searchTerm}"`);

      return res.json(responseData);
    }

    // Step 2: Google Places fallback (if <3 results OR explicitly requested)
    console.log(`🔍 Step 2: Triggering Google Places fallback (local results: ${dbResult.rows.length})`);
    console.log(`🔍 Google fallback explicitly requested:`, !!google_fallback);
    console.log(`🔑 Google API available: ${googleActuallyAvailable}`);
    
    if (!googleActuallyAvailable) {
      console.log(`⚠️ Google API key not configured properly, returning only local results`);
      return res.json({
        results: dbResult.rows,
        source: 'database',
        cached: false,
        query: searchTerm,
        count: dbResult.rows.length,
        google_available: false,
        google_error: 'API key not configured'
      });
    }

    // Google Places Text Search with dining-focused type filtering
    // London coordinates: 51.5074,-0.1278
    // Use type=restaurant as primary filter for dining establishments
    const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&location=51.5074,-0.1278&radius=50000&type=restaurant&key=${apiKey}`;
    
    // Track API usage
    const { APIUsageTracker } = await import('../services/apiUsageTracker');
    const startTime = Date.now();
    
    const googleResponse = await fetch(googleUrl);
    const googleData = await googleResponse.json() as any;
    
    // Track the API call
    APIUsageTracker.trackAPICall({
      apiService: 'places_text_search',
      endpoint: '/maps/api/place/textsearch/json',
      requestParams: { query: searchTerm, location: '51.5074,-0.1278', radius: 50000 },
      responseStatus: googleResponse.status,
      success: googleResponse.ok && googleData.status === 'OK',
      responseTimeMs: Date.now() - startTime,
      sessionId: req.headers['x-session-id'] as string
    });

    if (!googleResponse.ok) {
      console.error('❌ Google Places API error:', googleData.error_message);
      // Return local results if Google fails
      return res.json({
        results: dbResult.rows,
        source: 'database',
        cached: false,
        query: searchTerm,
        count: dbResult.rows.length,
        google_available: false,
        google_error: googleData.error_message
      });
    }

    // Transform Google results and mark them as not in database
    const googleResults = googleData.results?.map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      rating: place.rating || 0,
      user_ratings_total: place.user_ratings_total || 0,
      price_level: place.price_level || 0,
      business_status: place.business_status,
      types: place.types || [],
      photos: place.photos?.map((photo: any) => ({
        photo_reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) || [],
      source: 'google',
      inDatabase: false,
      addable: true,
      result_type: 'google'
    })) || [];

    // Mark Google results that are already in our database and separate new ones
    const dbPlaceIds = new Set(dbResult.rows.map(row => row.place_id));
    const existingGoogleResults = googleResults.filter((result: any) => dbPlaceIds.has(result.place_id))
      .map((result: any) => ({ ...result, inDatabase: true, addable: false }));
    const newGoogleResults = googleResults.filter((result: any) => !dbPlaceIds.has(result.place_id));

    // Combine results: database first, then existing Google results, then new Google results
    const combinedResults = [...dbResult.rows, ...existingGoogleResults, ...newGoogleResults];

    console.log(`📊 Step 2 complete: ${googleResults.length} Google results, ${existingGoogleResults.length} existing, ${newGoogleResults.length} new, ${combinedResults.length} total`);

    // Cache the combined results
    const hybridResponseData = {
      results: combinedResults,
      source: 'hybrid',
      cached: false,
      query: searchTerm,
      count: combinedResults.length,
      breakdown: {
        database: dbResult.rows.length,
        google_total: googleResults.length,
        google_existing: existingGoogleResults.length,
        google_new: newGoogleResults.length
      }
    };

    await cacheSet(cacheKey, hybridResponseData, CACHE_TTL_SECONDS);
    console.log(`💾 Cache SET: Hybrid results for "${searchTerm}"`);

    res.json({
      ...hybridResponseData,
      google_available: true
    });

  } catch (error) {
    console.error('❌ Hybrid search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Import a Google Place into the database (deferred import on user interaction)
 * This endpoint is called when a user clicks/views a Google search result
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { place_id } = req.body;

    if (!place_id) {
      return res.status(400).json({
        error: 'place_id is required',
        message: 'Please provide a place_id in the request body'
      });
    }

    console.log(`📥 Importing Google Place: ${place_id}`);

    const pool = getPool();

    // Check if place already exists in database by Google place_id stored in tags
    const existingQuery = `SELECT id, uuid, name, tags FROM venues.venues WHERE tags->>'place_id' = $1 LIMIT 1`;
    const existingResult = await pool.query(existingQuery, [place_id]);

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      console.log(`⚠️ Place with Google place_id ${place_id} already exists in database as uuid ${existing.uuid}`);
      return res.json({
        success: true,
        message: 'Place already in database',
        place_id,
        imported: false,
        place: existing
      });
    }

    // Get Google Places API key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Google Maps API key not configured',
        message: 'Server configuration error'
      });
    }

    // Fetch full place details from Google
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=name,formatted_address,geometry,rating,user_ratings_total,price_level,business_status,types,photos,reviews,opening_hours&key=${apiKey}`;
    
    // Track API usage
    const { APIUsageTracker } = await import('../services/apiUsageTracker');
    const startTime = Date.now();
    
    const response = await fetch(detailsUrl);
    const data = await response.json() as any;
    
    // Track the API call
    APIUsageTracker.trackAPICall({
      apiService: 'places_details',
      endpoint: '/maps/api/place/details/json',
      requestParams: { place_id, fields: 'name,formatted_address,geometry,rating,user_ratings_total,price_level,business_status,types,photos,reviews,opening_hours' },
      responseStatus: response.status,
      success: response.ok && data.status === 'OK',
      responseTimeMs: Date.now() - startTime,
      sessionId: req.headers['x-session-id'] as string
    });

    if (!response.ok || data.status !== 'OK') {
      console.error('❌ Google Places Details error:', data.error_message);
      return res.status(400).json({
        error: 'Failed to fetch place details',
        message: data.error_message || 'Google Places API error'
      });
    }

    const place = data.result;

    // Validate venue types using TrustDiner's dining-focused criteria
    const { VenueTypeService } = await import('../services/venueTypeService');
    const restaurantTypes = place.types || [];
    
    // Validate venue types and name
    const typeValidation = VenueTypeService.validateVenueTypes(restaurantTypes);
    const nameValidation = VenueTypeService.validateVenueName(place.name);
    
    if (!typeValidation.isValid || !nameValidation) {
      console.log(`❌ Skipping non-dining venue: ${place.name} (types: ${restaurantTypes.join(', ')})`);
      const reasons = typeValidation.excludedReasons || ['Invalid venue name pattern'];
      return res.status(400).json({
        error: 'Non-dining venue',
        message: 'This venue is not a dining establishment',
        place_types: restaurantTypes,
        excluded_reasons: reasons
      });
    }
    
    const primaryCategory = typeValidation.primaryCategory;
    const diningType = typeValidation.diningType;

    // Download and save the first photo if available
    let savedPhotoFilename = null;
    if (place.photos && place.photos.length > 0) {
      const firstPhoto = place.photos[0];
      if (firstPhoto.photo_reference) {
        console.log(`📸 Downloading photo for ${place.name}...`);
        savedPhotoFilename = await downloadGooglePhoto(firstPhoto.photo_reference, apiKey);
      }
    }

    // Prepare photos data for database
    const photosData = [];
    if (savedPhotoFilename) {
      photosData.push({
        filename: savedPhotoFilename,
        source: 'google_places',
        photo_reference: place.photos[0].photo_reference,
        width: place.photos[0].width,
        height: place.photos[0].height,
        downloaded_at: new Date().toISOString()
      });
    }

    // Insert into database with full details, generating a real UUID and storing Google place_id in tags
    const insertQuery = `
      INSERT INTO venues.venues (
        uuid,
        name,
        address,
        latitude,
        longitude,
        business_status,
        primary_category,
        cuisine,
        primary_image_ref,
        tags,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9,
        NOW(), NOW()
      )
      RETURNING id, uuid, name, tags
    `;

    const tagsPayload = {
      place_id,
      source: 'google_places',
      dining_type: diningType, // TrustDiner internal categorization
      google_types: restaurantTypes, // Original Google Places types
      rating: place.rating || null,
      user_ratings_total: place.user_ratings_total || null,
      types: place.types || [],
      opening_hours: place.opening_hours?.weekday_text || null,
      imported_at: new Date().toISOString(),
    };

    const primaryImageRef = savedPhotoFilename ? `/images/establishments/${savedPhotoFilename}` : null;

    const values = [
      place.name || 'Unknown',
      place.formatted_address || '',
      place.geometry?.location?.lat || null,
      place.geometry?.location?.lng || null,
      place.business_status || 'OPERATIONAL',
      primaryCategory,
      primaryCategory, // Use primary category as cuisine for now
      primaryImageRef, // primary_image_ref as served path
      JSON.stringify(tagsPayload)
    ];

    const insertResult = await pool.query(insertQuery, values);
    const newPlace = insertResult.rows[0];

    console.log(`✅ Successfully imported place: ${newPlace.name} (ID: ${newPlace.id})`);

    // Clear relevant caches since we added a new place
    try {
      // Clear establishments API cache
      await cacheDelete([
        'api:/api/establishments',
        'api:/api/establishments/',
        // Clear search cache patterns
        `search:${normalizeSearchQuery(place.name || '')}`,
        `search:${normalizeSearchQuery(place.formatted_address || '')}`,
        `search:${normalizeSearchQuery(`${place.name} ${place.formatted_address}` || '')}`
      ]);
      console.log('✅ Cache cleared for new place import');
      
      // Add a small delay to ensure cache clearing is fully processed
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('✅ Cache clearing delay completed');
    } catch (error) {
      console.warn('⚠️ Failed to clear cache:', error);
    }

    res.json({
      success: true,
      message: 'Place imported successfully',
      place: newPlace,
      imported: true
    });

  } catch (error) {
    console.error('❌ Place import error:', error);
    res.status(500).json({
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export { router as searchRouter };