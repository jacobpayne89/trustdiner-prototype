import { Pool } from 'pg';
import { getPool } from './database';
import imageService from './imageService';
import { sortAllergenScores } from '../constants/allergens';
import type { 
  Establishment, 
  EstablishmentWithStats, 
  EstablishmentCreateInput 
} from '../../../shared/types/core';
import { 
  transformEstablishmentFromDb, 
  transformEstablishmentWithStatsFromDb,
  transformEstablishmentToDb 
} from '../../../shared/utils/transforms';

export interface EstablishmentFilters {
  search?: string;
  chainId?: number;
  hasReviews?: boolean;
  minRating?: number;
  allergenSafe?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'average_rating' | 'review_count';
  sortOrder?: 'ASC' | 'DESC';
}

// Legacy interfaces - use core types for new code
export interface EstablishmentData {
  name: string;
  placeId: string;
  address?: string;
  position?: { lat: number; lng: number };
  phone?: string;
  website?: string;
  priceLevel?: number;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  businessStatus?: string;
  chainId?: number;
  localImageUrl?: string;
  tags?: string[];
}

export interface EstablishmentUpdateData extends Partial<EstablishmentData> {
  allergenRatings?: Record<string, any>;
  averageAllergenScores?: Record<string, number>;
}

export class EstablishmentService {
  
