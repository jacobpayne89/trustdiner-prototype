export interface Establishment {
    id: string;
    databaseId?: number;
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
}
export interface AddEstablishmentRequest {
    name: string;
    placeId: string;
    address: string;
    lat: number;
    lng: number;
    types?: string[];
    rating?: number;
    priceLevel?: number;
    userRatingsTotal?: number;
    photos?: string[];
    source: string;
}
export interface Chain {
    id: number;
    name: string;
    slug: string;
    logo_url?: string;
    category?: string;
    description?: string;
    website?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
//# sourceMappingURL=establishment.d.ts.map