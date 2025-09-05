"use client";

import { useState, useMemo, memo } from 'react';
import type { EstablishmentWithStats } from '../../../../../shared/types/core';
import EstablishmentCard from './EstablishmentCard';
import { getAverageAllergenRating } from '@/utils/allergenHelpers';
import EstablishmentLoadingState from '../ui/EstablishmentLoadingState';
import EmptyState from '../ui/EmptyState';
import { ALLERGENS } from '@/types';

// Interface for aggregated chain data
interface ChainAggregate {
  id: string; // Use chainId as the unique identifier
  name: string;
  chainId: number;
  chainName: string;
  chainSlug: string | null;
  chainLogoUrl: string | null;
  chainFeaturedImageUrl: string | null;
  chainCategory: string | null;
  locationCount: number;
  locations: EstablishmentWithStats[]; // All individual locations for this chain
  // Use the best representative location for display data
  representativeLocation: EstablishmentWithStats;
  // Aggregated data
  allergenRatings: Record<string, { rating: number; count: number }>;
  averageAllergenScores: Record<string, number>;
  tags: string[];
}

const ITEMS_PER_PAGE = 10;

// Function to aggregate chain locations
function aggregateChains(places: EstablishmentWithStats[]): (EstablishmentWithStats | ChainAggregate)[] {
  const chainMap = new Map<number, EstablishmentWithStats[]>();
  const independentPlaces: EstablishmentWithStats[] = [];

  // Group places by chain (check both new and legacy formats)
  places.forEach(place => {
    const chainId = place.chain_id || (place as any).chainId;
    const chainName = place.chain?.name || (place as any).chainName;
    
    if (chainId && chainName) {
      if (!chainMap.has(chainId)) {
        chainMap.set(chainId, []);
      }
      chainMap.get(chainId)!.push(place);
    } else {
      independentPlaces.push(place);
    }
  });

  // Create aggregated chain objects
  const aggregatedChains: ChainAggregate[] = [];
  chainMap.forEach((locations, chainId) => {
    if (locations.length === 1) {
      // If only one location, treat as independent
      independentPlaces.push(locations[0]);
      return;
    }

    // Find the best representative location (highest rated or first)
    const representativeLocation = locations.reduce((best, current) => {
      const bestRating = getAverageAllergenRating(null, best.avg_allergen_scores);
      const currentRating = getAverageAllergenRating(null, current.avg_allergen_scores);
      return currentRating > bestRating ? current : best;
    });

    // Aggregate allergen scores
    const aggregatedAllergenScores: Record<string, number> = {};
    const allergenCounts: Record<string, number> = {};
    
    locations.forEach(location => {
      if (location.avg_allergen_scores) {
        // Only process canonical allergen keys to avoid legacy mixed keys
        ALLERGENS.forEach(canonicalAllergen => {
          const score = location.avg_allergen_scores?.[canonicalAllergen];
          if (score !== undefined && score !== null) {
            if (!aggregatedAllergenScores[canonicalAllergen]) {
              aggregatedAllergenScores[canonicalAllergen] = 0;
              allergenCounts[canonicalAllergen] = 0;
            }
            aggregatedAllergenScores[canonicalAllergen] += score;
            allergenCounts[canonicalAllergen]++;
          }
        });
      }
    });

    // Calculate averages - only for canonical allergens
    ALLERGENS.forEach(allergen => {
      if (aggregatedAllergenScores[allergen] && allergenCounts[allergen]) {
        aggregatedAllergenScores[allergen] = aggregatedAllergenScores[allergen] / allergenCounts[allergen];
      }
    });

    // Aggregate tags (unique)
    const allTags = new Set<string>();
    locations.forEach(location => {
      if (location.tags) {
        location.tags.forEach(tag => allTags.add(tag));
      }
    });

    const chainName = representativeLocation.chain?.name || (representativeLocation as any).chainName;
    const chainLogoUrl = representativeLocation.chain?.logo_url || (representativeLocation as any).chainLogoUrl;
    const chainFeaturedImageUrl = representativeLocation.chain?.featured_image_path || (representativeLocation as any).chainFeaturedImageUrl;
    
    const chainAggregate: ChainAggregate = {
      id: `chain-${chainId}`,
      name: chainName!,
      chainId,
      chainName: chainName!,
      chainSlug: null, // Not available in new schema
      chainLogoUrl: chainLogoUrl || null,
      chainFeaturedImageUrl: chainFeaturedImageUrl || null,
      chainCategory: null, // Not available in new schema
      locationCount: locations.length,
      locations,
      representativeLocation,
      allergenRatings: {}, // Legacy format - could aggregate if needed
      averageAllergenScores: aggregatedAllergenScores,
      tags: Array.from(allTags)
    };

    aggregatedChains.push(chainAggregate);
  });

  return [...aggregatedChains, ...independentPlaces];
}

