// Centralized type exports for easy importing
// Re-export all types from individual files

// Place types
export type {
  Place,
  PlacePosition,
  PlaceDetails,
  AllergenRating
} from './Place';

// Review types
export type {
  Review,
  EnrichedReview,
  ReviewFormData,
  ReviewDisplayProps,
  AllergenScores
} from './Review';

// User types
export type {
  User,
  UserType,
  ProfileFormData,
  AuthState,
  LoginRequest,
  SignupRequest
} from './User';

// Search types
export type {
  SearchResult,
  SearchFilters,
  SearchState,
  LocalSearchProps
} from './Search';

// API types
export type {
  APIResponse,
  APIError,
  EstablishmentsResponse,
  LoginResponse,
  SignupResponse,
  ReviewsResponse,
  GoogleAPIUsage,
  DashboardData
} from './API';

// Component types
export type {
  ListViewProps,
  HeaderProps,
  PlaceCardProps,
  MapContainerProps,

  MobileFloatingButtonProps,
  FilterControlsProps,
  FilterControlsState,
  LoadingOverlayProps,
  WelcomePopupProps,
  FilterPanelProps,
  SearchBarProps
} from './Components';

// Canonical allergen constants (copied from shared to avoid Next.js import issues)
// REQUIRED ALLERGEN ORDER - DO NOT CHANGE
export const ALLERGENS = [
  'milk',
  'eggs', 
  'peanuts',
  'tree_nuts',
  'gluten',
  'fish',
  'crustaceans',
  'molluscs',
  'soybeans',
  'sesame',
  'mustard',
  'celery',
  'sulfites',
  'lupin'
] as const;

export type AllergenKey = typeof ALLERGENS[number];

export const ALLERGEN_DISPLAY_NAMES: Record<AllergenKey, string> = {
  milk: 'Milk',
  eggs: 'Eggs',
  peanuts: 'Peanuts',
  tree_nuts: 'Tree Nuts',
  gluten: 'Gluten',
  fish: 'Fish',
  crustaceans: 'Crustaceans',
  molluscs: 'Molluscs',
  soybeans: 'Soybeans',
  sesame: 'Sesame',
  mustard: 'Mustard',
  celery: 'Celery',
  sulfites: 'Sulphites', // British spelling as requested
  lupin: 'Lupin'
};

export type CanonicalAllergen = AllergenKey;

/**
 * ALLERGEN SORTING HELPERS
 * Ensures consistent allergen ordering across all UI components
 */

/**
 * Sort allergens according to the required order
 * Unknown allergens appear at the end
 */
export function sortAllergens(allergens: string[]): string[] {
  const allergenOrderMap = new Map(ALLERGENS.map((allergen, index) => [allergen, index]));
  
  return allergens.sort((a, b) => {
    const indexA = allergenOrderMap.get(a) ?? 999; // Unknown allergens go to end
    const indexB = allergenOrderMap.get(b) ?? 999;
    return indexA - indexB;
  });
}

/**
 * Sort allergen objects by allergen key
 * For objects with an 'allergen' or 'name' field
 */
export function sortAllergenObjects<T extends { allergen?: string; name?: string }>(
  allergenObjects: T[]
): T[] {
  const allergenOrderMap = new Map(ALLERGENS.map((allergen, index) => [allergen, index]));
  
  return allergenObjects.sort((a, b) => {
    const allergenA = a.allergen || a.name || '';
    const allergenB = b.allergen || b.name || '';
    const indexA = allergenOrderMap.get(allergenA) ?? 999;
    const indexB = allergenOrderMap.get(allergenB) ?? 999;
    return indexA - indexB;
  });
}

/**
 * Sort allergen entries (key-value pairs)
 * For Record<string, T> converted to entries
 */
export function sortAllergenEntries<T>(entries: [string, T][]): [string, T][] {
  const allergenOrderMap = new Map(ALLERGENS.map((allergen, index) => [allergen, index]));
  
  return entries.sort(([a], [b]) => {
    const indexA = allergenOrderMap.get(a) ?? 999;
    const indexB = allergenOrderMap.get(b) ?? 999;
    return indexA - indexB;
  });
}

// Re-export search store types
export type { SearchStore, SearchMetadata } from '../hooks/useSearchStore';

// Re-export filter store types
export type { FilterStore } from '../hooks/useFilterStore';
