"use client";

import React, { useState, useEffect } from 'react';
import { AllergenIcon, type AllergenKey } from '@/app/components/icons';
import { ALLERGENS, ALLERGEN_DISPLAY_NAMES, sortAllergens, type AllergenKey } from '@/types';
import AllergenHandlingStats from './AllergenHandlingStats';

// ALLERGENS is imported from @/types

// Review questions from review form - matching database fields
const REVIEW_QUESTIONS = [
  { 
    id: 'allergen_menu', 
    question: 'Did they have an allergen menu?',
    descriptiveText: 'were offered an allergen menu'
  },
  { 
    id: 'staff_allergy_trained', 
    question: 'Did the staff understand allergies?',
    descriptiveText: 'staff were confident about allergies'
  },
  { 
    id: 'staff_notified_kitchen', 
    question: 'Did staff notify kitchen about allergies?',
    descriptiveText: 'staff notified kitchen about allergies'
  },
  { 
    id: 'separate_preparation_area', 
    question: 'Was food prepared separately?',
    descriptiveText: 'said kitchen catered to allergies'
  }
];

// Helper function for score colors (from original)
function getScoreColor(score: number, hasRating: boolean = true): string {
  if (!hasRating || score === 0) return "#D1D5DB"; // light grey for no ratings
  if (score >= 5) return "#22C55E"; // green (5 - Excellent)
  if (score >= 4) return "#84CC16"; // lime (4 - Good)
  if (score >= 3) return "#EAB308"; // yellow (3 - Okay)
  if (score >= 2) return "#F97316"; // orange (2 - Avoid)
  return "#EF4444"; // red (1 - Unsafe)
}

// Helper function for allergen icon keys - maps API allergen names to icon keys
function getAllergenIconKey(allergen: string): string {
  const mapping: Record<string, string> = {
    'tree_nuts': 'treenuts',
    'milk': 'dairy', // Maps to milk.svg via ALLERGEN_SVG_MAP
    'soybeans': 'soy', // Maps to soybean.svg via ALLERGEN_SVG_MAP  
    'soybean': 'soy',
    'sulphites': 'sulfites',
    'sulfites': 'sulfites'
  };
  
  return mapping[allergen.toLowerCase()] || allergen.toLowerCase();
}

// Helper function to get allergen rating from either data format
function getAllergenRating(
  allergen: string, 
  allergenRatings?: Record<string, { rating: number; count: number }>, 
  averageScores?: Record<string, number>,
  individualReviewScores?: Record<string, number>
): { rating: number; count: number } {
  console.log(`🔍 getAllergenRating called for ${allergen}:`, {
    averageScores,
    allergenRatings,
    individualReviewScores,
    hasAverageScore: averageScores?.[allergen] !== undefined,
    hasIndividualScore: individualReviewScores?.[allergen] !== undefined,
    averageScoreValue: averageScores?.[allergen],
    individualScoreValue: individualReviewScores?.[allergen]
  });
  
  // PRIORITY 1: Use individual user's review scores if available (most specific)
  if (individualReviewScores && individualReviewScores[allergen] !== undefined && individualReviewScores[allergen] !== null) {
    const result = { rating: individualReviewScores[allergen], count: 1 };
    console.log(`✅ Using individualReviewScores for ${allergen}:`, result);
    return result;
  }
  
  // PRIORITY 2: Use new averageAllergenScores if available (this is the current format from API)
  if (averageScores && averageScores[allergen] !== undefined && averageScores[allergen] !== null) {
    const result = { rating: averageScores[allergen], count: 1 };
    console.log(`✅ Using averageScores for ${allergen}:`, result);
    return result;
  }
  
  // PRIORITY 3: Fall back to legacy allergenRatings format
  if (allergenRatings && allergenRatings[allergen]) {
    const result = allergenRatings[allergen];
    console.log(`✅ Using allergenRatings for ${allergen}:`, result);
    return result;
  }
  
  const result = { rating: 0, count: 0 };
  console.log(`❌ No data found for ${allergen}, returning:`, result);
  return result;
}