// Function to convert ChainAggregate to EstablishmentWithStats-like object for rendering
function chainAggregateToPlace(chainAggregate: ChainAggregate): EstablishmentWithStats {
  const representative = chainAggregate.representativeLocation;
  
  return {
    ...representative,
    id: parseInt(chainAggregate.id.replace('chain-', '')) || representative.id, // Convert back to number
    name: chainAggregate.name,
    uuid: representative.uuid,
    place_id: representative.place_id,
    chain_id: chainAggregate.chainId,
    avg_allergen_scores: chainAggregate.averageAllergenScores,
    tags: chainAggregate.tags,
    // Use chain's featured image first, then fallback to representative location's image
    local_image_url: chainAggregate.chainFeaturedImageUrl || representative.local_image_url,
    // Override address with location count
    address: `${chainAggregate.locationCount} location${chainAggregate.locationCount !== 1 ? 's' : ''}`,
    // Chain information
    chain: {
      name: chainAggregate.chainName,
      logo_url: chainAggregate.chainLogoUrl,
      featured_image_path: chainAggregate.chainFeaturedImageUrl
    },
    // Add a special property to identify this as an aggregated chain
    isAggregatedChain: true,
    chainLocations: chainAggregate.locations,
    aggregatedChainData: chainAggregate
  } as EstablishmentWithStats & { isAggregatedChain: boolean; chainLocations: EstablishmentWithStats[]; aggregatedChainData: ChainAggregate };
}

interface EstablishmentListProps {
  places: EstablishmentWithStats[];
  selectedPlace: EstablishmentWithStats | null;
  onPlaceClick: (place: EstablishmentWithStats) => void;
  onPlaceHover: (place: EstablishmentWithStats) => void;
  onPlaceLeave: () => void;
  sortBy: 'rating' | 'name';
  isLoading?: boolean;
  error?: string | null;
}

