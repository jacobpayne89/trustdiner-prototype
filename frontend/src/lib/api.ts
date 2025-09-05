// Secure API client functions for communicating with the backend
import TokenManager from './auth-token';
import { z } from 'zod';
import { ALLERGENS } from '@/types';
import {
  validateEstablishments,
  validateReviews,
  validateUser,
  validateChains,
  validateDashboardData,
  EstablishmentsResponseSchema,
  ReviewsResponseSchema,
  ProfileResponseSchema,
  ChainsResponseSchema,
  DashboardDataSchema,
  APIErrorSchema,
  type PlaceValidated,
  type ReviewValidated,
  type UserValidated,
  type ChainValidated,
  type DashboardDataValidated,
} from '@/types/zod-schemas';

// Environment-aware base URLs
// - Development: use Next.js proxy (relative URLs)
// - Production: use public API domain injected at build time
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? `${process.env.NEXT_PUBLIC_API_URL}`.replace(/\/$/, '') + '/api'
  : '/api'; // Use Next.js proxy in development

const BACKEND_BASE_URL = process.env.NODE_ENV === 'production'
  ? `${process.env.NEXT_PUBLIC_API_URL || ''}`.replace(/\/$/, '')
  : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}`.replace(/\/$/, '');

// =============================================================================
// FIELD TRANSFORMATION LAYER
// =============================================================================

/**
 * Transform API response (snake_case) to Frontend (camelCase)
 */
function transformReviewFromAPI(apiReview: any): any {
  if (!apiReview) return apiReview;
  
  return {
    id: apiReview.id,
    userId: apiReview.user_id,
    establishmentId: apiReview.venue_id,
    placeId: apiReview.place_id,
    allergenScores: apiReview.allergen_scores,
    generalComment: apiReview.general_comment,
    yesNoAnswers: apiReview.yes_no_answers,
    overallRating: apiReview.overall_rating,
    wouldRecommend: apiReview.would_recommend,
    staffKnowledgeRating: apiReview.staff_knowledge_rating,
    separatePreparationArea: apiReview.separate_preparation_area,
    staffAllergyTrained: apiReview.staff_allergy_trained,
    crossContaminationSafety: apiReview.cross_contamination_safety,
    createdAt: apiReview.created_at,
    updatedAt: apiReview.updated_at,
    // Preserve any other fields as-is
    ...Object.fromEntries(
      Object.entries(apiReview).filter(([key]) => 
        !['user_id', 'venue_id', 'place_id', 'allergen_scores', 'general_comment', 
          'yes_no_answers', 'overall_rating', 'would_recommend', 'staff_knowledge_rating',
          'separate_preparation_area', 'staff_allergy_trained', 'cross_contamination_safety',
          'created_at', 'updated_at'].includes(key)
      )
    )
  };
}

/**
 * Transform Frontend (camelCase) to API request (snake_case)
 */
function transformReviewToAPI(frontendReview: any): any {
  if (!frontendReview) return frontendReview;
  
  return {
    user_id: frontendReview.userId,
    venue_id: frontendReview.establishmentId,
    place_id: frontendReview.placeId,
    allergen_scores: frontendReview.allergenScores,
    general_comment: frontendReview.generalComment,
    yes_no_answers: frontendReview.yesNoAnswers,
    overall_rating: frontendReview.overallRating,
    would_recommend: frontendReview.wouldRecommend,
    staff_knowledge_rating: frontendReview.staffKnowledgeRating,
    separate_preparation_area: frontendReview.separatePreparationArea,
    staff_allergy_trained: frontendReview.staffAllergyTrained,
    cross_contamination_safety: frontendReview.crossContaminationSafety,
    // Preserve any other fields as-is
    ...Object.fromEntries(
      Object.entries(frontendReview).filter(([key]) => 
        !['userId', 'establishmentId', 'placeId', 'allergenScores', 'generalComment',
          'yesNoAnswers', 'overallRating', 'wouldRecommend', 'staffKnowledgeRating',
          'separatePreparationArea', 'staffAllergyTrained', 'crossContaminationSafety'].includes(key)
      )
    )
  };
}

/**
 * Transform establishment data from API (snake_case) to Frontend (camelCase)
 */
function transformEstablishmentFromAPI(apiEstablishment: any): any {
  if (!apiEstablishment) return apiEstablishment;
  
  console.log(`🔄 Transforming establishment: ${apiEstablishment.name}`);
  
  // Debug chain data transformation
  if (apiEstablishment.chain_id) {
    console.log(`🔗 Transforming chain data for ${apiEstablishment.name}:`, {
      chain_id: apiEstablishment.chain_id,
      chain_name: apiEstablishment.chain_name,
      chain_logo_url: apiEstablishment.chain_logo_url,
      chain_featured_image_path: apiEstablishment.chain_featured_image_path
    });
  }
  
  return {
    id: apiEstablishment.id,
    placeId: apiEstablishment.place_id,
    name: apiEstablishment.name,
    address: apiEstablishment.address,
    latitude: apiEstablishment.latitude,
    longitude: apiEstablishment.longitude,
    rating: apiEstablishment.rating,
    userRatingsTotal: apiEstablishment.user_ratings_total,
    priceLevel: apiEstablishment.price_level,
    businessStatus: apiEstablishment.business_status,
    avgAllergenScores: apiEstablishment.avg_allergen_scores,
    reviewCount: apiEstablishment.review_count,
    chainId: apiEstablishment.chain_id,
    chainName: apiEstablishment.chain_name,
    chainLogoUrl: apiEstablishment.chain_logo_url ? 
      (apiEstablishment.chain_logo_url.startsWith('http') ? apiEstablishment.chain_logo_url : `${BACKEND_BASE_URL}${apiEstablishment.chain_logo_url}`) : null,
    // Create chain object for useEstablishmentCard hook compatibility
    chain: apiEstablishment.chain_id ? {
      name: apiEstablishment.chain_name,
      logo_url: apiEstablishment.chain_logo_url ? 
        (apiEstablishment.chain_logo_url.startsWith('http') ? apiEstablishment.chain_logo_url : `${BACKEND_BASE_URL}${apiEstablishment.chain_logo_url}`) : null,
      featured_image_path: apiEstablishment.chain_featured_image_path ? 
        (apiEstablishment.chain_featured_image_path.startsWith('http') ? apiEstablishment.chain_featured_image_path : `${BACKEND_BASE_URL}${apiEstablishment.chain_featured_image_path}`) : null
    } : null,
    // Use the processed imageUrl from backend (S3 preferred, local fallback, placeholder if none)
    imageUrl: apiEstablishment.imageUrl || null,
    localImageUrl: apiEstablishment.local_image_url ? 
      (apiEstablishment.local_image_url.startsWith('http') ? apiEstablishment.local_image_url : `${BACKEND_BASE_URL}${apiEstablishment.local_image_url}`) : null,
    s3ImageUrl: apiEstablishment.s3_image_url,
    // Preserve any other fields as-is
    ...Object.fromEntries(
      Object.entries(apiEstablishment).filter(([key]) => 
        !['place_id', 'user_ratings_total', 'price_level', 'business_status',
          'avg_allergen_scores', 'review_count', 'chain_id', 'chain_name',
          'chain_logo_url', 'local_image_url', 's3_image_url', 'imageUrl'].includes(key)
      )
    )
  };
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Validation options for API requests
interface ValidationOptions<T> {
  schema?: z.ZodSchema<T>;
  fallback?: T;
  skipValidation?: boolean;
}

// Secure API request with automatic authentication and optional validation
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  validationOptions?: ValidationOptions<T>
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get authentication token
  const token = TokenManager.getTokenForEnvironment();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      // Add authentication header if token exists
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        TokenManager.clearTokens();
        // In development, this might be expected; in production, redirect to login
        if (process.env.NODE_ENV === 'production') {
          window.location.href = '/login';
        }
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(response.status, errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Apply validation if schema is provided and validation is not skipped
    if (validationOptions?.schema && !validationOptions.skipValidation) {
      try {
        console.log(`🔍 Validating API response for ${endpoint}:`, {
          dataType: typeof data,
          isArray: Array.isArray(data),
          keys: data && typeof data === 'object' ? Object.keys(data) : 'N/A',
          dataLength: Array.isArray(data) ? data.length : (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) ? data.data.length : 'N/A'
        });
        const validatedData = validationOptions.schema.parse(data);
        console.log(`✅ Validation successful for ${endpoint}`);
        return validatedData;
      } catch (validationError) {
        console.error(`🚨 API Response validation failed for ${endpoint}:`, validationError);
        console.error(`📊 Raw data that failed validation:`, data);
        console.error(`🔍 Validation error details:`, validationError.errors || validationError.issues || validationError);
        
        // Always return original data with warning when validation fails
        console.warn(`⚠️ Validation failed, proceeding with unvalidated data for ${endpoint}`);
        console.warn(`📊 Returning original data with ${Array.isArray(data?.data) ? data.data.length : 'unknown'} items`);
        return data;
      }
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error');
  }
}

// Validated API request wrapper for common endpoints
async function validatedApiRequest<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest(endpoint, options, { schema });
}

// API endpoints with validation
export const api = {
  // Establishments - with validation
  async getEstablishments(options: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
    allergenSafe?: string[];
    minRating?: number;
  } = {}): Promise<PlaceValidated[]> {
    const { search, limit = 2548, offset = 0, sortBy = 'name', sortOrder = 'ASC', allergenSafe, minRating } = options;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (allergenSafe && allergenSafe.length > 0) params.append('allergenSafe', allergenSafe.join(','));
    if (minRating) params.append('minRating', minRating.toString());
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    
    const queryString = params.toString();
    console.log('🔍 Loading establishments with proper validation and pagination...');
    
    const response = await validatedApiRequest(
      `/establishments${queryString ? `?${queryString}` : ''}`,
      EstablishmentsResponseSchema
    );
    
    console.log('✅ Establishments loaded and validated:', {
      fromEstablishments: response.establishments?.length || 0,
      fromData: response.data?.length || 0,
      total: (response.establishments || response.data || []).length
    });
    
    // Transform API response to canonical EstablishmentWithStats format
    const establishments = response.establishments || response.data || [];
    const processedEstablishments = establishments.map((place: any) => {
      // Create allergen scores object from individual avg_* fields using canonical allergens
      const avg_allergen_scores: Record<string, number> = {};
      const allergenFields = ALLERGENS;
      
      allergenFields.forEach(allergen => {
        const avgScore = place[`avg_${allergen}_score`];
        if (avgScore !== null && avgScore !== undefined) {
          avg_allergen_scores[allergen] = Number(avgScore);
        }
      });

      
      // Also check legacy averageAllergenScores format - but filter through canonical keys only
      if (place.averageAllergenScores && Object.keys(avg_allergen_scores).length === 0) {
        // Only include canonical allergen keys from legacy data
        ALLERGENS.forEach(canonicalKey => {
          if (place.averageAllergenScores[canonicalKey] !== undefined) {
            avg_allergen_scores[canonicalKey] = Number(place.averageAllergenScores[canonicalKey]);
          }
        });
      }
      

      
      // Create canonical EstablishmentWithStats object
      const canonicalPlace = {
        // Core Establishment fields
        id: Number(place.id),
        uuid: place.uuid,
        name: place.name,
        place_id: place.place_id,
        address: place.address,
        latitude: place.latitude ? Number(place.latitude) : null,
        longitude: place.longitude ? Number(place.longitude) : null,
        rating: place.rating ? Number(place.rating) : null,
        user_ratings_total: place.user_ratings_total ? Number(place.user_ratings_total) : null,
        price_level: place.price_level ? Number(place.price_level) : null,
        business_status: place.business_status,
        types: place.types,
        phone: place.phone,
        website: place.website,
        chain_id: place.chain_id ? Number(place.chain_id) : null,
        local_image_url: place.local_image_url || place.localImageUrl,
        tags: place.tags || [],
        created_at: place.created_at,
        updated_at: place.updated_at,
        
        // EstablishmentWithStats fields
        review_count: Number(place.review_count || place.reviewCount || 0),
        avg_review_rating: place.avg_review_rating ? Number(place.avg_review_rating) : (place.avgReviewRating ? Number(place.avgReviewRating) : null),
        avg_allergen_scores: Object.keys(avg_allergen_scores).length > 0 ? avg_allergen_scores : null,
        
        // Chain information (if applicable) - FIXED: Always create chain object if chain_id exists
        chain: place.chain_id ? {
          name: place.chain_name || place.chainName || `Chain ${place.chain_id}`,
          logo_url: place.chain_logo_url || place.chainLogoUrl || null,
          featured_image_path: place.chain_featured_image_path || place.chainFeaturedImageUrl || null
        } : undefined,
        
        // Legacy compatibility fields (for components that haven't been fully migrated)
        databaseId: Number(place.id),
        localImageUrl: place.local_image_url || place.localImageUrl,
        chainId: place.chain_id ? Number(place.chain_id) : null,
        chainName: place.chain_name || place.chainName,
        chainLogoUrl: place.chain_logo_url || place.chainLogoUrl,
        chainFeaturedImageUrl: place.chain_featured_image_path || place.chainFeaturedImageUrl,
        averageAllergenScores: avg_allergen_scores,
        allergenRatings: place.allergenRatings,
        reviewCount: Number(place.review_count || place.reviewCount || 0),
        avgReviewRating: place.avg_review_rating ? Number(place.avg_review_rating) : (place.avgReviewRating ? Number(place.avgReviewRating) : null),
        hasReviews: Number(place.review_count || place.reviewCount || 0) > 0,
        
        // Position for map compatibility
        position: place.position || {
          lat: place.latitude ? Number(place.latitude) : 0,
          lng: place.longitude ? Number(place.longitude) : 0
        }
      };



      return canonicalPlace;
    });
    
    return processedEstablishments;
  },

  async addEstablishment(data: any) {
    return apiRequest('/establishments/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Search - with basic validation
  async search(query: string) {
    return apiRequest(`/search?q=${encodeURIComponent(query)}`);
  },

  // Places
  async getPlaceDetails(placeId: string) {
    return apiRequest('/places/details', {
      method: 'POST',
      body: JSON.stringify({ placeId }),
    });
  },

  async searchPlaces(query: string, location = 'UK') {
    return apiRequest(`/places/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
  },

  // Dashboard - with validation
  async getDashboard(): Promise<DashboardDataValidated | null> {
    try {
      return await validatedApiRequest('/dashboard', DashboardDataSchema);
    } catch (error) {
      console.warn('Dashboard data unavailable:', error);
      return null;
    }
  },

  async resetDashboard() {
    return apiRequest('/dashboard/reset', {
      method: 'POST',
    });
  },

  // Admin - with validation
  async getChains(): Promise<ChainValidated[]> {
    try {
      return await validatedApiRequest('/admin/chains', ChainsResponseSchema);
    } catch (error) {
      console.warn('Chains data unavailable:', error);
      return [];
    }
  },

  async getChainCandidates() {
    return apiRequest('/admin/chain-candidates');
  },

  // User Profile - with validation
  async getProfile(): Promise<UserValidated | null> {
    try {
      return await validatedApiRequest('/profile/me', ProfileResponseSchema);
    } catch (error) {
      console.warn('Profile data unavailable:', error);
      return null;
    }
  },

  // Reviews - with validation
  async getUserReviews(userId: string): Promise<ReviewValidated[]> {
    try {
      const response = await validatedApiRequest(`/reviews/user/${userId}`, ReviewsResponseSchema);
      return response.reviews || response.data || [];
    } catch (error) {
      console.warn('User reviews unavailable:', error);
      return [];
    }
  },

  async getEstablishmentReviews(placeId: string): Promise<ReviewValidated[]> {
    try {
      const response = await validatedApiRequest(`/establishments/${placeId}/reviews`, ReviewsResponseSchema);
      return response.reviews || response.data || [];
    } catch (error) {
      console.warn('Establishment reviews unavailable:', error);
      return [];
    }
  },

  // Utilities
  async discoverImage(name: string) {
    return apiRequest(`/discover-image?name=${encodeURIComponent(name)}`);
  },

  async findImage(id: string) {
    return apiRequest(`/find-image?id=${encodeURIComponent(id)}`);
  },

  async getPhotoProxy(ref: string, name?: string) {
    const params = name ? `?ref=${encodeURIComponent(ref)}&name=${encodeURIComponent(name)}` : `?ref=${encodeURIComponent(ref)}`;
    return fetch(`${API_BASE_URL}/photo-proxy${params}`);
  }
};

export { ApiError }; 