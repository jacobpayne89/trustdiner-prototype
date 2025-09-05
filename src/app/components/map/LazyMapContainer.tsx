import React, { Suspense, lazy, useEffect, useState } from 'react';
import type { MapContainerProps } from '@/types';

// Lazy load the heavy MapContainer component
const MapContainer = lazy(() => import('./MapContainer'));

/**
 * Map loading placeholder component
 */
function MapLoading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl text-gray-600">🗺️</div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Map Loading...</h3>
          <p className="text-gray-600">Initializing Google Maps and location data</p>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Map unavailable fallback component
 */
function MapUnavailable() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 border-2 border-dashed border-gray-300">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl text-gray-400">🗺️</div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Map Temporarily Unavailable</h3>
          <p className="text-gray-600">
            The interactive map is currently unavailable. You can still browse restaurants using the list view.
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Use the search and filters above to find restaurants near you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy wrapper for MapContainer with loading state
 * This reduces initial bundle size by code-splitting the Google Maps component
 */
export default function LazyMapContainer(props: MapContainerProps) {
  const [isGoogleMapsAvailable, setIsGoogleMapsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if Google Maps API is loaded
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined') {
        const isAvailable = !!(window as any).google?.maps;
        setIsGoogleMapsAvailable(isAvailable);
      }
    };

    // Check immediately
    checkGoogleMaps();

    // Also check after a delay in case the script is still loading
    const timeout = setTimeout(checkGoogleMaps, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Show loading while checking
  if (isGoogleMapsAvailable === null) {
    return <MapLoading />;
  }

  // Show fallback if Google Maps is not available
  if (!isGoogleMapsAvailable) {
    return <MapUnavailable />;
  }

  // Render the actual map component
  return (
    <Suspense fallback={<MapLoading />}>
      <MapContainer {...props} />
    </Suspense>
  );
}
