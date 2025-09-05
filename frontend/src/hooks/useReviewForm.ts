import { useState, useCallback, useEffect } from 'react';
import type { User, EstablishmentWithStats } from '../../../shared/types/core';
import { ALLERGENS, type AllergenKey } from '@/types';
import type { AllergenType } from '@/types';

interface ReviewFormData {
  allergenScores: Partial<Record<AllergenKey, number>>;
  generalComments: string;
  overallRating: number;
  wouldRecommend: boolean;
}

interface UseReviewFormProps {
  user: User | null;
  place: EstablishmentWithStats;
  existingReview?: any;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

// Use canonical allergens as the single source of truth
const ALLERGEN_TYPES = ALLERGENS;

export function useReviewForm({ 
  user, 
  place, 
  existingReview, 
  onSubmitSuccess, 
  onCancel 
}: UseReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    allergenScores: {},
    generalComments: '',
    overallRating: 5,
    wouldRecommend: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [userAllergies, setUserAllergies] = useState<AllergenType[]>([]);

  // Load existing review data
  useEffect(() => {
    if (existingReview) {
      setFormData({
        allergenScores: existingReview.allergenScores || {},
        generalComments: existingReview.generalComments || '',
        overallRating: existingReview.overallRating || 5,
        wouldRecommend: existingReview.wouldRecommend ?? true,
      });
    }
  }, [existingReview]);

  // Load user allergies
  useEffect(() => {
    if (user?.allergies) {
      setUserAllergies(user.allergies);
    }
  }, [user]);

  const updateAllergenScore = useCallback((allergen: string, score: number) => {
    setFormData(prev => ({
      ...prev,
      allergenScores: {
        ...prev.allergenScores,
        [allergen]: score
      }
    }));
  }, []);



  const updateGeneralComments = useCallback((comments: string) => {
    setFormData(prev => ({
      ...prev,
      generalComments: comments
    }));
  }, []);

  const updateOverallRating = useCallback((rating: number) => {
    setFormData(prev => ({
      ...prev,
      overallRating: rating
    }));
  }, []);

  const updateWouldRecommend = useCallback((recommend: boolean) => {
    setFormData(prev => ({
      ...prev,
      wouldRecommend: recommend
    }));
  }, []);

  const validateForm = useCallback((): string | null => {
    // Check if user has scored their allergies
    const userAllergenScores = userAllergies.filter(allergen => 
      formData.allergenScores[allergen] !== undefined
    );
    
    if (userAllergies.length > 0 && userAllergenScores.length === 0) {
      return 'Please rate at least one of your allergens';
    }

    // Check overall rating
    if (formData.overallRating < 1 || formData.overallRating > 5) {
      return 'Overall rating must be between 1 and 5';
    }

    return null;
  }, [formData, userAllergies]);

  const submitReview = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const reviewData = {
        userId: user.id,
        establishmentId: place.id,
        allergenScores: formData.allergenScores,
        generalComments: formData.generalComments.trim(),
        overallRating: formData.overallRating,
        wouldRecommend: formData.wouldRecommend,
        // Only include placeId if it exists and is not null
        ...(place.placeId && { placeId: place.placeId }),
      };

      const url = existingReview 
        ? `/api/reviews/${existingReview.id}`
        : '/api/reviews';
      
      const method = existingReview ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      console.log('✅ Review submitted successfully:', data);
      onSubmitSuccess?.();

    } catch (error: any) {
      console.error('❌ Review submission error:', error);
      setError(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, place, formData, existingReview, validateForm, onSubmitSuccess]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      allergenScores: {},
      generalComments: '',
      overallRating: 5,
      wouldRecommend: true,
    });
    setCurrentStep(1);
    setError(null);
  }, []);

  const getStepTitle = useCallback((step: number): string => {
    switch (step) {
      case 1: return 'Rate Your Experience';
      case 2: return 'Share Details';
      case 3: return 'Final Review';
      default: return 'Review';
    }
  }, []);

  const isStepComplete = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return userAllergies.some(allergen => 
          formData.allergenScores[allergen] !== undefined
        );
      case 2:
        return formData.generalComments.trim().length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  }, [formData, userAllergies]);

  return {
    // State
    formData,
    isSubmitting,
    error,
    currentStep,
    userAllergies,
    
    // Actions
    updateAllergenScore,
    updateGeneralComments,
    updateOverallRating,
    updateWouldRecommend,
    submitReview,
    nextStep,
    prevStep,
    resetForm,
    onCancel,
    
    // Utilities
    validateForm,
    getStepTitle,
    isStepComplete,
    setError,
    
    // Constants
    ALLERGEN_TYPES,
  };
}

