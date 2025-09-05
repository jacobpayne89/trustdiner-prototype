"use client";

import { useState, useCallback } from 'react';

// Centralized filter store interface
export interface FilterStore {
  // Core filter state
  selectedAllergens: string[];
  selectedMinimumRating: number | null;
  showAllAllergens: boolean;
  
  // Actions
  setSelectedAllergens: (allergens: string[]) => void;
  setSelectedMinimumRating: (rating: number | null) => void;
  setShowAllAllergens: (show: boolean) => void;
  
  // Utility actions
  toggleAllergen: (allergen: string) => void;
  clearFilters: () => void;
  toggleShowAllAllergens: () => void;
  
  // Initialization (only sets if no user interaction has occurred)
  initializeUserAllergensIfEmpty: (userAllergies: string[]) => void;
  initializeUserAllergensOnLogin: (userAllergies: string[]) => void;
  clearUserAllergens: () => void;
  
  // User interaction tracking
  hasUserInteracted: boolean;
  markUserInteraction: () => void;
}

/**
 * Centralized hook for managing global filter state
 * Consolidates filter-related state that was previously scattered across components
 */
export function useFilterStore(): FilterStore {
  // Core filter state
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedMinimumRating, setSelectedMinimumRating] = useState<number | null>(null);
  const [showAllAllergens, setShowAllAllergens] = useState<boolean>(false);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
  
  // Mark user interaction
  const markUserInteraction = useCallback(() => {
    setHasUserInteracted(true);
  }, []);

  // Enhanced setters that mark user interaction
  const setSelectedAllergensWithInteraction = useCallback((allergens: string[]) => {
    setSelectedAllergens(allergens);
    markUserInteraction();
  }, [markUserInteraction]);

  const setSelectedMinimumRatingWithInteraction = useCallback((rating: number | null) => {
    setSelectedMinimumRating(rating);
    markUserInteraction();
  }, [markUserInteraction]);

  // Toggle a single allergen
  const toggleAllergen = useCallback((allergen: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
    markUserInteraction();
  }, [markUserInteraction]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedAllergens([]);
    setSelectedMinimumRating(null);
    markUserInteraction();
    // Don't reset showAllAllergens - this is a UI preference that should persist
  }, [markUserInteraction]);
  
  // Toggle show all allergens
  const toggleShowAllAllergens = useCallback(() => {
    setShowAllAllergens(prev => !prev);
  }, []);
  
  // Initialize user allergies as filters only if user hasn't interacted yet
  const initializeUserAllergensIfEmpty = useCallback((userAllergies: string[]) => {
    // IMPORTANT: Only initialize if the filter is currently empty AND user hasn't interacted
    if (!hasUserInteracted && selectedAllergens.length === 0 && userAllergies && userAllergies.length > 0) {
      setSelectedAllergens(userAllergies); // Directly set, do NOT mark interaction
    }
  }, [hasUserInteracted, selectedAllergens.length]); // Dependencies for this callback
  
  // Force initialize user allergies (for login scenarios)
  const initializeUserAllergensOnLogin = useCallback((userAllergies: string[]) => {
    setSelectedAllergens(userAllergies);
    setHasUserInteracted(false); // Reset interaction state so user can still modify
  }, []);
  
  // Clear user allergens when logged out
  const clearUserAllergens = useCallback(() => {
    setSelectedAllergens([]);
    setSelectedMinimumRating(null);
    setHasUserInteracted(false); // Reset interaction state on logout
  }, []);
  
  return {
    selectedAllergens,
    selectedMinimumRating,
    showAllAllergens,
    hasUserInteracted,
    setSelectedAllergens: setSelectedAllergensWithInteraction,
    setSelectedMinimumRating: setSelectedMinimumRatingWithInteraction,
    setShowAllAllergens,
    toggleAllergen,
    clearFilters,
    toggleShowAllAllergens,
    markUserInteraction,
    initializeUserAllergensIfEmpty,
    initializeUserAllergensOnLogin,
    clearUserAllergens,
  };
}
