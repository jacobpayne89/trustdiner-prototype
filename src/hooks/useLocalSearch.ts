import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Place, SearchResult } from '@/types';

interface LocalSearchProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
  highlightedPlace: Place | null;
  setHighlightedPlace: (place: Place | null) => void;
  onPlaceImported?: () => void;
  onPlaceSelectFromSearch?: (place: SearchResult) => void;
}

export function useLocalSearch({
  places,
  onPlaceClick,
  highlightedPlace,
  setHighlightedPlace,
  onPlaceImported,
  onPlaceSelectFromSearch
}: LocalSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [googleResults, setGoogleResults] = useState<SearchResult[]>([]);
  const [showGoogleResults, setShowGoogleResults] = useState(false);
  const [isLoadingGoogleResults, setIsLoadingGoogleResults] = useState(false);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Filter local places based on search
  const filterLocalPlaces = useCallback((query: string) => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return places
      .filter(place => 
        place.name.toLowerCase().includes(searchTerm) ||
        place.address?.toLowerCase().includes(searchTerm) ||
        place.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
      .slice(0, 8); // Limit to 8 results
  }, [places]);

  // Search Google Places API
  const searchGooglePlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) return;
    
    setIsLoadingGoogleResults(true);
    try {
      const response = await fetch(`/api/places/search?query=${encodeURIComponent(query)}&location=London`);
      const data = await response.json();
      
      if (response.ok && data.results) {
        setGoogleResults(data.results.slice(0, 5)); // Limit to 5 Google results
        setShowGoogleResults(true);
      }
    } catch (error) {
      console.error('Google search error:', error);
    } finally {
      setIsLoadingGoogleResults(false);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      const localResults = filterLocalPlaces(value);
      setSearchResults(localResults);
      setShowDropdown(true);
      
      // Trigger Google search after a delay
      const timeoutId = setTimeout(() => {
        searchGooglePlaces(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
      setShowGoogleResults(false);
      setGoogleResults([]);
    }
  }, [filterLocalPlaces, searchGooglePlaces]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalResults = searchResults.length + (showGoogleResults ? googleResults.length : 0);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalResults);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalResults - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < searchResults.length) {
            // Local result selected
            const selectedPlace = searchResults[selectedIndex];
            handlePlaceSelect(selectedPlace);
          } else {
            // Google result selected
            const googleIndex = selectedIndex - searchResults.length;
            const selectedGooglePlace = googleResults[googleIndex];
            handleGooglePlaceSelect(selectedGooglePlace);
          }
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setShowGoogleResults(false);
        searchRef.current?.blur();
        break;
    }
  }, [searchResults, googleResults, selectedIndex, showGoogleResults]);

  // Handle local place selection
  const handlePlaceSelect = useCallback((place: Place) => {
    setSearchValue(place.name);
    setShowDropdown(false);
    setShowGoogleResults(false);
    onPlaceClick(place);
  }, [onPlaceClick]);

  // Handle Google place selection
  const handleGooglePlaceSelect = useCallback(async (place: SearchResult) => {
    setIsSearching(true);
    try {
      // Import the place first
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: place.placeId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchValue(data.place.name);
        setShowDropdown(false);
        setShowGoogleResults(false);
        
        // Notify parent components
        onPlaceImported?.();
        onPlaceSelectFromSearch?.(data.place);
      }
    } catch (error) {
      console.error('Error importing place:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onPlaceImported, onPlaceSelectFromSearch]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowGoogleResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchValue('');
    setSearchResults([]);
    setShowDropdown(false);
    setShowGoogleResults(false);
    setGoogleResults([]);
    setSelectedIndex(-1);
  }, []);

  return {
    // State
    searchValue,
    searchResults,
    showDropdown,
    selectedIndex,
    isSearching,
    googleResults,
    showGoogleResults,
    isLoadingGoogleResults,
    
    // Refs
    searchRef,
    dropdownRef,
    
    // Actions
    handleSearchChange,
    handleKeyDown,
    handlePlaceSelect,
    handleGooglePlaceSelect,
    clearSearch,
    setShowDropdown,
    setHighlightedPlace,
    
    // Computed
    totalResults: searchResults.length + (showGoogleResults ? googleResults.length : 0),
  };
}

