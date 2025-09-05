import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/hooks/useSearchStore';
import type { EstablishmentWithStats } from '../../../shared/types/core';
import type { SearchResult } from '@/types';

interface UseSearchBarProps {
  places: EstablishmentWithStats[];
  onPlaceClick: (place: EstablishmentWithStats) => void;
  highlightedPlace: EstablishmentWithStats | null;
  setHighlightedPlace: (place: EstablishmentWithStats | null) => void;
  onPlaceImported?: () => void;
  onPlaceSelectFromSearch?: (place: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function useSearchBar({
  places,
  onPlaceClick,
  highlightedPlace,
  setHighlightedPlace,
  onPlaceImported,
  onPlaceSelectFromSearch,
  placeholder = "Search for somewhere to eat safely...",
  className = ""
}: UseSearchBarProps) {
  const searchStore = useSearchStore();
  const {
    searchValue,
    searchResults,
    showDropdown,
    searchMetadata,
    isSearching,
    setSearchValue,
    setSearchResults,
    setShowDropdown,
    setSearchMetadata,
    setIsSearching,
  } = searchStore;

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isGoogleFallbackActive, setIsGoogleFallbackActive] = useState(false);
  const [hasLoadedGoogleResults, setHasLoadedGoogleResults] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholder);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Load Google results and append to existing results
  const loadGoogleResults = useCallback(async (query: string) => {
    const url = `/api/search?q=${encodeURIComponent(query)}&google_fallback=true`;
    console.log('🌐 Fetching Google results:', url);
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        console.log(`✅ Got ${data.results.length} Google results`);
        
        // Append Google results to existing database results
        setSearchResults(prevResults => {
          const existingPlaceIds = new Set(prevResults.map(r => r.place_id));
          const newGoogleResults = data.results.filter((r: SearchResult) => 
            !existingPlaceIds.has(r.place_id)
          );
          
          return [...prevResults, ...newGoogleResults];
        });
        
        setSearchMetadata(prev => ({
          ...prev,
          source: 'hybrid' as const,
          breakdown: {
            database: prev?.count || 0,
            google_total: data.results.length,
            google_new: data.results.filter((r: SearchResult) => 
              !searchResults.some(existing => existing.place_id === r.place_id)
            ).length
          }
        }));
        
        setHasLoadedGoogleResults(true);
      } else {
        console.log('❌ No Google results found');
      }
    } catch (error) {
      console.error('❌ Error loading Google results:', error);
    }
  }, [setSearchResults, setSearchMetadata, searchResults]);

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearchMetadata(null);
      return;
    }

    setIsSearching(true);
    setIsGoogleFallbackActive(false);
    setHasLoadedGoogleResults(false);

    try {
      const url = `/api/search?q=${encodeURIComponent(query)}`;
      console.log('🔍 Searching:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Search results:', data);
      
      if (data.results) {
        setSearchResults(data.results);
        setSearchMetadata({
          source: data.source || 'database',
          google_available: data.google_available || false,
          count: data.count || data.results.length
        });
        
        // Show Google fallback option if we have few database results
        if (data.results.length < 3 && data.google_available) {
          setIsGoogleFallbackActive(true);
        }
        
        setShowDropdown(data.results.length > 0);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
        setSearchMetadata(null);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
      setShowDropdown(false);
      setSearchMetadata(null);
    } finally {
      setIsSearching(false);
    }
  }, [setSearchResults, setShowDropdown, setSearchMetadata, setIsSearching]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setSelectedIndex(-1);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [setSearchValue, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? searchResults.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          const selectedResult = searchResults[selectedIndex];
          handleResultSelect(selectedResult);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  }, [showDropdown, searchResults, selectedIndex]);

  // Handle result selection
  const handleResultSelect = useCallback(async (result: SearchResult) => {
    console.log('🎯 Selected result:', result);
    
    if (result.source === 'database') {
      // Find the place in our places array
      const place = places.find(p => p.placeId === result.place_id);
      if (place) {
        setSearchValue(result.name);
        setShowDropdown(false);
        onPlaceClick(place);
        return;
      }
    }
    
    // Handle Google result - import it first
    try {
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: result.place_id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchValue(result.name);
        setShowDropdown(false);
        
        // Notify parent components
        onPlaceImported?.();
        onPlaceSelectFromSearch?.(data.place);
      }
    } catch (error) {
      console.error('Error importing place:', error);
    }
  }, [places, setSearchValue, setShowDropdown, onPlaceClick, onPlaceImported, onPlaceSelectFromSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchValue('');
    setSearchResults([]);
    setShowDropdown(false);
    setSearchMetadata(null);
    setSelectedIndex(-1);
    setIsGoogleFallbackActive(false);
    setHasLoadedGoogleResults(false);
  }, [setSearchValue, setSearchResults, setShowDropdown, setSearchMetadata]);

  // Handle Google fallback
  const handleGoogleFallback = useCallback(() => {
    if (searchValue.trim()) {
      loadGoogleResults(searchValue);
    }
  }, [searchValue, loadGoogleResults]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    searchValue,
    searchResults,
    showDropdown,
    searchMetadata,
    isSearching,
    selectedIndex,
    isGoogleFallbackActive,
    hasLoadedGoogleResults,
    currentPlaceholder,
    
    // Actions
    handleSearchChange,
    handleKeyDown,
    handleResultSelect,
    clearSearch,
    handleGoogleFallback,
    setShowDropdown,
    setHighlightedPlace,
    
    // Utilities
    performSearch,
    loadGoogleResults,
  };
}

