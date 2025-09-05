import { useMemo } from 'react';
import type { EstablishmentWithStats } from '../../../shared/types/core';

// Helper function to convert Google Places photo reference to actual image URL
function convertGooglePlacesPhotoRef(photoRef: string | null): string | null {
  if (!photoRef) return null;
  
  // If it's already a full URL, return as-is
  if (photoRef.startsWith('http')) {
    return photoRef;
  }
  
  // If it's a Google Places photo reference (starts with ATKogp...)
  if (photoRef.startsWith('ATKogp')) {
    // Use the Google Places Photo API
    // Note: In production, this should use a backend proxy to hide the API key
    const apiKey = 'AIzaSyAohiZzDNq9DR77zIryQIdP4KYfhCIjuew'; // TODO: Move to env var
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;
  }
  
  // For other formats (demo://, etc.), return as-is
  return photoRef;
}
import { getAverageAllergenRating, getSafeAllergens } from '@/utils/allergenHelpers';
import { isPlaceChain } from '@/utils/chainDetection';

interface UseEstablishmentCardOptions {
  place: EstablishmentWithStats;
}

export function useEstablishmentCard({ place }: UseEstablishmentCardOptions) {
  // Memoized calculations to avoid recalculating on every render
  const averageRating = useMemo(() => 
    getAverageAllergenRating(null, place.avg_allergen_scores),
    [place.avg_allergen_scores]
  );

  const safeAllergens = useMemo(() => 
    getSafeAllergens(null, place.avg_allergen_scores),
    [place.avg_allergen_scores]
  );

  const hasRatings = useMemo(() => 
    place.review_count > 0 || (place.avg_allergen_scores && Object.values(place.avg_allergen_scores).some(score => score > 0)),
    [place.review_count, place.avg_allergen_scores]
  );

  const isChain = useMemo(() => 
    isPlaceChain(place),
    [place]
  );

  // Image logic
  const imageData = useMemo(() => {
    // For CHAIN venues, prioritize chain featured image over individual venue photos
    // For INDEPENDENT venues, use their individual photos
    // Chain logos should only be displayed next to the name, not as the main image
    
    // If this is a chain venue, use the chain's featured image first
    if (isChain && place.chain?.featured_image_path) {
      const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL === '/api' ? '' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
      const fullChainImageUrl = place.chain.featured_image_path.startsWith('http') ? 
        place.chain.featured_image_path : `${backendBaseUrl}${place.chain.featured_image_path}`;
      
      return {
        type: 'chain-featured' as const,
        url: fullChainImageUrl,
        alt: `${place.chain.name || place.name} featured image`,
        fallbackText: place.chain.name || 'Chain'
      };
    }
    
    // For independent venues OR chains without featured images, use individual venue photos
    const s3ImageUrl = (place as any).s3ImageUrl || (place as any).s3_image_url;
    const localImageUrl = (place as any).localImageUrl;
    const snakeCaseImageUrl = place.local_image_url;
    const processedImageUrl = (place as any).imageUrl; // This is the processed URL from backend
    
    // Prioritize processed imageUrl, then S3, then local images
    let venueImageUrl = processedImageUrl || s3ImageUrl || localImageUrl || snakeCaseImageUrl;
    
    // Convert Google Places photo references to actual URLs
    venueImageUrl = convertGooglePlacesPhotoRef(venueImageUrl);
    
    if (venueImageUrl) {
      // Ensure image URL is properly prefixed for development proxy
      const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL === '/api' ? '' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
      const fullImageUrl = venueImageUrl.startsWith('http') ? venueImageUrl : 
        `${backendBaseUrl}${venueImageUrl}`;
      
      return {
        type: 'venue' as const,
        url: fullImageUrl,
        alt: `${place.name} photo`,
        fallbackText: null
      };
    }
    
    // No image available - show placeholder
    return {
      type: 'placeholder' as const,
      url: null,
      alt: '',
      fallbackText: null
    };
  }, [isChain, place.chain?.featured_image_path, place.chain?.name, place.name, place.local_image_url, (place as any).localImageUrl, (place as any).s3ImageUrl, (place as any).s3_image_url, (place as any).imageUrl]);

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent, onPlaceClick: (place: EstablishmentWithStats) => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPlaceClick(place);
    }
  };

  return {
    averageRating,
    safeAllergens,
    hasRatings,
    isChain,
    imageData,
    handleKeyDown,
  };
}
