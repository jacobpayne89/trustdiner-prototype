"use client";

import React from 'react';
import { getScoreColor } from '@/utils/allergenHelpers';

interface RatingOption {
  value: number;
  label: string;
}

interface SortOptionsProps {
  ratingOptions: RatingOption[];
  selectedRating?: number;
  onRatingClick: (rating: number) => void;
}

export default function SortOptions({
  ratingOptions,
  selectedRating,
  onRatingClick
}: SortOptionsProps) {
  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by rating</h3>
      <div className="flex flex-wrap gap-2">
        {ratingOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onRatingClick(option.value)}
            className={`flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#01745F] focus:ring-offset-2 ${
              selectedRating === option.value
                ? 'ring-2 ring-[#01745F] ring-offset-2'
                : ''
            }`}
          >
            <div
              className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
              style={{ 
                backgroundColor: getScoreColor(option.value),
                opacity: selectedRating === option.value ? 1 : 0.8
              }}
            >
              {option.value}
            </div>
            <span className="text-xs text-gray-600">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

