"use client";

import React, { memo } from 'react';
import { AllergenIcon } from '@/app/components/icons';
import { getAllergenIconKey, getScoreColor } from '@/utils/allergenHelpers';
import { ALLERGENS, ALLERGEN_DISPLAY_NAMES, sortAllergens, type AllergenKey, type CanonicalAllergen } from '@/types';

interface AllergenFiltersProps {
  safeForAllergens: string[];
  setSafeForAllergens: (allergens: string[]) => void;
  selectedMinimumRating: number | null;
  setSelectedMinimumRating: (rating: number | null) => void;
  userAllergies: string[];
  showAllAllergies: boolean;
  setShowAllAllergies?: (show: boolean) => void;
  isLoggedIn: boolean;
  onFilterChange: () => void;
}

const AllergenFilters = memo(function AllergenFilters({
  safeForAllergens,
  setSafeForAllergens,
  selectedMinimumRating,
  setSelectedMinimumRating,
  userAllergies,
  showAllAllergies,
  setShowAllAllergies,
  isLoggedIn,
  onFilterChange
}: AllergenFiltersProps) {

  return (
    <>
      {/* Allergen filters */}
      <div role="group" aria-labelledby="allergen-filter-heading">
        <h3 id="allergen-filter-heading" className="font-semibold text-gray-900 text-sm mb-2">Filter by allergen</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Select allergens to filter by">
          {((isLoggedIn && userAllergies.length > 0 && !showAllAllergies) 
            ? sortAllergens(userAllergies) 
            : ALLERGENS).map((allergen) => {
            const selected = safeForAllergens.includes(allergen);
            return (
              <button
                key={allergen}
                type="button"
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selected 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-black'
                }`}
                onClick={() => {
                  setSafeForAllergens(selected
                    ? safeForAllergens.filter(a => a !== allergen)
                    : [...safeForAllergens, allergen]
                  );
                  onFilterChange();
                }}
                aria-pressed={selected}
                aria-label={`${selected ? 'Remove' : 'Add'} ${allergen} filter`}
              >
                <AllergenIcon allergen={getAllergenIconKey(allergen) as AllergenKey} size={12} className={selected ? "text-white" : "text-black"} />
                <span>{ALLERGEN_DISPLAY_NAMES[allergen as CanonicalAllergen] || allergen}</span>
              </button>
            );
          })}
          
          {/* Show All / Show Less button for user allergies */}
          {isLoggedIn && userAllergies.length > 0 && setShowAllAllergies && (
            <button
              type="button"
              className="px-2 py-1 rounded-full text-xs font-medium bg-white text-blue-600 hover:text-blue-700 transition-colors border border-gray-200"
              onClick={() => setShowAllAllergies(!showAllAllergies)}
            >
              {showAllAllergies ? 'Show my allergies' : 'Show all'}
            </button>
          )}
        </div>
      </div>

      {/* Rating filters */}
      <div role="group" aria-labelledby="rating-filter-heading">
        <h3 id="rating-filter-heading" className="font-semibold text-gray-900 text-sm mb-2">Filter by Rating</h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((rating) => {
              const selected = selectedMinimumRating === rating;
              return (
                <button
                  key={rating}
                  type="button"
                  className={`w-8 h-8 rounded-full text-black font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    selected ? 'ring-2 ring-black' : ''
                  }`}
                  style={{
                    backgroundColor: getScoreColor(rating),
                  }}
                  onClick={() => {
                    setSelectedMinimumRating(selected
                      ? null
                      : rating
                    );
                    onFilterChange();
                  }}
                  aria-pressed={selected}
                  aria-label={`Filter by rating ${rating}${rating !== 5 ? ' and above' : ''}`}
                >
                  <span aria-hidden="true">{rating}{rating !== 5 ? '+' : ''}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={`px-3 py-1 rounded text-xs border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              safeForAllergens.length > 0 || selectedMinimumRating !== null
                ? 'bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            onClick={() => {
              setSafeForAllergens([]);
              setSelectedMinimumRating(null);
              onFilterChange();
            }}
            disabled={safeForAllergens.length === 0 && selectedMinimumRating === null}
          >
            Clear filters
          </button>
        </div>
      </div>
    </>
  );
});

export default AllergenFilters;
