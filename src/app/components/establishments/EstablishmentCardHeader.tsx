"use client";

import React from 'react';
import { getScoreColor, getScoreLabel } from '@/utils/allergenHelpers';

interface ImageData {
  type: 'chain' | 'chain-placeholder' | 'establishment' | 'placeholder';
  url: string | null;
  alt: string;
  fallbackText: string | null;
}

interface EstablishmentCardHeaderProps {
  imageData: ImageData;
  hasRatings: boolean;
  averageRating: number;
  placeName: string;
}

export default function EstablishmentCardHeader({
  imageData,
  hasRatings,
  averageRating,
  placeName
}: EstablishmentCardHeaderProps) {
  const renderAllergenScoreOverlay = () => {
    if (!hasRatings) return null;

    return (
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
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const placeholder = target.parentElement;
    if (placeholder) {
      const fallbackContent = imageData.type === 'chain' 
        ? `<div class="w-full h-full bg-gray-100 flex items-center justify-center">
             <div class="text-gray-500 text-sm font-medium">${imageData.fallbackText}</div>
           </div>`
        : `<div class="w-full h-full bg-gray-200 flex items-center justify-center">
             <div class="text-gray-400 text-2xl">📷</div>
           </div>`;
      placeholder.innerHTML = fallbackContent;
    }
  };

  return (
    <div className="w-full h-24 mb-2 relative rounded-lg overflow-hidden bg-gray-100">
      {imageData.url ? (
        <div className="relative w-full h-full">
          <img
            src={imageData.url}
            alt={imageData.alt}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
          {renderAllergenScoreOverlay()}
        </div>
      ) : (
        <div className="relative w-full h-full bg-gray-200 flex items-center justify-center">
          {imageData.type === 'chain-placeholder' ? (
            <div className="text-gray-500 text-sm font-medium text-center px-2">
              {imageData.fallbackText}
            </div>
          ) : (
            <div className="text-gray-400 text-2xl">📷</div>
          )}
          {renderAllergenScoreOverlay()}
        </div>
      )}
    </div>
  );
}

