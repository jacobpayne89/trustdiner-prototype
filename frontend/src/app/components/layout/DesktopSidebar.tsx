"use client";

import type { Place } from '@/types';
import PlaceSidebar from '@/app/components/PlaceSidebar';
import { usePlaceCardState } from '@/hooks/usePlaceCardState';

interface DesktopSidebarProps {
  cardPlace?: Place;
  isClient: boolean;
  windowWidth: number;
  handleMapClick: () => void;
  user?: any;
  getUserAllergies: () => string[];
  onReviewSubmitted?: () => void;
  editReviewId?: string | null;
}

/**
 * Desktop sidebar component for PlaceCard - shows as fixed sidebar on desktop
 */
export default function DesktopSidebar({
  cardPlace,
  isClient,
  windowWidth,
  handleMapClick,
  user,
  getUserAllergies,
  onReviewSubmitted,
  editReviewId
}: DesktopSidebarProps) {
  const placeCardState = usePlaceCardState({
    cardPlace,
    user,
    getUserAllergies,
    onReviewSubmitted,
    editReviewId
  });

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