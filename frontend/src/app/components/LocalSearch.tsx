"use client";

import React from "react";
import { useLocalSearch } from "@/hooks/useLocalSearch";
import type { SearchResult, LocalSearchProps } from "@/types";


// Helper function to get color for allergy score (1-5 scale)
function getScoreColor(score: number): string {
  if (score >= 5) return "#22C55E"; // green (5 - Excellent)
  if (score >= 4) return "#84CC16"; // lime (4 - Good)
  if (score >= 3) return "#EAB308"; // yellow (3 - Okay)
  if (score >= 2) return "#F97316"; // orange (2 - Avoid)
  if (score >= 1) return "#EF4444"; // red (1 - Unsafe)
  return "#9CA3AF"; // gray for no score
}

function getScoreLabel(score: number): string {
  if (score >= 5) return "Excellent";
  if (score >= 4) return "Good";
  if (score >= 3) return "Okay";
  if (score >= 2) return "Avoid";
  if (score >= 1) return "Unsafe";
  return "No Rating";
}



export default function LocalSearch({ 
  placeholder = "Search for somewhere to eat safely...",
  className = ""
}: LocalSearchProps) {
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState<{
    source: 'database' | 'hybrid';
    google_available: boolean;
    count: number;
    breakdown?: { database: number; google_total: number; google_new: number };
  } | null>(null);
  const [isGoogleFallbackActive, setIsGoogleFallbackActive] = useState(false);
  const [hasLoadedGoogleResults, setHasLoadedGoogleResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  
  // Debug: Remove this after testing
  // console.log('🔍 LocalSearch component rendered:', { searchValue, resultsCount: searchResults.length, showDropdown, isSearching });

  // Load Google results and append to existing results
  const loadGoogleResults = async (query: string) => {
    const url = `/api/search?q=${encodeURIComponent(query)}&google_fallback=true`;
    console.log('🌐 Fetching Google results:', url);
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      
      // Extract only Google results
      const googleResults = data.results?.filter((r: any) => r.source === 'google' || r.result_type === 'google') || [];
      
      // Transform Google results
      const transformedGoogleResults: SearchResult[] = googleResults.map((result: any) => ({
        place_id: result.place_id,
        name: result.name,
        address: result.formatted_address || result.address,
        rating: result.rating || 0,
        user_ratings_total: result.user_ratings_total || 0,
        price_level: result.price_level || 0,
        allergy_rating: 0, // Google results don't have allergy ratings
        source: 'google',
        inDatabase: result.inDatabase || false,
        addable: result.addable !== false,
        localImageUrl: null,
        s3ImageUrl: null,
        databaseId: null,
        position: result.geometry?.location ? {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        } : result.position,
        types: result.types || [],
        photos: result.photos || [],
        result_type: 'google'
      }));
      
      // Append Google results to existing results
      setSearchResults(prev => {
        const newResults = [...prev, ...transformedGoogleResults];
        console.log(`🌐 Appending ${transformedGoogleResults.length} Google results to ${prev.length} existing results = ${newResults.length} total`);
        return newResults;
      });
      setHasLoadedGoogleResults(true);
      console.log('🔒 hasLoadedGoogleResults set to true - debounced search should now be blocked');
      
      // Update metadata
      setSearchMetadata(prev => prev ? {
        ...prev,
        source: 'hybrid',
        count: prev.count + transformedGoogleResults.length,
        breakdown: {
          database: prev.breakdown?.database || 0,
          google_total: transformedGoogleResults.length,
          google_new: transformedGoogleResults.length
        }
      } : null);
      
      console.log(`🌐 Added ${transformedGoogleResults.length} Google results`);
      
      // Ensure dropdown stays open after adding Google results
      console.log('🔓 Explicitly setting showDropdown(true) after Google results loaded');
      setShowDropdown(true);
    } else {
      console.error('Google search API error:', response.status);
    }
  };

  // Progressive search: Database first, then Google on demand
  const performSearch = async (query: string, forceFallback = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchMetadata(null);
      setHasLoadedGoogleResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      if (forceFallback) {
        // Load Google results and append to existing results
        console.log('🌐 Loading additional Google results for:', query);
        await loadGoogleResults(query);
      } else {
        // Initial search: Database only
        console.log('🔍 Initial database search for:', query);
        
        const url = `/api/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          
          // Filter to only database results
          const databaseResults = data.results?.filter((r: any) => r.source === 'database' || r.result_type === 'local') || [];
          
          // Transform database results
          const transformedResults: SearchResult[] = databaseResults.map((result: any) => ({
            place_id: result.place_id,
            name: result.name,
            address: result.address,
            rating: result.rating || 0,
            user_ratings_total: result.user_ratings_total || 0,
            price_level: result.price_level || 0,
            allergy_rating: result.allergy_rating || 0,
            source: result.source,
            inDatabase: true,
            addable: false,
            localImageUrl: result.local_image_url || result.localImageUrl,
            s3ImageUrl: result.s3_image_url,
            databaseId: result.id,
            position: result.latitude && result.longitude ? {
              lat: result.latitude,
              lng: result.longitude
            } : result.position,
            types: result.types || [],
            photos: result.photos || [],
            result_type: result.result_type || 'local'
          }));
          
          const metadata = {
            source: 'database' as const,
            google_available: data.google_available !== false,
            count: transformedResults.length,
            breakdown: { database: transformedResults.length, google_total: 0, google_new: 0 }
          };
          
          setSearchResults(transformedResults);
          setSearchMetadata(metadata);
          setHasLoadedGoogleResults(false);
          
          console.log(`🔍 Found ${transformedResults.length} database results`);
        } else {
          console.error('Search API error:', response.status);
          setSearchResults([]);
          setSearchMetadata(null);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      if (!forceFallback) {
        setSearchResults([]);
        setSearchMetadata(null);
      }
    } finally {
      setIsSearching(false);
      setShowDropdown(true);
      if (forceFallback) {
        setIsGoogleFallbackActive(false);
      }
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchValue.trim()) {
      // Don't trigger debounced search if Google fallback is active OR Google results are already loaded
      if (!isGoogleFallbackActive && !hasLoadedGoogleResults) {
        console.log('⏰ Setting up debounced search for:', searchValue);
        searchTimeoutRef.current = setTimeout(() => {
          console.log('🔍 Executing debounced search for:', searchValue);
          performSearch(searchValue);
        }, 300);
      } else {
        console.log('🚫 Skipping debounced search - isGoogleFallbackActive:', isGoogleFallbackActive, 'hasLoadedGoogleResults:', hasLoadedGoogleResults);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
      setIsGoogleFallbackActive(false);
      setHasLoadedGoogleResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, isGoogleFallbackActive, hasLoadedGoogleResults]);

  // Show dropdown when search results are available
  useEffect(() => {
    console.log('🔍 Search results changed:', searchResults.length, 'results, searchValue:', searchValue, 'showDropdown:', showDropdown, 'searchMetadata:', !!searchMetadata);
    if (searchResults.length > 0 && searchValue.trim()) {
      console.log('✅ Showing dropdown - conditions met (has results)');
      setShowDropdown(true);
    } else if (!searchValue.trim()) {
      console.log('❌ Hiding dropdown - no search value');
      setShowDropdown(false);
    } else {
      console.log('⚠️ Not changing dropdown - searchResults.length:', searchResults.length, 'searchValue.trim():', searchValue.trim());
    }
  }, [searchResults, searchValue]);

  // Debug dropdown state changes
  useEffect(() => {
    console.log('🎯 showDropdown changed to:', showDropdown);
  }, [showDropdown]);

  const handleResultClick = async (result: SearchResult) => {
    setSearchValue("");
    setSearchResults([]);
    setShowDropdown(false);
    
    console.log('🔍 Search result clicked:', result.name, 'Source:', result.source);
    console.log('🔍 Full search result data:', result);
    console.log('🔍 place_id value:', result.place_id, 'Type:', typeof result.place_id);
    
    // Store place data in sessionStorage for the main page to process
    const placeData = {
      place_id: result.place_id,
      name: result.name,
      formatted_address: result.address,
      geometry: {
        location: {
          lat: result.position?.lat || 0,
          lng: result.position?.lng || 0
        }
      },
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      price_level: result.price_level,
      types: result.types || ['restaurant'],
      source: result.source,
      inDatabase: result.inDatabase,
      photos: result.photos || [] // Include photos for immediate display
    };
    
    console.log('💾 Storing place data in sessionStorage:', placeData);
    sessionStorage.setItem('selectedPlace', JSON.stringify(placeData));
    
    // Navigate to the place URL to trigger the main page processing
    console.log('🧭 Navigating to place URL:', result.place_id);
    router.push(`/?place_id=${encodeURIComponent(result.place_id)}`);
    
    // If it's a new Google Places result, trigger deferred import
    if ((result.source === 'google' || result.result_type === 'google') && !result.inDatabase) {
      console.log('📥 Triggering deferred import for Google place:', result.place_id);
      
      // Use search import endpoint to import Google Places result
      fetch('/api/search/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result)
      }).then(async response => {
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Deferred import completed:', data);
          
          if (data.imported) {
            console.log(`✅ Successfully imported Google place: ${data.place.name} (ID: ${data.place.id})`);
          } else {
            console.log(`ℹ️ Place already existed: ${data.place_id}`);
          }
        } else {
          const errorData = await response.text();
          console.warn('⚠️ Deferred import failed:', response.status, errorData);
        }
      }).catch(error => {
        console.error('❌ Deferred import error:', error);
      });
    }
    
    console.log('✅ Search result processing completed - URL updated with place_id');
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0 && searchValue.trim()) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full px-6 py-2.5 rounded-full bg-white bg-opacity-40 text-lg text-gray-800 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-white border-none shadow-none"
          style={{ fontWeight: 500 }}
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && searchValue.trim() && (searchResults.length > 0 || searchMetadata || !isSearching) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {searchResults.map((result, index) => (
            <div key={`${result.place_id}-${index}`} className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => handleResultClick(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{result.name}</div>
                      {result.inDatabase && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          ✓ In Database
                        </span>
                      )}
                      {result.addable && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                      {result.source === 'database' && result.allergy_rating && result.allergy_rating > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          Rated
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{result.address}</div>
                    {result.addable && (
                      <div className="text-sm text-blue-600 mt-1">
                        📝 Can be added to database
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-3 flex items-center gap-3">
                    <div
                      className="px-3 py-1 rounded-full text-white text-xs flex items-center justify-center shadow-md"
                      style={{
                        backgroundColor: getScoreColor(result.allergy_rating || 0),
                      }}
                    >
                      {result.allergy_rating && result.allergy_rating > 0 ? (
                        <>
                          <span className="font-bold">{result.allergy_rating.toFixed(1)}</span>
                          <span className="ml-1 font-normal">{getScoreLabel(result.allergy_rating)}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold">0.0</span>
                          <span className="ml-1 font-normal">No Rating</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>

            </div>
          ))}
          
          {/* No Results Message */}
          {searchResults.length === 0 && searchValue.trim() && !isSearching && (
            <div className="p-4 text-center">
              <div className="text-gray-500">
                No establishments found for "{searchValue}"
              </div>
            </div>
          )}
          
          {/* Search More Places Button */}
          {searchMetadata && searchMetadata.google_available && !hasLoadedGoogleResults && (
            <div className="border-t border-gray-200 p-3">
              <div className="text-xs text-gray-500 mb-2">
                Found {searchMetadata.count} local results. Still not seeing what you're looking for?
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🌐 "Search more places" clicked, triggering Google fallback for:', searchValue);
                  console.log('🔍 Before click - showDropdown:', showDropdown, 'searchResults.length:', searchResults.length);
                  
                  // Force dropdown to stay open
                  setShowDropdown(true);
                  
                  setIsGoogleFallbackActive(true);
                  performSearch(searchValue, true);
                  
                  // Force dropdown to stay open again after a short delay
                  setTimeout(() => {
                    console.log('🔒 Forcing dropdown to stay open after delay');
                    setShowDropdown(true);
                  }, 100);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  console.log('🔽 Button mouseDown event');
                }}
                disabled={isSearching}
                className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                🌐 Search more places on Google {isSearching && '(Searching...)'}
              </button>
            </div>
          )}
          
          {/* Google Results Loaded Message */}
          {searchMetadata && hasLoadedGoogleResults && (
            <div className="border-t border-gray-200 p-3">
              <div className="text-xs text-gray-500 text-center py-2 bg-green-50 rounded-md">
                ✅ Google results loaded! ({searchMetadata.breakdown?.google_total || 0} additional places)
              </div>
            </div>
          )}
          
          {/* Search Results Summary */}
          {searchMetadata && searchMetadata.breakdown && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <div className="text-xs text-gray-600">
                Results: {searchMetadata.breakdown.database} local, {searchMetadata.breakdown.google_new} from Google
                {searchMetadata.source === 'hybrid' && ' 🎯 Cost-optimized search'}
              </div>
            </div>
          )}
        </div>
      )}




    </div>
  );
} 