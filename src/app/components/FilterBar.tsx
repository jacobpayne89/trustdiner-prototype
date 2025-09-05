"use client";

import React from 'react';
import SearchBar from '@/app/components/search/SearchBar';
import FilterControls from '@/app/components/filters/FilterControls';
import SortOptions from '@/app/components/filters/SortOptions';
import { useFilterBar, RATING_OPTIONS } from '@/hooks/useFilterBar';
import type { SearchResult } from '@/types';

interface FilterBarProps {
  onAllergenToggle?: (allergen: string) => void;
  onRatingFilter?: (rating: number) => void;
  selectedAllergens?: string[];
  selectedRating?: number;
  // Search props
  onPlaceSelect?: (result: SearchResult) => void;
  onPlaceImported?: () => void;
  onPlaceImportedAndOpen?: (placeId: string, placeName: string) => void;
}

export default function FilterBar({
  onAllergenToggle,
  onRatingFilter,
  selectedAllergens = [],
  selectedRating,
  onPlaceSelect,
  onPlaceImported,
  onPlaceImportedAndOpen
}: FilterBarProps) {
  const {
    showMoreAllergens,
    visibleAllergens,
    hasMoreAllergens,
    handleAllergenClick,
    handleRatingClick,
    toggleShowMoreAllergens,
  } = useFilterBar({
    selectedAllergens,
    selectedRating,
    onAllergenToggle,
    onRatingFilter
  });

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
      {/* Desktop Layout (>1024px) */}
      <div className="hidden min-[1025px]:block">
        <div className="grid grid-cols-12 gap-4 items-baseline">
          {/* Search Section - Left column (3 columns) */}
          <div className="col-span-3">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Search</h3>
            <SearchBar
              placeholder='Search for things like "Pizza in Clapham"'
              className="w-full [&_input]:text-sm [&_input]:py-2"
              onPlaceSelect={onPlaceSelect}
              onPlaceImported={onPlaceImported}
              onPlaceImportedAndOpen={onPlaceImportedAndOpen}
            />
          </div>
          
          {/* Allergen Filter Section - Middle column (4 columns) */}
          <div className="col-span-4">
            <FilterControls
              visibleAllergens={visibleAllergens}
              selectedAllergens={selectedAllergens}
              hasMoreAllergens={hasMoreAllergens}
              showMoreAllergens={showMoreAllergens}
              onAllergenClick={handleAllergenClick}
              onToggleShowMore={toggleShowMoreAllergens}
            />
          </div>

          {/* Rating Filter Section - (4 columns) */}
          <div className="col-span-4">
            <SortOptions
              ratingOptions={RATING_OPTIONS}
              selectedRating={selectedRating}
              onRatingClick={handleRatingClick}
            />
          </div>

          {/* Clear Filters Section - (1 column) */}
          <div className="col-span-1 flex flex-col items-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">&nbsp;</h3>
            <button
              onClick={() => {
                // Clear all filters
                onAllergenToggle?.('clear-all');
                onRatingFilter?.(undefined);
              }}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#01745F] focus:ring-offset-2 h-8"
                                    >
                          Clear Filters
                        </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout (≤1024px) */}
      <div className="block min-[1025px]:hidden space-y-4">
        {/* Search Section - Full width */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Search</h3>
          <SearchBar
            placeholder='Search for things like "Pizza in Clapham"'
            className="w-full [&_input]:text-sm [&_input]:py-2"
            onPlaceSelect={onPlaceSelect}
            onPlaceImported={onPlaceImported}
            onPlaceImportedAndOpen={onPlaceImportedAndOpen}
          />
        </div>
        
        {/* Allergen and Rating Filters - Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allergen Filter Section */}
          <FilterControls
            visibleAllergens={visibleAllergens}
            selectedAllergens={selectedAllergens}
            hasMoreAllergens={hasMoreAllergens}
            showMoreAllergens={showMoreAllergens}
            onAllergenClick={handleAllergenClick}
            onToggleShowMore={toggleShowMoreAllergens}
          />

          {/* Rating Filter Section */}
          <SortOptions
            ratingOptions={RATING_OPTIONS}
            selectedRating={selectedRating}
            onRatingClick={handleRatingClick}
          />
        </div>

        {/* Clear Filters Section - Full width */}
        <div className="w-full flex justify-end">
          <button
            onClick={() => {
              onAllergenToggle?.('clear-all');
              onRatingFilter?.(undefined);
            }}
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#01745F] focus:ring-offset-2 h-8"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}