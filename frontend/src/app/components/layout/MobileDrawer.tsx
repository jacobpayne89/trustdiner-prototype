"use client";

import type { Place } from '@/types';
import PlaceSidebar from '@/app/components/PlaceSidebar';
import { usePlaceCardState } from '@/hooks/usePlaceCardState';

interface MobileDrawerProps {
  cardPlace?: Place;
  isClient: boolean;
  windowWidth: number;
  handleMapClick: () => void;
  user?: any;
  getUserAllergies: () => string[];
  onReviewSubmitted?: () => void;
}

/**
 * Mobile drawer component for PlaceCard - shows as full-screen modal on mobile
 */
export default function MobileDrawer({
  cardPlace,
  isClient,
  windowWidth,
  handleMapClick,
  user,
  getUserAllergies,
  onReviewSubmitted
}: MobileDrawerProps) {
  const placeCardState = usePlaceCardState({
    cardPlace,
    user,
    getUserAllergies,
    onReviewSubmitted
  });

  // Only render on mobile when a place is selected
  if (!cardPlace || !isClient || windowWidth >= 1024) {
    return null;
  }

  return (
    <PlaceSidebar
      cardPlace={cardPlace}
      isClient={isClient}
      windowWidth={windowWidth}
      handleMapClick={handleMapClick}
      user={user}
      getUserAllergies={getUserAllergies}
      placeCardState={placeCardState}
    />
  );
}
