'use client';

import React from 'react';

interface EstablishmentLoadingStateProps {
  count?: number;
  message?: string;
}

const EstablishmentSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-start space-x-4">
        {/* Image placeholder */}
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          
          {/* Tags */}
          <div className="flex space-x-2 mb-3">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
          
          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        
        {/* Action button */}
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export const EstablishmentLoadingState: React.FC<EstablishmentLoadingStateProps> = ({ 
  count = 6, 
  message = "Loading restaurants..." 
}) => {
  return (
    <div className="space-y-4">
      {/* Loading message */}
      <div className="text-center py-8" role="status" aria-live="polite">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
        <p className="text-gray-500">Finding great allergy-friendly places near you</p>
        <span className="sr-only">Loading restaurants...</span>
      </div>
      
      {/* Skeleton placeholders */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <EstablishmentSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default EstablishmentLoadingState;
