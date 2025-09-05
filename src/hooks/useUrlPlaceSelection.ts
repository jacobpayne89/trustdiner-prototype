"use client";

import { useEffect, useState } from 'react';
import type { Place } from '@/types';

interface UseUrlPlaceSelectionProps {
  placeIdFromUrl: string | null;
  places: Place[];
  onPlaceSelect: (place: Place) => void;
}

/**
 * Custom hook to handle URL-based place selection
 * Finds and selects a place when URL contains a place_id parameter
 * Waits for newly imported places to become available
 */
export function useUrlPlaceSelection({ 
  placeIdFromUrl, 
  places, 
  onPlaceSelect 
}: UseUrlPlaceSelectionProps) {
  const [hasProcessedPlaceId, setHasProcessedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    // Only proceed if we have a place_id and it's different from the last processed one
    if (!placeIdFromUrl || hasProcessedPlaceId === placeIdFromUrl) {
      return;
    }

    console.log('🔍 URL place selection: Looking for place_id:', placeIdFromUrl);
    console.log('🔍 Available places:', Array.isArray(places) ? places.length : 'not an array');
    
    if (Array.isArray(places) && places.length > 0) {
      const place = places.find(p => 
        p.placeId === placeIdFromUrl ||
        (p as any).place_id === placeIdFromUrl ||
        (p as any).uuid === placeIdFromUrl ||
        String(p.id) === placeIdFromUrl
      );
      if (place) {
        console.log('✅ Found place for URL:', place.name);
        onPlaceSelect(place);
        setHasProcessedPlaceId(placeIdFromUrl);
      } else {
        console.log('❌ Place not found in current places array, will retry when places update');
        console.log('🔍 Available place IDs (placeId):', places.map(p => p.placeId).slice(0, 5));
        console.log('🔍 Available place IDs (place_id):', places.map(p => (p as any).place_id).slice(0, 5));
      }
    }
  }, [placeIdFromUrl, places]); // Remove onPlaceSelect to prevent infinite re-renders

  // Reset when place_id changes
  useEffect(() => {
    if (placeIdFromUrl !== hasProcessedPlaceId) {
      setHasProcessedPlaceId(null);
    }
  }, [placeIdFromUrl]);
}