  /**
   * Get all restaurant chains with aggregated data
   */
  static async getChains() {
    console.log('🏢 EstablishmentService.getChains called');
    
    const result = await this.getDbPool().query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.logo_url,
        c.local_logo_path,
        c.featured_image_path,
        c.website_url,
        c.category,
        c.created_at,
        c.updated_at,
        COUNT(e.id) as location_count,
        0 as avg_rating  -- TODO: Calculate from reviews
      FROM venues.chains c
      LEFT JOIN venues.venues e ON c.id = e.chain_id
      GROUP BY c.id, c.name, c.slug, c.description, c.logo_url, c.local_logo_path, c.featured_image_path, c.website_url, c.category, c.created_at, c.updated_at
      ORDER BY location_count DESC, c.name ASC
    `);

    // Add basic tags for consistency with frontend expectations
    const rowsWithTags = result.rows.map((row: any) => ({
      ...row,
      tags: ['Chain'] // Chains always just show "Chain" tag
    }));

    return rowsWithTags;
  }
  private static getDbPool(): Pool {
    return getPool();
  }

  /**
   * Get establishments with filtering, search, and pagination
   */
  static async getEstablishments(filters: EstablishmentFilters = {}) {
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
    } = filters;

    console.log('🔍 EstablishmentService.getEstablishments called with filters:', filters);

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (search) {
      whereConditions.push(`(
        e.name ILIKE $${paramIndex} OR 
        e.address ILIKE $${paramIndex} OR 
        COALESCE(e.tags::text, '') ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (chainId) {
      whereConditions.push(`e.chain_id = $${paramIndex++}`);
      queryParams.push(chainId);
    }

    if (hasReviews !== undefined) {
      if (hasReviews) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM reviews.reviews r 
          WHERE r.venue_id = e.id
        )`);
      } else {
        whereConditions.push(`NOT EXISTS (
          SELECT 1 FROM reviews.reviews r 
          WHERE r.venue_id = e.id
        )`);
      }
    }

    if (minRating) {
      if (minRating === 1) {
        // Rating 1+ means any place with reviews (individual or chain)
        whereConditions.push(`(
          EXISTS (
            SELECT 1 FROM reviews.reviews r 
            WHERE r.venue_id = e.id
          )
          OR
          (e.chain_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM reviews.reviews r2
            JOIN venues.venues e2 ON r2.venue_id = e2.id
            WHERE e2.chain_id = e.chain_id
          ))
        )`);
      } else {
        // Since overall_rating values are null, calculate rating from allergen scores
        // Show places where the average of allergen scores is >= minRating
        whereConditions.push(`(
          -- Direct review for this venue with calculated rating >= minRating
          EXISTS (
            SELECT 1 FROM reviews.reviews r 
            WHERE r.venue_id = e.id 
            AND r.allergen_scores IS NOT NULL
            AND (
              SELECT AVG(value::numeric) 
              FROM jsonb_each_text(r.allergen_scores) 
              WHERE value ~ '^[0-9]+(\.[0-9]+)?$'
            ) >= $${paramIndex++}
          )
          OR
          -- Chain has review with calculated rating >= minRating (include all chain locations)
          (e.chain_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM reviews.reviews r2
            JOIN venues.venues e2 ON r2.venue_id = e2.id
            WHERE e2.chain_id = e.chain_id
            AND r2.allergen_scores IS NOT NULL
            AND (
              SELECT AVG(value::numeric) 
              FROM jsonb_each_text(r2.allergen_scores) 
              WHERE value ~ '^[0-9]+(\.[0-9]+)?$'
            ) >= $${paramIndex++}
          ))
        )`);
        queryParams.push(minRating, minRating);
      }
    }

    // Allergen filtering - show places with reviews for ALL selected allergens (AND logic)
    if (allergenSafe && allergenSafe.length > 0) {
      const allergenConditions = allergenSafe.map(allergen => 
        `(
          -- Direct review for this venue
          EXISTS (
            SELECT 1 FROM reviews.reviews r 
            WHERE r.venue_id = e.id 
            AND r.allergen_scores->>'${allergen}' IS NOT NULL
          )
          OR
          -- Chain has review for this allergen (include all chain locations)
          (e.chain_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM reviews.reviews r2
            JOIN venues.venues e2 ON r2.venue_id = e2.id
            WHERE e2.chain_id = e.chain_id
            AND r2.allergen_scores->>'${allergen}' IS NOT NULL
          ))
        )`
      );
      whereConditions.push(`(${allergenConditions.join(' AND ')})`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    console.log('🔍 Built WHERE clause:', whereClause);
    console.log('🔍 Query params:', queryParams);

    // Count total establishments
    const countQuery = `
      SELECT COUNT(e.id) as total
      FROM public.establishments e
      ${whereClause}
    `;

    console.log('🔍 Count query:', countQuery);

    try {
      const countResult = await this.getDbPool().query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);
      
      console.log('✅ Count result:', total);

      // Get establishments with pagination
      const establishmentsQuery = `
        SELECT 
          e.id,
          e.uuid,
          e.name,
          NULL as place_id,  -- Moved to external_places table
          e.address,
          e.latitude,
          e.longitude,
          e.phone,
          e.website,
          e.price_level,
          NULL as rating,  -- Calculated from reviews
          NULL as user_ratings_total,  -- Calculated from reviews
          ARRAY[e.primary_category] as types,  -- Convert category to types array
          e.business_status,
          e.primary_category,
          e.cuisine,
          e.chain_id,
          e.primary_image_ref,
          e.tags,
          e.created_at,
          e.updated_at,
          c.name as chain_name,
          COALESCE(NULLIF(c.logo_url, ''), c.local_logo_path) as chain_logo_url,
          c.featured_image_path as chain_featured_image_path,
          COALESCE(review_stats.review_count, 0) as review_count,
          review_stats.avg_review_rating,
          -- Include allergen scores for frontend
          review_stats.avg_gluten_score,
          review_stats.avg_milk_score,
          review_stats.avg_eggs_score,
          review_stats.avg_fish_score,
          review_stats.avg_crustaceans_score,
          review_stats.avg_tree_nuts_score,
          review_stats.avg_peanuts_score,
          review_stats.avg_soybeans_score,
          review_stats.avg_sesame_score,
          review_stats.avg_celery_score,
          review_stats.avg_mustard_score,
          review_stats.avg_lupin_score,
          review_stats.avg_molluscs_score,
          review_stats.avg_sulfites_score
        FROM venues.venues e
        LEFT JOIN venues.chains c ON e.chain_id = c.id
        LEFT JOIN (
          WITH chain_reviews AS (
            -- Get all reviews for establishments in the result set and their chains
            SELECT 
              r.id,
              r.venue_id,
              r.user_id,
              NULL as allergen_scores, -- Allergen scores are now in separate table
              r.overall_rating,
              r.created_at,
              e.chain_id,
              NULL as place_id  -- Moved to external_places
            FROM reviews.reviews r
            JOIN venues.venues e ON r.venue_id = e.id
          ),
          deduped_chain_reviews AS (
            -- For chains: take only the most recent review per user per chain
            -- For individual places: take all reviews
            SELECT DISTINCT ON (
              CASE 
                WHEN chain_id IS NOT NULL THEN chain_id::text || '_' || user_id::text
                ELSE venue_id::text || '_' || user_id::text
              END
            )
            venue_id, overall_rating, chain_id, user_id, created_at
            FROM chain_reviews
            ORDER BY 
              CASE 
                WHEN chain_id IS NOT NULL THEN chain_id::text || '_' || user_id::text
                ELSE venue_id::text || '_' || user_id::text
              END,
              created_at DESC
          ),
          aggregated_reviews AS (
            -- Aggregate deduplicated reviews by chain or individual venue
            SELECT 
              CASE 
                WHEN chain_id IS NOT NULL THEN 'chain_' || chain_id::text
                ELSE 'venue_' || venue_id::text
              END as group_key,
              chain_id,
              venue_id,
              COUNT(*) as review_count,
              AVG(overall_rating) as avg_review_rating,
              -- Allergen scores will be calculated separately
              NULL as avg_gluten_score,
              NULL as avg_milk_score,
              NULL as avg_eggs_score,
              NULL as avg_fish_score,
              NULL as avg_crustaceans_score,
              NULL as avg_tree_nuts_score,
              NULL as avg_peanuts_score,
              NULL as avg_soybeans_score,
              NULL as avg_sesame_score,
              NULL as avg_celery_score,
              NULL as avg_mustard_score,
              NULL as avg_lupin_score,
              NULL as avg_molluscs_score,
              NULL as avg_sulfites_score
            FROM deduped_chain_reviews
            GROUP BY 
              CASE 
                WHEN chain_id IS NOT NULL THEN 'chain_' || chain_id::text
                ELSE 'venue_' || venue_id::text
              END,
              chain_id,
              venue_id
          )
          SELECT 
            e2.id as venue_id,
            ar.review_count,
            ar.avg_review_rating,
            ar.avg_gluten_score,
            ar.avg_milk_score,
            ar.avg_eggs_score,
            ar.avg_fish_score,
            ar.avg_crustaceans_score,
            ar.avg_tree_nuts_score,
            ar.avg_peanuts_score,
            ar.avg_soybeans_score,
            ar.avg_sesame_score,
            ar.avg_celery_score,
            ar.avg_mustard_score,
            ar.avg_lupin_score,
            ar.avg_molluscs_score,
            ar.avg_sulfites_score
          FROM venues.venues e2
          LEFT JOIN aggregated_reviews ar ON (
            (e2.chain_id IS NOT NULL AND ar.group_key = 'chain_' || e2.chain_id::text)
            OR 
            (e2.chain_id IS NULL AND ar.group_key = 'venue_' || e2.id::text)
          )
        ) review_stats ON e.id = review_stats.venue_id
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN '${sortBy}' = 'name' THEN e.name
            WHEN '${sortBy}' = 'average_rating' THEN review_stats.avg_review_rating::text
            WHEN '${sortBy}' = 'review_count' THEN review_stats.review_count::text
            ELSE e.created_at::text
          END ${sortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      queryParams.push(limit, offset);
      
      console.log('🔍 Main query:', establishmentsQuery);
      console.log('🔍 Final params:', queryParams);

      const establishmentsResult = await this.getDbPool().query(establishmentsQuery, queryParams);
      
      console.log('✅ Query executed successfully, got', establishmentsResult.rows.length, 'rows');

      // Fetch allergen averages for all establishments
      const establishmentIds = establishmentsResult.rows.map(row => row.id);
      let allergenAveragesMap: Record<string, Record<string, number>> = {};
      
      if (establishmentIds.length > 0) {
        const allergenQuery = `
          SELECT 
            e.id as venue_id,
            a.code as allergen_code,
            AVG(ras.score) as avg_score
          FROM venues.venues e
          JOIN reviews.reviews r ON e.id = r.venue_id
          JOIN reviews.review_allergen_scores ras ON r.id = ras.review_id
          JOIN public.allergens a ON ras.allergen_id = a.id
          WHERE e.id = ANY($1)
          GROUP BY e.id, a.code
        `;
        
        const allergenResult = await this.getDbPool().query(allergenQuery, [establishmentIds]);
        
        // Build allergen averages map
        allergenResult.rows.forEach(row => {
          const venueId = row.venue_id.toString();
          if (!allergenAveragesMap[venueId]) {
            allergenAveragesMap[venueId] = {};
          }
          
          // Map database codes to frontend codes
          let allergenCode = row.allergen_code;
          if (allergenCode === 'nuts') allergenCode = 'tree_nuts';
          if (allergenCode === 'sulphites') allergenCode = 'sulfites';
          
          allergenAveragesMap[venueId][allergenCode] = parseFloat(row.avg_score);
        });
        

      }

          // Get image URLs for all establishments
      const imageUrls = await imageService.getImageUrls(
        establishmentsResult.rows.map(row => ({
          uuid: row.id,
          local_image_url: row.primary_image_ref,
          s3_image_url: row.s3_image_url
        }))
      );

      return {
      establishments: establishmentsResult.rows.map(row => {
        // Get allergen averages from the separate query results
        const averageAllergenScoresUnsorted = allergenAveragesMap[row.id] || {};
        

        
        // Sort allergen scores to maintain consistent order
        const averageAllergenScores = sortAllergenScores(averageAllergenScoresUnsorted);

        // Build allergenRatings object (detailed format with rating and count)
        const allergenRatings: Record<string, { rating: number; count: number }> = {};
        const reviewCount = parseInt(row.review_count) || 0;
        
        // For each allergen that has a score, create the detailed rating object
        Object.entries(averageAllergenScores).forEach(([allergen, score]) => {
          allergenRatings[allergen] = {
            rating: score,
            count: reviewCount // Use total review count as approximation
          };
        });

        // Build tags array - prioritize Chain over category to avoid duplicates
        const tags: string[] = [];
        
        // If it's a chain, just show "Chain" as the primary tag
        if (row.chain_id) {
          tags.push('Chain');
        } else {
          // For independent venues, show cuisine or primary category
          if (row.cuisine && row.cuisine.trim() !== '') {
            tags.push(row.cuisine);
          } else if (row.primary_category && row.primary_category.trim() !== '') {
            const category = row.primary_category.charAt(0).toUpperCase() + row.primary_category.slice(1);
            tags.push(category);
          }
        }

        const finalResult = {
          ...row,
          position: row.latitude && row.longitude ? {
            lat: parseFloat(row.latitude),
            lng: parseFloat(row.longitude)
          } : null,
          reviewCount: reviewCount,
          avgReviewRating: parseFloat(row.avg_review_rating) || null,
          // Add the allergen data that the frontend expects
          averageAllergenScores: Object.keys(averageAllergenScores).length > 0 ? averageAllergenScores : null,
          allergenRatings: Object.keys(allergenRatings).length > 0 ? allergenRatings : null,
          // Add generated tags
          tags: tags.length > 0 ? tags : null,
          // Transform chain fields to camelCase for frontend compatibility
          chainId: row.chain_id,
          chainName: row.chain_name,
          chainLogoUrl: row.chain_logo_url,
          chainFeaturedImageUrl: row.chain_featured_image_path,
          // Transform image fields to camelCase for frontend compatibility
          localImageUrl: row.primary_image_ref,
          s3ImageUrl: row.s3_image_url,
          // Processed image URL (S3 preferred, local fallback, placeholder if none)
          imageUrl: imageUrls[row.id] || imageService.getFallbackImageUrl(row.name),
          // Keep snake_case versions for backward compatibility
          chain_id: row.chain_id,
          chain_name: row.chain_name,
          chain_logo_url: row.chain_logo_url,
          chain_featured_image_path: row.chain_featured_image_path,
          local_image_url: row.primary_image_ref,
          s3_image_url: row.s3_image_url,
          review_count: row.review_count,
          avg_review_rating: row.avg_review_rating
        };



        return finalResult;
      }),
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
    } catch (error) {
      console.error('❌ EstablishmentService.getEstablishments error:', error);
      throw error;
    }
  }

  /**
   * Get a single establishment by ID, UUID, or place_id
   */
  static async getEstablishmentById(identifier: string) {
    const query = `
      SELECT 
        e.*,
        c.name as chain_name,
        COALESCE(NULLIF(c.logo_url, ''), c.local_logo_path) as chain_logo_url,
        c.featured_image_path as chain_featured_image_url,
        COUNT(r.id) as review_count,
        AVG(r.overall_rating) as avg_review_rating,
        -- Calculate average allergen scores from review_allergen_scores table
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'gluten') as avg_gluten_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'milk') as avg_milk_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'eggs') as avg_eggs_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'fish') as avg_fish_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'crustaceans') as avg_crustaceans_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'nuts') as avg_tree_nuts_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'peanuts') as avg_peanuts_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'soybeans') as avg_soybeans_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'sesame') as avg_sesame_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'celery') as avg_celery_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'mustard') as avg_mustard_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'lupin') as avg_lupin_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'molluscs') as avg_molluscs_score,
        (SELECT AVG(ras.score) 
         FROM reviews.review_allergen_scores ras 
         JOIN public.allergens a ON ras.allergen_id = a.id 
         JOIN reviews.reviews r2 ON ras.review_id = r2.id
         WHERE r2.venue_id = e.id AND a.code = 'sulphites') as avg_sulfites_score
      FROM venues.venues e
      LEFT JOIN venues.chains c ON e.chain_id = c.id
      LEFT JOIN reviews.reviews r ON e.id = r.venue_id 
      WHERE e.id::text = $1 OR e.uuid::text = $1
      GROUP BY e.id, e.uuid, e.name, e.address, e.latitude, e.longitude, e.phone, e.website, e.business_status, e.primary_category, e.cuisine, e.price_level, e.chain_id, e.primary_image_ref, e.tags, e.created_at, e.updated_at, c.name, c.logo_url, c.local_logo_path, c.featured_image_path
    `;

    const result = await this.getDbPool().query(query, [identifier]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const establishment = result.rows[0];
    
    // Build averageAllergenScores object from individual score fields
    const averageAllergenScoresUnsorted: Record<string, number> = {};
    if (establishment.avg_gluten_score) averageAllergenScoresUnsorted.gluten = parseFloat(establishment.avg_gluten_score);
    if (establishment.avg_milk_score) averageAllergenScoresUnsorted.milk = parseFloat(establishment.avg_milk_score);
    if (establishment.avg_eggs_score) averageAllergenScoresUnsorted.eggs = parseFloat(establishment.avg_eggs_score);
    if (establishment.avg_fish_score) averageAllergenScoresUnsorted.fish = parseFloat(establishment.avg_fish_score);
    if (establishment.avg_crustaceans_score) averageAllergenScoresUnsorted.crustaceans = parseFloat(establishment.avg_crustaceans_score);
    if (establishment.avg_tree_nuts_score) averageAllergenScoresUnsorted['tree_nuts'] = parseFloat(establishment.avg_tree_nuts_score);
    if (establishment.avg_peanuts_score) averageAllergenScoresUnsorted.peanuts = parseFloat(establishment.avg_peanuts_score);
    if (establishment.avg_soybeans_score) averageAllergenScoresUnsorted.soybeans = parseFloat(establishment.avg_soybeans_score);
    if (establishment.avg_sesame_score) averageAllergenScoresUnsorted.sesame = parseFloat(establishment.avg_sesame_score);
    if (establishment.avg_celery_score) averageAllergenScoresUnsorted.celery = parseFloat(establishment.avg_celery_score);
    if (establishment.avg_mustard_score) averageAllergenScoresUnsorted.mustard = parseFloat(establishment.avg_mustard_score);
    if (establishment.avg_lupin_score) averageAllergenScoresUnsorted.lupin = parseFloat(establishment.avg_lupin_score);
    if (establishment.avg_molluscs_score) averageAllergenScoresUnsorted.molluscs = parseFloat(establishment.avg_molluscs_score);
    if (establishment.avg_sulfites_score) averageAllergenScoresUnsorted.sulfites = parseFloat(establishment.avg_sulfites_score);
    
    // Sort allergen scores to maintain consistent order
    const averageAllergenScores = sortAllergenScores(averageAllergenScoresUnsorted);

    // Build allergenRatings object (detailed format with rating and count)
    const allergenRatings: Record<string, { rating: number; count: number }> = {};
    const reviewCount = parseInt(establishment.review_count) || 0;
    
    // For each allergen that has a score, create the detailed rating object
    Object.entries(averageAllergenScores).forEach(([allergen, score]) => {
      allergenRatings[allergen] = {
        rating: score,
        count: reviewCount // Use total review count as approximation
      };
    });
    
    // Build tags array in the correct order: Chain -> Cuisine -> Primary Category
    const tags: string[] = [];
    
    // 1. Chain tag (if it's a chain)
    if (establishment.chain_id) {
      tags.push('Chain');
    }
    
    // 2. Cuisine type (if available and not empty)
    if (establishment.cuisine && establishment.cuisine.trim() !== '') {
      tags.push(establishment.cuisine);
    }
    
    // 3. Primary category (capitalize first letter)
    if (establishment.primary_category && establishment.primary_category.trim() !== '') {
      const category = establishment.primary_category.charAt(0).toUpperCase() + establishment.primary_category.slice(1);
      tags.push(category);
    }
    
    // Get the processed image URL
    const imageUrl = await imageService.getImageUrl({
      uuid: establishment.id,
      local_image_url: establishment.local_image_url,
      s3_image_url: establishment.s3_image_url
    });
    
    return {
      ...establishment,
      reviewCount: reviewCount,
      avgReviewRating: parseFloat(establishment.avg_review_rating) || null,
      // Add the allergen data that the frontend expects
      averageAllergenScores: Object.keys(averageAllergenScores).length > 0 ? averageAllergenScores : null,
      allergenRatings: Object.keys(allergenRatings).length > 0 ? allergenRatings : null,
      // Add generated tags
      tags: tags.length > 0 ? tags : null,
      // Add processed image URL
      imageUrl: imageUrl || imageService.getFallbackImageUrl(establishment.name),
      // Transform image fields to camelCase for frontend compatibility
      localImageUrl: establishment.local_image_url,
      s3ImageUrl: establishment.s3_image_url
    };
  }

  /**
   * Create a new establishment
   */
  static async createEstablishment(establishmentData: EstablishmentData) {
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
    } = establishmentData;

    // Check if establishment already exists
    const existingQuery = `
      SELECT id FROM venues.venues WHERE uuid = $1
    `;
    const existing = await this.getDbPool().query(existingQuery, [placeId]);
    
    if (existing.rows.length > 0) {
      throw new Error('Establishment with this place ID already exists');
    }

    // Generate UUID
    const uuidQuery = 'SELECT gen_random_uuid() as uuid';
    const uuidResult = await this.getDbPool().query(uuidQuery);
    const uuid = uuidResult.rows[0].uuid;

    // Create the establishment
    const insertQuery = `
      INSERT INTO venues.venues (
        uuid,
        name,
        address,
        phone,
        website,
        price_level,
        latitude,
        longitude,
        business_status,
        chain_id,
        primary_image_ref,
        tags,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

    const result = await this.getDbPool().query(insertQuery, [
      uuid,
      name,
      address || null,
      phone || null,
      website || null,
      priceLevel || null,
      position?.lat || null,
      position?.lng || null,
      businessStatus || null,
      chainId || null,
      localImageUrl || null,
      tags ? JSON.stringify(tags) : null
    ]);

    return result.rows[0];
  }

  /**
   * Update an existing establishment
   */
  static async updateEstablishment(identifier: string, updateData: EstablishmentUpdateData) {
    // Check if establishment exists
    const existing = await this.getEstablishmentById(identifier);
    if (!existing) {
      throw new Error('Establishment not found');
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      queryParams.push(updateData.name);
    }

    if (updateData.address !== undefined) {
      updateFields.push(`address = $${paramIndex++}`);
      queryParams.push(updateData.address);
    }

    if (updateData.position !== undefined) {
      updateFields.push(`position = $${paramIndex++}`);
      queryParams.push(updateData.position ? JSON.stringify(updateData.position) : null);
    }

    if (updateData.phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      queryParams.push(updateData.phone);
    }

    if (updateData.website !== undefined) {
      updateFields.push(`website = $${paramIndex++}`);
      queryParams.push(updateData.website);
    }

    if (updateData.priceLevel !== undefined) {
      updateFields.push(`price_level = $${paramIndex++}`);
      queryParams.push(updateData.priceLevel);
    }

    // Note: rating and userRatingsTotal are calculated from reviews, not stored directly

    // Note: types are stored in primary_category and cuisine fields

    if (updateData.businessStatus !== undefined) {
      updateFields.push(`business_status = $${paramIndex++}`);
      queryParams.push(updateData.businessStatus);
    }

    if (updateData.chainId !== undefined) {
      updateFields.push(`chain_id = $${paramIndex++}`);
      queryParams.push(updateData.chainId);
    }

    if (updateData.localImageUrl !== undefined) {
      updateFields.push(`primary_image_ref = $${paramIndex++}`);
      queryParams.push(updateData.localImageUrl);
    }

    if (updateData.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      queryParams.push(updateData.tags ? JSON.stringify(updateData.tags) : null);
    }

    // Note: allergen ratings are calculated from reviews.review_allergen_scores, not stored directly

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    queryParams.push(existing.id);

    const updateQuery = `
      UPDATE venues.venues 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.getDbPool().query(updateQuery, queryParams);
    return result.rows[0];
  }

  /**
   * Delete an establishment
   */
  static async deleteEstablishment(identifier: string) {
    const existing = await this.getEstablishmentById(identifier);
    if (!existing) {
      throw new Error('Establishment not found');
    }

    // Check if establishment has reviews
    const reviewsQuery = `
      SELECT COUNT(*) as review_count 
      FROM reviews.reviews 
      WHERE venue_id = $1
    `;
    const reviewsResult = await this.getDbPool().query(reviewsQuery, [existing.id]);
    const reviewCount = parseInt(reviewsResult.rows[0].review_count);

    if (reviewCount > 0) {
      throw new Error('Cannot delete establishment with existing reviews');
    }

    const deleteQuery = `
      DELETE FROM venues.venues 
      WHERE id = $1
      RETURNING id, name
    `;

    const result = await this.getDbPool().query(deleteQuery, [existing.id]);
    return result.rows[0];
  }

  /**
   * Search establishments by text query
   */
  static async searchEstablishments(query: string, options: {
    limit?: number;
    includeChains?: boolean;
    allergenSafe?: string[];
  } = {}) {
    const { limit = 20, includeChains = true, allergenSafe } = options;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Text search
    whereConditions.push(`(
      e.name ILIKE $${paramIndex} OR 
      e.address ILIKE $${paramIndex} OR 
      COALESCE(e.tags::text, '') ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${query}%`);
    paramIndex++;

    // Allergen safety filter
    if (allergenSafe && allergenSafe.length > 0) {
      const allergenConditions = allergenSafe.map(allergen => 
        `(e.average_allergen_scores->>'${allergen}')::numeric >= 4`
      );
      whereConditions.push(`(${allergenConditions.join(' AND ')})`);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const searchQuery = `
      SELECT 
        e.id,
        e.uuid,
        e.name,
        NULL as place_id,  -- Moved to external_places
        e.address,
        POINT(e.longitude, e.latitude) as position,  -- Convert to PostGIS point if needed
        NULL as rating,  -- Calculated from reviews
        NULL as user_ratings_total,  -- Calculated from reviews
        e.price_level,
        e.primary_image_ref,
        NULL as allergen_ratings, -- Calculated from reviews
        NULL as average_allergen_scores, -- Calculated from reviews
        ${includeChains ? 'c.name as chain_name, COALESCE(NULLIF(c.logo_url, \'\'), c.local_logo_path) as chain_logo_url,' : ''}
        COUNT(r.id) as review_count,
        AVG(r.overall_rating) as avg_review_rating,
        ts_rank_cd(
          to_tsvector('english', e.name || ' ' || COALESCE(e.address, '') || ' ' || COALESCE(e.tags::text, '')),
          plainto_tsquery('english', $1)
        ) as search_rank
      FROM venues.venues e
      ${includeChains ? 'LEFT JOIN venues.chains c ON e.chain_id = c.id' : ''}
      LEFT JOIN reviews.reviews r ON e.id = r.venue_id 
      ${whereClause}
      GROUP BY e.id${includeChains ? ', c.name, c.logo_url, c.local_logo_path' : ''}
      ORDER BY search_rank DESC, e.name ASC
      LIMIT $${paramIndex}
    `;

    queryParams.push(limit);
    const result = await this.getDbPool().query(searchQuery, queryParams);

    return result.rows.map(row => ({
      ...row,
      reviewCount: parseInt(row.review_count) || 0,
      avgReviewRating: parseFloat(row.avg_review_rating) || null,
      searchRank: parseFloat(row.search_rank) || 0
    }));
  }

  /**
   * Get establishment statistics
   */
  static async getEstablishmentStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_establishments,
        COUNT(CASE WHEN chain_id IS NOT NULL THEN 1 END) as chain_establishments,
        COUNT(CASE WHEN chain_id IS NULL THEN 1 END) as independent_establishments,
        COUNT(CASE WHEN primary_image_ref IS NOT NULL THEN 1 END) as establishments_with_images,
        0 as average_rating, -- TODO: Calculate from reviews
        COUNT(DISTINCT chain_id) as unique_chains
      FROM venues.venues
    `;

    const result = await this.getDbPool().query(statsQuery);
    const stats = result.rows[0];

    return {
      totalEstablishments: parseInt(stats.total_establishments),
      chainEstablishments: parseInt(stats.chain_establishments),
      independentEstablishments: parseInt(stats.independent_establishments),
      establishmentsWithImages: parseInt(stats.establishments_with_images),
      averageRating: parseFloat(stats.average_rating) || 0,
      uniqueChains: parseInt(stats.unique_chains)
    };
  }

  /**
   * Update allergen scores for an establishment
   */
  static async updateAllergenScores(establishmentId: number) {
    // Calculate average allergen scores from reviews
    const scoresQuery = `
      SELECT 
        allergen_scores
      FROM reviews.reviews 
      WHERE venue_id = $1
    `;

    const result = await this.getDbPool().query(scoresQuery, [establishmentId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    // Calculate averages
    const allergenTotals: Record<string, { sum: number; count: number }> = {};
    
    result.rows.forEach(row => {
      const scores = row.allergen_scores;
      Object.entries(scores).forEach(([allergen, score]) => {
        if (typeof score === 'number') {
          if (!allergenTotals[allergen]) {
            allergenTotals[allergen] = { sum: 0, count: 0 };
          }
          allergenTotals[allergen].sum += score;
          allergenTotals[allergen].count += 1;
        }
      });
    });

    const averageScores: Record<string, number> = {};
    Object.entries(allergenTotals).forEach(([allergen, { sum, count }]) => {
      averageScores[allergen] = Math.round((sum / count) * 100) / 100; // Round to 2 decimal places
    });

    // Update the establishment
    const updateQuery = `
      UPDATE venues.venues 
      SET 
        average_allergen_scores = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING average_allergen_scores
    `;

    const updateResult = await this.getDbPool().query(updateQuery, [
      JSON.stringify(averageScores),
      establishmentId
    ]);

    return updateResult.rows[0];
  }
}
