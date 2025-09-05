import { z } from 'zod';

/**
 * Zod schemas for runtime type validation
 * These schemas validate API responses to ensure data integrity
 */

// Base schemas for common structures
export const PlacePositionSchema = z.object({
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
}).nullable().optional();

export const AllergenRatingSchema = z.object({
  rating: z.number(),
  count: z.number(),
});

export const PhotoSchema = z.union([
  z.string(),
  z.object({
    url: z.string(),
    type: z.string().optional(),
    source: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
]);

// Place/Establishment schema - made more lenient for real-world data
export const PlaceSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  uuid: z.string().optional(),
  databaseId: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
    return undefined;
  }),
  name: z.string(),
  position: PlacePositionSchema.nullable().optional(),
  // Alternative coordinate properties for compatibility
  latitude: z.union([z.number(), z.string()]).nullable().optional(),
  longitude: z.union([z.number(), z.string()]).nullable().optional(),
  allergenRatings: z.record(z.string(), AllergenRatingSchema).nullable().optional().default({}),
  placeDetails: z.object({
    address: z.string().optional(),
    categories: z.array(z.string()).nullable().optional(),
    images: z.array(z.string()).nullable().optional(),
  }).optional(),
  placeId: z.string().optional(),
  place_id: z.string().nullable().optional(), // Snake case compatibility
  address: z.string().optional(),
  categories: z.array(z.string()).nullable().optional(),
  rating: z.union([z.number(), z.string()]).nullable().optional(),
  userRatingsTotal: z.union([z.number(), z.string()]).optional(),
  user_ratings_total: z.union([z.number(), z.string()]).nullable().optional(), // Snake case compatibility
  priceLevel: z.number().optional(),
  price_level: z.number().nullable().optional(), // Snake case compatibility
  businessStatus: z.string().nullable().optional(),
  business_status: z.string().nullable().optional(), // Snake case compatibility
  types: z.array(z.string()).nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  chain_id: z.union([z.number(), z.string()]).nullable().optional().transform((val) => {
    if (val === '' || val === undefined || val === null) return null;
    if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
    return typeof val === 'number' ? val : null;
  }),
  chain_name: z.string().nullable().optional(),
  chain_logo_url: z.string().nullable().optional(),
  local_image_url: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  review_count: z.union([z.number(), z.string()]).optional(),
  avg_review_rating: z.union([z.number(), z.string()]).nullable().optional(),
  avgReviewRating: z.union([z.number(), z.string()]).nullable().optional(),
  detailedTypes: z.array(z.string()).nullable().optional(),
  cuisineTypes: z.array(z.string()).nullable().optional(),
  primaryCategory: z.string().optional(),
  cuisine: z.string().nullable().optional(),
  hasReviews: z.boolean().optional(),
  photoCount: z.number().optional(),
  photos: z.array(PhotoSchema).nullable().optional(),
  localImageUrl: z.string().nullable().optional(),
  s3ImageUrl: z.string().optional(),
  s3_image_url: z.string().optional(), // Snake case compatibility
  // Chain information
  chainId: z.union([z.number(), z.string()]).nullable().optional().transform((val) => {
    if (val === '' || val === undefined || val === null) return null;
    if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
    return typeof val === 'number' ? val : null;
  }),
  chainName: z.string().nullable().optional(),
  chainSlug: z.string().nullable().optional(),
  chainLogoUrl: z.string().nullable().optional(),
  chainFeaturedImageUrl: z.string().nullable().optional(),
  chainCategory: z.string().nullable().optional(),
  // Review information
  reviewCount: z.number().optional(),
  chainReviewCount: z.number().optional(),
  locationReviewCount: z.number().optional(),
  averageAllergenScores: z.record(z.string(), z.number()).nullable().optional().default({}),
  allergyHandlingStats: z.object({
    staffTrained: z.object({
      yes: z.number(),
      total: z.number(),
    }),
    separatePrep: z.object({
      yes: z.number(),
      total: z.number(),
    }),
    wouldRecommend: z.object({
      yes: z.number(),
      total: z.number(),
    }),
  }).optional(),
  // Compatibility fields
  inDatabase: z.boolean().optional(),
  addable: z.boolean().optional(),
  source: z.enum(['database', 'google', 'cache']).optional(),
}).transform((data, ctx) => {
  // Get the original id value before it was transformed to string
  const originalId = data.id;
  
  // Populate databaseId from original numeric id if databaseId is not set
  if (!data.databaseId && typeof originalId === 'number') {
    data.databaseId = originalId;
  } else if (!data.databaseId && typeof originalId === 'string' && !isNaN(Number(originalId))) {
    data.databaseId = Number(originalId);
  }
  
  // Map snake_case image fields to camelCase for frontend compatibility
  if (!data.localImageUrl && data.local_image_url) {
    data.localImageUrl = data.local_image_url;
  }
  if (!data.s3ImageUrl && data.s3_image_url) {
    data.s3ImageUrl = data.s3_image_url;
  }
  
  return data;
});

