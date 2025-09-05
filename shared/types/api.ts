export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface SearchResult {
  place_id: string;
  name: string;
  address: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  position: { lat: number; lng: number };
  types: string[];
  source: 'database' | 'google' | 'cache';
  inDatabase: boolean;
  databaseId?: number;
  addable: boolean;
  localImageUrl?: string;
}

export interface AllergenScores {
  [allergen: string]: number; // 1-5 scale
}

export interface ReviewUser {
  displayName: string;
  email: string;
  // firebaseUid removed - legacy field no longer needed
}

export interface Review {
  id: number;
  // firebaseId removed - legacy field no longer needed
  userDisplayName: string;
  createdAt: string;
  updatedAt: string;
  allergenScores: AllergenScores;
  notes: string | null;
  separatePreparationArea: boolean | null;
  staffAllergyTrained: boolean | null;
  user: ReviewUser;
}

export interface ReviewsResponse {
  success: boolean;
  establishment: {
    id: number;
    name: string;
    uuid: string;
  };
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface Place {
  id: string;
  placeId: string;
  name: string;
  address: string;
  position: { lat: number; lng: number } | null;
  rating: number | null;
  userRatingsTotal: number;
  priceLevel: number | null;
  businessStatus: string;
  types: string[];
  primaryCategory: string;
  cuisine: string;
  chainId: number | null;
  chainName: string | null;
  chainSlug: string | null;
  chainLogoUrl: string | null;
  localImageUrl: string | null;
  photos: Array<{ url: string }>;
  allergenRatings: AllergenScores;
  // New review fields
  hasReviews: boolean;
  reviewCount: number;
  averageAllergenScores: AllergenScores;
}

export interface DashboardData {
  usage: {
    today: {
      date: string;
      calls: any[];
      totals: {
        TEXT_SEARCH: number;
        PLACE_DETAILS: number;
        PLACE_PHOTOS: number;
        TOTAL: number;
      };
      costs: {
        TEXT_SEARCH: number;
        PLACE_DETAILS: number;
        PLACE_PHOTOS: number;
        TOTAL: number;
      };
    };
    thisMonth: {
      totalCalls: number;
      totalCost: number;
      daysActive: number;
    };
    allTime: {
      totalCalls: number;
      totalCost: number;
      placesAdded: number;
    };
  };
  quota: {
    TOTAL_REQUESTS: number;
    TEXT_SEARCH: number;
    PLACE_DETAILS: number;
    PLACE_PHOTOS: number;
  };
  limits: {
    TOTAL_REQUESTS: number;
    TEXT_SEARCH: number;
    PLACE_DETAILS: number;
    PLACE_PHOTOS: number;
  };
  timestamp: number;
} 