import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { SearchResult } from '@/types';

interface UsageInfo {
  requestsToday: number;
  requestsThisMonth: number;
  costToday: number;
  costThisMonth: number;
}

interface SearchInfo {
  query: string;
  count: number;
  usage: UsageInfo;
}

interface PlaceDetailsResponse {
  place: SearchResult;
  source: 'cache' | 'api';
  cached: boolean;
  callId?: string;
  usage?: UsageInfo;
  error?: string;
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('London');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<SearchInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
  const router = useRouter();

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a restaurant name to search');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults([]);
    setSearchInfo(null);

    try {
      const response = await fetch(`/api/places/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results);
      setSearchInfo({
        query: data.query,
        count: data.count,
        usage: data.usage
      });

      console.log(`🔍 Search completed: ${data.count} results for "${data.query}"`);

    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message || 'Failed to search restaurants');
    } finally {
      setIsSearching(false);
    }
  }, [query, location]);

  const handlePlaceSelect = useCallback(async (place: SearchResult) => {
    setIsLoadingDetails(place.placeId);
    setError(null);

    try {
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId: place.placeId }),
      });

      const data: PlaceDetailsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get place details');
      }

      setSelectedPlace(data.place);
      
      // Update the place in results to show it's now cached
      setResults(prev => prev.map(p => 
        p.placeId === place.placeId 
          ? { ...p, inDatabase: true }
          : p
      ));

      console.log(`✅ Place details loaded: ${data.place.name} (Source: ${data.source})`);

    } catch (error: any) {
      console.error('Place details error:', error);
      setError(error.message || 'Failed to load place details');
    } finally {
      setIsLoadingDetails(null);
    }
  }, []);

  const formatPriceLevel = useCallback((level?: number): string => {
    if (!level) return 'Price not available';
    return '£'.repeat(level) + '·'.repeat(4 - level);
  }, []);

  const formatTypes = useCallback((types: string[]): string => {
    const formatted = types
      .filter(type => !['establishment', 'point_of_interest'].includes(type))
      .map(type => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .slice(0, 3);
    return formatted.join(', ');
  }, []);

  return {
    // State
    query,
    location,
    results,
    isSearching,
    isLoadingDetails,
    searchInfo,
    error,
    selectedPlace,
    
    // Actions
    setQuery,
    setLocation,
    handleSearch,
    handlePlaceSelect,
    
    // Utilities
    formatPriceLevel,
    formatTypes,
  };
}

