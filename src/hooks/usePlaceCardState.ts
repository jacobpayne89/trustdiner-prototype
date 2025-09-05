import { useState, useCallback, useEffect } from 'react';
import type { EstablishmentWithStats } from '../../../shared/types/core';
import { api as apiClient } from '@/lib/api-client';
import { sanitizeReviewPayload, hasValidReviewContent, createReviewDiff, logPotentialDataLoss } from '@/utils/reviewHelpers';

export interface PlaceCardState {
  // Tab state
  cardTab: 'scores' | 'comments' | 'locations';
  setCardTab: (tab: 'scores' | 'comments' | 'locations') => void;
  
  // Review form state
  showReviewForm: boolean;
  setShowReviewForm: (show: boolean) => void;
  editingReview?: any;
  
  // Temporary form data
  tempAllergenScores: Record<string, Record<string, number>>;
  setTempAllergenScores: (value: Record<string, Record<string, number>> | ((prev: Record<string, Record<string, number>>) => Record<string, Record<string, number>>)) => void;
  tempAllergenComments: Record<string, string>;
  setTempAllergenComments: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  tempYesNoAnswers: Record<string, Record<string, boolean>>;
  setTempYesNoAnswers: (value: Record<string, Record<string, boolean>> | ((prev: Record<string, Record<string, boolean>>) => Record<string, Record<string, boolean>>)) => void;
  
  // Display state
  showAllAllergiesInCard: boolean;
  setShowAllAllergiesInCard: (show: boolean) => void;
  
  // Data
  venueComments: any[];
  venueYesNoData: Record<string, any>;
  userReviews: any[];
  
  // Handlers
  handleOpenReviewForm: (existingReview?: any) => void;
  handleCancelReview: () => void;
  handleSubmitReview: () => Promise<void>;
  
  // Utility
  resetState: () => void;
  centerMapOnLocation?: (location: EstablishmentWithStats) => void;
}

interface UsePlaceCardStateProps {
  cardPlace?: EstablishmentWithStats;
  user?: any;
  getUserAllergies: () => string[];
  onReviewSubmitted?: (isEdit?: boolean) => void;
  centerMapOnLocation?: (location: EstablishmentWithStats) => void;
  editReviewId?: string | null;
}

