import React from "react";

interface MobileControlsProps {
  onShowFilters: () => void;
  onToggleListView: () => void;
  showMobileListView: boolean;
}

/**
 * Mobile control buttons overlay component with descriptive classes for debugging
 */
export default function MobileControls({
  onShowFilters,
  onToggleListView,
  showMobileListView,
}: MobileControlsProps) {
  return (
    <div className="mobile-controls-overlay absolute top-4 left-4 right-4 z-10">
      <div className="mobile-controls-wrapper flex gap-2">
        <button
          onClick={onShowFilters}
          className="mobile-filter-trigger-button bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="mobile-filter-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          <span className="mobile-filter-label">Filters</span>
        </button>
        
        <button
          onClick={onToggleListView}
          className="mobile-view-toggle-button bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          {showMobileListView ? (
            <>
              <svg className="mobile-map-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="mobile-view-label">Map</span>
            </>
          ) : (
            <>
              <svg className="mobile-list-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="mobile-view-label">List</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 