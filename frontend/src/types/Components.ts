// Component prop interfaces and UI-related types
import { Place } from './Place';
import { Review, EnrichedReview } from './Review';
import { User } from './User';
import { SearchResult, SearchFilters } from './Search';
import type { EstablishmentWithStats, Review as CoreReview, User as CoreUser } from '../../../shared/types/core';

// Note: Google Maps types are provided by @types/google.maps

// ListView component props
export interface ListViewProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
  highlightedPlace: Place | null;
  setHighlightedPlace: (place: Place | null) => void;
  selectedPlace?: Place | null;
  safeForAllergens: string[];
  setSafeForAllergens: (allergens: string[]) => void;
  selectedMinimumRating: number | null;
  setSelectedMinimumRating: (rating: number | null) => void;
  userAllergies?: string[];
  showAllAllergies?: boolean;
  setShowAllAllergies?: (show: boolean) => void;
  isLoggedIn?: boolean;
  showMobileListView?: boolean;
}

// Header component props
export interface HeaderProps {
  showSearch?: boolean;
  searchPlaceholder?: string;
  rightLinks?: React.ReactNode;
  onLogoClick?: () => void;
}

// PlaceCard component props - migrated to use canonical types
export interface PlaceCardProps {
  place: EstablishmentWithStats;
  onClose: () => void;
  showReviews?: boolean;
}

// Map container props
export interface MapContainerProps {
  places: Place[];
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  hoveredMarker: Place | null;
  setHoveredMarker: (place: Place | null) => void;
  onMapLoad?: (map: google.maps.Map) => void;
  onPlaceCardOpen?: (place: Place) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  activeLocation?: Place | null; // For radiowave effect
}

// Loading overlay props
export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

// Note: MobileDrawerProps removed in Stage 2E - now using usePlaceCardState() hook

// Mobile floating button props
export interface MobileFloatingButtonProps {
  isClient: boolean;
  windowWidth: number;
  cardPlace: Place | null;
  showMobileListView: boolean;
  setShowMobileListView: (show: boolean) => void;
}

// Filter controls props
export interface FilterControlsProps {
  user: any;
  onFilterChange: (allergens: string[], rating: number | null) => void;
}

export interface FilterControlsState {
  safeForAllergens: string[];
  selectedMinimumRating: number | null;
  showAllAllergies: boolean;
}

// Welcome popup props
export interface WelcomePopupProps {
  show: boolean;
  onClose: () => void;
}

// Filter panel props
export interface FilterPanelProps {
  safeForAllergens: string[];
  setSafeForAllergens: (allergens: string[]) => void;
  selectedMinimumRating: number | null;
  setSelectedMinimumRating: (rating: number | null) => void;
  onClose?: () => void;
  isMobile?: boolean;
  userAllergies?: string[];
  showAllAllergies?: boolean;
  setShowAllAllergies?: (showAll: boolean) => void;
  isLoggedIn?: boolean;
}

// Search bar props
export interface SearchBarProps {
  onPlaceSelect?: (place: SearchResult) => void;
  placeholder?: string;
  className?: string;
}
