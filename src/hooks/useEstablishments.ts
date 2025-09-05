import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { validatePlaces } from '@/lib/validation-utils';
import type { PlaceValidated } from '@/types/zod-schemas';
import { imageCache } from '@/lib/imageCache';
import { usePagination } from './usePagination';
import { useDebounce } from './useDebounce';

interface UseEstablishmentsOptions {
  enablePagination?: boolean;
  pageSize?: number;
  enableFiltering?: boolean;
}

export function useEstablishments(options: UseEstablishmentsOptions = {}) {
  // Reduced debug logging for cleaner console
  
  const { 
    enablePagination = false, 
    pageSize = 50, 
    enableFiltering = false 
  } = options;

  const [allPlaces, setAllPlaces] = useState<PlaceValidated[]>([]);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(false);
  const [establishmentsError, setEstablishmentsError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    allergens: [] as string[],
    minRating: null as number | null,
    hasReviews: false
  });

  // Debounce filters to prevent excessive re-filtering
  const debouncedFilters = useDebounce(filters, 300);

  const loadEstablishments = useCallback(async (forceFresh = false, filterParams?: { allergenSafe?: string[]; minRating?: number }) => {
    setEstablishmentsLoading(true);
    setEstablishmentsError(null);
    try {
      // Build API parameters (load a larger batch locally)
      const params: any = { limit: 2000 };
      
      // Add cache busting parameter when forcing fresh data
      if (forceFresh) {
        params._t = Date.now();
      }
      
      // Add filter parameters
      if (filterParams?.allergenSafe && filterParams.allergenSafe.length > 0) {
        params.allergenSafe = filterParams.allergenSafe;
      }
      if (filterParams?.minRating) {
        params.minRating = filterParams.minRating;
      }
      
      const establishments = await api.getEstablishments(params);
      console.log('✅ Loaded and validated establishments:', establishments?.length || 'undefined');
      
      // Skip client-side validation for now since we're using canonical types
      // TODO: Update PlaceSchema to match EstablishmentWithStats format
      const finalEstablishments = establishments;
      setAllPlaces(finalEstablishments as PlaceValidated[]);
      
      // Skip aggressive image prefetching to avoid 404 spam in development
      // Images will be loaded on-demand when place cards are opened
      if (finalEstablishments && finalEstablishments.length > 0) {
        const placesWithImages = finalEstablishments.filter(place => (place as any).localImageUrl || place.local_image_url);
        console.log('📷 Found', placesWithImages.length, 'of', finalEstablishments.length, 'places with image URLs (will load on-demand)');
      }
    } catch (error) {
      console.error('❌ Failed to load establishments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load restaurants';
      setEstablishmentsError(errorMessage);
    } finally {
      setEstablishmentsLoading(false);
    }
  }, []);

  // Load establishments when component mounts (client-side only)
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted && typeof window !== 'undefined') {
        await loadEstablishments();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run on mount

  // Since we're now using server-side filtering, we don't need client-side filtering
  // Just return all places as received from the server
  const filteredPlaces = useMemo(() => {
    if (!allPlaces.length) {
      console.log('📊 No places loaded yet, returning empty array');
      return [];
    }

    console.log(`📋 Server-side filtering active, showing all ${allPlaces.length} places from server`);
    return allPlaces;
  }, [allPlaces]);

  // Pagination
  const pagination = usePagination({
    data: filteredPlaces,
    pageSize,
    initialPage: 1
  });

  // Update filter functions
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      allergens: [],
      minRating: null,
      hasReviews: false
    });
  }, []);

  const retryLoad = useCallback(() => {
    setEstablishmentsError(null);
    loadEstablishments();
  }, []); // Empty dependency array to prevent infinite loops

  // Function to reload establishments with current filters
  const reloadWithFilters = useCallback((filterParams: { allergenSafe?: string[]; minRating?: number }) => {
    loadEstablishments(false, filterParams);
  }, [loadEstablishments]);

  return {
    // Data (maintain backward compatibility) - simplified for debugging
    places: allPlaces,
    allPlaces,
    filteredPlaces,
    
    // Loading states
    establishmentsLoading,
    establishmentsError,
    
    // Error handling
    retryLoad,
    
    // Backward compatibility
    setPlaces: setAllPlaces,
    refreshEstablishments: () => loadEstablishments(true), // Force fresh data on refresh
    reloadWithFilters, // New function to reload with filter parameters
    
    // Pagination (if enabled)
    ...(enablePagination && {
      pagination
    }),
    
    // Filtering (if enabled)
    ...(enableFiltering && {
      filters,
      updateFilters,
      clearFilters,
      hasActiveFilters: Object.values(debouncedFilters).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== null && value !== '' && value !== false
      )
    })
  };
}
