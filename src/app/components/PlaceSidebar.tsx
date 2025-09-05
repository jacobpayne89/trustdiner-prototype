"use client";

import { useEffect } from 'react';
import type { EstablishmentWithStats } from '../../../shared/types/core';
import { getAllergenIconKey, formatAllergenName, getAverageAllergenRating, getScoreColor, getScoreLabel } from '@/utils/allergenHelpers';
import { isPlaceChain } from '@/utils/chainDetection';
import { 
  LazyPlaceCardScores, 
  LazyPlaceCardReviews, 
  LazyPlaceCardReviewForm 
} from '@/app/components/PlaceCard/LazyPlaceCardComponents';
import type { PlaceCardState } from '@/hooks/usePlaceCardState';

interface PlaceSidebarProps {
  cardPlace: EstablishmentWithStats;
  isClient: boolean;
  windowWidth: number;
  handleMapClick: () => void;
  user: any;
  getUserAllergies: () => string[];
  placeCardState: PlaceCardState;
}

export default function PlaceSidebar({
  cardPlace,
  isClient,
  windowWidth,
  handleMapClick,
  user,
  getUserAllergies,
  placeCardState
}: PlaceSidebarProps) {
  // Destructure all state and handlers from placeCardState
  const {
    cardTab,
    setCardTab,
    showReviewForm,
    setShowReviewForm,
    editingReview,
    tempAllergenScores,
    setTempAllergenScores,
    tempAllergenComments,
    setTempAllergenComments,
    tempYesNoAnswers,
    setTempYesNoAnswers,
    showAllAllergiesInCard,
    setShowAllAllergiesInCard,
    venueComments,
    venueYesNoData,
    userReviews,
    handleOpenReviewForm,
    handleCancelReview,
    handleSubmitReview
  } = placeCardState;
  
  useEffect(() => {
    // PlaceSidebar mounted - component ready for display
  }, [cardPlace]);

  // PlaceSidebar is now conditionally rendered from parent, so cardPlace is guaranteed to exist

  return (
    <div 
      className={`${!isClient || windowWidth >= 1024 ? 'w-1/4 min-w-80 border-r border-gray-200' : 'fixed inset-0 bg-white z-50'} overflow-y-auto`}
      role="complementary"
      aria-label={`Details for ${cardPlace.name}`}
      tabIndex={-1}
    >
      {/* Place Image with Score Overlay - RESTORED ORIGINAL DESIGN */}
      <div className="relative w-full h-48 bg-gray-200 flex-shrink-0">
        {/* Close button - positioned over image in top-right corner */}
        <button
          className="absolute top-4 right-4 z-10 text-2xl text-gray-600 bg-white bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-100 transition-all pointer-events-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={handleMapClick}
          aria-label={`Close ${cardPlace.name} details`}
        >
          <span aria-hidden="true">×</span>
        </button>
        {(() => {
          // For CHAIN venues, prioritize chain featured image over individual venue photos
          // For INDEPENDENT venues, use their individual photos
          // Chain logos should only appear next to names, not as main images
          let imageUrl = null;
          
          // If this is a chain venue, use the chain's featured image first
          if (isPlaceChain(cardPlace) && cardPlace.chain?.featured_image_path) {
            const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL === '/api' ? '' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
            imageUrl = cardPlace.chain.featured_image_path.startsWith('http') ? 
              cardPlace.chain.featured_image_path : 
              `${backendBaseUrl}${cardPlace.chain.featured_image_path}`;
          } else {
            // For independent venues OR chains without featured images, use individual venue photos
            const processedImageUrl = (cardPlace as any).imageUrl;
            const s3ImageUrl = (cardPlace as any).s3ImageUrl || (cardPlace as any).s3_image_url;
            const localImageUrl = cardPlace.localImageUrl || (cardPlace as any).local_image_url;
            let rawImageUrl = processedImageUrl || s3ImageUrl || localImageUrl;
            
            // Convert Google Places photo references to actual URLs
            if (rawImageUrl && rawImageUrl.startsWith('ATKogp')) {
              const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
              imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${rawImageUrl}&key=${apiKey}`;
            } else {
              imageUrl = rawImageUrl;
            }
          }
          
          // Final fallback to Google Photos if available
          if (!imageUrl && cardPlace.photos && cardPlace.photos.length > 0) {
            imageUrl = typeof cardPlace.photos[0] === 'object' ? cardPlace.photos[0].url : cardPlace.photos[0];
          }
          
          // Use imageUrl as-is for relative URLs (they'll be proxied by Next.js)
          const fullImageUrl = imageUrl || null;
          
          if (fullImageUrl) {
            return (
              <img
                src={fullImageUrl}
                alt={cardPlace.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // Fallback to placeholder silently
                  e.currentTarget.src = '/images/placeholder-restaurant-old.webp';
                }}
              />
            );
          }
          return null;
        })()}
        
        {/* Rating tag with label - matching list view style */}
        {(() => {
          const avgRating = getAverageAllergenRating(cardPlace.allergenRatings || {}, cardPlace.averageAllergenScores);
          const hasRatings = avgRating > 0;
          
          return hasRatings ? (
            <div className="absolute top-3 left-3">
              <div
                className="px-3 py-1 rounded-full text-white text-xs flex items-center justify-center shadow-md"
                style={{ backgroundColor: getScoreColor(avgRating) }}
              >
                <span className="font-bold">{avgRating.toFixed(1)}</span>
                <span className="ml-1 font-normal">{getScoreLabel(avgRating)}</span>
              </div>
            </div>
          ) : null;
        })()}
      </div>

      {/* Place Details */}
      <div className="p-4">
        {/* Restaurant name with chain logo */}
        <div className="flex items-center gap-3 mb-3">
          {cardPlace.chainLogoUrl && (
            <img 
              src={cardPlace.chainLogoUrl} 
              alt={`${cardPlace.chainName} logo`}
              className="w-8 h-8 rounded object-contain flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900">{cardPlace.name}</h1>
        </div>
        
        {/* Address */}
        {(cardPlace.address || cardPlace.placeDetails?.address) && (
          <p className="text-gray-600 mb-3">
            {cardPlace.address || cardPlace.placeDetails?.address}
          </p>
        )}

        {/* Tags - Combined from chain and establishment */}
        <div className="mb-4 flex flex-wrap gap-2">
          {cardPlace.tags && cardPlace.tags.length > 0 ? (
            // Use merged tags from backend
            cardPlace.tags.map((tag: string) => (
              <span 
                key={tag}
                className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${
                  tag === 'Chain' ? 'bg-orange-100 text-orange-800' :
                  tag.includes('Restaurant') || tag.includes('Food') ? 'bg-blue-100 text-blue-800' :
                  tag.includes('Coffee') || tag.includes('Cafe') ? 'bg-amber-100 text-amber-800' :
                  tag.includes('Fast') ? 'bg-red-100 text-red-800' :
                  'bg-purple-100 text-purple-800'
                }`}
              >
                {tag}
              </span>
            ))
          ) : (
            // Fallback to legacy tag display if no tags array
            <>
              {/* Chain Tag */}
              {(cardPlace.chainName || isPlaceChain(cardPlace)) && (
                <span className="inline-block bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full font-medium">
                  Chain
                </span>
              )}
              
              {/* Primary Category */}
              {cardPlace.primaryCategory && (
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                  {cardPlace.primaryCategory}
                </span>
              )}
              
              {/* Cuisine Type */}
              {cardPlace.cuisine && cardPlace.cuisine !== cardPlace.primaryCategory && (
                <span className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full font-medium">
                  {cardPlace.cuisine}
                </span>
              )}
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Review Form or Tabs */}
          {showReviewForm ? (
            /* Review Form */
            <LazyPlaceCardReviewForm
              cardPlace={cardPlace}
              user={user}
              userAllergies={getUserAllergies()}
              tempAllergenScores={tempAllergenScores}
              setTempAllergenScores={setTempAllergenScores}
              tempAllergenComments={tempAllergenComments}
              setTempAllergenComments={setTempAllergenComments}
              tempYesNoAnswers={tempYesNoAnswers}
              setTempYesNoAnswers={setTempYesNoAnswers}
              editingReview={editingReview}
              onCancel={handleCancelReview}
              onSubmit={handleSubmitReview}
            />
          ) : (
            <div className="space-y-4">
              {/* Tab navigation */}
              <div className="flex border-b border-gray-200" role="tablist" aria-label="Restaurant information tabs">
                <button
                  className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    cardTab === 'scores'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setCardTab('scores')}
                  role="tab"
                  aria-selected={cardTab === 'scores'}
                  aria-controls="scores-panel"
                  id="scores-tab"
                >
                  Ratings
                </button>
                <button
                  className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    cardTab === 'comments'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    console.log('🔍 PlaceSidebar: Reviews tab clicked, switching to comments tab');
                    setCardTab('comments');
                  }}
                  role="tab"
                  aria-selected={cardTab === 'comments'}
                  aria-controls="reviews-panel"
                  id="reviews-tab"
                >
                  Reviews
                </button>
                
                {/* Locations tab - only show for aggregated chains */}
                {(cardPlace as any).isAggregatedChain && (
                  <button
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      cardTab === 'locations'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setCardTab('locations')}
                    role="tab"
                    aria-selected={cardTab === 'locations'}
                    aria-controls="locations-panel"
                    id="locations-tab"
                  >
                    Locations
                  </button>
                )}
              </div>

              {/* Tab content */}
              {cardTab === 'scores' && (
                <div
                  role="tabpanel"
                  id="scores-panel"
                  aria-labelledby="scores-tab"
                  tabIndex={0}
                >
                  <LazyPlaceCardScores
                  key={`${cardPlace.id}-${JSON.stringify(cardPlace.averageAllergenScores)}`}
                  cardPlace={cardPlace}
                  user={user}
                  userAllergies={getUserAllergies()}
                  venueComments={venueComments}
                  venueYesNoData={venueYesNoData}
                  showAllAllergiesInCard={showAllAllergiesInCard}
                  setShowAllAllergiesInCard={setShowAllAllergiesInCard}
                  onShowReviewForm={() => setShowReviewForm(true)}
                  handleOpenReviewForm={handleOpenReviewForm}
                  userReviews={userReviews}
                  />
                </div>
              )}
              
              {cardTab === 'comments' && (
                <div
                  role="tabpanel"
                  id="reviews-panel"
                  aria-labelledby="reviews-tab"
                  tabIndex={0}
                >
                  {(() => {
                    // Handle multiple identifier formats from backend
                    const placeUuid = cardPlace.placeId || (cardPlace as any).place_id || (cardPlace as any).uuid;
                    console.log('🔍 PlaceSidebar: Rendering LazyPlaceCardReviews for placeId:', placeUuid);
                    console.log('🔍 PlaceSidebar: cardPlace.placeId:', cardPlace.placeId);
                    console.log('🔍 PlaceSidebar: cardPlace.place_id:', (cardPlace as any).place_id);
                    console.log('🔍 PlaceSidebar: Full cardPlace object keys:', Object.keys(cardPlace));
                    console.log('🔍 PlaceSidebar: cardPlace sample:', {
                      id: cardPlace.id,
                      name: cardPlace.name,
                      placeId: cardPlace.placeId,
                      place_id: (cardPlace as any).place_id,
                      uuid: (cardPlace as any).uuid
                    });
                    console.log('🔍 PlaceSidebar: Resolved placeUuid:', placeUuid);
                    
                    if (!placeUuid) {
                      console.error('❌ PlaceSidebar: No placeUuid found! Cannot load reviews.');
                      return (
                        <div className="text-red-500 p-4">
                          <p>Cannot load reviews: Missing place identifier</p>
                          <p className="text-xs mt-2">Debug: placeId={cardPlace.placeId}, place_id={(cardPlace as any).place_id}</p>
                        </div>
                      );
                    }
                    
                    return (
                      <LazyPlaceCardReviews 
                        placeUuid={placeUuid} 
                        venueComments={venueComments}
                        chainData={(cardPlace as any).isAggregatedChain ? {
                          chainId: cardPlace.chainId,
                          chainName: cardPlace.chainName,
                          locations: (cardPlace as any).chainLocations || []
                        } : undefined}
                      />
                    );
                  })()}
                </div>
              )}
              
              {cardTab === 'locations' && (cardPlace as any).isAggregatedChain && (
                <div
                  role="tabpanel"
                  id="locations-panel"
                  aria-labelledby="locations-tab"
                  tabIndex={0}
                >
                  {/* Locations list for aggregated chains */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      All {(cardPlace as any).chainLocations?.length || 0} Locations
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(cardPlace as any).chainLocations?.map((location: any, index: number) => (
                        <div
                          key={location.id}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => {
                            if (placeCardState.centerMapOnLocation) {
                              placeCardState.centerMapOnLocation(location);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{location.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                            </div>
                            <button 
                              className="ml-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent onClick
                                if (placeCardState.centerMapOnLocation) {
                                  placeCardState.centerMapOnLocation(location);
                                }
                              }}
                            >
                              View on Map
                            </button>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">No locations available</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    Place ID: {cardPlace.placeId || (cardPlace as any).place_id || 'N/A'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
