'use client';

import React, { useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { AuthContext } from '@/app/context/AuthContext';
import type { Place } from "@/types";
import { ALLERGENS } from "@/types";

import { useResponsiveState } from '@/hooks/useResponsiveState';
import { useFilterStore } from '@/hooks/useFilterStore';
import { usePlaceContext } from '@/hooks/usePlaceContext';
import { useSearchStore } from '@/hooks/useSearchStore';
import { useUrlPlaceSelection } from '@/hooks/useUrlPlaceSelection';
import { usePlaceCardState } from '@/hooks/usePlaceCardState';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useChainToggle } from '@/hooks/useChainToggle';

// Static imports for critical components
import Header from '@/app/components/Header';
import FilterControls from '@/app/components/filters/FilterControls';
import DesktopListView from '@/app/components/layout/DesktopListView';
import MobileListView from '@/app/components/layout/MobileListView';
import MobileFloatingButton from '@/app/components/layout/MobileFloatingButton';
import PlaceSidebar from '@/app/components/PlaceSidebar';
import LazyMapContainer from '@/app/components/map/LazyMapContainer';

interface NewLayoutProps {
  placeIdFromUrl: string | null;
  places: Place[];
  establishmentsLoading: boolean;
  establishmentsError: string | null;
  refreshEstablishments: () => Promise<void>;
  reloadWithFilters: (params: any) => Promise<void>;
}

