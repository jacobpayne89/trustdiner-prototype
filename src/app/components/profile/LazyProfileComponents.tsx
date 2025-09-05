import React, { Suspense, lazy } from 'react';

// Lazy load profile components that are only used in profile page
const UserReviewsList = lazy(() => import('./UserReviewsList'));
const AllergenSelector = lazy(() => import('./AllergenSelector'));
const AvatarUploader = lazy(() => import('./AvatarUploader'));

/**
 * Profile component loading placeholder
 */
function ProfileComponentLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

/**
 * Lazy wrapper for UserReviewsList
 */
export function LazyUserReviewsList(props: any) {
  return (
    <Suspense fallback={<ProfileComponentLoading />}>
      <UserReviewsList {...props} />
    </Suspense>
  );
}

/**
 * Lazy wrapper for AllergenSelector
 */
export function LazyAllergenSelector(props: any) {
  return (
    <Suspense fallback={<ProfileComponentLoading />}>
      <AllergenSelector {...props} />
    </Suspense>
  );
}

/**
 * Lazy wrapper for AvatarUploader
 */
export function LazyAvatarUploader(props: any) {
  return (
    <Suspense fallback={<ProfileComponentLoading />}>
      <AvatarUploader {...props} />
    </Suspense>
  );
}
