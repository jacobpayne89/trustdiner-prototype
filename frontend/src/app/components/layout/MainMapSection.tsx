import React from "react";
import MapContainer from "@/app/components/map/MapContainer";
import LoadingOverlay from "@/app/components/ui/LoadingOverlay";
import MobileControls from "./MobileControls";

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

interface MainMapSectionProps {
  places: Place[];
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  hoveredMarker: Place | null;
  setHoveredMarker: (place: Place | null) => void;
  onMapLoad: (map: google.maps.Map) => void;
  loading: boolean;
  isMobile: boolean;
  showMobileListView: boolean;
  onShowMobileFilters: () => void;
  onToggleMobileListView: () => void;
}

/**
 * Main map section with loading states and mobile controls - descriptive classes for debugging
 */
export default function MainMapSection({
  places,
  selectedPlace,
  setSelectedPlace,
  hoveredMarker,
  setHoveredMarker,
  onMapLoad,
  loading,
  isMobile,
  showMobileListView,
  onShowMobileFilters,
  onToggleMobileListView,
}: MainMapSectionProps) {
  return (
    <div className={`main-map-section ${isMobile && showMobileListView ? 'hidden' : 'flex-1'} relative h-full`}>
      {/* Loading Overlay */}
      {loading && (
        <LoadingOverlay 
          isVisible={true} 
          message="Loading establishments..." 
        />
      )}
      
      {/* Map Container */}
      <MapContainer
        places={places}
        selectedPlace={selectedPlace}
        setSelectedPlace={setSelectedPlace}
        hoveredMarker={hoveredMarker}
        setHoveredMarker={setHoveredMarker}
        onMapLoad={onMapLoad}
        className="main-map-instance h-full"
      />

      {/* Mobile Controls Overlay */}
      {isMobile && (
        <MobileControls
          onShowFilters={onShowMobileFilters}
          onToggleListView={onToggleMobileListView}
          showMobileListView={showMobileListView}
        />
      )}
    </div>
  );
} 