export default function NewLayout({ 
  placeIdFromUrl, 
  places, 
  establishmentsLoading, 
  establishmentsError, 
  refreshEstablishments, 
  reloadWithFilters 
}: NewLayoutProps) {
  
  const { user } = useContext(AuthContext);
  const { isClient, windowWidth } = useResponsiveState();
  const filterStore = useFilterStore();
  const placeContext = usePlaceContext();
  const searchStore = useSearchStore();
  const userProfile = useUserProfile();
  const chainToggle = useChainToggle();

  // Get current selected/highlighted places
  const { cardPlace, highlightedPlace } = placeContext;
  
  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 });
  const [mapZoom, setMapZoom] = useState(12);
  const [activeLocation, setActiveLocation] = useState<Place | null>(null);

  // Helper function to get user allergies (must be defined before usePlaceCardState)
  const getUserAllergies = useCallback(() => {
    // User profile allergies are the primary source
    const rawAllergies = userProfile.allergens || user?.allergies || [];
    
    // Filter to only canonical allergen keys to prevent legacy mixed keys
    const canonicalAllergies = rawAllergies.filter(allergen => 
      ALLERGENS.includes(allergen as any)
    );
    
    return canonicalAllergies;
  }, [user?.allergies]);

  // UI state
  const [showMobileList, setShowMobileList] = useState(false);

  // Map centering function - defined before usePlaceCardState
  const centerMapOnLocation = useCallback((location: Place) => {
    const lat = location.position?.lat || location.latitude;
    const lng = location.position?.lng || location.longitude;
    
    if (typeof lat === 'number' && typeof lng === 'number') {
      setMapCenter({ lat, lng });
      setMapZoom(16); // Zoom in closer when centering on a specific location
      setActiveLocation(location);
      
      // Clear active location after 3 seconds
      setTimeout(() => {
        setActiveLocation(null);
      }, 3000);
    }
  }, []);
  
  // Simplified callback for review submission - single refresh only
  const handleReviewSubmitted = useCallback(async (isEdit: boolean = false) => {
    console.log(`🔄 NewLayout: Review ${isEdit ? 'edited' : 'submitted'} - refreshing establishments...`);
    
    // Simple refresh without aggressive retry logic
    await refreshEstablishments();
    
    console.log('✅ NewLayout: Establishments refreshed after review submission');
  }, [refreshEstablishments]);

  // Place card state management
  const placeCardState = usePlaceCardState({ 
    cardPlace, 
    user,
    getUserAllergies,
    onReviewSubmitted: handleReviewSubmitted,
    centerMapOnLocation
  });

  // URL-based place selection
  useUrlPlaceSelection({
    placeIdFromUrl,
    places,
    onPlaceSelect: placeContext.openPlaceCard
  });

  // Memoized user allergies for performance
  const memoizedUserAllergies = useMemo(() => getUserAllergies(), [getUserAllergies]);

  // Trigger server-side filtering when filter store changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const hasActiveFilters = filterStore.selectedAllergens.length > 0 || filterStore.selectedMinimumRating !== null;
      
      if (hasActiveFilters) {
        console.log('🔍 NewLayout: Applying server-side filters:', {
          allergens: filterStore.selectedAllergens,
          minRating: filterStore.selectedMinimumRating
        });
        
        reloadWithFilters({
          allergenSafe: filterStore.selectedAllergens.length > 0 ? filterStore.selectedAllergens : undefined,
          minRating: filterStore.selectedMinimumRating || undefined
        });
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [filterStore.selectedAllergens, filterStore.selectedMinimumRating, reloadWithFilters]);

  // Shared filtering function that applies the same logic as ListView
  const applyClientSideFilters = useCallback((
    places: Place[], 
    selectedAllergens: string[], 
    selectedMinimumRating: number | null
  ): Place[] => {
    let filtered = places;

    // Apply allergen safety filter
    if (selectedAllergens.length > 0) {
      filtered = filtered.filter(place => {
        if (!place.averageAllergenScores) return false;
        
        return selectedAllergens.every(allergen => {
          const score = place.averageAllergenScores?.[allergen];
          return score !== undefined && score >= 3; // Safe threshold
        });
      });
    }

    // Apply minimum rating filter
    if (selectedMinimumRating !== null) {
      filtered = filtered.filter(place => {
        const rating = place.rating || place.averageRating;
        return rating !== undefined && rating >= selectedMinimumRating;
      });
    }

    return filtered;
  }, []);

  // Use the places data from props (from useEstablishments hook)
  const actualPlaces = places || [];

  // Filter places for list view (apply same filters as map)
  const filteredPlaces = useMemo(() => {
    console.log('🔍 NewLayout: Filtering places for list view:', {
      total: actualPlaces.length,
      selectedAllergens: filterStore.selectedAllergens,
      selectedMinimumRating: filterStore.selectedMinimumRating
    });
    
    // Apply the same client-side filtering that the map uses
    return applyClientSideFilters(actualPlaces, filterStore.selectedAllergens, filterStore.selectedMinimumRating);
  }, [actualPlaces, filterStore.selectedAllergens, filterStore.selectedMinimumRating]);

  // Filter places for map (apply same filters as list view, plus chain toggle)
  const mapPlaces = useMemo(() => {
    let filtered = applyClientSideFilters(actualPlaces, filterStore.selectedAllergens, filterStore.selectedMinimumRating);
    
    // Apply chain toggle filter
    if (!chainToggle.showChains) {
      filtered = filtered.filter(place => !place.chainId);
    }
    
    return filtered;
  }, [actualPlaces, chainToggle.showChains, filterStore.selectedAllergens, filterStore.selectedMinimumRating]);

  // Function to create aggregated chain object from individual place
  const createChainAggregateFromPlace = useCallback((place: Place): Place & { isAggregatedChain: boolean; chainLocations: Place[] } => {
    if (!place.chainId || !place.chainName) {
      return { ...place, isAggregatedChain: false, chainLocations: [] };
    }

    // Find all places with the same chain ID
    const chainLocations = places.filter(p => p.chainId === place.chainId);
    
    // Aggregate allergen scores across all chain locations
    const aggregatedScores: Record<string, number> = {};
    const scoreCounts: Record<string, number> = {};
    
    chainLocations.forEach(location => {
      if (location.averageAllergenScores) {
        Object.entries(location.averageAllergenScores).forEach(([allergen, score]) => {
          if (score !== undefined && score !== null) {
            if (!aggregatedScores[allergen]) {
              aggregatedScores[allergen] = 0;
              scoreCounts[allergen] = 0;
            }
            aggregatedScores[allergen] += score;
            scoreCounts[allergen]++;
          }
        });
      }
    });
    
    // Calculate averages
    Object.keys(aggregatedScores).forEach(allergen => {
      if (scoreCounts[allergen] > 0) {
        aggregatedScores[allergen] = aggregatedScores[allergen] / scoreCounts[allergen];
      }
    });
    
    // Calculate total review count
    const totalReviewCount = chainLocations.reduce((sum, location) => sum + (location.reviewCount || 0), 0);
    
    return {
      ...place,
      id: `chain-${place.chainId}`,
      name: `${place.chainName} (Chain)`,
      averageAllergenScores: aggregatedScores,
      reviewCount: totalReviewCount,
      isAggregatedChain: true,
      chainLocations: chainLocations, // Store all locations for the Locations tab
    } as Place & { isAggregatedChain: boolean; chainLocations: Place[] };
  }, [places]);

  // Place interaction handlers
  const handlePlaceSelect = useCallback((place: Place) => {
    console.log('🎯 NewLayout: Place selected:', place.name);
    placeContext.openPlaceCard(place);
    searchStore.clearSearch();
    searchStore.setShowDropdown(false);
  }, [placeContext, searchStore, createChainAggregateFromPlace]);

  const handlePlaceHover = useCallback((place: Place | null) => {
    placeContext.setHighlightedPlace(place);
  }, [placeContext]);

  const handleMapClick = useCallback(() => {
    placeContext.closePlaceCard();
  }, [placeContext]);

  // Search handlers for the FilterBar
  const handleSearchResultSelect = useCallback((result: any) => {
    console.log('🔍 NewLayout: Search result selected:', result);
    
    if (result.place_id) {
      // This is a Google Places result that needs to be imported
      console.log('🔍 NewLayout: Google Places result - will be handled by SearchBar import logic');
      return;
    }
    
    // This is an existing place in our database
    const place = places.find(p => 
      p.id === result.id || 
      p.uuid === result.id ||
      p.name.toLowerCase().includes(result.name?.toLowerCase() || '')
    );
    
    if (place) {
      console.log('🎯 NewLayout: Found existing place, selecting:', place.name);
      handlePlaceSelect(place);
    } else {
      console.warn('⚠️ NewLayout: Could not find place for search result:', result);
    }
    
    searchStore.clearSearch();
    searchStore.setShowDropdown(false);
  }, [places, placeContext, searchStore]);

  // Handler for opening newly imported places
  const handlePlaceImportedAndOpen = useCallback((placeId: string, placeName: string) => {
    console.log('🎯 NewLayout: Opening newly imported place:', placeName, 'ID:', placeId);
    
    // Try to find the place in the current places array
    const place = places.find(p => 
      p.id === placeId || 
      p.uuid === placeId ||
      (typeof p.id === 'string' && p.id.includes(placeId)) ||
      (typeof p.uuid === 'string' && p.uuid.includes(placeId))
    );
    
    if (place) {
      console.log('✅ NewLayout: Found imported place, opening card:', place.name);
      placeContext.openPlaceCard(place);
      searchStore.clearSearch();
      searchStore.setShowDropdown(false);
    } else {
      console.warn(`⚠️ Could not find newly imported place: ${placeName} (ID: ${placeId})`);
      if (places.length > 0) {
        console.log('🔍 Available place IDs:', places.slice(0, 5).map(p => ({ id: p.id, uuid: p.uuid, name: p.name })));
      }
    }
  }, [places, placeContext, searchStore, createChainAggregateFromPlace, refreshEstablishments]);

  const handleAllergenToggle = useCallback((allergen: string) => {
    // Handle clear all filters
    if (allergen === 'clear-all') {
      filterStore.clearFilters();
      return;
    }

    const currentAllergens = filterStore.selectedAllergens;
    const newAllergens = currentAllergens.includes(allergen)
      ? currentAllergens.filter(a => a !== allergen)
      : [...currentAllergens, allergen];
    filterStore.setSelectedAllergens(newAllergens);
  }, [filterStore]);

  const handleRatingFilter = useCallback((rating: number | undefined) => {
    filterStore.setSelectedMinimumRating(rating || null);
  }, [filterStore]);

  // Loading and error states
  if (establishmentsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load restaurants</h2>
          <p className="text-gray-600 mb-4">{establishmentsError}</p>
          <button 
            onClick={refreshEstablishments}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading TrustDiner...</div>
      </div>
    );
  }

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        user={user}
        onPlaceImported={refreshEstablishments}
        onPlaceImportedAndOpen={handlePlaceImportedAndOpen}
      />

      {/* Filter Controls */}
      <FilterControls
        selectedAllergens={filterStore.selectedAllergens}
        selectedMinimumRating={filterStore.selectedMinimumRating}
        onAllergenToggle={handleAllergenToggle}
        onRatingFilter={handleRatingFilter}
        onSearchResultSelect={handleSearchResultSelect}
        showChains={chainToggle.showChains}
        onToggleChains={chainToggle.toggleShowChains}
        onPlaceImported={refreshEstablishments}
        onPlaceImportedAndOpen={handlePlaceImportedAndOpen}
      />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Desktop: Side-by-side layout */}
        {isDesktop && (
          <>
            {/* Left Panel - List */}
            <div className="w-1/2 flex flex-col">
              <DesktopListView
                places={filteredPlaces}
                loading={establishmentsLoading}
                onPlaceSelect={handlePlaceSelect}
                onPlaceHover={handlePlaceHover}
                highlightedPlace={highlightedPlace}
                selectedPlace={cardPlace}
                userAllergies={memoizedUserAllergies}
              />
            </div>

            {/* Right Panel - Map */}
            <div className="w-1/2 relative">
              <LazyMapContainer
                places={mapPlaces}
                center={mapCenter}
                zoom={mapZoom}
                onPlaceSelect={handlePlaceSelect}
                onPlaceHover={handlePlaceHover}
                onMapClick={handleMapClick}
                highlightedPlace={highlightedPlace}
                selectedPlace={cardPlace}
                activeLocation={activeLocation}
                userAllergies={memoizedUserAllergies}
              />
            </div>
          </>
        )}

        {/* Tablet: Map with overlay */}
        {isTablet && (
          <div className="w-full relative">
            <LazyMapContainer
              places={mapPlaces}
              center={mapCenter}
              zoom={mapZoom}
              onPlaceSelect={handlePlaceSelect}
              onPlaceHover={handlePlaceHover}
              onMapClick={handleMapClick}
              highlightedPlace={highlightedPlace}
              selectedPlace={cardPlace}
              activeLocation={activeLocation}
              userAllergies={memoizedUserAllergies}
            />
            
            {/* Floating List Button */}
            <MobileFloatingButton
              onClick={() => setShowMobileList(true)}
              count={filteredPlaces.length}
            />

            {/* Mobile List Overlay */}
            {showMobileList && (
              <MobileListView
                places={filteredPlaces}
                loading={establishmentsLoading}
                onPlaceSelect={(place) => {
                  handlePlaceSelect(place);
                  setShowMobileList(false);
                }}
                onClose={() => setShowMobileList(false)}
                userAllergies={memoizedUserAllergies}
              />
            )}
          </div>
        )}

        {/* Mobile: Map with overlay */}
        {isMobile && (
          <div className="w-full relative">
            <LazyMapContainer
              places={mapPlaces}
              center={mapCenter}
              zoom={mapZoom}
              onPlaceSelect={handlePlaceSelect}
              onPlaceHover={handlePlaceHover}
              onMapClick={handleMapClick}
              highlightedPlace={highlightedPlace}
              selectedPlace={cardPlace}
              activeLocation={activeLocation}
              userAllergies={memoizedUserAllergies}
            />
            
            {/* Floating List Button */}
            <MobileFloatingButton
              onClick={() => setShowMobileList(true)}
              count={filteredPlaces.length}
            />

            {/* Mobile List Overlay */}
            {showMobileList && (
              <MobileListView
                places={filteredPlaces}
                loading={establishmentsLoading}
                onPlaceSelect={(place) => {
                  handlePlaceSelect(place);
                  setShowMobileList(false);
                }}
                onClose={() => setShowMobileList(false)}
                userAllergies={memoizedUserAllergies}
              />
            )}
          </div>
        )}
      </div>

      {/* Place Sidebar */}
      {cardPlace && (
        <PlaceSidebar
          cardPlace={cardPlace}
          isClient={isClient}
          windowWidth={windowWidth}
          handleMapClick={handleMapClick}
          user={user}
          getUserAllergies={getUserAllergies}
          placeCardState={placeCardState}
        />
      )}
    </div>
  );
}
