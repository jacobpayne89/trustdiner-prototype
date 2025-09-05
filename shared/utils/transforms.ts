/**
 * Database ↔ API Transform Utilities
 * 
 * Handles conversion between snake_case database fields and camelCase API fields
 * Ensures consistent data transformation across the entire application
 */

import type { 
  Establishment as DbEstablishment,
  EstablishmentWithStats as DbEstablishmentWithStats,
  User as DbUser,
  Review as DbReview,
  ReviewWithDetails as DbReviewWithDetails,
  Chain as DbChain,
  ChainWithStats as DbChainWithStats
} from '../types/core';

// =============================================================================
// ESTABLISHMENT TRANSFORMS
// =============================================================================

/**
 * Transform database establishment row to API format
 */
export function transformEstablishmentFromDb(dbRow: any): DbEstablishment {
  return {
    id: dbRow.id,
    uuid: dbRow.uuid,
    name: dbRow.name,
    address: dbRow.address,
    latitude: dbRow.latitude ? Number(dbRow.latitude) : null,
    longitude: dbRow.longitude ? Number(dbRow.longitude) : null,
    phone: dbRow.phone,
    website: dbRow.website,
    business_status: dbRow.business_status,
    primary_category: dbRow.primary_category,
    cuisine: dbRow.cuisine,
    price_level: dbRow.price_level,
    chain_id: dbRow.chain_id,
    primary_image_ref: dbRow.primary_image_ref,
    image_attribution: dbRow.image_attribution,
    local_image_url: dbRow.local_image_url, // Compatibility mapping
    tags: dbRow.tags,
    source_last_seen_at: dbRow.source_last_seen_at,
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at
  };
}

/**
 * Transform database establishment with stats to API format
 */
export function transformEstablishmentWithStatsFromDb(dbRow: any): DbEstablishmentWithStats {
  const base = transformEstablishmentFromDb(dbRow);
  return {
    ...base,
    review_count: Number(dbRow.review_count || 0),
    avg_review_rating: dbRow.avg_review_rating ? Number(dbRow.avg_review_rating) : null,
    // Individual allergen scores from new schema
    avg_gluten_score: dbRow.avg_gluten_score ? Number(dbRow.avg_gluten_score) : null,
    avg_milk_score: dbRow.avg_milk_score ? Number(dbRow.avg_milk_score) : null,
    avg_eggs_score: dbRow.avg_eggs_score ? Number(dbRow.avg_eggs_score) : null,
    avg_fish_score: dbRow.avg_fish_score ? Number(dbRow.avg_fish_score) : null,
    avg_crustaceans_score: dbRow.avg_crustaceans_score ? Number(dbRow.avg_crustaceans_score) : null,
    avg_tree_nuts_score: dbRow.avg_tree_nuts_score ? Number(dbRow.avg_tree_nuts_score) : null,
    avg_peanuts_score: dbRow.avg_peanuts_score ? Number(dbRow.avg_peanuts_score) : null,
    avg_soybeans_score: dbRow.avg_soybeans_score ? Number(dbRow.avg_soybeans_score) : null,
    avg_sesame_score: dbRow.avg_sesame_score ? Number(dbRow.avg_sesame_score) : null,
    avg_celery_score: dbRow.avg_celery_score ? Number(dbRow.avg_celery_score) : null,
    avg_mustard_score: dbRow.avg_mustard_score ? Number(dbRow.avg_mustard_score) : null,
    avg_lupin_score: dbRow.avg_lupin_score ? Number(dbRow.avg_lupin_score) : null,
    avg_molluscs_score: dbRow.avg_molluscs_score ? Number(dbRow.avg_molluscs_score) : null,
    avg_sulfites_score: dbRow.avg_sulfites_score ? Number(dbRow.avg_sulfites_score) : null,
    // Chain info from new schema
    chain_name: dbRow.chain_name,
    chain_logo_url: dbRow.chain_logo_url,
    chain_featured_image_path: dbRow.chain_featured_image_path
  };
}

/**
 * Transform API establishment input to database format
 */
export function transformEstablishmentToDb(apiData: any) {
  return {
    name: apiData.name,
    place_id: apiData.placeId || apiData.place_id,
    address: apiData.address,
    latitude: apiData.latitude || apiData.position?.lat,
    longitude: apiData.longitude || apiData.position?.lng,
    rating: apiData.rating,
    user_ratings_total: apiData.userRatingsTotal || apiData.user_ratings_total,
    price_level: apiData.priceLevel || apiData.price_level,
    business_status: apiData.businessStatus || apiData.business_status,
    types: apiData.types,
    phone: apiData.phone,
    website: apiData.website,
    chain_id: apiData.chainId || apiData.chain_id,
    local_image_url: apiData.localImageUrl || apiData.local_image_url,
    tags: apiData.tags
  };
}

// =============================================================================
// USER TRANSFORMS
// =============================================================================

/**
 * Transform database user row to API format
 */
