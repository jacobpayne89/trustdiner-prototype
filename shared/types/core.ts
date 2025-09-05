/**
 * CORE DATABASE-ALIGNED TYPES
 * 
 * These types strictly match the actual database schema (ground truth).
 * They replace the legacy types that had accumulated inconsistencies.
 * 
 * Database Tables:
 * - content.allergen_review
 * - restaurant.venue  
 * - restaurant.chain
 * - user.account
 */

import { CanonicalAllergen } from '../constants/allergens';

// =============================================================================
// REVIEW TYPES (content.allergen_review table)
// =============================================================================

/**
 * Core Review interface - matches NEW database schema exactly
 * Table: reviews.reviews
 */
export interface Review {
  // Primary fields (dual-key pattern)
  id: number;
  uuid: string;
  user_id: number; // FK to users.accounts.id
  venue_id: number; // FK to venues.venues.id
  
  // Review content
  overall_rating: number | null; // 1-5 scale
  comment: string | null;
  visit_date: string | null; // ISO date
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Review with populated establishment and user data
 * Used for display purposes (joins with establishments and users tables)
 */
export interface ReviewWithDetails extends Review {
  // Establishment details
  establishment: {
    name: string;
    address: string | null;
    uuid: string;
    primary_image_ref: string | null;
  };
  
  // User details
  user: {
    display_name: string | null;
    avatar_url: string | null;
  };
  
  // Chain details (if applicable)
  chain?: {
    name: string;
    logo_url: string | null;
  };
  
  // Allergen scores (from separate table)
  allergen_scores?: Record<string, number>;
}

/**
 * Review creation payload (what frontend sends)
 */
export interface ReviewCreateInput {
  user_id: number;
  venue_id: number; // FK to venues.venues.id
  
  overall_rating?: number; // 1-5 scale
  comment?: string;
  visit_date?: string; // ISO date
  
  // Allergen scores (stored in separate table)
  allergen_scores?: Record<string, number>; // allergen_code -> score (0-5)
}

/**
 * Review update payload (partial updates)
 */
export interface ReviewUpdateInput extends Partial<Omit<ReviewCreateInput, 'user_id' | 'venue_id'>> {}

// =============================================================================
// ESTABLISHMENT TYPES (public.establishments table)
// =============================================================================

/**
 * Core Establishment interface - matches NEW database schema exactly
 * Table: venues.venues (via public.establishments view)
 */
export interface Establishment {
  // Primary fields (dual-key pattern)
  id: number;
  uuid: string;
  name: string;
  
  // Location
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Venue details
  phone: string | null;
  website: string | null;
  business_status: string | null;
  primary_category: string | null;
  cuisine: string | null;
  price_level: number | null;
  
  // Chain relationship
  chain_id: number | null;
  
  // Media (photo_reference based)
  primary_image_ref: string | null; // Google Photos reference
  image_attribution: string | null; // HTML attribution string
  local_image_url?: string | null; // Compatibility - mapped from primary_image_ref
  
  // Metadata
  tags: string[] | null;
  source_last_seen_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Establishment with aggregated review data
 * Used for display with calculated review statistics
 */
export interface EstablishmentWithStats extends Establishment {
  // Review statistics (calculated from reviews.reviews)
  review_count: number;
  avg_review_rating: number | null;
  
  // Allergen score averages (calculated from reviews.review_allergen_scores)
  avg_gluten_score: number | null;
  avg_milk_score: number | null;
  avg_eggs_score: number | null;
  avg_fish_score: number | null;
  avg_crustaceans_score: number | null;
  avg_tree_nuts_score: number | null;
  avg_peanuts_score: number | null;
  avg_soybeans_score: number | null;
  avg_sesame_score: number | null;
  avg_celery_score: number | null;
  avg_mustard_score: number | null;
  avg_lupin_score: number | null;
  avg_molluscs_score: number | null;
  avg_sulfites_score: number | null;
  
  // Chain information (if applicable)
  chain_name?: string | null;
  chain_logo_url?: string | null;
  chain_featured_image_path?: string | null;
  
  // Compatibility fields for frontend (derived from individual scores)
  avg_allergen_scores?: Record<string, number> | null; // Computed from individual scores
  chain?: {
    name: string;
    logo_url: string | null;
    featured_image_path: string | null;
  } | null; // Computed from chain_* fields
  
