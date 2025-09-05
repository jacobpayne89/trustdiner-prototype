"use client";

import type { Place } from '@/types';
import ListView from '@/app/components/ListView';

interface MobileListViewProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
  highlightedPlace: Place | null;
  setHighlightedPlace: (place: Place | null) => void;
  safeForAllergens: string[];
  setSafeForAllergens: (allergens: string[]) => void;
  selectedMinimumRating: number | null;
  setSelectedMinimumRating: (rating: number | null) => void;
  showAllAllergies: boolean;
  setShowAllAllergies: (show: boolean) => void;
  userAllergies?: string[];
  isLoggedIn?: boolean;
  isClient: boolean;
  windowWidth: number;
  showMobileListView: boolean;
  setShowMobileListView: (show: boolean) => void;
}

/**
 * Mobile list view component - shows as full-screen modal on mobile
 */
export default function MobileListView({
  places,
  onPlaceClick,
  highlightedPlace,
  setHighlightedPlace,
  safeForAllergens,
  setSafeForAllergens,
  selectedMinimumRating,
  setSelectedMinimumRating,
  showAllAllergies,
  setShowAllAllergies,
  userAllergies = [],
  isLoggedIn = false,
  isClient,
  windowWidth,
  showMobileListView,
  setShowMobileListView
}: MobileListViewProps) {
  // Only render on mobile/tablet when showMobileListView is true
  if (!isClient || windowWidth > 1024) {
    return null;
  }

  return (
    <div className={`${showMobileListView ? 'absolute inset-0 bg-white z-40' : 'hidden'} mobile-list-view-container`}>
      <div className="h-full overflow-y-auto">
        <ListView
          places={places}
          onPlaceClick={onPlaceClick}
          highlightedPlace={highlightedPlace}
          setHighlightedPlace={setHighlightedPlace}
          safeForAllergens={safeForAllergens}
          setSafeForAllergens={setSafeForAllergens}
          selectedMinimumRating={selectedMinimumRating}
          setSelectedMinimumRating={setSelectedMinimumRating}
          showAllAllergies={showAllAllergies}
          setShowAllAllergies={setShowAllAllergies}
          userAllergies={userAllergies}
          isLoggedIn={isLoggedIn}
          showMobileListView={showMobileListView}
        />
      </div>


    </div>
  );
}
