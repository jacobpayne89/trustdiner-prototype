"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AllergenIcon, type AllergenKey } from "@/app/components/icons";
import type { ReviewWithDetails } from '../../../../shared/types/core';
import { ALLERGENS, ALLERGEN_DISPLAY_NAMES } from "@/types";

// Reviews per page
const REVIEWS_PER_PAGE = 10;

// Helper functions (matching PlaceCardReviews format)
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

// Format time ago function (matching PlaceCardReviews)
const getTimeAgo = (timestamp: any) => {
  const date = timestamp instanceof Date ? timestamp : (timestamp?.toDate?.() || new Date(timestamp));
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInWeeks === 1) return "1 week ago";
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  if (diffInMonths === 1) return "1 month ago";
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  return date.toLocaleDateString();
};

// User Avatar component (matching PlaceCardReviews)
const UserAvatar = ({ userProfile }: { userProfile: any }) => {
  if (userProfile?.avatar_url) {
    return (
      <img
        src={userProfile.avatar_url}
        alt={`${userProfile.display_name || 'User'}'s avatar`}
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

interface UserReviewsListProps {
  userId: string;
  userDisplayName?: string;
  userEmail?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  refreshEstablishments?: () => void;
}

export default function UserReviewsList({ 
  userId, 
  userDisplayName, 
  userEmail, 
  onSuccess, 
  onError,
  refreshEstablishments
}: UserReviewsListProps) {
  const [userReviews, setUserReviews] = useState<ReviewWithDetails[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Fetch user reviews
  const fetchUserReviews = async () => {
    try {
      if (!userId) {
        console.log('ℹ️ No user ID available for fetching reviews');
        setUserReviews([]);
        setReviewsLoading(false);
        return;
      }

      console.log(`🔍 Loading user reviews for user ID: ${userId}...`);
      
      // Use relative URL in development (Next.js proxy) or direct URL in production
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `/api/reviews/user/${userId}`
        : `/api/reviews/user/${userId}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No reviews found for this user');
          setUserReviews([]);
          setReviewsLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch reviews');
      }
      
      console.log(`✅ Found ${result.count} reviews for user`);
      
      // Transform to expected format (ReviewWithDetails)
      console.log('🖼️ Raw review data from API:', result.data[0] || result.reviews?.[0]); // Debug first review
      const rawReviews = result.data || result.reviews || [];
      const enrichedReviews: ReviewWithDetails[] = rawReviews.map((review: any) => {
        // Parse allergen_scores if it's a string
        let allergenScores = review.allergen_scores || review.allergenScores || {};
        if (typeof allergenScores === 'string') {
          try {
            allergenScores = JSON.parse(allergenScores);
          } catch (e) {
            console.warn('Failed to parse allergen_scores:', allergenScores);
            allergenScores = {};
          }
        }

        // Parse yes_no_answers if it's a string
        let yesNoAnswers = review.yes_no_answers || {};
        if (typeof yesNoAnswers === 'string') {
          try {
            yesNoAnswers = JSON.parse(yesNoAnswers);
          } catch (e) {
            console.warn('Failed to parse yes_no_answers:', yesNoAnswers);
            yesNoAnswers = {};
          }
        }

        return {
          // Core review fields
          id: review.id,
          user_id: review.user_id,
          venue_id: review.venue_id,
          allergen_scores: allergenScores,
          general_comment: review.general_comment,
          yes_no_answers: yesNoAnswers,
          overall_rating: review.overall_rating,
          would_recommend: review.would_recommend,
          staff_knowledge_rating: review.staff_knowledge_rating,
          separate_preparation_area: review.separate_preparation_area || review.separatePreparationArea,
          staff_allergy_trained: review.staff_allergy_trained || review.staffAllergyTrained,
          cross_contamination_safety: review.cross_contamination_safety,
          created_at: review.created_at || review.createdAt,
          updated_at: review.updated_at || review.updatedAt,
          place_id: review.place_id,
          
          // Establishment details (from flattened API response)
          establishment: {
            name: review.establishment_name || review.establishment?.name,
            address: review.establishment_address || review.establishment?.address,
            place_id: review.place_id || review.establishment?.place_id || review.establishment?.placeId,
            uuid: review.establishment?.uuid || '',
            local_image_url: review.establishment?.local_image_url || null
          },
          
          // User details (from flattened API response)
          user: {
            display_name: userDisplayName || review.user_name || review.user?.display_name || review.user?.displayName || 'You',
            avatar_url: review.user?.avatar_url || review.user?.profileImage || null
          },
          
          // Chain details (if applicable)
          chain: review.chain || undefined
        };
      });
      
      console.log('🖼️ Enriched review data:', enrichedReviews[0]); // Debug first enriched review
      setUserReviews(enrichedReviews);
      console.log(`📝 Processed ${enrichedReviews.length} user reviews`);
      
    } catch (err) {
      console.error('❌ Error fetching user reviews:', err);
      setUserReviews([]);
      onError?.('Failed to load reviews. Please try again.');
    }
    setReviewsLoading(false);
  };

  // Load reviews on mount or when userId changes
  useEffect(() => {
    setReviewsLoading(true);
    fetchUserReviews();
  }, [userId]);

  const handleDeleteReview = async (reviewId: string, placeName: string) => {
    if (!window.confirm(`Are you sure you want to delete your review for "${placeName}"? This action cannot be undone.`)) {
      return;
    }

    console.log(`🗑️ Attempting to delete review ${reviewId} for user ${userId}`);
    setDeletingReviewId(reviewId);
    
    try {
      // Make request to frontend API route which will proxy to backend
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId, 10)
        })
      });

      console.log(`📡 Delete response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ Delete failed with status ${response.status}:`, errorData);
        throw new Error(`Failed to delete review: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      console.log(`✅ Review deleted successfully:`, result);
      
      // Remove the review from local state
      setUserReviews(prev => prev.filter(review => review.id !== reviewId));
      
      // Refresh establishments data to update review counts in place cards
      refreshEstablishments?.();
      
      onSuccess?.("Review deleted successfully.");
    } catch (error) {
      console.error('Error deleting review:', error);
      onError?.('Failed to delete review. Please try again.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleEditReview = (placeId: string, reviewId?: string) => {
    // Open the main page with the place selected in a new tab so user doesn't lose their profile page
    const url = new URL('/', window.location.origin);
    url.searchParams.set('place_id', placeId);
    if (reviewId) {
      url.searchParams.set('edit_review', reviewId);
    }
    window.open(url.toString(), '_blank');
  };

  // Calculate pagination
  const totalPages = Math.ceil(userReviews.length / REVIEWS_PER_PAGE);
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const endIndex = startIndex + REVIEWS_PER_PAGE;
  const paginatedReviews = userReviews.slice(startIndex, endIndex);

  // Expose refetch function for parent component
  const refetchReviews = () => {
    setReviewsLoading(true);
    fetchUserReviews();
  };

  return (
    <div className="bg-white shadow sm:rounded-lg sm:p-6 flex flex-col min-h-[600px]">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Reviews</h3>
        <p className="text-sm text-gray-600">
          {userReviews.length === 0 
            ? 'You haven\'t written any reviews yet.' 
            : `You have written ${userReviews.length} review${userReviews.length === 1 ? '' : 's'}.`
          }
        </p>
      </div>

      {reviewsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading reviews...</span>
        </div>
      ) : userReviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📝</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
          <p className="text-gray-600 mb-4">Start exploring places and share your allergy experiences!</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Explore Places
          </Link>
        </div>
      ) : (
        <div className="space-y-6 flex-1 overflow-y-auto">
          {paginatedReviews.map((review) => {
            // Calculate overall average score for this user's review
            const allergenScores = review.allergen_scores || {};
            const scores = Object.values(allergenScores).filter((score): score is number => typeof score === 'number' && score > 0);
            const avgScore = scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
            
            return (
              <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {/* Header with avatar, name, time, and action buttons */}
                <div className="flex items-start space-x-3 mb-3">
                  <UserAvatar userProfile={review.user} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {review.user?.display_name || 'You'}
                          </p>
                        </div>
                        {/* Show venue info */}
                        <h4 className="text-sm font-medium text-blue-600 mt-1">
                          {review.establishment?.name || 'Unknown Place'}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {getTimeAgo(review.created_at)}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditReview(review.place_id || review.establishment?.place_id || '', review.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id, review.establishment?.name || 'Unknown Place')}
                          disabled={deletingReviewId === review.id}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingReviewId === review.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review comment */}
                {review.general_comment && review.general_comment.trim() && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {review.general_comment}
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
                  const yesNoAnswers = review.yes_no_answers || {};
                  
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, userReviews.length)} of {userReviews.length} reviews
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