  // Legacy compatibility
  place_id?: string | null; // Always null in new schema
  rating?: number | null; // Maps to avg_review_rating
  user_ratings_total?: number; // Maps to review_count
  types?: string[]; // Maps to [primary_category]
}

/**
 * Establishment creation payload (for Google Places import)
 */
export interface EstablishmentCreateInput {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  business_status?: string;
  primary_category?: string;
  cuisine?: string;
  price_level?: number;
  chain_id?: number;
  primary_image_ref?: string; // Google Photos reference
  image_attribution?: string; // HTML attribution
  tags?: string[];
}

// =============================================================================
// EXTERNAL PLACES TYPES (venues.external_places table)
// =============================================================================

/**
 * External Places interface - for Google Places integration
 * Table: venues.external_places
 */
export interface ExternalPlace {
  // Primary fields (dual-key pattern)
  id: number;
  uuid: string;
  venue_id: number; // FK to venues.venues.id
  
  // Provider data
  provider: string; // 'google', 'yelp', etc.
  provider_id: string; // place_id from Google
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * External Place creation payload
 */
export interface ExternalPlaceCreateInput {
  venue_id: number;
  provider: string;
  provider_id: string;
}

// =============================================================================
// ALLERGEN TYPES (allergens table)
// =============================================================================

/**
 * Allergen interface
 * Table: allergens
 */
export interface Allergen {
  // Primary fields (dual-key pattern)
  id: number;
  uuid: string;
  code: string; // 'gluten', 'milk', etc.
  name: string; // 'Gluten', 'Milk', etc.
  description: string | null;
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Review Allergen Score interface
 * Table: reviews.review_allergen_scores
 */
export interface ReviewAllergenScore {
  // Primary fields (dual-key pattern)
  id: number;
  uuid: string;
  review_id: number; // FK to reviews.reviews.id
  allergen_id: number; // FK to allergens.id
  
  // Score data
  score: number; // 0-5 scale
  confidence: number; // 1-5 scale
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// =============================================================================
// USER TYPES (users.accounts table)
// =============================================================================

/**
 * Core User interface - matches NEW database schema exactly
 * Table: users.accounts
 */
export interface User {
  // Primary fields (dual-key pattern)
  id: number;
  uuid: string;
  email: string;
  
  // Profile
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  
  // User data
  avatar_url: string | null;
  password_hash: string | null; // Server-side only
  email_verified: boolean;
  
  // Status
  is_active: boolean;
  last_login: string | null; // ISO timestamp
  deleted_at: string | null; // ISO timestamp
  deleted_by: number | null; // FK to users.accounts.id
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  
  // Compatibility fields for frontend
  allergies?: Array<{id: string | number; name: string; severity?: string}> | null; // Updated allergen structure
  userType?: string; // User role name (from users.user_roles join)
}

/**
 * User profile update payload
 */
export interface UserUpdateInput {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

// =============================================================================
// CHAIN TYPES (restaurant.chain table)
// =============================================================================

/**
 * Core Chain interface - matches NEW database schema exactly
 * Table: venues.chains
 */
export interface Chain {
  // Primary fields (dual-key pattern)
  id: number;
  uuid: string;
  name: string;
  slug: string;
  
  // Content
  description: string | null;
  category: string | null;
  
  // Media
  logo_url: string | null;
  local_logo_path: string | null;
  featured_image_path: string | null;
  
  // External
  website_url: string | null;
  
  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Chain with statistics
 */
export interface ChainWithStats extends Chain {
  location_count: number;
  avg_rating: number | null;
  sample_image: string | null;
  allergen_scores: Record<string, number> | null;
}

/**
 * Chain creation payload
 */
export interface ChainCreateInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  logo_url?: string;
  local_logo_path?: string;
  featured_image_path?: string;
  website_url?: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp?: string;
  };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    timestamp: string;
  };
}

// =============================================================================
// LEGACY TYPE DEPRECATION MARKERS
// =============================================================================

/**
 * @deprecated Use Review instead
 * Legacy type from shared/types/database.ts
 */
export interface LegacyReview {
  // Marked for removal - use Review instead
}

/**
 * @deprecated Use Establishment instead  
 * Legacy type from frontend/src/types/Place.ts
 */
export interface LegacyPlace {
  // Marked for removal - use Establishment instead
}

/**
 * @deprecated Use ReviewWithDetails instead
 * Legacy type from frontend/src/types/Review.ts
 */
export interface LegacyEnrichedReview {
  // Marked for removal - use ReviewWithDetails instead
}