interface PlaceCardScoresProps {
  cardPlace: {
    id: string;
    placeId?: string;
    allergenRatings?: Record<string, { rating: number; count: number }>;
    averageAllergenScores?: Record<string, number>;
    allergyHandlingStats?: {
      staffTrained: { yes: number; total: number };
      separatePrep: { yes: number; total: number };
      wouldRecommend: { yes: number; total: number };
    };
    hasReviews?: boolean;
    reviewCount?: number;
  };
  user: any;
  userAllergies: string[];
  venueComments: any[];
  venueYesNoData: Record<string, any>;
  showAllAllergiesInCard: boolean;
  setShowAllAllergiesInCard: (show: boolean) => void;
  onShowReviewForm: () => void;
  handleOpenReviewForm: (existingReview?: any) => void;
  userReviews: any[];
}

function PlaceCardScores({
  cardPlace,
  user,
  userAllergies,
  venueComments,
  venueYesNoData,
  showAllAllergiesInCard,
  setShowAllAllergiesInCard,
  onShowReviewForm,
  handleOpenReviewForm,
  userReviews
}: PlaceCardScoresProps) {
  
  // State for fresh establishment data (like Reviews tab)
  const [freshEstablishmentData, setFreshEstablishmentData] = useState<any>(null);
  const [isLoadingFreshData, setIsLoadingFreshData] = useState(false);

  // Fetch fresh establishment data directly from API (like Reviews tab does)
  useEffect(() => {
    console.log('🔍 PlaceCardScores useEffect triggered for:', cardPlace?.name);
    
    if (!cardPlace?.id) {
      console.log('❌ PlaceCardScores: No cardPlace.id provided');
      return;
    }
    
    const fetchFreshEstablishmentData = async () => {
      console.log('📡 PlaceCardScores: Fetching fresh data for establishment ID:', cardPlace.id);
      setIsLoadingFreshData(true);
      
      try {
        const isChain = typeof cardPlace.id === 'string' && cardPlace.id.startsWith('chain-');
        
        if (isChain) {
          // For chains, get aggregated data
          const actualChainId = cardPlace.id.replace('chain-', '');
          
          // Get chain review count
          const chainReviewResponse = await fetch(`/api/reviews/chains/${actualChainId}/reviews`);
          if (!chainReviewResponse.ok) {
            throw new Error(`Failed to fetch chain reviews: ${chainReviewResponse.status}`);
          }
          const chainReviewData = await chainReviewResponse.json();
          const actualChainReviewCount = chainReviewData.pagination?.total || 0;
          
          // Get establishments data for aggregation
          const response = await fetch(`/api/establishments?limit=2548&_t=${Date.now()}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch establishment data: ${response.status}`);
          }
          
          const data = await response.json();
          const chainEstablishments = data.data?.filter((place: any) => place.chain_id === parseInt(actualChainId)) || [];
          
          if (chainEstablishments.length > 0) {
            // Create aggregated chain data
            const aggregatedScores: Record<string, number> = {};
            const scoreCounts: Record<string, number> = {};
            
            chainEstablishments.forEach((establishment: any) => {
              if (establishment.avg_allergen_scores) {
                Object.entries(establishment.avg_allergen_scores).forEach(([allergen, score]) => {
                  if (score !== undefined && score !== null) {
                    if (!aggregatedScores[allergen]) {
                      aggregatedScores[allergen] = 0;
                      scoreCounts[allergen] = 0;
                    }
                    aggregatedScores[allergen] += (score as number);
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
            
            const chainData = {
              id: cardPlace.id,
              name: chainEstablishments[0].chain_name || 'Chain',
              averageAllergenScores: aggregatedScores,
              reviewCount: actualChainReviewCount
            };
            
            console.log('📦 PlaceCardScores: Received fresh chain data:', {
              id: chainData.id,
              name: chainData.name,
              averageAllergenScores: chainData.averageAllergenScores,
              reviewCount: chainData.reviewCount
            });
            setFreshEstablishmentData(chainData);
          } else {
            console.log('⚠️ PlaceCardScores: No chain establishments found');
            setFreshEstablishmentData(null);
          }
        } else {
          // For individual establishments, fetch directly
          const response = await fetch(`/api/establishments?limit=2548&_t=${Date.now()}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch establishment data: ${response.status}`);
          }
          
          const data = await response.json();
          const establishment = data.data?.find((place: any) => place.id === cardPlace.id);
          
          if (establishment) {
            console.log('📦 PlaceCardScores: Received fresh data:', {
              name: establishment.name,
              reviewCount: establishment.reviewCount,
              averageAllergenScores: establishment.averageAllergenScores
            });
            setFreshEstablishmentData(establishment);
          } else {
            console.log('⚠️ PlaceCardScores: Establishment not found in API response');
            setFreshEstablishmentData(null);
          }
        }
      } catch (error) {
        console.error('❌ PlaceCardScores: Error fetching fresh data:', error);
        setFreshEstablishmentData(null);
      } finally {
        setIsLoadingFreshData(false);
      }
    };
    
    fetchFreshEstablishmentData();
  }, [cardPlace?.id, cardPlace?.name]); // Re-fetch when establishment changes

  // Listen for review updates to trigger fresh data fetch (like Reviews tab)
  useEffect(() => {
    const handleReviewUpdate = (event: any) => {
      console.log(`🔄 PlaceCardScores: Review updated, fetching fresh data for ${cardPlace?.name}...`);
      if (cardPlace?.id) {
        // Trigger a fresh data fetch (reuse the same logic as initial fetch)
        const fetchFreshData = async () => {
          try {
            const isChain = typeof cardPlace.id === 'string' && cardPlace.id.startsWith('chain-');
            
            if (isChain) {
              // For chains, get aggregated data
              const actualChainId = cardPlace.id.replace('chain-', '');
              
              // Get chain review count
              const chainReviewResponse = await fetch(`/api/reviews/chains/${actualChainId}/reviews`);
              if (chainReviewResponse.ok) {
                const chainReviewData = await chainReviewResponse.json();
                const actualChainReviewCount = chainReviewData.pagination?.total || 0;
                
                // Get establishments data for aggregation
                const response = await fetch(`/api/establishments?limit=2548&_t=${Date.now()}`);
                const data = await response.json();
                const chainEstablishments = data.data?.filter((place: any) => place.chain_id === parseInt(actualChainId)) || [];
                
                if (chainEstablishments.length > 0) {
                  // Create aggregated chain data
                  const aggregatedScores: Record<string, number> = {};
                  const scoreCounts: Record<string, number> = {};
                  
                  chainEstablishments.forEach((establishment: any) => {
                    if (establishment.avg_allergen_scores) {
                      Object.entries(establishment.avg_allergen_scores).forEach(([allergen, score]) => {
                        if (score !== undefined && score !== null) {
                          if (!aggregatedScores[allergen]) {
                            aggregatedScores[allergen] = 0;
                            scoreCounts[allergen] = 0;
                          }
                          aggregatedScores[allergen] += (score as number);
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
                  
                  const chainData = {
                    id: cardPlace.id,
                    name: chainEstablishments[0].chain_name || 'Chain',
                    averageAllergenScores: aggregatedScores,
                    reviewCount: actualChainReviewCount
                  };
                  
                  console.log('🔄 PlaceCardScores: Fresh chain data after review update:', chainData.averageAllergenScores);
                  setFreshEstablishmentData(chainData);
                }
              }
            } else {
              // For individual establishments
              const response = await fetch(`/api/establishments?limit=2548&_t=${Date.now()}`);
              const data = await response.json();
              const establishment = data.data?.find((place: any) => place.id === cardPlace.id);
              if (establishment) {
                console.log('🔄 PlaceCardScores: Fresh data after review update:', establishment.averageAllergenScores);
                setFreshEstablishmentData(establishment);
              }
            }
          } catch (error) {
            console.error('❌ PlaceCardScores: Error fetching fresh data after review:', error);
          }
        };
        fetchFreshData();
      }
    };

    window.addEventListener('reviewSubmitted', handleReviewUpdate);
    window.addEventListener('reviewUpdated', handleReviewUpdate);

    return () => {
      window.removeEventListener('reviewSubmitted', handleReviewUpdate);
      window.removeEventListener('reviewUpdated', handleReviewUpdate);
    };
  }, [cardPlace?.id, cardPlace?.name]);

  // Use fresh data if available, otherwise fall back to cardPlace data
  const currentAllergenScores = freshEstablishmentData?.averageAllergenScores || cardPlace?.averageAllergenScores || {};
  
  // Log the current scores for debugging
  useEffect(() => {
    console.log(`🔍 PlaceCardScores: Current scores for ${cardPlace?.name}:`, currentAllergenScores);
    console.log(`🔍 PlaceCardScores: Using fresh data:`, !!freshEstablishmentData);
    console.log(`🔍 PlaceCardScores: Fresh data scores:`, freshEstablishmentData?.averageAllergenScores);
    console.log(`🔍 PlaceCardScores: Fallback cardPlace scores:`, cardPlace?.averageAllergenScores);
  }, [currentAllergenScores, freshEstablishmentData, cardPlace?.name, cardPlace]);
  


  // Check if user has already reviewed this place
  // Since userReviews comes from our specific API endpoint for this place and user,
  // any review in the array means the user has reviewed this place
  const existingReview = userReviews.length > 0 ? userReviews[0] : null;
  const hasExistingReview = userReviews.length > 0;
  
  // Debug logging for review detection
  if (userReviews.length > 0) {
    console.log('✅ Found existing review for', (cardPlace as any).name, '- showing Edit button');
    console.log('🔍 existingReview object:', existingReview);
    console.log('🔍 existingReview.yes_no_answers:', existingReview?.yes_no_answers);
    console.log('🔍 existingReview.yesNoAnswers:', existingReview?.yesNoAnswers);
    console.log('🔍 existingReview.updated_at:', existingReview?.updated_at);
    console.log('🔍 existingReview.separatePreparationArea:', existingReview?.separatePreparationArea);
    console.log('🔍 existingReview.staffAllergyTrained:', existingReview?.staffAllergyTrained);
  }
  
  return (
    <div>
      {/* Allergy Scores Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Allergy Scores ({cardPlace.reviewCount || venueComments.length} Reviews)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(() => {
            const filteredAllergens = ((user && userAllergies.length > 0 && !showAllAllergiesInCard) 
              ? sortAllergens(userAllergies) 
              : ALLERGENS)
              .map((allergen) => {
                const { rating, count } = getAllergenRating(
                  allergen, 
                  cardPlace.allergenRatings, 
                  currentAllergenScores,
                  existingReview?.allergen_scores
                );
                return { allergen, rating, count };
              })
              .filter(({ allergen, rating, count }) => {
                // Show ALL allergens when showAllAllergiesInCard is true
                // OR show allergens with ratings
                // OR show user's specific allergens when in user allergy mode
                const hasRating = count > 0 && rating > 0;
                const isUserAllergyMode = user && userAllergies.length > 0 && !showAllAllergiesInCard;
                const showAll = showAllAllergiesInCard;
                const shouldShow = showAll || hasRating || (isUserAllergyMode && userAllergies.includes(allergen));

                return shouldShow;
              });
            

            
            return filteredAllergens.map(({ allergen, rating, count }) => {
              const hasRating = count > 0 && rating > 0;
              const displayValue = hasRating ? rating.toFixed(1) : 'N/A';
              return (
                <div key={allergen} className="flex items-center justify-between rounded-full p-2 text-black" style={{ backgroundColor: getScoreColor(rating, hasRating) }}>
                  <div className="flex items-center gap-2">
                    <AllergenIcon 
                      allergen={getAllergenIconKey(allergen) as AllergenKey} 
                      size={18} 
                      className="text-black"
                    />
                    <span className="text-sm font-medium">
                      {ALLERGEN_DISPLAY_NAMES[allergen as AllergenKey] || allergen}
                    </span>
                  </div>
                  <div className="flex items-center justify-center w-7 h-7 bg-white rounded-full text-sm font-bold text-black">
                    {displayValue}
                  </div>
                </div>
              );
            });
          })()}
        </div>
        
        {/* Show All / Show Less button for user allergies */}
        {user && userAllergies.length > 0 && (
          <div
            className="mt-4 text-blue-600 hover:text-blue-700 cursor-pointer text-sm flex items-center transition-colors"
            onClick={() => setShowAllAllergiesInCard(!showAllAllergiesInCard)}
          >
            <span>{showAllAllergiesInCard ? 'Show My Allergies Only' : 'Show All Allergens'}</span>
            <svg
              className="ml-1 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {showAllAllergiesInCard ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Allergy Handling Section - New Percentage Bars UI */}
      <AllergenHandlingStats 
        placeId={cardPlace.placeId || (cardPlace as any).place_id || (cardPlace as any).uuid}
        chainData={(cardPlace as any).isAggregatedChain ? {
          chainId: (cardPlace as any).chainId,
          chainName: (cardPlace as any).chainName,
          locations: (cardPlace as any).chainLocations || []
        } : undefined}
      />

      {/* Add/Edit Your Review Button */}
      {user && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              console.log('🔧 Edit Review button clicked!');
              console.log('🔧 Passing existingReview to handleOpenReviewForm:', existingReview);
              handleOpenReviewForm(existingReview);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {hasExistingReview ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              )}
            </svg>
            {hasExistingReview ? 'Edit Your Review' : 'Add Your Review'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PlaceCardScores; 