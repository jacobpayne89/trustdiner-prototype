import { CanonicalAllergen } from '../constants/allergens';
export interface Review {
    id: number;
    user_id: number;
    venue_id: number;
    allergen_scores: Partial<Record<CanonicalAllergen, number>> | null;
    general_comment: string | null;
    yes_no_answers: Record<string, boolean | null> | null;
    overall_rating: number | null;
    would_recommend: boolean | null;
    staff_knowledge_rating: number | null;
    separate_preparation_area: boolean | null;
    staff_allergy_trained: boolean | null;
    cross_contamination_safety: boolean | null;
    created_at: string;
    updated_at: string;
    place_id: string | null;
}
export interface ReviewWithDetails extends Review {
    establishment: {
        name: string;
        address: string | null;
        place_id: string | null;
        uuid: string;
        local_image_url: string | null;
    };
    user: {
        display_name: string | null;
        avatar_url: string | null;
    };
    chain?: {
        name: string;
        logo_url: string | null;
    };
}
export interface ReviewCreateInput {
    user_id: number;
    venue_id: number;
    place_id?: string;
    allergen_scores?: Record<string, number>;
    general_comment?: string;
    yes_no_answers?: Record<string, boolean | null>;
    overall_rating?: number;
    would_recommend?: boolean;
    staff_knowledge_rating?: number;
    separate_preparation_area?: boolean | null;
    staff_allergy_trained?: boolean | null;
    cross_contamination_safety?: boolean | null;
}
export interface ReviewUpdateInput extends Partial<Omit<ReviewCreateInput, 'user_id' | 'venue_id'>> {
}
export interface Establishment {
    id: number;
    uuid: string;
    name: string;
    place_id: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    rating: number | null;
    user_ratings_total: number | null;
    price_level: number | null;
    business_status: string | null;
    types: string[] | null;
    phone: string | null;
    website: string | null;
    chain_id: number | null;
    local_image_url: string | null;
    s3_image_url: string | null;
    localImageUrl?: string | null;
    s3ImageUrl?: string | null;
    imageUrl?: string | null;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
}
export interface EstablishmentWithStats extends Establishment {
    review_count: number;
    avg_review_rating: number | null;
    avg_allergen_scores: Record<string, number> | null;
    chain?: {
        name: string;
        logo_url: string | null;
        featured_image_path: string | null;
    };
}
export interface EstablishmentCreateInput {
    name: string;
    place_id: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    business_status?: string;
    types?: string[];
    phone?: string;
    website?: string;
    chain_id?: number;
    local_image_url?: string;
    tags?: string[];
}
export interface User {
    id: number;
    firebase_uid: string | null;
    email: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    user_type: string | null;
    allergies: string[] | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string | null;
}
export interface UserUpdateInput {
    display_name?: string;
    first_name?: string;
    last_name?: string;
    allergies?: string[];
    avatar_url?: string;
}
export interface Chain {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    logo_url: string | null;
    local_logo_path: string | null;
    featured_image_path: string | null;
    website_url: string | null;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
}
export interface ChainWithStats extends Chain {
    location_count: number;
    avg_rating: number | null;
    sample_image: string | null;
    allergen_scores: Record<string, number> | null;
}
export interface ChainCreateInput {
    name: string;
    slug: string;
    description?: string;
    category?: string;
    logo_url?: string;
    local_logo_path?: string;
    featured_image_path?: string;
    website_url?: string;
    tags?: string[];
}
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
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    meta: {
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
        timestamp: string;
    };
}
export interface LegacyReview {
}
export interface LegacyPlace {
}
export interface LegacyEnrichedReview {
}
//# sourceMappingURL=core.d.ts.map