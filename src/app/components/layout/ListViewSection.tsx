import React from "react";
import ListView from "@/app/components/ListView";

// Place interface (should be moved to shared types)
interface Place {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  allergenRatings: Record<string, { rating: number; count: number }>;
  placeDetails?: {
    address: string;
    categories: string[];
    images?: string[];
  };
  placeId: string;
  address?: string;
  categories?: string[];
  hasReviews?: boolean;
}

interface ListViewSectionProps {
  places: Place[];
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  hoveredMarker?: Place | null;
  setHoveredMarker?: (place: Place | null) => void;
  isMobile: boolean;
  showMobileListView: boolean;
}

/**
 * List view section with responsive behavior - descriptive classes for debugging
 */
export default function ListViewSection({
  places,
  selectedPlace,
  setSelectedPlace,
  hoveredMarker,
  setHoveredMarker,
  isMobile,
  showMobileListView,
}: ListViewSectionProps) {
  // Determine container classes based on mobile state
  const containerClasses = isMobile 
    ? (showMobileListView ? 'list-view-section-mobile-active w-full' : 'list-view-section-mobile-hidden hidden')
    : 'list-view-section-desktop w-1/3 border-r border-gray-200';

  return (
    <div className={`list-view-section-container ${containerClasses} bg-white overflow-hidden`}>
      <div className="list-view-content h-full">
        <ListView 
          places={places}
          onPlaceClick={setSelectedPlace}
          highlightedPlace={hoveredMarker || null}
          setHighlightedPlace={setHoveredMarker || (() => {})}
          selectedPlace={selectedPlace}
          safeForAllergens={[]}
          setSafeForAllergens={() => {}}
          selectedMinimumRating={null}
          setSelectedMinimumRating={() => {}}
          showMobileListView={showMobileListView}
        />
      </div>
    </div>
  );
} 