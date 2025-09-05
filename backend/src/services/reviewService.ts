import { Pool } from 'pg';
import { getPool } from './database';
import type {
  Review,
  ReviewWithDetails,
  ReviewCreateInput,
  ReviewUpdateInput
} from '../../../shared/types/core';
import { 
  transformReviewFromDb, 
  transformReviewWithDetailsFromDb,
  transformReviewToDb 
} from '../../../shared/utils/transforms';

/**
 * Validates yes_no_answers keys to ensure they don't contain spaces
 */
function validateYesNoAnswers(yesNoAnswers: Record<string, any> | undefined): void {
  if (!yesNoAnswers) return;
  
  const keysWithSpaces = Object.keys(yesNoAnswers).filter(key => key.includes(' '));
  if (keysWithSpaces.length > 0) {
    console.warn(`⚠️ YES/NO ANSWERS VALIDATION: Keys with spaces detected: ${keysWithSpaces.join(', ')}`);
    // In production, you might want to throw an error instead
    // throw new Error(`Invalid yes_no_answers keys contain spaces: ${keysWithSpaces.join(', ')}`);
  }
}

export interface ReviewFilters {
  status?: 'pending' | 'approved' | 'rejected';
  userId?: number;
  establishmentId?: number;
  placeId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'overall_rating';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * @deprecated Use ReviewCreateInput from shared/types/core.ts instead
 * This interface will be removed in a future version
 */
export interface ReviewData {
  userId: number;
  establishmentId?: number | string;
  placeId?: string | null;
  allergenScores?: Record<string, number>;
  generalComment?: string;
  overallRating?: number;
  wouldRecommend?: boolean;
  separatePreparationArea?: boolean | null;
  staffAllergyTrained?: boolean | null;
  staffKnowledgeRating?: number;
  crossContaminationSafety?: boolean | null;
  yesNoAnswers?: Record<string, any>;
  // New boolean fields for individual yes/no questions
  allergenMenu?: boolean;
  staffConfident?: boolean;
  staffNotifyKitchen?: boolean;
  kitchenAdjust?: boolean;
}

/**
 * @deprecated Use ReviewUpdateInput from shared/types/core.ts instead
 * This interface will be removed in a future version
 */
export interface ReviewUpdateData extends Partial<ReviewData> {
  status?: 'pending' | 'approved' | 'rejected';
  moderatedBy?: number;
  moderatedAt?: Date;
}

export class ReviewService {
  private static getDbPool(): Pool {
    return getPool();
  }

