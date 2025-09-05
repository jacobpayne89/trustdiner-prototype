// Search-related type definitions
import { Place } from './Place';

// Search result from Google Places API or database
export interface SearchResult {
  place_id: string;
  name: string;
  // Different address formats based on source
  formatted_address?: string; // Google format
  address?: string; // Database format
  // Different position formats
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  position?: {
    lat: number;
    lng: number;
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  allergy_rating?: number; // Database-specific
  types?: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }> | string[];
  business_status?: string;
  source?: 'database' | 'google' | 'google_legacy';
  result_type?: string; // For legacy compatibility
  inDatabase?: boolean;
  addable?: boolean;
  localImageUrl?: string;
  databaseId?: string;
}

// Search filters
export interface SearchFilters {
  safeForAllergens: string[];
  selectedMinimumRating: number | null;
  showAllAllergies: boolean;
}

// Search state
export interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  showMoreFromGoogle: boolean;
  filters: SearchFilters;
}

// Local search component props
export interface LocalSearchProps {
  onPlaceSelect?: (place: SearchResult) => void;
  onPlaceImported?: () => void;
  onPlaceImportedAndOpen?: (placeId: string, placeName: string) => void;
  placeholder?: string;
  className?: string;
}