export function usePlaceCardState({
  cardPlace,
  user,
  getUserAllergies,
  onReviewSubmitted,
  centerMapOnLocation,
  editReviewId
}: UsePlaceCardStateProps): PlaceCardState {
  // Removed excessive logging to prevent console spam
  // console.log('🎯 usePlaceCardState called with:', { 
  //   cardPlaceName: cardPlace?.name, 
  //   cardPlaceId: cardPlace?.id, 
  //   cardPlaceDatabaseId: cardPlace?.databaseId,
  //   userId: user?.id 
  // });
  
  // Tab state
  const [cardTab, setCardTab] = useState<'scores' | 'comments' | 'locations'>('scores');
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>();
  
  // Temporary form data
  const [tempAllergenScores, setTempAllergenScores] = useState<Record<string, Record<string, number>>>({});
  const [tempAllergenComments, setTempAllergenComments] = useState<Record<string, string>>({});
  const [tempYesNoAnswers, setTempYesNoAnswers] = useState<Record<string, Record<string, boolean>>>({});
  
  // Display state
  const [showAllAllergiesInCard, setShowAllAllergiesInCard] = useState(false);
  
  // Data state - these would typically be fetched from API based on cardPlace
  const [venueComments, setVenueComments] = useState<any[]>([]);
  const [venueYesNoData, setVenueYesNoData] = useState<Record<string, any>>({});
  const [userReviews, setUserReviews] = useState<any[]>([]);

  // Function to load user reviews for the current place
  const loadUserReviews = useCallback(async (bustCache: boolean = false) => {
    if (!cardPlace || !user?.id) {
      setUserReviews([]);
      return;
    }

    try {
      // Get establishment ID - use the canonical id field
      const establishmentId = cardPlace.id;
      
      const placeId = cardPlace.place_id;
      
      // Only log meaningful events to prevent console spam
      // console.log(`🔍 Debug: cardPlace.id=${cardPlace.id}, establishmentId=${establishmentId}, placeId=${placeId}`);
      
      if (establishmentId && typeof establishmentId === 'number') {
        // console.log(`📡 Loading user reviews for establishment ${establishmentId}, user ${user.id}${bustCache ? ' (cache busted)' : ''}`);
        const response = await apiClient.getUserReviewsForEstablishment(establishmentId, user.id, bustCache);
        
        // Handle the new standardized API response format
        const reviews = response.data || response || [];
        // console.log(`📝 Loaded ${reviews.length} user reviews via establishment ID`);
        setUserReviews(reviews);
      } else if (placeId) {
        // Fallback to place ID for backward compatibility
        // console.log(`📡 Loading user reviews for place ${placeId}, user ${user.id} (fallback)${bustCache ? ' (cache busted)' : ''}`);
        const response = await apiClient.getUserReviewsForPlace(placeId, user.id, bustCache);
        
        // Handle the new standardized API response format
        const reviews = response.data || response || [];
        // console.log(`📝 Loaded ${reviews.length} user reviews via place ID fallback`);
        setUserReviews(reviews);
      } else {
        console.warn('❌ No establishment ID or place ID available for loading reviews');
        console.warn('❌ cardPlace data:', cardPlace);
        setUserReviews([]);
      }
    } catch (error) {
      console.error('❌ Error loading user reviews:', error);
      setUserReviews([]);
    }
  }, [cardPlace, user?.id]);

  // Load user reviews when cardPlace or user changes
  useEffect(() => {
    loadUserReviews();
  }, [loadUserReviews]);

  // Reset review form state when cardPlace changes (when user clicks on a different place)
  useEffect(() => {
    if (cardPlace) {
      // Close any open review form when switching places
      setShowReviewForm(false);
      setEditingReview(undefined);
      setTempAllergenScores({});
      setTempAllergenComments({});
      setTempYesNoAnswers({});
      
      // Center map on the new place if centerMapOnLocation function is provided
      if (centerMapOnLocation) {
        centerMapOnLocation(cardPlace);
      }
    }
  }, [cardPlace?.place_id, centerMapOnLocation]);

  const handleOpenReviewForm = useCallback((existingReview?: any) => {
    console.log('🔧 handleOpenReviewForm called with existingReview:', existingReview);
    setEditingReview(existingReview);
    setShowReviewForm(true);
    
    // Form pre-population is handled by PlaceCardReviewForm component useEffect
    // Just reset form state to let the form component handle pre-population
    if (!existingReview) {
      // Reset form for new review
      setTempAllergenScores({});
      setTempAllergenComments({});
      setTempYesNoAnswers({});
    }
  }, []);
  
  const handleCancelReview = useCallback(() => {
    setShowReviewForm(false);
    setEditingReview(undefined);
    setTempAllergenScores({});
    setTempAllergenComments({});
    setTempYesNoAnswers({});
  }, []);
  
  const handleSubmitReview = useCallback(async () => {
    if (!cardPlace || !user) {
      console.error('Cannot submit review: missing cardPlace or user');
      return;
    }
    
    try {
      // Extract yes/no answers for backend compatibility
      const yesNoAnswers = tempYesNoAnswers[cardPlace.id] || {};
      console.log('🔧 Submitting review with yesNoAnswers:', yesNoAnswers);
      console.log('🔧 tempYesNoAnswers state:', tempYesNoAnswers);
      console.log('🔧 cardPlace.id:', cardPlace.id);
      console.log('🔧 yesNoAnswers keys:', Object.keys(yesNoAnswers));
      console.log('🔧 kitchen_free keys:', Object.keys(yesNoAnswers).filter(k => k.startsWith('kitchen_free_')));
      
      // Prepare all yes/no answers including kitchen-free questions for backend
      const allYesNoAnswers: Record<string, boolean | null> = {};
      
      // Add the 4 main allergen handling questions
      allYesNoAnswers.allergen_menu = yesNoAnswers.allergen_menu !== undefined ? yesNoAnswers.allergen_menu : null;
      allYesNoAnswers.staff_confident = yesNoAnswers.staff_confident !== undefined ? yesNoAnswers.staff_confident : null;
      allYesNoAnswers.staff_notify_kitchen = yesNoAnswers.staff_notify_kitchen !== undefined ? yesNoAnswers.staff_notify_kitchen : null;
      allYesNoAnswers.kitchen_adjust = yesNoAnswers.kitchen_adjust !== undefined ? yesNoAnswers.kitchen_adjust : null;
      
      // Add all kitchen-free questions (kitchen_free_gluten, kitchen_free_nuts, etc.)
      Object.keys(yesNoAnswers).forEach(key => {
        if (key.startsWith('kitchen_free_')) {
          allYesNoAnswers[key] = yesNoAnswers[key] !== undefined ? yesNoAnswers[key] : null;
        }
      });
      
      console.log('🔧 All yes/no answers being sent to backend:', allYesNoAnswers);
      
      // Get establishment ID - use the canonical id field
      const establishmentId = cardPlace.id;
      
      const rawReviewData = {
        // Use establishment ID for reliable matching
        establishmentId: establishmentId,
        placeId: cardPlace.place_id, // Keep for backward compatibility
        userId: parseInt(user.id as string),
        allergenScores: tempAllergenScores[cardPlace.id] || {},
        generalComment: tempAllergenComments[cardPlace.id] || '',
        // Legacy fields (keep for backward compatibility)
        separatePreparationArea: yesNoAnswers.staff_notify_kitchen !== undefined ? yesNoAnswers.staff_notify_kitchen : null,
        staffAllergyTrained: yesNoAnswers.staff_confident !== undefined ? yesNoAnswers.staff_confident : null,
        // New yes/no fields for all 4 main questions
        allergenMenu: allYesNoAnswers.allergen_menu,
        staffConfident: allYesNoAnswers.staff_confident,
        staffNotifyKitchen: allYesNoAnswers.staff_notify_kitchen,
        kitchenAdjust: allYesNoAnswers.kitchen_adjust,
        // All yes/no answers (including kitchen-free questions) for backend storage
        yesNoAnswers: allYesNoAnswers,
        reviewId: editingReview?.id ? parseInt(editingReview.id as string) : undefined // Backend expects 'reviewId', not 'editingReviewId'
      };

      // 🛡️ SAFETY LAYER: Sanitize payload to prevent accidental data loss
      const reviewData = sanitizeReviewPayload(rawReviewData);
      
      // 🛡️ SAFETY LAYER: Check for potential data loss
      if (editingReview) {
        logPotentialDataLoss(editingReview.id, 'allergenScores', editingReview.allergen_scores, rawReviewData.allergenScores);
        logPotentialDataLoss(editingReview.id, 'yesNoAnswers', editingReview.yes_no_answers, rawReviewData.yesNoAnswers);
        logPotentialDataLoss(editingReview.id, 'generalComment', editingReview.general_comment, rawReviewData.generalComment);
      }
      
      // 🛡️ SAFETY LAYER: Validate that we have meaningful content
      if (!hasValidReviewContent(reviewData)) {
        console.error('❌ Cannot submit review: No meaningful content after sanitization');
        return;
      }
      
      console.log('🔧 Final reviewData being sent:', reviewData);
      console.log('🔧 Review type:', editingReview ? 'UPDATE' : 'NEW SUBMISSION');
      console.log('🔧 tempYesNoAnswers state:', tempYesNoAnswers);
      console.log('🔧 cardPlace.id:', cardPlace.id);
      console.log('🔧 Extracted yesNoAnswers:', yesNoAnswers);
      
      const endpoint = editingReview ? `/api/reviews/${editingReview.id}` : '/api/reviews';
      const method = editingReview ? 'PUT' : 'POST';
      
      console.log(`🌐 Making ${method} request to ${endpoint}`);
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${method} request failed:`, errorText);
        throw new Error(`Failed to ${editingReview ? 'update' : 'submit'} review: ${response.status} ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log(`✅ ${method} request successful:`, responseData);

      // 🚀 OPTIMISTIC UPDATE: Immediately update local state with response data
      if (responseData && responseData.id) {
        // Backend returns the review object directly (not wrapped in .data)
        const updatedReview = responseData;
        console.log('🔄 Optimistically updating userReviews with response data:', updatedReview);
        
        // Update userReviews state immediately
        if (editingReview) {
          // Update existing review
          setUserReviews(prev => prev.map(review => 
            review.id === updatedReview.id ? updatedReview : review
          ));
          console.log('✅ Updated existing review in local state');
        } else {
          // Add new review
          setUserReviews(prev => [updatedReview, ...prev]);
          console.log('✅ Added new review to local state');
        }
      } else {
        console.warn('⚠️ No valid review data in response (missing .id), falling back to refresh');
        console.warn('⚠️ Response data structure:', responseData);
      }
      
      // Reset form state
      handleCancelReview();
      
      // Background refresh (shorter delay since we already updated optimistically)
      console.log('🔄 Background refresh of user reviews...');
      setTimeout(async () => {
        await loadUserReviews(true); // Force cache bust as backup
        console.log('✅ Background refresh completed');
      }, 500); // Reduced delay since we have optimistic update
      
      // Dispatch custom events to notify other components
      console.log('📡 Dispatching reviewSubmitted event...');
      window.dispatchEvent(new CustomEvent('reviewSubmitted', { 
        detail: { 
          establishmentId: cardPlace.id, 
          reviewData: responseData 
        } 
      }));
      
      if (editingReview) {
        window.dispatchEvent(new CustomEvent('reviewUpdated', { 
          detail: { 
            establishmentId: cardPlace.id, 
            reviewData: responseData 
          } 
        }));
      }
      
      // Trigger refresh if callback provided (only once)
      if (onReviewSubmitted) {
        console.log('🔄 Triggering single refresh after review submission');
        onReviewSubmitted(!!editingReview); // Pass true if editing, false if new
      }
      
      console.log('✅ Review update completed, UI should refresh with new data');
      
      // Review submitted successfully
    } catch (error) {
      console.error('Error submitting review:', error);
      // In a real app, you'd show a user-friendly error message
    }
  }, [cardPlace, user, tempAllergenScores, tempAllergenComments, tempYesNoAnswers, editingReview, handleCancelReview, onReviewSubmitted, loadUserReviews]);
  
  const resetState = useCallback(() => {
    setCardTab('scores');
    setShowReviewForm(false);
    setEditingReview(undefined);
    setTempAllergenScores({});
    setTempAllergenComments({});
    setTempYesNoAnswers({});
    setShowAllAllergiesInCard(false);
    setVenueComments([]);
    setVenueYesNoData({});
    setUserReviews([]);
  }, []);

  // Handle edit review from URL parameter
  useEffect(() => {
    if (editReviewId && cardPlace && userReviews.length > 0 && user?.id) {
      console.log('🔧 Edit review requested from URL:', editReviewId);
      console.log('🔧 Available user reviews:', userReviews.length);
      
      // Find the review that matches the editReviewId
      const reviewToEdit = userReviews.find(review => review.id === editReviewId);
      
      if (reviewToEdit) {
        console.log('🔧 Found review to edit:', reviewToEdit);
        console.log('🔧 Opening review form with existing review data');
        handleOpenReviewForm(reviewToEdit);
      } else {
        console.log('🔧 Review not found in user reviews, opening form anyway');
        // If we can't find the specific review, just open the form
        // The form will load the user's existing review if there is one
        handleOpenReviewForm(userReviews[0] || undefined);
      }
    }
  }, [editReviewId, cardPlace, userReviews, user?.id, handleOpenReviewForm]);
  
  return {
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
    handleSubmitReview,
    resetState,
    centerMapOnLocation
  };
}
