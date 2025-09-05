"use client";

import React from 'react';
import type { Place } from '@/types';

interface EstablishmentCardActionsProps {
  place: Place;
  selectedPlace: Place | null;
  onPlaceClick: (place: Place) => void;
  onPlaceHover: (place: Place) => void;
  onPlaceLeave: () => void;
  onKeyDown: (e: React.KeyboardEvent, onPlaceClick: (place: Place) => void) => void;
  children: React.ReactNode;
}

export default function EstablishmentCardActions({
  place,
  selectedPlace,
  onPlaceClick,
  onPlaceHover,
  onPlaceLeave,
  onKeyDown,
  children
}: EstablishmentCardActionsProps) {
  const isSelected = selectedPlace?.id === place.id;

  return (
    <div
      className={`bg-white rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isSelected 
          ? 'border-2 border-black shadow-md' 
          : 'border border-transparent hover:border-gray-700'
      }`}
      onClick={() => onPlaceClick(place)}
      onMouseEnter={() => onPlaceHover(place)}
      onMouseLeave={() => onPlaceLeave()}
      onKeyDown={(e) => onKeyDown(e, onPlaceClick)}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${place.name}, ${place.address || 'address not available'}`}
    >
      {children}
    </div>
  );
}

