import { query } from './database';

/**
 * Simplified establishment service for demo purposes
 * This bypasses the complex allergen score aggregation
 */

// Helper function to convert Google Places photo reference to actual image URL
function convertPhotoReferenceToUrl(photoReference: string | null): string | null {
  console.log('🔄 Converting photo reference:', photoReference?.substring(0, 50) + '...');
  
  if (!photoReference) {
    console.log('❌ No photo reference provided');
    return null;
  }
  
  // Check if it's already a full URL (Unsplash, S3, etc.)
  if (photoReference.startsWith('http')) {
    console.log('✅ Already a full URL, returning as-is');
    return photoReference;
  }
  
  // Check if it's a Google Places photo reference (starts with ATKogp...)
  if (photoReference.startsWith('ATKogp')) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Google Places API key not found, cannot convert photo reference');
      return null;
    }
    
    // Convert to Google Places Photo API URL
    // Max width 400px for card images, high quality
    const convertedUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
    console.log('🎯 Converted Google Places photo reference to URL:', convertedUrl.substring(0, 100) + '...');
    return convertedUrl;
  }
  
  // For demo:// URLs or other formats, return as-is (will fallback to placeholder)
  console.log('🔄 Unknown format, returning as-is');
  return photoReference;
}

export interface EstablishmentFilters {
  search?: string;
  chainId?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export class EstablishmentServiceSimple {
  
  static async getEstablishments(filters: EstablishmentFilters = {}) {
    const {
      search,
      chainId,
      limit = 50,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = filters;

    console.log('🔍 EstablishmentServiceSimple.getEstablishments called with filters:', filters);

    // Build WHERE clause
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`e.name ILIKE $${paramIndex}`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (chainId) {
      whereConditions.push(`e.chain_id = $${paramIndex}`);
      queryParams.push(chainId);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(e.id) as total
      FROM venues.venues e
      ${whereClause}
    `;
    
    console.log('🔍 Count query:', countQuery);
    console.log('🔍 Query params:', queryParams);
    
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    console.log('✅ Count result:', total);

    // Get establishments
    const mainQuery = `
      SELECT 
        e.id,
        e.uuid,
        e.name,
        e.address,
        e.latitude,
        e.longitude,
        e.phone,
        e.website,
        e.price_level,
        e.business_status,
        e.primary_category,
        e.cuisine,
        e.chain_id,
        e.local_image_url,
        e.tags,
        e.created_at,
        e.updated_at,
        c.name as chain_name,
        c.logo_url as chain_logo_url,
        c.featured_image_path as chain_featured_image_path,
        -- Simple review count from reviews table
        COALESCE(r.review_count, 0) as review_count,
        r.avg_rating as avg_review_rating
      FROM venues.venues e
      LEFT JOIN venues.chains c ON e.chain_id = c.id
      LEFT JOIN (
        SELECT 
          venue_id,
          COUNT(*) as review_count,
          AVG(overall_rating) as avg_rating
        FROM reviews.reviews
        GROUP BY venue_id
      ) r ON e.id = r.venue_id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN '${sortBy}' = 'name' THEN e.name
          WHEN '${sortBy}' = 'created_at' THEN e.created_at::text
          ELSE e.name
        END ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    
    console.log('🔍 Main query:', mainQuery);
    console.log('🔍 Final params:', queryParams);

    const result = await query(mainQuery, queryParams);
    
    console.log('✅ Query executed successfully, got', result.rows.length, 'rows');

    // Transform results
    console.log('🔄 Transforming', result.rows.length, 'establishments...');
    const establishments = result.rows.map((row: any) => {
      console.log('🔄 Processing establishment:', row.name, 'with local_image_url:', row.local_image_url?.substring(0, 50) + '...');
      return {
      id: row.id,
      uuid: row.uuid,
      name: row.name,
      address: row.address,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      phone: row.phone,
      website: row.website,
      price_level: row.price_level,
      business_status: row.business_status,
      primary_category: row.primary_category,
      cuisine: row.cuisine,
      chain_id: row.chain_id,
      primary_image_ref: row.local_image_url, // Map existing field
      image_attribution: null, // Not available in view
      local_image_url: convertPhotoReferenceToUrl(row.local_image_url), // Convert Google Places photo references
      tags: row.tags,
      created_at: row.created_at,
      updated_at: row.updated_at,
      // Chain info
      chain_name: row.chain_name,
      chain_logo_url: row.chain_logo_url,
      chain_featured_image_path: row.chain_featured_image_path,
      // Review stats
      review_count: Number(row.review_count || 0),
      avg_review_rating: row.avg_review_rating ? Number(row.avg_review_rating) : null,
      // Individual allergen scores (all null for demo data)
      avg_gluten_score: null,
      avg_milk_score: null,
      avg_eggs_score: null,
      avg_fish_score: null,
      avg_crustaceans_score: null,
      avg_tree_nuts_score: null,
      avg_peanuts_score: null,
      avg_soybeans_score: null,
      avg_sesame_score: null,
      avg_celery_score: null,
      avg_mustard_score: null,
      avg_lupin_score: null,
      avg_molluscs_score: null,
      avg_sulfites_score: null,
      // Compatibility fields for frontend
      avg_allergen_scores: null, // No allergen scores in demo data
      chain: row.chain_name ? {
        name: row.chain_name,
        logo_url: row.chain_logo_url,
        featured_image_path: row.chain_featured_image_path
      } : null,
      // Legacy fields for compatibility
      place_id: null,
      rating: row.avg_review_rating ? Number(row.avg_review_rating) : null,
      user_ratings_total: Number(row.review_count || 0),
      types: row.primary_category ? [row.primary_category] : []
      };
    });

    const hasMore = offset + limit < total;
    const sampleEstablishment = establishments.length > 0 ? {
      id: establishments[0].id.toString(),
      name: establishments[0].name,
      place_id: null
    } : null;

    const response = {
      establishmentsCount: establishments.length,
      total,
      hasMore,
      sampleEstablishment
    };

    console.log('✅ EstablishmentServiceSimple returned:', response);

    return {
      ...response,
      establishments
    };
  }
}