  /**
   * Get reviews with filtering, pagination, and sorting
   */
  static async getReviews(filters: ReviewFilters = {}) {
    const {
      status,
      userId,
      establishmentId,
      placeId,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    // Note: status column doesn't exist in current schema
    // if (status) {
    //   whereConditions.push(`r.status = $${paramIndex++}`);
    //   queryParams.push(status);
    // }

    if (userId) {
      whereConditions.push(`r.user_id = $${paramIndex++}`);
      queryParams.push(userId);
    }

    if (establishmentId) {
      whereConditions.push(`r.venue_id = $${paramIndex++}`);
      queryParams.push(establishmentId);
    }

    // Note: place_id column doesn't exist in venues.venues table
    // if (placeId) {
    //   whereConditions.push(`e.place_id = $${paramIndex++}`);
    //   queryParams.push(placeId);
    // }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count total reviews
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews.reviews r
      LEFT JOIN venues.venues e ON r.venue_id = e.id
      ${whereClause}
    `;

    const countResult = await this.getDbPool().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get reviews with pagination
    const reviewsQuery = `
      SELECT 
        r.id,
        r.user_id,
        r.venue_id,
        r.allergen_scores,
        r.general_comment,
        NULL as specific_allergen_comments,
        r.overall_rating,

        '{}' as yes_no_answers, -- Column doesn't exist in current schema
        NULL as status,
        r.created_at,
        r.updated_at,
        NULL as moderated_by,
        NULL as moderated_at,
        u.display_name as user_name,
        u.email as user_email,
        e.name as establishment_name,
        NULL as place_id, -- place_id column doesn't exist in venues.venues
        e.address as establishment_address
      FROM reviews.reviews r
      LEFT JOIN users.accounts u ON r.user_id = u.id
      LEFT JOIN venues.venues e ON r.venue_id = e.id
      ${whereClause}
      ORDER BY r.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);
    const reviewsResult = await this.getDbPool().query(reviewsQuery, queryParams);

    return {
      reviews: reviewsResult.rows,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  /**
   * Get a single review by ID
   */
  static async getReviewById(reviewId: number) {
    const query = `
      SELECT 
        r.id,
        r.user_id,
        r.venue_id,
        COALESCE(
          (
            SELECT jsonb_object_agg(a.code, ras.score)
            FROM reviews.review_allergen_scores ras
            JOIN allergens a ON ras.allergen_id = a.id
            WHERE ras.review_id = r.id
          ), 
          '{}'::jsonb
        ) as allergen_scores,
        r.comment as general_comment,
        r.overall_rating,
        COALESCE(
          (
            SELECT jsonb_object_agg(ra.question_code, ra.answer)
            FROM reviews.review_answers ra
            WHERE ra.review_id = r.id
          ), 
          '{}'::jsonb
        ) as yes_no_answers,
        r.created_at,
        r.updated_at,
        u.display_name as user_name,
        u.email as user_email,
        e.name as establishment_name,
        NULL as place_id,
        e.address as establishment_address
      FROM reviews.reviews r
      LEFT JOIN users.accounts u ON r.user_id = u.id
      LEFT JOIN venues.venues e ON r.venue_id = e.id
      WHERE r.id = $1
    `;

    const result = await this.getDbPool().query(query, [reviewId]);
    const review = result.rows[0];
    
    if (review && review.allergen_scores) {
      // Map database allergen codes back to frontend codes
      const dbToFrontendMapping: Record<string, string> = {
        'nuts': 'tree_nuts',  // DB uses nuts, frontend expects tree_nuts
        'sulphites': 'sulfites'  // Handle spelling variations
      };
      
      const mappedAllergenScores: Record<string, number> = {};
      for (const [dbCode, score] of Object.entries(review.allergen_scores)) {
        const frontendCode = dbToFrontendMapping[dbCode] || dbCode;
        mappedAllergenScores[frontendCode] = score as number;
      }
      review.allergen_scores = mappedAllergenScores;
    }
    
    return review;
  }

  /**
   * Get reviews for a specific establishment by user using establishment ID
   * This is the preferred method for internal use
   */
  static async getReviewsByEstablishmentAndUser(establishmentId: number, userId: number) {
    console.log(`🔍 Getting reviews for establishment ${establishmentId} by user ${userId}`);
    
    // Get reviews for this establishment and user, including chain reviews
    const reviewsQuery = `
      WITH target_establishment AS (
        SELECT id, chain_id FROM venues.venues WHERE id = $1
      )
      SELECT 
        r.id,
        r.user_id,
        r.venue_id,
        COALESCE(
          (
            SELECT jsonb_object_agg(a.code, ras.score)
            FROM reviews.review_allergen_scores ras
            JOIN allergens a ON ras.allergen_id = a.id
            WHERE ras.review_id = r.id
          ), 
          '{}'::jsonb
        ) as allergen_scores,
        r.comment as general_comment,
        NULL as specific_allergen_comments,
        r.overall_rating,

        COALESCE(
          (
            SELECT jsonb_object_agg(ra.question_code, ra.answer)
            FROM reviews.review_answers ra
            WHERE ra.review_id = r.id
          ), 
          '{}'::jsonb
        ) as yes_no_answers,
        NULL as status,
        r.created_at,
        r.updated_at,
        e.name as establishment_name,
        NULL as place_id,
        CASE 
          WHEN r.venue_id = te.id THEN 'venue'
          ELSE 'chain'
        END as review_type
      FROM reviews.reviews r
      JOIN venues.venues e ON r.venue_id = e.id
      JOIN target_establishment te ON (
        r.venue_id = te.id OR 
        (te.chain_id IS NOT NULL AND e.chain_id = te.chain_id)
      )
      WHERE r.user_id = $2 
      ORDER BY 
        CASE WHEN r.venue_id = te.id THEN 0 ELSE 1 END,
        r.created_at DESC
    `;

    const result = await this.getDbPool().query(reviewsQuery, [establishmentId, userId]);
    
    console.log(`✅ Found ${result.rows.length} reviews for establishment ${establishmentId} by user ${userId}`);
    
    // Map database allergen codes back to frontend codes for all reviews
    const dbToFrontendMapping: Record<string, string> = {
      'nuts': 'tree_nuts',  // DB uses nuts, frontend expects tree_nuts
      'sulphites': 'sulfites'  // Handle spelling variations
    };
    
    const mappedReviews = result.rows.map(review => {
      if (review.allergen_scores) {
        const mappedAllergenScores: Record<string, number> = {};
        for (const [dbCode, score] of Object.entries(review.allergen_scores)) {
          const frontendCode = dbToFrontendMapping[dbCode] || dbCode;
          mappedAllergenScores[frontendCode] = score as number;
        }
        review.allergen_scores = mappedAllergenScores;
      }
      return review;
    });
    
    return mappedReviews;
  }

  /**
   * Get reviews for a specific place by user (legacy method)
   * Supports both place_id and establishment_id as input
   */
  static async getReviewsByPlaceAndUser(placeId: string, userId: number) {
    console.log(`🔍 Legacy method: Getting reviews for place ${placeId} by user ${userId}`);
    
    // First get the establishment ID
    const establishmentQuery = `
              SELECT id FROM venues.venues 
      WHERE uuid::text = $1 OR id::text = $1
    `;
    const establishmentResult = await this.getDbPool().query(establishmentQuery, [placeId]);
    
    if (establishmentResult.rows.length === 0) {
      console.log(`❌ No establishment found for place ${placeId}`);
      return [];
    }

    const establishmentId = establishmentResult.rows[0].id;
    console.log(`✅ Found establishment ID ${establishmentId} for place ${placeId}`);

    // Use the new method internally
    return this.getReviewsByEstablishmentAndUser(establishmentId, userId);
  }

  /**
   * Get all reviews by a specific user (for profile page)
   */
  static async getAllReviewsByUser(userId: number) {
    console.log(`📝 Getting all reviews for user ${userId}`);
    
    const reviewsQuery = `
      SELECT 
        r.id,
        r.user_id,
        r.venue_id,
        r.comment as general_comment,
        r.overall_rating,
        r.created_at,
        r.updated_at,
        e.name as establishment_name,
        e.address as establishment_address,
        COALESCE(ep.provider_id, e.uuid::text) as place_id, -- Use Google place_id if available, otherwise venue UUID
        e.uuid as establishment_uuid,
        e.primary_image_ref as establishment_image,
        -- Get user profile info
        u.display_name as user_display_name,
        u.avatar_url as user_profile_image,
        -- Chain info if applicable
        c.name as chain_name,
        c.logo_url as chain_logo_url
      FROM reviews.reviews r
      JOIN venues.venues e ON r.venue_id = e.id
      LEFT JOIN users.accounts u ON r.user_id = u.id
      LEFT JOIN venues.chains c ON e.chain_id = c.id
      LEFT JOIN venues.external_places ep ON e.id = ep.venue_id AND ep.provider = 'google_places'
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `;

    const result = await this.getDbPool().query(reviewsQuery, [userId]);
    
    console.log(`✅ Found ${result.rows.length} reviews for user ${userId}`);
    
    // For each review, fetch allergen scores and answers
    const enrichedReviews = await Promise.all(result.rows.map(async (review) => {
      // Get allergen scores
      const allergenScoresQuery = `
        SELECT LOWER(a.name) as allergen_name, ras.score
        FROM reviews.review_allergen_scores ras
        JOIN allergens a ON ras.allergen_id = a.id
        WHERE ras.review_id = $1
      `;
      const allergenScoresResult = await this.getDbPool().query(allergenScoresQuery, [review.id]);
      
      // Convert to object format {allergen_name: score}
      const allergenScores: Record<string, number> = {};
      allergenScoresResult.rows.forEach(row => {
        allergenScores[row.allergen_name] = row.score;
      });

      // Get yes/no answers
      const answersQuery = `
        SELECT question_code, answer
        FROM reviews.review_answers
        WHERE review_id = $1
      `;
      const answersResult = await this.getDbPool().query(answersQuery, [review.id]);
      
      // Convert to object format {question_code: answer}
      const yesNoAnswers: Record<string, any> = {};
      answersResult.rows.forEach(row => {
        // The answer is stored as JSONB, so we need to extract the actual value
        const answerValue = row.answer;
        if (typeof answerValue === 'object' && answerValue !== null) {
          // If it's an object, try to extract a boolean value
          if ('value' in answerValue) {
            yesNoAnswers[row.question_code] = answerValue.value;
          } else if ('answer' in answerValue) {
            yesNoAnswers[row.question_code] = answerValue.answer;
          } else {
            yesNoAnswers[row.question_code] = answerValue;
          }
        } else {
          yesNoAnswers[row.question_code] = answerValue;
        }
      });

      return {
        ...review,
        allergen_scores: allergenScores,
        yes_no_answers: yesNoAnswers
      };
    }));
    
    console.log(`✅ Enriched ${enrichedReviews.length} reviews with allergen scores and answers`);
    
    return enrichedReviews;
  }

  /**
   * Get reviews for an establishment
   */
  static async getEstablishmentReviews(establishmentIdentifier: string, options: {
    page?: number;
    limit?: number;
    includeChainReviews?: boolean;
  } = {}) {
    const { page = 1, limit = 10, includeChainReviews = true } = options;
    const offset = (page - 1) * limit;

    // Find establishment
    const establishmentQuery = `
      SELECT id, name, uuid
      FROM venues.venues 
      WHERE uuid::text = $1 OR id::text = $1
    `;
    const establishmentResult = await this.getDbPool().query(establishmentQuery, [establishmentIdentifier]);
    
    if (establishmentResult.rows.length === 0) {
      throw new Error('Establishment not found');
    }

    const establishment = establishmentResult.rows[0];

    // Get chain info if needed
    let chainInfo = null;
    if (includeChainReviews) {
      const chainQuery = `
        SELECT chain_id, c.name as chain_name
        FROM venues.venues e
        LEFT JOIN venues.chains c ON e.chain_id = c.id
        WHERE e.id = $1
      `;
      const chainResult = await this.getDbPool().query(chainQuery, [establishment.id]);
      chainInfo = chainResult.rows[0];
    }

    // Count total reviews
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews.reviews r
      JOIN venues.venues e ON r.venue_id = e.id
      WHERE e.id = $1
    `;
    const countResult = await this.getDbPool().query(countQuery, [establishment.id]);
    const total = parseInt(countResult.rows[0].total);

    // Get reviews
    const reviewsQuery = `
      SELECT 
        r.id,
        r.user_id,
        r.venue_id,
        COALESCE(
          (
            SELECT jsonb_object_agg(a.code, ras.score)
            FROM reviews.review_allergen_scores ras
            JOIN public.allergens a ON ras.allergen_id = a.id
            WHERE ras.review_id = r.id
          ), 
          '{}'::jsonb
        ) as allergen_scores,
        r.comment as general_comment,
        NULL as specific_allergen_comments,
        r.overall_rating,
        COALESCE(
          (
            SELECT jsonb_object_agg(ra.question_code, ra.answer)
            FROM reviews.review_answers ra
            WHERE ra.review_id = r.id
          ), 
          '{}'::jsonb
        ) as yes_no_answers,
        r.created_at,
        r.updated_at,
        u.display_name as user_name,
        'standard' as user_type,
        e.name as establishment_name,
        NULL as place_id,
        'venue' as review_type
      FROM reviews.reviews r
      JOIN venues.venues e ON r.venue_id = e.id
      LEFT JOIN users.accounts u ON r.user_id = u.id
      WHERE e.id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const reviewsResult = await this.getDbPool().query(reviewsQuery, [
      establishment.id,
      limit,
      offset
    ]);

    // Map database allergen codes back to frontend codes for all reviews
    const dbToFrontendMapping: Record<string, string> = {
      'nuts': 'tree_nuts',  // DB uses nuts, frontend expects tree_nuts
      'sulphites': 'sulfites'  // Handle spelling variations
    };
    
    const mappedReviews = reviewsResult.rows.map(review => {
      if (review.allergen_scores) {
        const mappedAllergenScores: Record<string, number> = {};
        for (const [dbCode, score] of Object.entries(review.allergen_scores)) {
          const frontendCode = dbToFrontendMapping[dbCode] || dbCode;
          mappedAllergenScores[frontendCode] = score as number;
        }
        review.allergen_scores = mappedAllergenScores;
      }
      return review;
    });

    return {
      establishment,
      chainInfo,
      reviews: mappedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Get all reviews for a chain
   */
  static async getChainReviews(chainId: number, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    // Find chain
    const chainQuery = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.logo_url,
        c.featured_image_path,
        c.category,
        COUNT(e.id) as location_count
      FROM venues.chains c
      LEFT JOIN venues.venues e ON c.id = e.chain_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.slug, c.logo_url, c.featured_image_path, c.category
    `;
    const chainResult = await this.getDbPool().query(chainQuery, [chainId]);
    
    if (chainResult.rows.length === 0) {
      throw new Error('Chain not found');
    }

    const chain = chainResult.rows[0];

    // Count total reviews for this chain
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews.reviews r
      JOIN venues.venues e ON r.venue_id = e.id
      WHERE e.chain_id = $1
    `;
    const countResult = await this.getDbPool().query(countQuery, [chainId]);
    const total = parseInt(countResult.rows[0].total);

    // Get all reviews for establishments in this chain
    const reviewsQuery = `
      SELECT 
        r.id,
        -- r.firebase_id, -- Removed legacy field
        r.allergen_scores,
        r.general_comment,
        NULL as specific_allergen_comments,
        r.overall_rating,

        '{}' as yes_no_answers, -- Column doesn't exist in current schema
        r.created_at,
        r.updated_at,
        u.display_name as user_name,
        'standard' as user_type, -- user_type column doesn't exist in users.accounts
        e.name as establishment_name,
        NULL as establishment_place_id, -- place_id column doesn't exist in venues.venues
        'chain' as review_type
      FROM reviews.reviews r
      JOIN venues.venues e ON r.venue_id = e.id
      LEFT JOIN users.accounts u ON r.user_id = u.id
      WHERE e.chain_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const reviewsResult = await this.getDbPool().query(reviewsQuery, [chainId, limit, offset]);

    return {
      chain,
      reviews: reviewsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Create a new review
   */
  static async createReview(reviewData: ReviewData) {
    const {
      userId,
      establishmentId,
      placeId,
      allergenScores,
      generalComment,
      overallRating,
      wouldRecommend,
      separatePreparationArea,
      staffAllergyTrained,
      staffKnowledgeRating,
      crossContaminationSafety,
      yesNoAnswers,
      allergenMenu,
      staffConfident,
      staffNotifyKitchen,
      kitchenAdjust
    } = reviewData;

    // Handle different types of establishment IDs
    let finalEstablishmentId = establishmentId;
    
    console.log(`📝 Processing establishmentId: ${establishmentId} (type: ${typeof establishmentId})`);
    
    // If establishmentId is a chain ID (e.g., "chain-3"), find the first venue in that chain
    if (typeof establishmentId === 'string' && establishmentId.toString().startsWith('chain-')) {
      const chainId = establishmentId.toString().replace('chain-', '');
      console.log(`📝 Creating review for chain ${chainId}, finding first venue...`);
      
      const chainVenueQuery = `
        SELECT id FROM venues.venues WHERE chain_id = $1 LIMIT 1
      `;
      const chainVenueResult = await this.getDbPool().query(chainVenueQuery, [parseInt(chainId)]);
      
      if (chainVenueResult.rows.length === 0) {
        throw new Error('No venues found for the specified chain');
      }
      
      finalEstablishmentId = chainVenueResult.rows[0].id;
      console.log(`📝 Using venue ${finalEstablishmentId} to represent chain ${chainId}`);
    }
    // If no establishmentId provided, find it by placeId
    else if (!finalEstablishmentId && placeId) {
      const establishmentQuery = `
        SELECT id FROM venues.venues WHERE place_id = $1
      `;
      const establishmentResult = await this.getDbPool().query(establishmentQuery, [placeId]);
      
      if (establishmentResult.rows.length === 0) {
        throw new Error('Establishment not found for the provided place ID');
      }
      
      finalEstablishmentId = establishmentResult.rows[0].id;
    }

    if (!finalEstablishmentId) {
      throw new Error('Establishment ID is required');
    }

    // Check if user already has a review for this establishment
    const existingReviewQuery = `
      SELECT id FROM reviews.reviews 
      WHERE user_id = $1 AND venue_id = $2
    `;
    const existingReview = await this.getDbPool().query(existingReviewQuery, [userId, finalEstablishmentId]);
    
    if (existingReview.rows.length > 0) {
      throw new Error('You have already reviewed this establishment');
    }

    // Validate yes_no_answers before insertion
    validateYesNoAnswers(yesNoAnswers);

    console.log('📝 Creating review with data:', {
      userId,
      finalEstablishmentId,
      allergenScores,
      generalComment,
      overallRating,
      yesNoAnswers,
      separatePreparationArea,
      staffAllergyTrained,
      staffKnowledgeRating,
      crossContaminationSafety,
      wouldRecommend
    });

    // Create the review using the actual tables (not the view)
    console.log('📝 Inserting review with data:', {
      userId,
      finalEstablishmentId,
      allergenScores: allergenScores || {},
      generalComment,
      overallRating,
      yesNoAnswers: yesNoAnswers || {}
    });

    // Start a transaction to insert into multiple tables
    const client = await this.getDbPool().connect();
    
    try {
      await client.query('BEGIN');

      // 1. Insert main review into reviews.reviews table
      const mainReviewQuery = `
        INSERT INTO reviews.reviews (
          venue_id,
          user_id,
          overall_rating,
          comment,
          visit_date,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, NOW(), NOW())
        RETURNING id, uuid
      `;

      const mainReviewResult = await client.query(mainReviewQuery, [
        finalEstablishmentId,
        userId,
        overallRating || null,
        generalComment || null
      ]);

      const reviewId = mainReviewResult.rows[0].id;
      const reviewUuid = mainReviewResult.rows[0].uuid;

      // 2. Insert allergen scores into reviews.review_allergen_scores table
      if (allergenScores && Object.keys(allergenScores).length > 0) {
        // Map frontend allergen codes to database codes
        const allergenCodeMapping: Record<string, string> = {
          'tree_nuts': 'nuts',  // Frontend uses tree_nuts, DB uses nuts
          'sulfites': 'sulphites'  // Handle spelling variations
        };
        
        // Convert frontend codes to database codes
        const allergenCodes = Object.keys(allergenScores).map(code => 
          allergenCodeMapping[code] || code
        );
        
        // First, get allergen IDs from codes
        const allergenQuery = `
          SELECT id, code FROM public.allergens 
          WHERE code = ANY($1)
        `;
        const allergenResult = await client.query(allergenQuery, [allergenCodes]);
        
        // Insert each allergen score
        for (const allergenRow of allergenResult.rows) {
          const dbAllergenCode = allergenRow.code;
          
          // Find the original frontend code that maps to this database code
          const frontendCode = Object.keys(allergenScores).find(frontendKey => {
            const mappedCode = allergenCodeMapping[frontendKey] || frontendKey;
            return mappedCode === dbAllergenCode;
          });
          
          if (frontendCode) {
            const score = allergenScores[frontendCode];
          
          if (score !== undefined) {
            const scoreQuery = `
              INSERT INTO reviews.review_allergen_scores (
                review_id,
                allergen_id,
                score,
                created_at,
                updated_at
              ) VALUES ($1, $2, $3, NOW(), NOW())
            `;
            await client.query(scoreQuery, [reviewId, allergenRow.id, score]);
          }
          }
        }
      }

      // 3. Insert yes/no answers into reviews.review_answers table (if needed)
      if (yesNoAnswers && Object.keys(yesNoAnswers).length > 0) {
        // First, get valid question codes from the question bank
        const validQuestionsQuery = `
          SELECT question_code, version FROM public.question_bank 
          WHERE is_active = true
        `;
        const validQuestionsResult = await client.query(validQuestionsQuery);
        const validQuestions = new Map();
        
        for (const row of validQuestionsResult.rows) {
          validQuestions.set(row.question_code, row.version);
        }
        
        console.log('📝 Valid question codes:', Array.from(validQuestions.keys()));
        console.log('📝 Frontend question keys:', Object.keys(yesNoAnswers));
        
        for (const [questionKey, answer] of Object.entries(yesNoAnswers)) {
          if (answer !== null && answer !== undefined) {
            if (validQuestions.has(questionKey)) {
              const version = validQuestions.get(questionKey);
              const answerQuery = `
                INSERT INTO reviews.review_answers (
                  review_id,
                  question_code,
                  question_version,
                  answer,
                  created_at,
                  updated_at
                ) VALUES ($1, $2, $3, $4, NOW(), NOW())
              `;
              console.log(`📝 Inserting answer for ${questionKey} (v${version}): ${answer}`);
              await client.query(answerQuery, [reviewId, questionKey, version, answer]);
            } else {
              console.log(`⚠️ Skipping unknown question code: ${questionKey}`);
            }
          }
        }
      }

      await client.query('COMMIT');

      // Return the created review data
      const result = {
        rows: [{
          id: reviewId,
          uuid: reviewUuid,
          user_id: userId,
          venue_id: finalEstablishmentId,
          overall_rating: overallRating,
          general_comment: generalComment,
          allergen_scores: allergenScores,
          yes_no_answers: yesNoAnswers
        }]
      };
      
      client.release();
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  }

  /**
   * Update an existing review with field-level diffing
   */
  static async updateReview(reviewId: number, updateData: ReviewUpdateData, userId?: number) {
    // Check if review exists and user has permission
    const existingReview = await this.getReviewById(reviewId);
    if (!existingReview) {
      throw new Error('Review not found');
    }

    if (userId && parseInt(existingReview.user_id) !== parseInt(userId.toString())) {
      throw new Error('You can only update your own reviews');
    }

    console.log('🔍 FIELD-LEVEL DIFF: Comparing existing vs new data');
    console.log('   Existing review:', existingReview);
    console.log('   Update data:', updateData);

    // Build update query dynamically with protection against empty object overwrites
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Helper function to check if an object is empty or has meaningful content
    const isEmptyObject = (obj: any): boolean => {
      return obj && typeof obj === 'object' && Object.keys(obj).length === 0;
    };

    // Helper function to check if two values are deeply equal
    const isDeepEqual = (a: any, b: any): boolean => {
      if (a === b) return true;
      if (a == null || b == null) return a === b;
      if (typeof a !== typeof b) return false;
      if (typeof a === 'object') {
        return JSON.stringify(a) === JSON.stringify(b);
      }
      return false;
    };

    // Helper function to log field clearing attempts
    const logFieldClearing = (fieldName: string, existingValue: any, newValue: any) => {
      if (existingValue && (isEmptyObject(newValue) || newValue === null || newValue === '')) {
        console.warn(`🚨 FIELD CLEARING DETECTED - Review ID: ${reviewId}, User ID: ${userId}, Field: ${fieldName}`);
        console.warn(`   Existing value:`, existingValue);
        console.warn(`   New value:`, newValue);
        console.warn(`   Timestamp: ${new Date().toISOString()}`);
      }
    };

    // Helper function to log field changes
    const logFieldChange = (fieldName: string, existingValue: any, newValue: any, willUpdate: boolean) => {
      if (!isDeepEqual(existingValue, newValue)) {
        console.log(`📝 FIELD CHANGE: ${fieldName} - ${willUpdate ? 'UPDATING' : 'SKIPPING'}`);
        console.log(`   From:`, existingValue);
        console.log(`   To:`, newValue);
      } else {
        console.log(`✅ FIELD UNCHANGED: ${fieldName} - no update needed`);
      }
    };

    // NOTE: allergenScores are handled separately in the transaction below

    // PROTECTED UPDATE: generalComment - only update if not empty string
    if (updateData.generalComment !== undefined) {
      if (updateData.generalComment !== '') {
        updateFields.push(`comment = $${paramIndex++}`);
        queryParams.push(updateData.generalComment);
      } else {
        logFieldClearing('general_comment', existingReview.general_comment, updateData.generalComment);
        console.log(`🛡️ PROTECTED: Skipping general_comment update (empty string) for review ${reviewId}`);
      }
    }

    // DEPRECATED: specificAllergenComments field is no longer used
    // Keeping this comment for historical reference

    // SAFE UPDATE: overallRating - always update if provided (numeric values are safe)
    if (updateData.overallRating !== undefined) {
      updateFields.push(`overall_rating = $${paramIndex++}`);
      queryParams.push(updateData.overallRating);
    }

    // Note: would_recommend column removed from current schema

    // SAFE UPDATE: status - always update if provided (enum values are safe)
    if (updateData.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      queryParams.push(updateData.status);
    }

    // Note: separate_preparation_area, staff_allergy_trained, staff_knowledge_rating, 
    // cross_contamination_safety columns removed from current schema

    // Note: yes_no_answers column doesn't exist in current schema

    // Note: moderated_by and moderated_at columns don't exist in current schema
    // if (updateData.moderatedBy !== undefined) {
    //   updateFields.push(`moderated_by = $${paramIndex++}`);
    //   queryParams.push(updateData.moderatedBy);
    //   updateFields.push(`moderated_at = NOW()`);
    // }

    if (updateFields.length === 0) {
      console.log(`ℹ️ No fields to update for review ${reviewId} - all fields unchanged or protected`);
      console.log(`🛡️ PROTECTION SUMMARY: Review data preserved from accidental overwrites`);
      return existingReview;
    }

    console.log(`📊 UPDATE SUMMARY for review ${reviewId}:`);
    console.log(`   Fields to update: ${updateFields.length}`);
    console.log(`   Update fields: ${updateFields.map(f => f.split(' = ')[0]).join(', ')}`);
    console.log(`   Protected/unchanged fields: ${Object.keys(updateData).length - updateFields.length}`);

    // Use a transaction to update multiple tables
    const client = await this.getDbPool().connect();
    
    try {
      await client.query('BEGIN');

      // 1. Update main review table
      if (updateFields.length > 0) {
        updateFields.push(`updated_at = NOW()`);
        queryParams.push(reviewId);

        const mainUpdateQuery = `
          UPDATE reviews.reviews 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
        `;
        
        await client.query(mainUpdateQuery, queryParams);
      }

      // 2. Update allergen scores if provided
      if (updateData.allergenScores && !isEmptyObject(updateData.allergenScores)) {
        // Delete existing allergen scores
        await client.query('DELETE FROM reviews.review_allergen_scores WHERE review_id = $1', [reviewId]);
        
        // Map frontend allergen codes to database codes (same as create method)
        const allergenCodeMapping: Record<string, string> = {
          'tree_nuts': 'nuts',  // Frontend uses tree_nuts, DB uses nuts
          'sulfites': 'sulphites'  // Handle spelling variations
        };
        
        // Insert new allergen scores
        for (const [frontendAllergenCode, score] of Object.entries(updateData.allergenScores)) {
          const dbAllergenCode = allergenCodeMapping[frontendAllergenCode] || frontendAllergenCode;
          const allergenQuery = 'SELECT id FROM allergens WHERE code = $1';
          const allergenResult = await client.query(allergenQuery, [dbAllergenCode]);
          
          if (allergenResult.rows.length > 0) {
            const allergenId = allergenResult.rows[0].id;
            const scoreQuery = `
              INSERT INTO reviews.review_allergen_scores (review_id, allergen_id, score, created_at, updated_at)
              VALUES ($1, $2, $3, NOW(), NOW())
            `;
            await client.query(scoreQuery, [reviewId, allergenId, score]);
          }
        }
      }

      // 3. Update yes/no answers if provided
      if (updateData.yesNoAnswers && !isEmptyObject(updateData.yesNoAnswers)) {
        // Delete existing answers
        await client.query('DELETE FROM reviews.review_answers WHERE review_id = $1', [reviewId]);
        
        // Get valid question codes from question_bank (same as createReview)
        const questionsResult = await client.query(`
          SELECT question_code, version 
          FROM question_bank 
          WHERE is_active = true
        `);
        
        const validQuestions = new Map<string, number>();
        questionsResult.rows.forEach(row => {
          validQuestions.set(row.question_code, row.version);
        });
        
        console.log('📝 UPDATE - Valid question codes:', Array.from(validQuestions.keys()));
        console.log('📝 UPDATE - Frontend question keys:', Object.keys(updateData.yesNoAnswers));
        
        // Insert new answers with validation
        for (const [questionCode, answer] of Object.entries(updateData.yesNoAnswers)) {
          if (answer !== null && answer !== undefined) {
            if (validQuestions.has(questionCode)) {
              const version = validQuestions.get(questionCode);
              const answerQuery = `
                INSERT INTO reviews.review_answers (review_id, question_code, question_version, answer, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
              `;
              console.log(`📝 UPDATE - Inserting answer for ${questionCode} (v${version}): ${answer}`);
              await client.query(answerQuery, [reviewId, questionCode, version, answer]);
            } else {
              console.log(`⚠️ UPDATE - Skipping unknown question code: ${questionCode}`);
            }
          }
        }
      }

      await client.query('COMMIT');
      client.release();

      // Return the updated review
      return await this.getReviewById(reviewId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: number, userId?: number) {
    // Check if review exists and user has permission
    const existingReview = await this.getReviewById(reviewId);
    if (!existingReview) {
      throw new Error('Review not found');
    }

    if (userId && parseInt(existingReview.user_id) !== parseInt(userId.toString())) {
      throw new Error('You can only delete your own reviews');
    }

    const deleteQuery = `
      DELETE FROM reviews.reviews 
      WHERE id = $1
      RETURNING id
    `;

    const result = await this.getDbPool().query(deleteQuery, [reviewId]);
    return result.rows[0];
  }

  /**
   * Moderate a review (admin only)
   */
  static async moderateReview(reviewId: number, status: 'approved' | 'rejected', moderatorId: number) {
    return this.updateReview(reviewId, {
      status,
      moderatedBy: moderatorId,
      moderatedAt: new Date()
    });
  }

  /**
   * Get review statistics for an establishment
   */
  static async getReviewStats(establishmentId: number) {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_rating) as average_rating,
        0 as recommendations, -- would_recommend column removed from current schema
        0 as pending_reviews -- status column removed from current schema
      FROM reviews.reviews 
      WHERE venue_id = $1
    `;

    const result = await this.getDbPool().query(statsQuery, [establishmentId]);
    const stats = result.rows[0];

    return {
      totalReviews: parseInt(stats.total_reviews),
      averageRating: parseFloat(stats.average_rating) || 0,
      recommendations: parseInt(stats.recommendations),
      pendingReviews: parseInt(stats.pending_reviews),
      recommendationRate: stats.total_reviews > 0 
        ? (parseInt(stats.recommendations) / parseInt(stats.total_reviews)) * 100 
        : 0
    };
  }
}
