import { Router, Request, Response } from 'express';
import { getPool } from '../services/database.js';
import { logger } from '../services/logger.js';

const router = Router();


// Google Places Details API endpoint
router.post('/details', async (req: Request, res: Response) => {
  try {
    const { placeId } = req.body;
    
    if (!placeId) {
      return res.status(400).json({
        error: 'Missing placeId',
        message: 'placeId is required to fetch place details'
      });
    }

    console.log(`🔍 Fetching Google Places details for: ${placeId}`);

    // Get Google Places API key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Google Places API key not configured',
        message: 'Server configuration error'
      });
    }

    // Fetch detailed information from Google Places API
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,business_status,types,photos,website,formatted_phone_number,opening_hours,reviews&key=${apiKey}`;
    
    // Track API usage
    const { APIUsageTracker } = await import('../services/apiUsageTracker');
    const startTime = Date.now();
    
    const response = await fetch(detailsUrl);
    const data = await response.json();
    
    // Track the API call
    APIUsageTracker.trackAPICall({
      apiService: 'places_details',
      endpoint: '/maps/api/place/details/json',
      requestParams: { place_id: placeId, fields: 'place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,business_status,types,photos,website,formatted_phone_number,opening_hours,reviews' },
      responseStatus: response.status,
      success: response.ok && data.status === 'OK',
      responseTimeMs: Date.now() - startTime,
      userId: req.headers['x-user-id'] ? parseInt(req.headers['x-user-id'] as string) : undefined,
      sessionId: req.headers['x-session-id'] as string
    });

    if (data.status !== 'OK') {
      console.error('❌ Google Places API error:', data.status, data.error_message);
      return res.status(400).json({
        error: 'Google Places API error',
        message: data.error_message || data.status
      });
    }

    const place = data.result;
    console.log(`✅ Fetched details for: ${place.name}`);

    // Check if place already exists in database (using tags field to store place_id)
    const pool = getPool();
    const existingPlace = await pool.query(
      'SELECT id, name, tags FROM public.establishments WHERE tags->>\'place_id\' = $1',
      [placeId]
    );

    if (existingPlace.rows.length > 0) {
      console.log(`ℹ️ Place already exists in database: ${existingPlace.rows[0].name}`);
      return res.status(200).json({
        message: 'Place already exists',
        place: existingPlace.rows[0],
        alreadyExists: true,
        imported: false
      });
    }

    // Extract and format data for database insertion
    const establishmentData = {
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry?.location?.lat || null,
      longitude: place.geometry?.location?.lng || null,
      business_status: place.business_status || 'OPERATIONAL',
      website: place.website || null,
      phone: place.formatted_phone_number || null,
      // Set default values for required fields
      cuisine: extractCuisineFromTypes(place.types || []),
      local_image_url: place.photos?.[0]?.photo_reference || null,
      price_level: place.price_level || null,
      primary_category: place.types?.[0] || 'restaurant',
      // Store Google Places data in tags field
      tags: {
        place_id: place.place_id,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        types: place.types,
        photos: place.photos,
        reviews: place.reviews,
        opening_hours: place.opening_hours?.weekday_text,
        source: 'google_places',
        imported_at: new Date().toISOString()
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log(`💾 Inserting establishment: ${establishmentData.name}`);
    console.log(`🔍 Establishment data:`, {
      name: establishmentData.name,
      place_id: establishmentData.tags.place_id,
      address: establishmentData.address
    });

    // Insert into database
    const insertQuery = `
      INSERT INTO public.establishments (
        name, address, latitude, longitude, business_status, website, phone, 
        local_image_url, cuisine, price_level, primary_category, tags, 
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *
    `;

    const insertResult = await pool.query(insertQuery, [
      establishmentData.name,
      establishmentData.address,
      establishmentData.latitude,
      establishmentData.longitude,
      establishmentData.business_status,
      establishmentData.website,
      establishmentData.phone,
      establishmentData.local_image_url,
      establishmentData.cuisine,
      establishmentData.price_level,
      establishmentData.primary_category,
      JSON.stringify(establishmentData.tags),
      establishmentData.created_at,
      establishmentData.updated_at
    ]);

    console.log(`🔍 DEBUG: Insert result row count:`, insertResult.rows.length);
    
    // Instead of relying on RETURNING, query the database to get the newly inserted record
    // Find the most recently created establishment with this Google Places ID
    const selectQuery = `
      SELECT * FROM public.establishments 
      WHERE tags->>'place_id' = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const selectResult = await pool.query(selectQuery, [placeId]);
    
    if (selectResult.rows.length === 0) {
      throw new Error('Failed to retrieve newly inserted establishment');
    }
    
    const newEstablishment = selectResult.rows[0];
    console.log(`🔍 DEBUG: Retrieved establishment:`, {
      id: newEstablishment.id,
      name: newEstablishment.name,
      place_id: newEstablishment.tags?.place_id
    });
    
    console.log(`✅ Successfully added establishment: ${newEstablishment.name} (ID: ${newEstablishment.id})`);

    // Log the addition
    logger.info('Establishment added from Google Places', {
      establishmentId: newEstablishment.id,
      name: newEstablishment.name,
      placeId: newEstablishment.place_id,
      source: 'google_places'
    });

    res.status(201).json({
      message: 'Establishment added successfully',
      place: newEstablishment,
      source: 'google_places',
      imported: true
    });

  } catch (error) {
    console.error('❌ Error adding place from Google Places:', error);
    logger.error('Failed to add place from Google Places', {
      error: error instanceof Error ? error.message : 'Unknown error',
      placeId: req.body.placeId
    });

    res.status(500).json({
      error: 'Failed to add place',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Helper function to extract cuisine from Google Places types
function extractCuisineFromTypes(types: string[]): string | null {
  // TrustDiner approved dining venue types and cuisine mapping
  const cuisineMap: { [key: string]: string } = {
    // Primary dining venue types
    'restaurant': 'Restaurant',
    'cafe': 'Cafe',
    'bakery': 'Bakery', 
    'bar': 'Bar',
    'meal_takeaway': 'Takeaway',
    'meal_delivery': 'Delivery',
    'food_court': 'Food Court',
    'ice_cream_shop': 'Ice Cream',
    'pizza_restaurant': 'Pizza',
    'sandwich_shop': 'Sandwich Shop',
    'food': 'Food',
    
    // Specific cuisine types
    'chinese_restaurant': 'Chinese',
    'indian_restaurant': 'Indian',
    'italian_restaurant': 'Italian',
    'japanese_restaurant': 'Japanese',
    'mexican_restaurant': 'Mexican',
    'thai_restaurant': 'Thai',
    'french_restaurant': 'French',
    'american_restaurant': 'American',
    'seafood_restaurant': 'Seafood',
    'steak_house': 'Steakhouse',
    'sushi_restaurant': 'Sushi',
    'vegetarian_restaurant': 'Vegetarian',
    'vegan_restaurant': 'Vegan'
  };

  // Find the first matching cuisine type
  for (const type of types) {
    if (cuisineMap[type]) {
      return cuisineMap[type];
    }
  }

  // Default fallback
  return 'Restaurant';
}

export default router;