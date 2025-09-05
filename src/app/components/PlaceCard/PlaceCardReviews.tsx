"use client";

import { useState, useEffect } from 'react';
import { AllergenIcon, type AllergenKey } from '@/app/components/icons';
import { Review } from '../../../shared/types/core';
import { ALLERGEN_DISPLAY_NAMES, type AllergenKey } from '@/types';

// Helper functions
function getScoreColor(score: number): string {
  if (score >= 5) return "#22C55E"; // green (5 - Excellent)
  if (score >= 4) return "#84CC16"; // lime (4 - Good)
  if (score >= 3) return "#EAB308"; // yellow (3 - Okay)
  if (score >= 2) return "#F97316"; // orange (2 - Avoid)
  return "#EF4444"; // red (1 - Unsafe)
}

function getAllergenIconKey(allergen: string): string {
  return allergen.toLowerCase();
}

interface ChainData {
  chainId: number;
  chainName: string;
  locations: any[];
}

interface PlaceCardReviewsProps {
  placeUuid: string;
  venueComments?: any[]; // Legacy prop for backward compatibility
  chainData?: ChainData;
}

export default function PlaceCardReviews({ placeUuid, venueComments = [], chainData }: PlaceCardReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewsData, setReviewsData] = useState<any>(null);
  
  // Fetch reviews from new API
  useEffect(() => {
    console.log('🔍 PlaceCardReviews useEffect triggered with placeUuid:', placeUuid);
    console.log('🔍 PlaceCardReviews component mounted for:', placeUuid);
    console.log('🔍 PlaceCardReviews chainData:', chainData);
    
    if (!placeUuid && !chainData) {
      console.log('❌ PlaceCardReviews: No placeUuid or chainData provided');
      return;
    }
    
    const fetchReviews = async () => {
      console.log('📡 PlaceCardReviews: Starting fetch for:', chainData ? `chain ${chainData.chainName}` : `place ${placeUuid}`);
      setLoading(true);
      setError(null);
      
      try {
        let apiUrl: string;
        if (chainData) {
          apiUrl = `/api/reviews/chains/${chainData.chainId}/reviews`;
          console.log('🌐 PlaceCardReviews: Calling chain API:', apiUrl);
        } else {
          apiUrl = `/api/reviews/establishments/${placeUuid}/reviews`;
          console.log('🌐 PlaceCardReviews: Calling establishment API:', apiUrl);
        }
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.status}`);
        }
        
        const data: ReviewsResponse = await response.json();
        console.log('📦 PlaceCardReviews: Received data:', data);
        console.log('📝 PlaceCardReviews: Setting reviews:', data.reviews?.length || 0, 'reviews');
        setReviews(data.reviews);
        setReviewsData(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError(error instanceof Error ? error.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [placeUuid, chainData]);
  
  // Use new reviews if available, otherwise fall back to legacy venueComments
  const displayReviews = reviews.length > 0 ? reviews : venueComments;
  // Format time ago function (from original)
  const getTimeAgo = (timestamp: any) => {
    const date = timestamp instanceof Date ? timestamp : (timestamp?.toDate?.() || new Date());
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    
    if (diffInMonths > 0) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    } else if (diffInWeeks > 0) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return 'Today';
    }
  };

  // User's avatar component (from original)
  const UserAvatar = ({ userProfile }: { userProfile: any }) => {
    if (userProfile?.avatarUrl) {
      return (
        <img
          src={userProfile.avatarUrl}
          alt={`${userProfile.displayName || 'User'}'s avatar`}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
        />
      );
    }

    // Default avatars based on user type
    if (userProfile?.userType === "parent") {
      return (
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-green-600">
            <circle cx="8" cy="5" r="2.5" fill="currentColor"/>
            <path d="M8 8C6 8 4 9.5 4 12v8h8v-8c0-2.5-2-4-4-4z" fill="currentColor"/>
            <circle cx="16" cy="7" r="1.8" fill="currentColor"/>
            <path d="M16 9.5C14.5 9.5 13 10.5 13 12.5v5.5h6v-5.5c0-2-1.5-3-3-3z" fill="currentColor"/>
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-blue-600">
          <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
          <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
        </svg>
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
      
      {loading && (
        <div className="text-gray-500 text-center py-8">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            <span>Loading reviews...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-center py-8">
          {error}
        </div>
      )}
      
      {!loading && !error && displayReviews.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No reviews yet. Be the first to leave a review!
        </div>
      ) : !loading && !error && (
        <div className="space-y-4">
          {/* Chain reviews header */}
          {reviewsData?.chain && reviewsData?.reviewScope === 'chain' && (
            <p className="text-xs text-gray-500 mb-3">
              Showing reviews from all {reviewsData.chain.name} locations
            </p>
          )}
          
          
          <div className="space-y-6">
            {displayReviews.map((review, i) => {
            // Calculate overall average score for this user's review
            const allergenScores = (review as any).allergen_scores || review.allergenScores || review.scores || {};
            const scores = Object.values(allergenScores).filter((score): score is number => typeof score === 'number' && score > 0);
            const avgScore = scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
            
            // Detect if this is a new Review object or legacy format - check for API fields
            const isNewFormat = 'user_name' in review || 'userDisplayName' in review;
            const displayName = isNewFormat ? ((review as any).user_name || review.userDisplayName || 'Anonymous User') : (review.userProfile?.displayName || 'Anonymous User');
            const timestamp = isNewFormat ? ((review as any).created_at || review.createdAt) : review.timestamp;
            const comment = isNewFormat ? ((review as any).general_comment || review.notes) : review.overallComment;
            const userProfile = isNewFormat ? review.user : review.userProfile;

            return (
              <div key={isNewFormat ? ((review as any).id || i) : i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {/* Header with avatar, name, allergies, time */}
                <div className="flex items-start space-x-3 mb-3">
                  <UserAvatar userProfile={userProfile} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {displayName}
                      </p>
                      {userProfile?.allergens && (
                        <div className="flex items-center space-x-1">
                          {userProfile.allergens.map((allergen: string) => {
                            const iconKey = getAllergenIconKey(allergen) as AllergenKey;
                            return (
                              <div key={allergen} className="flex items-center">
                                <AllergenIcon 
                                  allergen={iconKey} 
                                  size={12}
                                  className="text-gray-600" 
                                  aria-label={allergen}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {/* Show venue info for chain reviews */}
                    {isNewFormat && review.venue && !review.isCurrentVenue && (
                      <p className="text-xs text-blue-600 mt-1">
                        Reviewing {reviewsData?.chain?.name || 'this location'}, {(() => {
                          // Extract area from venue name (e.g., "Nando's Waterloo" -> "Waterloo")
                          const venueName = review.venue.name;
                          const chainName = reviewsData?.chain?.name || '';
                          const area = chainName && venueName.startsWith(chainName) 
                            ? venueName.substring(chainName.length).trim() 
                            : venueName.split(' ').slice(-1)[0] || 'location';
                          return area;
                        })()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(timestamp)}
                    </p>
                  </div>
                </div>

                {/* Review comment */}
                {comment && comment.trim() && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {comment}
                    </p>
                  </div>
                )}

                {/* Allergen scores */}
                {Object.keys(allergenScores).length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-medium text-gray-700">Overall rating</h4>
                      {avgScore > 0 && (
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: getScoreColor(avgScore) }}
                        >
                          {avgScore.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(allergenScores)
                        .filter(([_, score]) => score !== 0)
                        .sort(([, a], [, b]) => Number(b) - Number(a))
                        .map(([allergen, score]) => {
                          const iconKey = getAllergenIconKey(allergen) as AllergenKey;
                          const displayAllergen = ALLERGEN_DISPLAY_NAMES[allergen as AllergenKey] || allergen.charAt(0).toUpperCase() + allergen.slice(1);
                          return (
                            <div 
                              key={allergen} 
                              className="flex items-center space-x-1 rounded-full px-2 py-1"
                              style={{ backgroundColor: getScoreColor(Number(score)) }}
                            >
                              <AllergenIcon 
                                allergen={iconKey} 
                                size={10}
                                className="text-black" 
                              />
                              <span className="text-xs text-black font-medium">
                                {displayAllergen}
                              </span>
                              <div 
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-white"
                                style={{ color: getScoreColor(Number(score)) }}
                              >
                                {Number(score)}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Yes/No answers to allergen handling questions */}
                {(() => {
                  // For new format, check both yes_no_answers (snake_case from API) and yesNoAnswers (camelCase)
                  const yesNoAnswers = isNewFormat 
                    ? ((review as any).yes_no_answers || review.yesNoAnswers || {})
                    : review.yesNoAnswers;
                  
                  if (!yesNoAnswers || Object.keys(yesNoAnswers).filter(key => yesNoAnswers[key] !== null).length === 0) {
                    return null;
                  }
                  
                  return (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Allergen Handling:</h4>
                      <div className="space-y-1">
                        {Object.entries(yesNoAnswers)
                          .filter(([_, answer]) => answer !== null)
                          .map(([questionId, answer]) => {
                            // Convert question IDs to readable text
                            let questionText = questionId.replace(/_/g, ' ');
                            if (questionId === 'separate_preparation_area') {
                              questionText = 'Separate preparation area used';
                            } else if (questionId === 'staff_allergy_trained') {
                              questionText = 'Staff knowledgeable about allergies';
                            } else if (questionId === 'allergen_menu') {
                              questionText = 'Allergen menu available';
                            } else if (questionId === 'staff_confident') {
                              questionText = 'Staff confident handling allergies';
                            } else if (questionId === 'staff_notify_kitchen') {
                              questionText = 'Staff notified kitchen about allergies';
                            } else if (questionId === 'kitchen_adjust') {
                              questionText = 'Kitchen adjusted food for allergies';
                            } else if (questionId.startsWith('kitchen_free_')) {
                              const allergen = questionId.replace('kitchen_free_', '').replace(/_/g, ' ');
                              questionText = `Kitchen was ${allergen} free`;
                            }
                            
                            return (
                              <div key={questionId} className="flex items-center space-x-2 text-xs">
                                <span className="text-sm">
                                  {answer ? '👍' : '👎'}
                                </span>
                                <span className="text-gray-600 capitalize">{questionText}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
} 