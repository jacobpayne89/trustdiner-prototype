'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  suggestions?: string[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "🍽️",
  title,
  description,
  action,
  suggestions
}) => {
  return (
    <div className="text-center py-12" role="status" aria-live="polite">
      <div className="text-6xl mb-4" aria-hidden="true">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      
      {suggestions && suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Try:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-6 py-3 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
