import React, { useState, useCallback, useEffect, memo, useMemo, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import RadioWaveOverlay from "./RadioWaveOverlay";
import type { EstablishmentWithStats } from '../../../../shared/types/core';
import type { MapContainerProps } from "@/types";
import { getScoreColor, getAverageAllergenRating, getScoreLabel } from "@/utils/allergenHelpers";
import { isPlaceChain } from "@/utils/chainDetection";

// Helper function to get marker color based on allergen score and chain status
const getMarkerColor = (place: EstablishmentWithStats): string => {
  const averageRating = getAverageAllergenRating(null, place.avg_allergen_scores);
  
  // If place has a rating, always use traffic light colors for consistency
  if (averageRating > 0) {
    return getScoreColor(averageRating);
  }
  
  // If no rating, use purple for chains, blue for regular restaurants
  if (isPlaceChain(place)) {
    return '#9333EA'; // Purple for chain restaurants without ratings
  }
  
  return '#2563eb'; // Blue for regular restaurants without ratings
};

// Use the same logic for both scored and unscored markers for consistency
const getBaseMarkerColor = getMarkerColor;

/**
 * Individual marker component - memoized to prevent unnecessary re-renders
 */
const MemoizedMarker = memo(function MemoizedMarker({
  place,
  isSelected,
  isHovered,
  onMarkerClick,
  onMarkerMouseOver,
  onMarkerMouseOut,
  map
}: {
  place: EstablishmentWithStats;
  isSelected: boolean;
  isHovered: boolean;
  onMarkerClick: (place: EstablishmentWithStats) => void;
  onMarkerMouseOver: (place: EstablishmentWithStats) => void;
  onMarkerMouseOut: () => void;
  map: google.maps.Map | null;
}) {
  const positionLat = place.position?.lat || place.latitude;
  const positionLng = place.position?.lng || place.longitude;
  
  const lat = (typeof positionLat === 'string' ? parseFloat(positionLat) : positionLat) || 0;
  const lng = (typeof positionLng === 'string' ? parseFloat(positionLng) : positionLng) || 0;
  
  // Skip invalid markers
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const position = { lat, lng };

  return (
    <React.Fragment>
      <Marker
        position={position}
        onClick={() => onMarkerClick(place)}
        onMouseOver={() => onMarkerMouseOver(place)}
        onMouseOut={onMarkerMouseOut}
        zIndex={(() => {
          const score = getAverageAllergenRating(place.allergenRatings || {}, place.averageAllergenScores);
          
          // Force low z-index for unreviewed places (blue markers)
          // High z-index for reviewed places (colored markers)
          if (isSelected) return 100000;
          // REMOVED: if (isHovered) return 90000; // This was causing jumping
          if (score > 0) return 2000 + score; // Higher z-index for reviewed places (like original)
          return 1; // Very low z-index for unreviewed places
        })()}
        icon={(() => {
          const score = getAverageAllergenRating(place.allergenRatings || {}, place.averageAllergenScores);
          const hasScore = score > 0;
        
        if (hasScore) {
          // Create scored marker with number - WITH HOVER SIZE CHANGE (40% smaller)
          const size = isSelected ? 36 : isHovered ? 30 : 24; // Made selected markers smaller (36 instead of 48)
          const textSize = isSelected ? 14 : isHovered ? 12 : 10; // Made selected text smaller (14 instead of 19)
          const color = getMarkerColor(place);
          const strokeWidth = isHovered ? 2 : 0; // Proportionally smaller border on hover
          const strokeColor = isHovered ? '#000' : 'none'; // Black border on hover
          
          const svg = encodeURIComponent(`
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="${size/2}" cy="${size/2}" r="${size/2 - strokeWidth/2}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
              <text x="${size/2}" y="${size/2}" text-anchor="middle" font-size="${textSize}" font-family="Ubuntu, sans-serif" font-weight="bold" fill="#222" dominant-baseline="central" alignment-baseline="central">${score}</text>
            </svg>
          `);
          
          return {
            url: `data:image/svg+xml;charset=UTF-8,${svg}`,
            scaledSize: new google.maps.Size(size, size),
            anchor: new google.maps.Point(size/2, size/2),
          };
        } else {
          // Create marker without number - WITH HOVER SIZE CHANGE
          const size = isSelected ? 18 : isHovered ? 16 : 10; // Made selected unrated markers smaller (18 instead of 24)
          const markerColor = getBaseMarkerColor(place);
          const strokeWidth = 1; // Thin border for unrated places
          
          // Create a darker shade of the marker color for the border
          const getDarkerShade = (color: string) => {
            if (color === '#2563eb') return '#1d4ed8'; // Darker blue
            if (color === '#9333EA') return '#7c3aed'; // Darker purple
            return color; // Fallback to original color
          };
          const strokeColor = getDarkerShade(markerColor);
          
          const svg = encodeURIComponent(`
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="${size/2}" cy="${size/2}" r="${size/2 - strokeWidth/2}" fill="${markerColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
            </svg>
          `);
          
          return {
            url: `data:image/svg+xml;charset=UTF-8,${svg}`,
            scaledSize: new google.maps.Size(size, size),
            anchor: new google.maps.Point(size/2, size/2),
          };
        }
      })()}
    />
    
    {/* RadioWave overlay for SELECTED places only */}
    {isSelected && (
      <RadioWaveOverlay 
        position={position} 
        map={map}
        size={36}
        color={getMarkerColor(place)}
      />
    )}
  </React.Fragment>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the props that matter for this specific marker changed
  return (
    prevProps.place.id === nextProps.place.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.onMarkerClick === nextProps.onMarkerClick &&
    prevProps.onMarkerMouseOver === nextProps.onMarkerMouseOver &&
    prevProps.onMarkerMouseOut === nextProps.onMarkerMouseOut &&
    prevProps.map === nextProps.map
  );
});

/**
 * Google Maps container component with descriptive classes for debugging
 */
function MapContainer({
  places,
  selectedPlace,
  setSelectedPlace,
  hoveredMarker,
  setHoveredMarker,
  onMapLoad,
  onPlaceCardOpen,
  center = { lat: 51.509865, lng: -0.118092 }, // Default to London
  zoom = 13,
  className = "",
  activeLocation = null
}: MapContainerProps) {
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  // no state needed; rely on global script
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Simple check - just like it was working before
  const isGoogleLoaded = isClient && typeof window !== 'undefined' && (window as any).google;

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [onMapLoad]);

  const handleMarkerClick = (place: EstablishmentWithStats) => {
    setSelectedPlace(place);
    // Also open the place card if callback is provided
    if (onPlaceCardOpen) {
      onPlaceCardOpen(place);
    }
  };

  const handleMarkerMouseOver = (place: EstablishmentWithStats) => {
    setHoveredMarker(place);
  };

  const handleMarkerMouseOut = () => {
    setHoveredMarker(null);
  };

  // Stable callback references to prevent breaking memoization
  const handleMarkerClickStable = useCallback(handleMarkerClick, []);
  const handleMarkerMouseOverStable = useCallback(handleMarkerMouseOver, []);
  const handleMarkerMouseOutStable = useCallback(handleMarkerMouseOut, []);







  // Map styling options
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  // Use controlled map with stable key to prevent unnecessary re-renders
  const mapKey = useMemo(() => `map-${center.lat}-${center.lng}-${zoom}`, [center.lat, center.lng, zoom]);

  return (
    <div 
      className={`map-container-wrapper ${className} w-full h-full`}
      role="application"
      aria-label="Interactive map of restaurants"
    >
      {!isGoogleLoaded ? (
        // Loading state - same structure to avoid hydration mismatch
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-100">
          <div className="text-center space-y-4">
            <div className="text-2xl text-gray-600">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-800">Map Loading...</h3>
            <p className="text-gray-600">Google Maps is initializing</p>
          </div>
        </div>
      ) : (
        <GoogleMap
          key={mapKey}
          mapContainerClassName="google-map-instance w-full h-full"
          mapContainerStyle={{ 
            width: '100%', 
            height: '100%', 
            minHeight: '400px'
          }}
          center={center}
          zoom={zoom}
          onLoad={handleMapLoad}
          options={mapOptions}
        >
        {/* Unreviewed Places Layer - Render first (below) */}
        {Array.isArray(places) && places
          .filter(place => getAverageAllergenRating(place.allergenRatings || {}, place.averageAllergenScores) === 0)
          .map((place) => (
            <MemoizedMarker
              key={place.id}
              place={place}
              isSelected={
                selectedPlace?.id === place.id || 
                ((selectedPlace as any)?.isAggregatedChain && 
                 (selectedPlace as any)?.chainId === place.chainId)
              }
              isHovered={hoveredMarker?.id === place.id}
              onMarkerClick={handleMarkerClickStable}
              onMarkerMouseOver={handleMarkerMouseOverStable}
              onMarkerMouseOut={handleMarkerMouseOutStable}
              map={map}
            />
          ))}



        {/* Reviewed Places Layer - Render second (on top) */}
        {Array.isArray(places) && places
          .filter(place => getAverageAllergenRating(place.allergenRatings || {}, place.averageAllergenScores) > 0)
          .map((place) => (
            <MemoizedMarker
              key={`reviewed-${place.id}`}
              place={place}
              isSelected={
                selectedPlace?.id === place.id || 
                ((selectedPlace as any)?.isAggregatedChain && 
                 (selectedPlace as any)?.chainId === place.chainId)
              }
              isHovered={hoveredMarker?.id === place.id}
              onMarkerClick={handleMarkerClickStable}
              onMarkerMouseOver={handleMarkerMouseOverStable}
              onMarkerMouseOut={handleMarkerMouseOutStable}
              map={map}
            />
          ))}

        {/* Info Window - Shows only for hovered places when no place card is open */}
        {hoveredMarker && !selectedPlace && (() => {
          // Calculate position with validation
          let lat = hoveredMarker?.position?.lat;
          let lng = hoveredMarker?.position?.lng;
          
          // Try alternative coordinate sources if position is not available
          if (lat === undefined || lat === null) {
            lat = typeof hoveredMarker?.latitude === 'string' ? parseFloat(hoveredMarker?.latitude) : hoveredMarker?.latitude;
          }
          if (lng === undefined || lng === null) {
            lng = typeof hoveredMarker?.longitude === 'string' ? parseFloat(hoveredMarker?.longitude) : hoveredMarker?.longitude;
          }
          
          // Only render InfoWindow if we have valid, non-zero coordinates
          if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
            console.warn('InfoWindow: Invalid coordinates', { lat, lng, hoveredMarker: hoveredMarker?.name });
            return null;
          }
          
          return (
            <InfoWindow
              position={{ lat, lng }}
              onCloseClick={() => setHoveredMarker(null)}
              options={{
                pixelOffset: new google.maps.Size(0, -30),
                disableAutoPan: true // Don't auto-pan for hover
              }}
            >
            <div 
              className="text-sm w-80 h-auto"
              style={{ margin: 0, padding: 0 }}
            >
              {/* Place Image with Score Overlay - EXACT ORIGINAL DIMENSIONS */}
              <div className="w-full h-32 mb-2.5 relative" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
                {(() => {
                  const currentPlace = hoveredMarker;
                  if (!currentPlace) return null;
                  
                  // For CHAIN venues, prioritize chain featured image over individual venue photos
                  // For INDEPENDENT venues, use their individual photos
                  // Chain logos should only appear next to names, not as main images
                  let imageUrl = null;
                  
                  // If this is a chain venue, use the chain's featured image first
                  if (isPlaceChain(currentPlace) && currentPlace.chain?.featured_image_path) {
                    const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL === '/api' ? '' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');
                    imageUrl = currentPlace.chain.featured_image_path.startsWith('http') ? 
                      currentPlace.chain.featured_image_path : 
                      `${backendBaseUrl}${currentPlace.chain.featured_image_path}`;
                  } else {
                    // For independent venues OR chains without featured images, use individual venue photos
                    let rawImageUrl = (currentPlace as any).imageUrl || 
                               currentPlace.localImageUrl || 
                               (currentPlace as any).local_image_url ||
                               (currentPlace as any).s3ImageUrl ||
                               (currentPlace as any).s3_image_url;
                    
                    // Convert Google Places photo references to actual URLs
                    if (rawImageUrl && rawImageUrl.startsWith('ATKogp')) {
                      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                      imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${rawImageUrl}&key=${apiKey}`;
                    } else {
                      imageUrl = rawImageUrl;
                    }
                  }
                  
                  // Final fallback to Google Photos if available
                  if (!imageUrl && currentPlace.photos && currentPlace.photos.length > 0) {
                    imageUrl = typeof currentPlace.photos[0] === 'object' ? currentPlace.photos[0].url : currentPlace.photos[0];
                  }
                  
                  // Use imageUrl as-is for relative URLs (they'll be proxied by Next.js)
                  const fullImageUrl = imageUrl || null;
                  
                  if (fullImageUrl) {
                    return (
                      <img 
                        src={fullImageUrl} 
                        alt={currentPlace.name} 
                        className="w-full h-full object-cover"
                        style={{ margin: 0, padding: 0 }}
                        loading="lazy"
                        onError={(e) => { 
                          // Fallback to placeholder silently
                          e.currentTarget.src = '/images/placeholder-restaurant-old.webp';
                        }} 
                      />
                    );
                  }
                  return null;
                })()}
                
                {/* Allergen Score Overlay - Updated for new scoring system */}
                {(() => {
                  const currentPlace = hoveredMarker;
                  if (!currentPlace) return null;
                  
                  const averageRating = getAverageAllergenRating(currentPlace.allergenRatings || {}, currentPlace.averageAllergenScores);
                  const hasScores = currentPlace.averageAllergenScores && Object.keys(currentPlace.averageAllergenScores).length > 0;
                  
                  return hasScores && averageRating > 0 && (
                    <div className="absolute top-3 left-3">
                      <div
                        className="px-3 py-1 rounded-full text-white text-xs flex items-center justify-center shadow-md"
                        style={{ backgroundColor: getScoreColor(averageRating) }}
                      >
                        <span className="font-bold">{averageRating.toFixed(1)}</span>
                        <span className="ml-1 font-normal">{getScoreLabel(averageRating)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Content with padding - EXACT ORIGINAL STRUCTURE */}
              <div className="px-4 pt-0 pb-2.5">
                {(() => {
                  const currentPlace = hoveredMarker;
                  if (!currentPlace) return null;
                  
                  return (
                    <>
                      {/* Place Name - EXACT ORIGINAL STYLING */}
                      <h2 className="font-semibold mb-2 text-sm">{currentPlace.name}</h2>
                      
                      {/* Address - EXACT ORIGINAL STYLING */}
                      {currentPlace.address && (
                        <div className="text-xs text-gray-600 mb-2">
                          {currentPlace.address}
                        </div>
                      )}

                      {/* Place Type (Primary Category) - EXACT ORIGINAL STYLING */}
                      {currentPlace.categories && currentPlace.categories.length > 0 && (
                        <div className="mb-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                            {currentPlace.categories[0]}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </InfoWindow>
          );
        })()}
        
        {/* Radio wave overlay for active location */}
        {activeLocation && map && (
          <RadioWaveOverlay
            position={{
              lat: activeLocation.position?.lat || activeLocation.latitude || 0,
              lng: activeLocation.position?.lng || activeLocation.longitude || 0
            }}
            map={map}
            size={36}
            color={getMarkerColor(activeLocation)}
          />
        )}
      </GoogleMap>
      )}
    </div>
  );
} 

// Memoize MapContainer for better performance with large datasets
export default memo(MapContainer, (prevProps, nextProps) => {
  // Safety check: ensure both places are arrays
  if (!Array.isArray(prevProps.places) || !Array.isArray(nextProps.places)) return false;
  
  // Compare places array length and IDs for efficient comparison
  if (prevProps.places.length !== nextProps.places.length) return false;
  
  // Check if place IDs are the same
  const prevPlaceIds = prevProps.places.map(p => p.id).sort();
  const nextPlaceIds = nextProps.places.map(p => p.id).sort();
  if (JSON.stringify(prevPlaceIds) !== JSON.stringify(nextPlaceIds)) return false;
  
  // Compare other props
  return (
    prevProps.selectedPlace?.id === nextProps.selectedPlace?.id &&
    prevProps.hoveredMarker?.id === nextProps.hoveredMarker?.id &&
    prevProps.center?.lat === nextProps.center?.lat &&
    prevProps.center?.lng === nextProps.center?.lng &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.className === nextProps.className &&
    prevProps.setSelectedPlace === nextProps.setSelectedPlace &&
    prevProps.setHoveredMarker === nextProps.setHoveredMarker &&
    prevProps.onMapLoad === nextProps.onMapLoad &&
    prevProps.onPlaceCardOpen === nextProps.onPlaceCardOpen
  );
}); 