const EstablishmentList = memo(function EstablishmentList({
  places,
  selectedPlace,
  onPlaceClick,
  onPlaceHover,
  onPlaceLeave,
  sortBy,
  isLoading = false,
  error = null
}: EstablishmentListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Aggregate chains and sort - ALWAYS call hooks before conditional renders
  const sortedAndPaginatedPlaces = useMemo(() => {
    // First aggregate chains
    const aggregatedItems = aggregateChains(places);
    
    // Sort the aggregated items
    const sorted = aggregatedItems.sort((a, b) => {
      // Helper function to get data from either Place or ChainAggregate
      const getName = (item: Place | ChainAggregate) => {
        return 'chainName' in item && item.chainName ? item.chainName : item.name;
      };
      
      const getRating = (item: Place | ChainAggregate) => {
        if ('averageAllergenScores' in item) {
          return getAverageAllergenRating(item.allergenRatings || {}, item.averageAllergenScores);
        }
        return getAverageAllergenRating(item.allergenRatings || {}, item.averageAllergenScores);
      };
      
      const getGoogleRating = (item: Place | ChainAggregate) => {
        if ('representativeLocation' in item) {
          return parseFloat(item.representativeLocation.rating?.toString() || '0');
        }
        return parseFloat(item.rating?.toString() || '0');
      };

      const isChain = (item: Place | ChainAggregate) => {
        return 'locationCount' in item; // ChainAggregate has locationCount
      };

      if (sortBy === 'name') {
        return getName(a).localeCompare(getName(b));
      } else {
        // New ordering: rating → independent businesses → alphabetical
        const aAllergenRating = getRating(a);
        const bAllergenRating = getRating(b);
        const aIsChain = isChain(a);
        const bIsChain = isChain(b);
        
        // 1. First sort by rating (highest first)
        if (aAllergenRating > 0 && bAllergenRating > 0) {
          const ratingDiff = bAllergenRating - aAllergenRating;
          if (Math.abs(ratingDiff) > 0.01) { // Only if ratings are significantly different
            return ratingDiff;
          }
          // If ratings are very close, continue to next criteria
        }
        
        // If only one has allergen rating, it goes first
        if (aAllergenRating > 0 && bAllergenRating === 0) return -1;
        if (bAllergenRating > 0 && aAllergenRating === 0) return 1;
        
        // 2. Then prioritize independent businesses over chains (if ratings are equal or both 0)
        if (aAllergenRating === bAllergenRating) {
          if (!aIsChain && bIsChain) return -1; // Independent first
          if (aIsChain && !bIsChain) return 1;  // Chain second
        }
        
        // 3. Finally sort alphabetically
        return getName(a).localeCompare(getName(b));
      }
    });

    // Calculate pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    return sorted.slice(startIndex, endIndex);
  }, [places, sortBy, currentPage]);

  // Calculate total pages based on aggregated items
  const totalAggregatedItems = useMemo(() => {
    return aggregateChains(places).length;
  }, [places]);

  const totalPages = Math.ceil(totalAggregatedItems / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when places change (e.g., due to filtering)
  useMemo(() => {
    setCurrentPage(1);
  }, [places.length]);

  // Handle loading state
  if (isLoading) {
    return <EstablishmentLoadingState count={6} message="Loading restaurants..." />;
  }

  // Handle error state
  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Something went wrong"
        description={error}
        action={{
          label: "Refresh",
          onClick: () => window.location.reload()
        }}
        suggestions={[
          "Check your internet connection",
          "Try refreshing the page",
          "Contact support if the problem continues"
        ]}
      />
    );
  }

  // Handle empty state
  if (!places || places.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No restaurants found"
        description="We couldn't find any allergy-friendly restaurants in this area. Try adjusting your filters or search location."
        suggestions={[
          "Remove some allergen filters",
          "Expand your search area",
          "Try searching for a different location",
          "Add a new restaurant to our database"
        ]}
      />
    );
  }

  return (
    <>
      {/* Places List */}
      <div className="p-2 grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 min-[500px]:grid-cols-2 pb-4">
        {sortedAndPaginatedPlaces.map((item) => {
          // Convert ChainAggregate to Place for rendering
          const place = 'locationCount' in item ? chainAggregateToPlace(item) : item;
          
          return (
            <EstablishmentCard
              key={`place-${place.uuid || place.place_id || place.id}`}
              place={place}
              selectedPlace={selectedPlace}
              onPlaceClick={onPlaceClick}
              onPlaceHover={onPlaceHover}
              onPlaceLeave={onPlaceLeave}
            />
          );
        })}
        
        {/* Pagination - Inside scrollable area, spans full grid */}
        {totalPages > 1 && (
          <div className="col-span-full mx-0 lg:mx-2 lg:w-auto mt-4 p-3 border-t border-gray-200 bg-white lg:rounded-lg">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-3 min-h-[44px] text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Go to previous page"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-3 min-h-[44px] text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Go to next page"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

export default EstablishmentList;
