"use client";

import { memo } from 'react';
import type { MobileFloatingButtonProps } from '@/types';

/**
 * Mobile floating action button - toggles between map and list view
 */
const MobileFloatingButton = memo(function MobileFloatingButton({
  isClient,
  windowWidth,
  cardPlace,
  showMobileListView,
  setShowMobileListView
}: MobileFloatingButtonProps) {

  // Only show on mobile/tablet when no place card is open
  if (!isClient || windowWidth > 1024 || cardPlace) {
    return null;
  }

  return (
    <button
      onClick={() => setShowMobileListView(!showMobileListView)}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 transition-all duration-200 mobile-floating-button focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={showMobileListView ? "Switch to map view" : "Switch to list view"}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setShowMobileListView(!showMobileListView);
        }
      }}
    >
      {showMobileListView ? (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          View Map
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          View List
        </>
      )}
    </button>
  );
});

export default MobileFloatingButton;
