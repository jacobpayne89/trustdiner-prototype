'use client';

import React from 'react';

interface FallbackMapProps {
  places?: any[];
  className?: string;
}

export default function FallbackMap({ places = [], className = '' }: FallbackMapProps) {
  return (
    <div className={`relative bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center min-h-[400px] ${className}`}>
      {/* Map placeholder with UK outline */}
      <div className="text-center z-10">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Restaurant Map</h3>
        <p className="text-gray-600 mb-4 max-w-md">
          Showing {places.length} restaurants across the UK
        </p>
        <div className="text-sm text-gray-500 bg-white/80 rounded-lg px-4 py-2 inline-block">
          <p>📍 London • Manchester • Birmingham • Leeds • Bristol</p>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          <p>Interactive map requires Google Maps API key</p>
        </div>
      </div>
      
      {/* Decorative map-like grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9CA3AF" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Mock location pins */}
      <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-blue-500 rounded-full shadow-lg"></div>
      <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
      <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></div>
      <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-purple-500 rounded-full shadow-lg"></div>
    </div>
  );
}
