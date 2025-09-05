"use client";

import { useState, useMemo, useRef, useEffect, memo, useCallback } from 'react';
import type { Place, ListViewProps } from '@/types';

import EstablishmentList from '@/app/components/establishments/EstablishmentList';
import { getAverageAllergenRating, getSafeAllergens, getScoreColor } from '@/utils/allergenHelpers';





// Component for discovering images when no local image is available
function DiscoveryImageFallback({ 
  place, 
  hasRatings, 
  averageRating 
}: { 
  place: Place; 
  hasRatings: boolean; 
  averageRating: number; 
}) {
  const [discoveredImage, setDiscoveredImage] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  
  useEffect(() => {
    const discoverImage = async () => {
      if (isDiscovering || discoveredImage || hasAttempted) return;
      
      setIsDiscovering(true);
      setHasAttempted(true);
      
      try {
        console.log(`🔍 Trying discovery API for: ${place.name}`);
        // For local development, skip API call and use placeholder
        if (process.env.NODE_ENV === 'development') {
          console.log('🏠 Development mode: Using placeholder image');
          setDiscoveredImage(`https://via.placeholder.com/300x200?text=${encodeURIComponent(place.name)}`);
          return;
        }
        
        const response = await fetch(`/api/discover-image?name=${encodeURIComponent(place.name)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.imagePath) {
            console.log(`✅ Discovered image: ${data.imagePath}`);
            setDiscoveredImage(data.imagePath);
            return;
          }
        }
        console.log(`❌ No image discovered for: ${place.name}`);
      } catch (error) {
        console.error('Discovery API error:', error);
      } finally {
        setIsDiscovering(false);
      }
    };
    
    discoverImage();
  }, [place.name, isDiscovering, discoveredImage, hasAttempted]);
  
  if (discoveredImage) {
    return (
      <div className="relative w-full h-full">
        <img
          src={discoveredImage}
          alt={place.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Discovered image failed to load:', discoveredImage);
            setDiscoveredImage(null);
          }}
          onLoad={() => {
            console.log('Discovered image loaded successfully:', discoveredImage);
          }}
        />
        
        {/* Allergen Score Overlay */}
        {hasRatings && (
          <div className="absolute top-2 right-2">
                                    <div
                          className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-md"
                          style={{ backgroundColor: getScoreColor(averageRating) }}
                        >
              {averageRating}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  if (isDiscovering) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          <div className="text-xs">Finding image...</div>
        </div>
      </div>
    );
  }
  
  // Final fallback to placeholder
  return (
    <div className="w-full h-full flex items-center justify-center text-gray-400">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}











const ListView = memo(function ListView({ 
  places, 
  onPlaceClick, 
  highlightedPlace, 
  setHighlightedPlace,
  selectedPlace = null,
  safeForAllergens,
  setSafeForAllergens,
  selectedMinimumRating,
  setSelectedMinimumRating,
  userAllergies = [],
  showAllAllergies = false,
  setShowAllAllergies,
  isLoggedIn = false,
  showMobileListView
}: ListViewProps) {
  
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating');
  const scrollableRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [filtersHeight, setFiltersHeight] = useState(0);

  // Filter places based on applied filters
    const filteredPlaces = useMemo(() => {
    // Safety check: ensure places is an array
    if (!Array.isArray(places)) {
      console.warn('⚠️ ListView received places that is not an array:', places);
      return [];
    }

    if (places.length === 0) {
      return [];
    }

    // Apply filters with dynamic average calculation based on selected allergens
    let filtered = places;
    
    // Helper function to calculate average score for selected allergens (or all if none selected)
    const getEffectiveAverageScore = (place: Place) => {
      const scores = place.averageAllergenScores || {};
      
      if (safeForAllergens.length > 0) {
        // Calculate average based only on selected allergens
        const selectedScores = safeForAllergens
          .map(allergen => scores[allergen])
          .filter(score => typeof score === 'number' && score !== null && score !== undefined) as number[];
        
        if (selectedScores.length === 0) return 0;
        return selectedScores.reduce((a, b) => a + b, 0) / selectedScores.length;
      } else {
        // Use overall average (all allergens)
        return getAverageAllergenRating(place.allergenRatings || {}, place.averageAllergenScores);
      }
    };

    // Apply allergen filters if any are selected (show places with data for ANY selected allergens)
    if (safeForAllergens.length > 0) {
      filtered = filtered.filter(place => {
        const scores = place.averageAllergenScores || {};
        
        // Show places that have reviews for ANY of the selected allergens (any score, not just good ones)
        return safeForAllergens.some(allergen => {
          const score = scores[allergen];
          return score !== undefined && score !== null && score > 0; // Show any place that has been rated for this allergen
        });
      });
    }

    // Apply minimum rating filter based on effective average score
    if (selectedMinimumRating !== null) {
      filtered = filtered.filter(place => {
        const effectiveAverage = getEffectiveAverageScore(place);
        
        if (effectiveAverage === 0) {
          // No relevant allergen ratings, exclude from rating filter
          return false;
        }
        
        return effectiveAverage >= selectedMinimumRating;
      });
    }

    return filtered;
  }, [places, safeForAllergens, selectedMinimumRating]);



  // Hover handlers for map integration - memoized to prevent re-renders
  const handlePlaceHover = useCallback((place: Place) => {
    setHighlightedPlace(place);
  }, [setHighlightedPlace]);

  const handlePlaceLeave = useCallback(() => {
    setHighlightedPlace(null);
  }, [setHighlightedPlace]);

  // Scroll to top when page changes
  const scrollToTop = () => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTop = 0;
    }
  };

  // Handle filter changes - EstablishmentList will auto-reset pagination
  const handleFilterChange = () => {
    setTimeout(scrollToTop, 100);
  };

  // Handle sort change - EstablishmentList will auto-reset pagination  
  const handleSortChange = (newSortBy: 'rating' | 'name') => {
    setSortBy(newSortBy);
    setTimeout(scrollToTop, 100);
  };



  const handlePlaceClick = (place: Place) => {
    onPlaceClick(place);
  };

  // Measure filter height whenever it changes
  useEffect(() => {
    const measureFiltersHeight = () => {
      if (filtersRef.current) {
        const height = filtersRef.current.getBoundingClientRect().height;
        setFiltersHeight(height);
      }
    };

    measureFiltersHeight();

    // Use ResizeObserver to watch for filter height changes
    if (filtersRef.current) {
      const observer = new ResizeObserver(measureFiltersHeight);
      observer.observe(filtersRef.current);
      
      return () => observer.disconnect();
    }
    
    return () => {}; // Return empty cleanup function if no observer
  }, [showAllAllergies, safeForAllergens.length, selectedMinimumRating, isLoggedIn, userAllergies.length]); // Use lengths instead of array references

  return (
    <div className={`${showMobileListView ? 'block min-[1025px]:hidden w-full max-w-full' : 'hidden min-[1025px]:block'} bg-gray-200 border-r border-gray-200 h-screen flex flex-col`}>
      {/* Header Section */}
      <div className="flex-shrink-0" ref={filtersRef}>
        {/* Desktop Header Section - Always show for desktop list view */}
        <div className="hidden min-[1025px]:block p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{filteredPlaces.length} places</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  handleSortChange(e.target.value as 'rating' | 'name');
                }}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating">Best Rated</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Header - Only show on mobile when NOT in overlay mode */}
        {!showMobileListView && (
          <div className="min-[1025px]:hidden flex items-center justify-between p-4 border-t border-gray-300 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{filteredPlaces.length} places</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  handleSortChange(e.target.value as 'rating' | 'name');
                }}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating">Best Rated</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* List Area - Fixed height for reliable scrolling */}
      <div className="flex-1 overflow-y-auto" ref={scrollableRef}>
        <EstablishmentList
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onPlaceClick={onPlaceClick}
          onPlaceHover={handlePlaceHover}
          onPlaceLeave={handlePlaceLeave}
          sortBy={sortBy}
        />
      </div>
    </div>
  );
});

export default ListView; 