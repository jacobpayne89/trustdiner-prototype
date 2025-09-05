import React from "react";
import { AllergenIcon, type AllergenKey } from "@/app/components/icons";
import { ALLERGENS, ALLERGEN_DISPLAY_NAMES, type AllergenKey } from '@/types';
import type { FilterPanelProps } from "@/types";

// Helper function to get allergen key for icon mapping
function getAllergenIconKey(allergen: string): string {
  const mapping: Record<string, string> = {
    'milk': 'dairy', // Maps to dairy icon (milk.svg)
    'tree_nuts': 'treenuts',
    'treenuts': 'treenuts',
    'nuts': 'treenuts',
    'fish': 'fish',
    'shellfish': 'crustraceans',
    'crustaceans': 'crustraceans',
    'molluscs': 'molluscs',
    'mollusks': 'molluscs',
    'eggs': 'eggs',
    'egg': 'eggs',
    'soy': 'soybean',
    'soybean': 'soybean',
    'soya': 'soybean',
    'gluten': 'gluten',
    'peanuts': 'peanuts',
    'peanut': 'peanuts',
    'sesame': 'sesame',
    'mustard': 'mustard',
    'celery': 'celery',
    'lupin': 'lupin',
    'sulfites': 'sulfites',
    'sulphites': 'sulfites'
  };
  
  return mapping[allergen.toLowerCase()] || allergen.toLowerCase();
}

/**
 * Filter panel component for allergen and rating filtering with descriptive classes
 */
export default function FilterPanel({
  safeForAllergens,
  setSafeForAllergens,
  selectedMinimumRating,
  setSelectedMinimumRating,
  onClose,
  isMobile = false,
  userAllergies = [],
  showAllAllergies = false,
  setShowAllAllergies,
  isLoggedIn = false
}: FilterPanelProps) {
  // Use canonical allergens as the single source of truth
  const allAllergens = ALLERGENS;

  // Show user's allergies by default when logged in, or all when showAllAllergies is true
  const availableAllergens = isLoggedIn && !showAllAllergies && userAllergies.length > 0
    ? userAllergies
    : allAllergens;

  const ratingOptions = [3, 4, 5];

  const toggleAllergen = (allergen: string) => {
    if (safeForAllergens.includes(allergen)) {
      setSafeForAllergens(safeForAllergens.filter(a => a !== allergen));
    } else {
      setSafeForAllergens([...safeForAllergens, allergen]);
    }
  };

  const baseContainerClass = isMobile 
    ? "filter-panel-mobile bg-white p-6 rounded-t-2xl max-h-[80vh] overflow-y-auto"
    : "filter-panel-desktop bg-white p-4 rounded-lg shadow-lg border border-gray-200";

  return (
    <div className={`filter-panel-container ${baseContainerClass}`}>
      {/* Header */}
      <div className="filter-panel-header flex items-center justify-between mb-6">
        <h2 className="filter-panel-title text-lg font-semibold text-gray-900">
          Filter Results
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="filter-panel-close-button text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close filters"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="filter-panel-content space-y-6">
        {/* Allergen Filters */}
        <div className="allergen-filter-section">
          <h3 className="allergen-filter-title font-semibold text-gray-900 text-sm mb-3">
            Filter by allergen safety
          </h3>
          <p className="allergen-filter-description text-xs text-gray-600 mb-4">
            Show only places rated safe for these allergens:
          </p>
          
          {/* Show all allergies toggle for logged-in users */}
          {isLoggedIn && userAllergies.length > 0 && setShowAllAllergies && (
            <div className="user-allergy-toggle mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {showAllAllergies ? 'Showing all allergens' : 'Showing your allergens'}
                  </p>
                  <p className="text-xs text-blue-700">
                    {showAllAllergies 
                      ? `Switch to show only your ${userAllergies.length} allergen${userAllergies.length !== 1 ? 's' : ''}`
                      : `Switch to show all ${allAllergens.length} allergens`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowAllAllergies(!showAllAllergies)}
                  className="toggle-all-allergies-button px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                >
                  {showAllAllergies ? 'Show Mine' : 'Show All'}
                </button>
              </div>
            </div>
          )}
          
          <div className="allergen-filter-options flex flex-wrap gap-2">
            {availableAllergens.map((allergen) => {
              const isSelected = safeForAllergens.includes(allergen);
              return (
                <button
                  key={allergen}
                  onClick={() => toggleAllergen(allergen)}
                  className={`allergen-filter-button allergen-button-${allergen.replace(/\s+/g, '-')} flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'allergen-button-selected bg-blue-100 text-blue-800 border border-blue-300'
                      : 'allergen-button-unselected bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <AllergenIcon 
                    allergen={getAllergenIconKey(allergen) as AllergenKey} 
                    size={16} 
                    className="allergen-filter-icon"
                  />
                  <span className="allergen-filter-label">{ALLERGEN_DISPLAY_NAMES[allergen as AllergenKey] || allergen}</span>
                </button>
              );
            })}
          </div>
          {safeForAllergens.length > 0 && (
            <button
              onClick={() => setSafeForAllergens([])}
              className="clear-allergen-filters-button mt-3 px-3 py-1 rounded text-xs border bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300 transition-colors"
            >
              Clear allergen filters
            </button>
          )}
        </div>

        {/* Rating Filter */}
        <div className="rating-filter-section">
          <h3 className="rating-filter-title font-semibold text-gray-900 text-sm mb-3">
            Minimum overall rating
          </h3>
          <div className="rating-filter-options flex flex-wrap gap-2">
            {ratingOptions.map((rating) => (
              <button
                key={rating}
                onClick={() => setSelectedMinimumRating(
                  selectedMinimumRating === rating ? null : rating
                )}
                className={`rating-filter-button rating-button-${rating} px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedMinimumRating === rating
                    ? 'rating-button-selected bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'rating-button-unselected bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {rating}+ ⭐
              </button>
            ))}
          </div>
          {selectedMinimumRating && (
            <button
              onClick={() => setSelectedMinimumRating(null)}
              className="clear-rating-filter-button mt-3 px-3 py-1 rounded text-xs border bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300 transition-colors"
            >
              Clear rating filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 