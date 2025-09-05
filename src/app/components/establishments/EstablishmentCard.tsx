"use client";

import React, { memo } from 'react';
import type { EstablishmentWithStats } from '../../../../../shared/types/core';
import { useEstablishmentCard } from '@/hooks/useEstablishmentCard';
import EstablishmentCardHeader from './EstablishmentCardHeader';
import EstablishmentCardContent from './EstablishmentCardContent';
import EstablishmentCardActions from './EstablishmentCardActions';

interface EstablishmentCardProps {
  place: EstablishmentWithStats;
  selectedPlace: EstablishmentWithStats | null;
  onPlaceClick: (place: EstablishmentWithStats) => void;
  onPlaceHover: (place: EstablishmentWithStats) => void;
  onPlaceLeave: () => void;
}

const EstablishmentCard = memo(function EstablishmentCard(props: EstablishmentCardProps) {
  const { place, selectedPlace, onPlaceClick, onPlaceHover, onPlaceLeave } = props;
  
  const {
    averageRating,
    safeAllergens,
    hasRatings,
    isChain,
    imageData,
    handleKeyDown,
  } = useEstablishmentCard({ place });

  return (
    <EstablishmentCardActions
      place={place}
      selectedPlace={selectedPlace}
      onPlaceClick={onPlaceClick}
      onPlaceHover={onPlaceHover}
      onPlaceLeave={onPlaceLeave}
      onKeyDown={handleKeyDown}
    >
      <EstablishmentCardHeader
        imageData={imageData}
        hasRatings={hasRatings}
        averageRating={averageRating}
        placeName={place.name}
      />
      
      <EstablishmentCardContent
        place={place}
        isChain={isChain}
        safeAllergens={safeAllergens}
      />
    </EstablishmentCardActions>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the place data itself changes or if this specific place's selection status changes
  return (
    prevProps.place.id === nextProps.place.id &&
    prevProps.place.name === nextProps.place.name &&
    prevProps.place.address === nextProps.place.address &&
    prevProps.place.hasReviews === nextProps.place.hasReviews &&
    (prevProps.selectedPlace?.id === prevProps.place.id) === (nextProps.selectedPlace?.id === nextProps.place.id) &&
    prevProps.onPlaceClick === nextProps.onPlaceClick &&
    prevProps.onPlaceHover === nextProps.onPlaceHover &&
    prevProps.onPlaceLeave === nextProps.onPlaceLeave
  );
});

export default EstablishmentCard;