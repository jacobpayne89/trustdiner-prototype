'use client';

import React, { useContext, useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

import { AuthContext } from '@/app/context/AuthContext';
import type { Place, SearchResult } from "@/types";
import { ALLERGENS } from "@/types";

import { useEstablishments } from '@/hooks/useEstablishments';
import { useResponsiveState } from '@/hooks/useResponsiveState';

import { useFilterStore } from '@/hooks/useFilterStore';
import { usePlaceContext } from '@/hooks/usePlaceContext';
import { useSearchStore } from '@/hooks/useSearchStore';
import { useUrlPlaceSelection } from '@/hooks/useUrlPlaceSelection';
import { usePlaceCardState } from '@/hooks/usePlaceCardState';
import { useUserProfile } from '@/hooks/useUserProfile';
import ClientOnly from '@/components/ClientOnly';
import ErrorBoundary from '@/app/components/ui/ErrorBoundary';
import { NetworkError } from '@/app/components/ui/ErrorStates';
import SkipLinks from '@/app/components/ui/SkipLinks';


// Static imports for critical components
import Header from '@/app/components/Header';
import FilterControls from '@/app/components/filters/FilterControls';
import NewLayout from '@/app/components/NewLayout';
import DesktopListView from '@/app/components/layout/DesktopListView';
import MobileListView from '@/app/components/layout/MobileListView';
import MobileFloatingButton from '@/app/components/layout/MobileFloatingButton';
import PlaceSidebar from '@/app/components/PlaceSidebar';

// Dynamic imports for heavy components
const LazyMapContainer = dynamic(() => import('@/app/components/map/LazyMapContainer'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
});

/**
 * HomeContent - Main application orchestrator
 * Coordinates all layout components and manages core application state
 */
function HomeContent({ placeIdFromUrl, editReviewId }: { placeIdFromUrl: string | null; editReviewId: string | null }) {


  // Core data and responsive state - only called here to avoid duplicates
  const { places, establishmentsLoading, establishmentsError, refreshEstablishments, reloadWithFilters, retryLoad } = useEstablishments();
  
  // Temporary: Use new layout for testing
  const useNewLayout = true;
  if (useNewLayout) {
    return (
      <ClientOnly fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-600">Loading TrustDiner...</div></div>}>
        <NewLayout 
          placeIdFromUrl={placeIdFromUrl}
          editReviewId={editReviewId}
          places={places}
          establishmentsLoading={establishmentsLoading}
          establishmentsError={establishmentsError}
          refreshEstablishments={refreshEstablishments}
          reloadWithFilters={reloadWithFilters}
        />
      </ClientOnly>
    );
  }
}

/**
 * LegacyHomeContent - Original home content with all hooks
 */
function LegacyHomeContent({ placeIdFromUrl }: { placeIdFromUrl: string | null }) {
  const { user } = useContext(AuthContext);

  // Legacy code - useEstablishments moved to parent HomeContent to avoid duplicates
  const { isClient, windowWidth } = useResponsiveState();
  const filterStore = useFilterStore();
  const placeContext = usePlaceContext();
  const searchStore = useSearchStore();
  const userProfile = useUserProfile();

  // Get current selected/highlighted places
  const { cardPlace, highlightedPlace } = placeContext;
  
  // Separate hover state for map to prevent conflicts with list hover
  const [mapHoveredPlace, setMapHoveredPlace] = useState<Place | null>(null);
  
  // Helper function to get user allergies (must be defined before usePlaceCardState)
  const getUserAllergies = useCallback(() => {
    // User profile allergies are the primary source
    const rawAllergies = userProfile.allergens || user?.allergies || [];
    
    // Filter to only canonical allergen keys to prevent legacy mixed keys
    const canonicalAllergies = rawAllergies.filter(allergen => 
      ALLERGENS.includes(allergen as any)
    );
    
    console.log('🔍 getUserAllergies called:', {
      userProfileAllergens: userProfile.allergens,
      userAllergens: user?.allergies,
      rawAllergies,
      canonicalAllergies,
      result: canonicalAllergies
    });
    return canonicalAllergies;
  }, [userProfile.allergens, user?.allergies]);
  
  // Enhanced callback for review submission that refreshes both list and current place
  const handleReviewSubmitted = useCallback(async () => {
    console.log('🔄 Review submitted - refreshing establishments and updating current place...');
    
    if (!cardPlace) {
      console.log('⚠️ No cardPlace selected, just refreshing establishments');
      await refreshEstablishments();
      return;
    }

    const currentPlaceId = cardPlace.id;
    console.log('🔄 Updating current place card with fresh data for place ID:', currentPlaceId);
    
    // Add a small delay to ensure database transaction is committed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Refresh the establishments list with fresh data
    await refreshEstablishments();
    
    // Use a longer delay and check multiple times to ensure the places state is updated
    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = 200;
    
    const updateCardPlace = () => {
      attempts++;
      console.log(`🔍 Attempt ${attempts}/${maxAttempts} to find updated place data...`);
      
      // Find the updated place in the refreshed list
      const updatedPlace = places.find(place => place.id === currentPlaceId);
      
      if (updatedPlace) {
        console.log('✅ Found updated place data, updating cardPlace:', updatedPlace.name);
        console.log('🔍 Page: Updated place averageAllergenScores:', updatedPlace.averageAllergenScores);
        console.log('🔍 Page: Updated place avg_allergen_scores:', (updatedPlace as any).avg_allergen_scores);
        console.log('🔍 Page: Updated place review_count:', updatedPlace.reviewCount);
        placeContext.setCardPlace(updatedPlace);
      } else if (attempts < maxAttempts) {
        console.log(`⏳ Place not found yet, retrying in ${checkInterval}ms...`);
        setTimeout(updateCardPlace, checkInterval);
      } else {
        console.log('⚠️ Could not find updated place in refreshed list after all attempts');
      }
    };
    
    // Start checking after a small delay
    setTimeout(updateCardPlace, checkInterval);
  }, [refreshEstablishments, cardPlace, places, placeContext]);

  // Place card state management (must come after cardPlace is defined)
  const placeCardState = usePlaceCardState({ 
    cardPlace, 
    user,
    getUserAllergies,
    onReviewSubmitted: handleReviewSubmitted // Enhanced callback for review submission
  });

  // Clear search when place_id changes in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    searchStore.clearSearch();
    searchStore.setShowDropdown(false);
  }, [placeIdFromUrl]); // Remove searchStore to prevent infinite re-renders
  
  // UI state
  const [showMobileListView, setShowMobileListView] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // URL-based place selection
  useUrlPlaceSelection({
    placeIdFromUrl,
    places,
    onPlaceSelect: placeContext.openPlaceCard
  });

  // Filter change handler for FilterControls component
  const handleFilterChange = useCallback((allergens: string[], rating: number | null) => {
    filterStore.setSelectedAllergens(allergens);
    filterStore.setSelectedMinimumRating(rating);
  }, [filterStore]);

  // Place interaction handlers
  const handlePlaceClick = useCallback((place: Place) => {
    placeContext.handlePlaceClick(place);
    // Clear search UI on any selection from list/map
    searchStore.clearSearch();
    searchStore.setShowDropdown(false);
    // On mobile, hide the list view when a place is selected
    if (windowWidth < 1024) {
      setShowMobileListView(false);
    }
  }, [windowWidth, placeContext, searchStore]);

  const handleMapClick = useCallback(() => {
    placeContext.handleMapClick();
  }, [placeContext]);



  // Memoize user allergies to prevent infinite re-renders
  const memoizedUserAllergies = useMemo(() => {
    return user?.allergies || [];
  }, [user?.allergies]);

  // Initialize filter store with user allergies when they become available
  useEffect(() => {
    if (user?.allergies && user.allergies.length > 0) {
      console.log('🔧 Initializing filter store with user allergies:', user.allergies);
      filterStore.initializeUserAllergensIfEmpty(user.allergies);
    }
  }, [user?.allergies, filterStore]);

  // Memoize stable callbacks to prevent render loops
  const handlePlaceSelectFromSearch = useCallback((result: SearchResult) => {
    if (!Array.isArray(places)) return;
    const matched = places.find(p => p.placeId === result.place_id);
    if (matched) {
      placeContext.openPlaceCard(matched);
    }
  }, [places, placeContext.openPlaceCard]);

  // Show error state if establishments failed to load
  if (establishmentsError && !establishmentsLoading && places.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <NetworkError
            title="Unable to Load Restaurants"
            message="We couldn't load the restaurant data. Please check your connection and try again."
            onRetry={retryLoad}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Skip Links for accessibility */}
      <SkipLinks />
      
      {/* Header with search and navigation */}
      <Header />
      
      {/* Filter Controls */}
      <FilterControls user={user} filterStore={filterStore} />

      {/* Main content area */}
      <main 
        id="main-content" 
        className="flex flex-1 overflow-hidden main-content-area"
        role="main"
        aria-label="Restaurant map and list"
      >
        {/* Desktop List View */}
        <DesktopListView
          places={places}
          onPlaceClick={handlePlaceClick}
          highlightedPlace={highlightedPlace}
          setHighlightedPlace={placeContext.setHighlightedPlace}
          safeForAllergens={filterStore.selectedAllergens}
          setSafeForAllergens={filterStore.setSelectedAllergens}
          selectedMinimumRating={filterStore.selectedMinimumRating}
          setSelectedMinimumRating={filterStore.setSelectedMinimumRating}
          showAllAllergies={filterStore.showAllAllergens}
          setShowAllAllergies={filterStore.setShowAllAllergens}
          userAllergies={memoizedUserAllergies}
          isLoggedIn={!!user}
          isClient={isClient}
          windowWidth={windowWidth}
          isLoading={establishmentsLoading}
        />

        {/* Place Sidebar/Card - Between List and Map */}
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

        {/* Map Container */}
        <div className="flex-1 relative">
          {isClient && (
            <ErrorBoundary fallback={
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">🗺️</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Map Unavailable</h3>
                  <p className="text-gray-500">The map couldn't load. Please refresh the page.</p>
                </div>
              </div>
            }>
              <LazyMapContainer
                places={places}
                selectedPlace={cardPlace}
                setSelectedPlace={placeContext.openPlaceCard}
                hoveredMarker={mapHoveredPlace}
                setHoveredMarker={setMapHoveredPlace}
                onMapLoad={setMap}
                onPlaceCardOpen={placeContext.openPlaceCard}
              />
            </ErrorBoundary>
          )}
        </div>

        {/* Mobile List View */}
        <MobileListView
          places={places}
          onPlaceClick={handlePlaceClick}
          highlightedPlace={highlightedPlace}
          setHighlightedPlace={placeContext.setHighlightedPlace}
          safeForAllergens={filterStore.selectedAllergens}
          setSafeForAllergens={filterStore.setSelectedAllergens}
          selectedMinimumRating={filterStore.selectedMinimumRating}
          setSelectedMinimumRating={filterStore.setSelectedMinimumRating}
          showAllAllergies={filterStore.showAllAllergens}
          setShowAllAllergies={filterStore.setShowAllAllergens}
          userAllergies={memoizedUserAllergies}
          isLoggedIn={!!user}
          isClient={isClient}
          windowWidth={windowWidth}
          showMobileListView={showMobileListView}
          setShowMobileListView={setShowMobileListView}
        />

        {/* Mobile Floating Action Button - Toggle between Map and List */}
        <MobileFloatingButton
          isClient={isClient}
          windowWidth={windowWidth}
          cardPlace={cardPlace}
          showMobileListView={showMobileListView}
          setShowMobileListView={setShowMobileListView}
        />
      </main>
    </div>
  );
}

// URL parameter wrapper component
function URLParamHandler() {
  // Removed excessive logging to prevent console spam
  const searchParams = useSearchParams();
  const placeIdFromUrl = searchParams?.get ? searchParams.get('place_id') : 
                         searchParams && 'place_id' in searchParams ? searchParams['place_id'] as string : null;
  const editReviewId = searchParams?.get ? searchParams.get('edit_review') : 
                       searchParams && 'edit_review' in searchParams ? searchParams['edit_review'] as string : null;
  
  return <HomeContent placeIdFromUrl={placeIdFromUrl} editReviewId={editReviewId} />;
}

// Main page component with URL parameter handling  
export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <URLParamHandler />
    </Suspense>
  );
}
