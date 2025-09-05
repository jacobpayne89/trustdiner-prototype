"use client";

import React from 'react';
import { AllergenIcon } from '@/app/components/icons';

interface Allergen {
  key: string;
  label: string;
  icon: string;
}

interface FilterControlsProps {
  visibleAllergens: Allergen[];
  selectedAllergens: string[];
  hasMoreAllergens: boolean;
  showMoreAllergens: boolean;
  onAllergenClick: (allergen: string) => void;
  onToggleShowMore: () => void;
}

export default function FilterControls({
  visibleAllergens,
  selectedAllergens,
  hasMoreAllergens,
  showMoreAllergens,
  onAllergenClick,
  onToggleShowMore
}: FilterControlsProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by allergen</h3>
      <div className="flex flex-wrap gap-2">
        {visibleAllergens.map((allergen) => (
          <button
            key={allergen.key}
            onClick={() => onAllergenClick(allergen.key)}
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#01745F] focus:ring-offset-2 h-8 ${
              selectedAllergens.includes(allergen.key)
                ? 'bg-[#01745F] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AllergenIcon 
              allergen={allergen.icon} 
              size={14} 
              className="mr-1.5" 
            />
            {allergen.label}
          </button>
        ))}
        {hasMoreAllergens && (
          <button
            onClick={onToggleShowMore}
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#01745F] focus:ring-offset-2 h-8"
          >
            {showMoreAllergens ? 'Less -' : 'More +'}
          </button>
        )}
      </div>
    </div>
  );
}