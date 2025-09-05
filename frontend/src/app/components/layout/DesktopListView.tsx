"use client";

import { memo } from 'react';
import type { Place } from '@/types';
import ListView from '@/app/components/ListView';

interface DesktopListViewProps {
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
  isLoading?: boolean;
}

/**
 * Desktop list view component - shows as fixed sidebar on desktop
 */
const DesktopListView = memo(function DesktopListView({
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
  isLoading = false
}: DesktopListViewProps) {
  // Only render on desktop
  if (!isClient || windowWidth < 1024) {
    return null;
  }

  return (
    <div className="w-1/4 min-w-80 border-r border-gray-200 overflow-y-auto desktop-list-view-container">
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
        showMobileListView={false}
      />
    </div>
  );
});

export default DesktopListView;
