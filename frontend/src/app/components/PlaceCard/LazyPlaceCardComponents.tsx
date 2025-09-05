import React, { Suspense, lazy } from 'react';

// Lazy load heavy PlaceCard components
const PlaceCardReviews = lazy(() => import('./PlaceCardReviews'));
const PlaceCardReviewForm = lazy(() => import('./PlaceCardReviewForm'));
const PlaceCardScores = lazy(() => import('./PlaceCardScores'));

/**
 * Component loading placeholder
 */
function ComponentLoading() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex space-x-3 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 animate-pulse">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}

/**
 * Lazy wrapper for PlaceCardReviews
 */
export function LazyPlaceCardReviews(props: any) {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <PlaceCardReviews {...props} />
    </Suspense>
  );
}

/**
 * Lazy wrapper for PlaceCardReviewForm
 */
export function LazyPlaceCardReviewForm(props: any) {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <PlaceCardReviewForm {...props} />
    </Suspense>
  );
}

/**
 * Lazy wrapper for PlaceCardScores
 */
export function LazyPlaceCardScores(props: any) {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <PlaceCardScores {...props} />
    </Suspense>
  );
}
