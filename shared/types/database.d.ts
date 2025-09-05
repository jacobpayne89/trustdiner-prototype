export interface Review {
    id: string;
    userId: string;
    placeId: string;
    allergenScores: Record<string, number>;
    comment: string;
    yesNoAnswers?: Record<string, boolean>;
    createdAt: any;
    updatedAt: any;
    placeName?: string;
    placeAddress?: string;
}
export interface User {
    id: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    allergies: string[];
    profileImage?: string;
    createdAt: any;
    updatedAt?: any;
}
export interface Place {
    id: string;
    placeId: string;
    name: string;
    address: string;
    position: {
        lat: number;
        lng: number;
    };
    rating?: number;
    userRatingsTotal?: number;
    priceLevel?: number;
    types: string[];
    businessStatus?: string;
    website?: string;
    phone?: string;
    openingHours?: any;
    photos?: string[];
    detailedTypes?: string[];
    cuisineTypes?: string[];
    hasReviews?: boolean;
    photoCount?: number;
    localImageUrl?: string;
    primaryCategory?: string;
    cuisine?: string;
    chainId?: number;
    chainName?: string;
    chainSlug?: string;
    chainLogoUrl?: string;
    chainCategory?: string;
    allergenRatings?: Record<string, any>;
    inDatabase: boolean;
    source: 'database' | 'google' | 'cache';
    reviewCount?: number;
    averageAllergenScores?: Record<string, number>;
}
export interface EstablishmentRow {
    id: number;
    place_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    rating: number;
    user_ratings_total: number;
    price_level: number;
    types: string[];
    business_status: string;
    website: string;
    phone: string;
    opening_hours: any;
    photos: string[];
    detailed_types: string[];
    cuisine_types: string[];
    has_reviews: boolean;
    photo_count: number;
    local_image_url: string;
    primary_category: string;
    cuisine: string;
    chain_id: number;
    chain_name: string;
    chain_slug: string;
    chain_logo_url: string;
    chain_category: string;
    created_at: string;
    updated_at: string;
}
//# sourceMappingURL=database.d.ts.map