import React from "react";
import FilterPanel from "@/app/components/search/FilterPanel";

interface MobileFilterOverlayProps {
  show: boolean;
  onClose: () => void;
  safeForAllergens: string[];
  setSafeForAllergens: (allergens: string[]) => void;
  selectedMinimumRating: number | null;
  setSelectedMinimumRating: (rating: number | null) => void;
}

/**
 * Mobile filter overlay component with backdrop - descriptive classes for debugging
 */
export default function MobileFilterOverlay({
  show,
  onClose,
  safeForAllergens,
  setSafeForAllergens,
  selectedMinimumRating,
  setSelectedMinimumRating,
}: MobileFilterOverlayProps) {
  if (!show) return null;

  return (
    <div className="mobile-filter-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      {/* Backdrop - clicking closes the overlay */}
      <div 
        className="mobile-filter-backdrop absolute inset-0" 
        onClick={onClose}
        aria-label="Close filters"
      />
      
      {/* Filter Panel Container */}
      <div className="mobile-filter-panel-container w-full relative">
        <FilterPanel
          safeForAllergens={safeForAllergens}
          setSafeForAllergens={setSafeForAllergens}
          selectedMinimumRating={selectedMinimumRating}
          setSelectedMinimumRating={setSelectedMinimumRating}
          onClose={onClose}
          isMobile={true}
        />
      </div>
    </div>
  );
} 