'use client';

import React from 'react';

interface FallbackMapProps {
  places?: any[];
  className?: string;
}

export default function FallbackMap({ places = [], className = '' }: FallbackMapProps) {
  return (
    <div className={`relative bg-gray-100 flex items-center justify-center ${className}`}>
      {/* Map placeholder with UK outline */}
      <div className="text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map</h3>
        <p className="text-gray-500 mb-4">
          Showing {places.length} restaurants across the UK
        </p>
        <div className="text-sm text-gray-400">
          <p>📍 London • Manchester • Birmingham • Leeds • Bristol</p>
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