// Review schema
export const ReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  user_id: z.string().optional(), // Snake case compatibility
  placeId: z.string(),
  place_id: z.string().nullable().optional(), // Snake case compatibility
  allergenScores: z.record(z.string(), z.number()),
  allergen_scores: z.record(z.string(), z.number()).optional(), // Snake case compatibility
  comment: z.string(),
  yesNoAnswers: z.record(z.string(), z.boolean()).optional(),
  staff_allergy_trained: z.boolean().optional(),
  separate_preparation_area: z.boolean().optional(),
  would_recommend: z.boolean().optional(),
  createdAt: z.union([z.string(), z.date()]),
  created_at: z.union([z.string(), z.date()]).optional(), // Snake case compatibility
  updatedAt: z.union([z.string(), z.date()]).optional(),
  updated_at: z.union([z.string(), z.date()]).optional(), // Snake case compatibility
  placeName: z.string().optional(),
  place_name: z.string().optional(), // Snake case compatibility
  placeAddress: z.string().optional(),
  place_address: z.string().optional(), // Snake case compatibility
  establishment: z.object({
    name: z.string(),
    address: z.string().optional(),
  }).optional(),
});

// Enriched review schema (includes place information)
export const EnrichedReviewSchema = ReviewSchema.extend({
  placeName: z.string(),
  placeAddress: z.string(),
});

// User schema
export const UserSchema = z.object({
  id: z.union([z.string(), z.number()]),
  uid: z.string().optional(), // For backward compatibility
  email: z.string().email(),
  displayName: z.string(),
  display_name: z.string().optional(), // Snake case compatibility
  firstName: z.string().optional(),
  first_name: z.string().optional(), // Snake case compatibility
  lastName: z.string().optional(),
  last_name: z.string().optional(), // Snake case compatibility
  userType: z.string().optional(),
  user_type: z.string().optional(), // Snake case compatibility
  allergies: z.array(z.string()),
  profileImage: z.string().optional(),
  profile_image: z.string().optional(), // Snake case compatibility
  avatarUrl: z.string().optional(),
  avatar_url: z.string().optional(), // Snake case compatibility
  createdAt: z.union([z.string(), z.date()]).optional(),
  created_at: z.union([z.string(), z.date()]).optional(), // Snake case compatibility
  updatedAt: z.union([z.string(), z.date()]).optional(),
  updated_at: z.union([z.string(), z.date()]).optional(), // Snake case compatibility
});

// API Response schemas
export const EstablishmentsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  establishments: z.array(PlaceSchema).optional(),
  data: z.array(PlaceSchema).optional(), // Alternative response format
  total: z.number().optional(),
  cached: z.boolean().optional(),
  timestamp: z.string().optional(),
  meta: z.object({
    timestamp: z.string().optional(),
    path: z.string().optional(),
    method: z.string().optional(),
    version: z.string().optional(),
    processingTime: z.number().optional(),
    cached: z.boolean().optional(),
    total: z.number().optional(),
  }).optional(),
});

