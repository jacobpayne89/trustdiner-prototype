"use client";

import { useState, useCallback } from 'react';
import type { EstablishmentWithStats } from '../../../shared/types/core';
import type { Place } from '@/types';

/**
 * Centralized hook for managing place-related UI state
 * Handles cardPlace, highlightedPlace, and editingReview state
 */
export function usePlaceContext() {
  // Core place UI state
  const [cardPlace, setCardPlace] = useState<EstablishmentWithStats | null>(null);
  const [highlightedPlace, setHighlightedPlace] = useState<EstablishmentWithStats | null>(null);
  const [editingReview, setEditingReview] = useState<any>(null);

  // Place interaction handlers
  const openPlaceCard = useCallback((place: EstablishmentWithStats) => {
    setCardPlace(place);
  }, []);

  const closePlaceCard = useCallback(() => {
    setCardPlace(null);
    setHighlightedPlace(null);
    setEditingReview(null);
  }, []);

  const highlightPlace = useCallback((place: EstablishmentWithStats | null) => {
    setHighlightedPlace(place);
  }, []);

  const startEditingReview = useCallback((review: any) => {
    setEditingReview(review);
  }, []);

  const stopEditingReview = useCallback(() => {
    setEditingReview(null);
  }, []);

  // Combined handlers for common operations
  const handlePlaceClick = useCallback((place: EstablishmentWithStats, windowWidth?: number) => {
    setCardPlace(place);
    // Clear highlighted state when opening card
    setHighlightedPlace(null);
  }, []);

  const handleMapClick = useCallback(() => {
    setCardPlace(null);
    setHighlightedPlace(null);
  }, []);

  const handleOpenReviewForm = useCallback((existingReview?: any) => {
    if (existingReview) {
      setEditingReview(existingReview);
    }
  }, []);

  return {
    // State
    cardPlace,
    highlightedPlace,
    editingReview,
    
    // Basic setters
    setCardPlace,
    setHighlightedPlace,
    setEditingReview,
    
    // Semantic handlers
    openPlaceCard,
    closePlaceCard,
    highlightPlace,
    startEditingReview,
    stopEditingReview,
    
    // Combined operation handlers
    handlePlaceClick,
    handleMapClick,
    handleOpenReviewForm,
  };
}
