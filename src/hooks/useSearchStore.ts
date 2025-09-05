"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SearchResult } from '@/types';

// Search metadata interface
export interface SearchMetadata {
  source: 'database' | 'hybrid';
  google_available: boolean;
  count: number;
  breakdown?: { 
    database: number; 
    google_total: number; 
    google_new: number; 
  };
}

// Centralized search store interface 
export interface SearchStore {
  // Core search state
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  selectedSearchResult: SearchResult | null;
  shouldShowGoogleFallback: boolean;
  
  // UI state
  showDropdown: boolean;
  searchMetadata: SearchMetadata | null;
  isGoogleFallbackActive: boolean;
  hasLoadedGoogleResults: boolean;
  isImporting: boolean;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[] | ((prev: SearchResult[]) => SearchResult[])) => void;
  setSearchLoading: (loading: boolean) => void;
  setSelectedSearchResult: (result: SearchResult | null) => void;
  setShowDropdown: (show: boolean) => void;
  setSearchMetadata: (metadata: SearchMetadata | null | ((prev: SearchMetadata | null) => SearchMetadata | null)) => void;
  setIsGoogleFallbackActive: (active: boolean) => void;
  setHasLoadedGoogleResults: (loaded: boolean) => void;
  setIsImporting: (importing: boolean) => void;
  
  // Utility actions
  clearSearch: () => void;
  resetGoogleFallback: () => void;
}

/**
 * Centralized hook for managing global search state
 * Consolidates search-related state that was previously scattered across components
 */
export function useSearchStore(): SearchStore {
  // Core search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
  
  // UI and interaction state
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);
  const [isGoogleFallbackActive, setIsGoogleFallbackActive] = useState(false);
  const [hasLoadedGoogleResults, setHasLoadedGoogleResults] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Computed state
  const shouldShowGoogleFallback = Boolean(searchMetadata?.google_available && !hasLoadedGoogleResults);
  
  // Utility actions
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchMetadata(null);
    setHasLoadedGoogleResults(false);
    setShowDropdown(false);
    setIsGoogleFallbackActive(false);
    setIsImporting(false);
    setSelectedSearchResult(null);
  }, []);
  
  const resetGoogleFallback = useCallback(() => {
    setIsGoogleFallbackActive(false);
    setHasLoadedGoogleResults(false);
  }, []);
  
  return {
    // State
    searchQuery,
    searchResults,
    searchLoading,
    selectedSearchResult,
    shouldShowGoogleFallback,
    showDropdown,
    searchMetadata,
    isGoogleFallbackActive,
    hasLoadedGoogleResults,
    isImporting,
    
    // Setters
    setSearchQuery,
    setSearchResults,
    setSearchLoading,
    setSelectedSearchResult,
    setShowDropdown,
    setSearchMetadata,
    setIsGoogleFallbackActive,
    setHasLoadedGoogleResults,
    setIsImporting,
    
    // Utility actions
    clearSearch,
    resetGoogleFallback,
  };
}