export const ReviewsResponseSchema = z.object({
  success: z.boolean().optional(),
  reviews: z.array(ReviewSchema).optional(),
  data: z.array(ReviewSchema).optional(), // Alternative response format
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const ProfileResponseSchema = z.object({
  success: z.boolean().optional(),
  user: UserSchema.optional(),
  data: UserSchema.optional(), // Alternative response format
});

// Chain schema for admin endpoints
export const ChainSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  local_logo_path: z.string().optional(),
  featured_image_path: z.string().optional(),
  website_url: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).nullable().optional(),
  location_count: z.number().optional(),
  avg_rating: z.number().optional(),
  sample_image: z.string().optional(),
  allergen_scores: z.record(z.string(), z.number()).optional(),
  created_at: z.union([z.string(), z.date()]).optional(),
  updated_at: z.union([z.string(), z.date()]).optional(),
});

export const ChainsResponseSchema = z.array(ChainSchema);

// Dashboard data schema
export const DashboardDataSchema = z.object({
  totalEstablishments: z.number(),
  totalReviews: z.number(),
  totalUsers: z.number(),
  recentReviews: z.array(ReviewSchema),
  topAllergens: z.array(z.object({
    allergen: z.string(),
    count: z.number(),
  })),
});

// Google API Usage schema
export const GoogleAPIUsageSchema = z.object({
  date: z.string(),
  requests: z.number(),
  cost: z.number(),
  endpoint: z.string().optional(),
});

// Generic API Error schema
export const APIErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.string().optional(),
});

// Type inference from schemas
export type PlaceValidated = z.infer<typeof PlaceSchema>;
export type ReviewValidated = z.infer<typeof ReviewSchema>;
export type EnrichedReviewValidated = z.infer<typeof EnrichedReviewSchema>;
export type UserValidated = z.infer<typeof UserSchema>;
export type ChainValidated = z.infer<typeof ChainSchema>;
export type EstablishmentsResponseValidated = z.infer<typeof EstablishmentsResponseSchema>;
export type ReviewsResponseValidated = z.infer<typeof ReviewsResponseSchema>;
export type ProfileResponseValidated = z.infer<typeof ProfileResponseSchema>;
export type ChainsResponseValidated = z.infer<typeof ChainsResponseSchema>;
export type DashboardDataValidated = z.infer<typeof DashboardDataSchema>;
export type GoogleAPIUsageValidated = z.infer<typeof GoogleAPIUsageSchema>;
export type APIErrorValidated = z.infer<typeof APIErrorSchema>;

// Validation helper functions
export function validateEstablishments(data: unknown): PlaceValidated[] {
  try {
    const result = EstablishmentsResponseSchema.parse(data);
    return result.establishments || result.data || [];
  } catch (error) {
    console.warn('🚨 Establishments validation failed:', error);
    // Return empty array as fallback
    return [];
  }
}

export function validateReviews(data: unknown): ReviewValidated[] {
  try {
    const result = ReviewsResponseSchema.parse(data);
    return result.reviews || result.data || [];
  } catch (error) {
    console.warn('🚨 Reviews validation failed:', error);
    // Return empty array as fallback
    return [];
  }
}

export function validateUser(data: unknown): UserValidated | null {
  try {
    const result = ProfileResponseSchema.parse(data);
    return result.user || result.data || null;
  } catch (error) {
    console.warn('🚨 User profile validation failed:', error);
    // Return null as fallback
    return null;
  }
}

export function validateChains(data: unknown): ChainValidated[] {
  try {
    return ChainsResponseSchema.parse(data);
  } catch (error) {
    console.warn('🚨 Chains validation failed:', error);
    // Return empty array as fallback
    return [];
  }
}

export function validateDashboardData(data: unknown): DashboardDataValidated | null {
  try {
    return DashboardDataSchema.parse(data);
  } catch (error) {
    console.warn('🚨 Dashboard data validation failed:', error);
    return null;
  }
}