export function transformUserFromDb(dbRow: any): DbUser {
  return {
    id: dbRow.id,
    uuid: dbRow.uuid,
    email: dbRow.email,
    display_name: dbRow.display_name,
    first_name: dbRow.first_name,
    last_name: dbRow.last_name,
    password_hash: dbRow.password_hash,
    email_verified: dbRow.email_verified,
    avatar_url: dbRow.avatar_url,
    is_active: dbRow.is_active,
    last_login: dbRow.last_login,
    deleted_at: dbRow.deleted_at,
    deleted_by: dbRow.deleted_by,
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at
  };
}

/**
 * Transform API user input to database format
 */
export function transformUserToDb(apiData: any) {
  return {
    // firebase_uid: apiData.firebaseUid || apiData.firebase_uid, // Removed - legacy field
    email: apiData.email,
    display_name: apiData.displayName || apiData.display_name,
    first_name: apiData.firstName || apiData.first_name,
    last_name: apiData.lastName || apiData.last_name,
    user_type: apiData.userType || apiData.user_type,
    allergies: apiData.allergies,
    avatar_url: apiData.avatarUrl || apiData.avatar_url
  };
}

// =============================================================================
// REVIEW TRANSFORMS
// =============================================================================

/**
 * Transform database review row to API format
 */
export function transformReviewFromDb(dbRow: any): DbReview {
  return {
    id: dbRow.id,
    uuid: dbRow.uuid,
    user_id: dbRow.user_id,
    venue_id: dbRow.venue_id,
    overall_rating: dbRow.overall_rating,
    comment: dbRow.comment,
    visit_date: dbRow.visit_date,
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at
  };
}

/**
 * Transform database review with details to API format
 */
export function transformReviewWithDetailsFromDb(dbRow: any): DbReviewWithDetails {
  const base = transformReviewFromDb(dbRow);
  return {
    ...base,
    establishment: {
      name: dbRow.establishment_name,
      address: dbRow.establishment_address,
      uuid: dbRow.establishment_uuid,
      primary_image_ref: dbRow.establishment_primary_image_ref
    },
    user: {
      display_name: dbRow.user_display_name,
      avatar_url: dbRow.user_avatar_url
    },
    chain: dbRow.chain_name ? {
      name: dbRow.chain_name,
      logo_url: dbRow.chain_logo_url
    } : undefined,
    allergen_scores: dbRow.allergen_scores // From separate table
  };
}

/**
 * Transform API review input to database format
 */
export function transformReviewToDb(apiData: any) {
  return {
    user_id: apiData.userId || apiData.user_id,
    venue_id: apiData.venueId || apiData.venue_id,
    allergen_scores: apiData.allergenScores || apiData.allergen_scores,
    general_comment: apiData.generalComment || apiData.general_comment || apiData.comment,
    yes_no_answers: apiData.yesNoAnswers || apiData.yes_no_answers,
    overall_rating: apiData.overallRating || apiData.overall_rating || apiData.rating,
    would_recommend: apiData.wouldRecommend || apiData.would_recommend,
    staff_knowledge_rating: apiData.staffKnowledgeRating || apiData.staff_knowledge_rating,
    separate_preparation_area: apiData.separatePreparationArea || apiData.separate_preparation_area,
    staff_allergy_trained: apiData.staffAllergyTrained || apiData.staff_allergy_trained,
    cross_contamination_safety: apiData.crossContaminationSafety || apiData.cross_contamination_safety,
    place_id: apiData.placeId || apiData.place_id
  };
}

// =============================================================================
// CHAIN TRANSFORMS
// =============================================================================

/**
 * Transform database chain row to API format
 */
export function transformChainFromDb(dbRow: any): DbChain {
  return {
    id: dbRow.id,
    uuid: dbRow.uuid,
    name: dbRow.name,
    slug: dbRow.slug,
    description: dbRow.description,
    category: dbRow.category,
    logo_url: dbRow.logo_url,
    local_logo_path: dbRow.local_logo_path,
    featured_image_path: dbRow.featured_image_path,
    website_url: dbRow.website_url,
    created_at: dbRow.created_at,
    updated_at: dbRow.updated_at
  };
}

/**
 * Transform database chain with stats to API format
 */
export function transformChainWithStatsFromDb(dbRow: any): DbChainWithStats {
  const base = transformChainFromDb(dbRow);
  return {
    ...base,
    location_count: Number(dbRow.location_count || 0),
    avg_rating: dbRow.avg_rating ? Number(dbRow.avg_rating) : null,
    sample_image: dbRow.sample_image,
    allergen_scores: dbRow.allergen_scores
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert snake_case object keys to camelCase
 */
export function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = snakeToCamel(value);
  }
  return result;
}

/**
 * Convert camelCase object keys to snake_case
 */
export function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = camelToSnake(value);
  }
  return result;
}

/**
 * Ensure numeric fields are properly typed
 */
export function ensureNumericTypes(obj: any, numericFields: string[]): any {
  const result = { ...obj };
  for (const field of numericFields) {
    if (result[field] !== null && result[field] !== undefined) {
      result[field] = Number(result[field]);
    }
  }
  return result;
}

/**
 * Clean undefined values from object
 */
export function cleanUndefined(obj: any): any {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
