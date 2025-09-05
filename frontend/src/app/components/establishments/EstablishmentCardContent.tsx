"use client";

import React from 'react';
import { AllergenIcon } from '@/app/components/icons';
import type { Place } from '@/types';
import { getAllergenIconKey, formatAllergenName } from '@/utils/allergenHelpers';

interface EstablishmentCardContentProps {
  place: Place;
  isChain: boolean;
  safeAllergens: string[];
}

export default function EstablishmentCardContent({
  place,
  isChain,
  safeAllergens
}: EstablishmentCardContentProps) {
  const renderTags = () => {
    if (place.tags && place.tags.length > 0) {
      // Use merged tags from backend
      return place.tags.map((tag: string, index: number) => (
        <span 
          key={`${place.uuid || place.place_id || place.id}-tag-${index}-${tag}`}
          className={`inline-block text-xs px-2 py-1 rounded font-medium ${
            tag === 'Chain' ? 'bg-orange-100 text-orange-800' :
            tag.includes('Restaurant') || tag.includes('Food') ? 'bg-blue-100 text-blue-800' :
            tag.includes('Coffee') || tag.includes('Cafe') ? 'bg-amber-100 text-amber-800' :
            tag.includes('Fast') ? 'bg-red-100 text-red-800' :
            'bg-purple-100 text-purple-800'
          }`}
        >
          {tag}
        </span>
      ));
    }

    // Fallback to legacy tag display if no tags array
    return (
      <>
        {/* Chain Tag */}
        {isChain && (
          <span key={`${place.uuid || place.place_id || place.id}-chain`} className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-medium">
            Chain
          </span>
        )}
        
        {/* Primary Category */}
        {place.primaryCategory && (
          <span key={`${place.uuid || place.place_id || place.id}-primary-${place.primaryCategory}`} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
            {place.primaryCategory}
          </span>
        )}
        
        {/* Cuisine Type */}
        {place.cuisine && place.cuisine !== place.primaryCategory && (
          <span key={`${place.uuid || place.place_id || place.id}-cuisine-${place.cuisine}`} className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">
            {place.cuisine}
          </span>
        )}
      </>
    );
  };

  const renderSafeAllergens = () => {
    if (safeAllergens.length === 0) return null;

    return (
      <div className="mt-2">
        <p className="text-xs text-gray-600 mb-1">Rated safe for:</p>
        <div className="flex flex-wrap gap-1">
          {safeAllergens.slice(0, 3).map((allergen) => (
            <span
              key={allergen}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
              title={`Safe for ${formatAllergenName(allergen)}`}
            >
              <AllergenIcon 
                allergen={getAllergenIconKey(allergen)} 
                size={12}
                className="mr-1" 
              />
              {formatAllergenName(allergen)}
            </span>
          ))}
          {safeAllergens.length > 3 && (
            <span className="text-xs text-gray-500 leading-5">+{safeAllergens.length - 3} more</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Place Name with Chain Logo */}
      <div className="flex items-center gap-2 mb-2">
        {place.chainLogoUrl && (
          <img 
            src={place.chainLogoUrl} 
            alt={`${place.chainName} logo`}
            className="w-6 h-6 rounded object-contain flex-shrink-0"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
          {place.name}
        </h3>
      </div>

      {/* Address */}
      {place.address && (
        <p className="text-xs text-gray-600 mb-2 break-words">{place.address}</p>
      )}

      {/* Tags - Combined from chain and establishment */}
      <div className="mb-2 flex flex-wrap gap-1">
        {renderTags()}
      </div>

      {/* Safe Allergens Display */}
      {renderSafeAllergens()}
    </>
  );
}

