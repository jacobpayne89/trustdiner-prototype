'use client';

import { useState } from 'react';

interface EstablishmentData {
  place_id: string;
  name: string;
  address: string;
  position: { lat: number; lng: number };
  rating: number;
  user_ratings_total: number;
  price_level: number;
  types: string[];
  source: string;
  localImageUrl?: string;
  inDatabase: boolean;
  addable: boolean;
}

interface AddEstablishmentButtonProps {
  establishment: EstablishmentData;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function AddEstablishmentButton({ 
  establishment, 
  onSuccess, 
  onError 
}: AddEstablishmentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(!establishment.addable);

  const handleAddEstablishment = async () => {
    if (!establishment.addable || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/establishments/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(establishment),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsAdded(true);
        onSuccess?.(result);
      } else {
        const errorMessage = result.error || 'Failed to add establishment';
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if already in database
  if (establishment.inDatabase) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✓ In Database
      </span>
    );
  }

  // Don't show button if not addable
  if (!establishment.addable) {
    return null;
  }

  // Show success state
  if (isAdded) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        ✓ Added to Database
      </span>
    );
  }

  return (
    <button
      onClick={handleAddEstablishment}
      disabled={isLoading}
      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
        isLoading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
      }`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Adding...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add to Database
        </>
      )}
    </button>
  );
} 