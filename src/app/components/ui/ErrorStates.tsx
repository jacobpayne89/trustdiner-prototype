"use client";

import React, { memo } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

interface NetworkErrorProps extends ErrorStateProps {
  onRetry?: () => void;
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Generic error state component
 */
export const ErrorState = memo(function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  action,
  className = ""
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="text-red-500 text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});

/**
 * Network error state with retry functionality
 */
export const NetworkError = memo(function NetworkError({
  title = "Connection Error",
  message = "Unable to connect to the server. Please check your internet connection and try again.",
  onRetry,
  className = ""
}: NetworkErrorProps) {
  return (
    <ErrorState
      title={title}
      message={message}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
      className={className}
    />
  );
});

/**
 * Empty state component for when there's no data
 */
export const EmptyState = memo(function EmptyState({
  title = "No data found",
  message = "There's nothing to show here yet.",
  icon = "📭",
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});

/**
 * Loading state with spinner and optional text
 */
export const LoadingState = memo(function LoadingState({
  message = "Loading...",
  size = 'lg',
  className = ""
}: {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <LoadingSpinner size={size} text={message} />
    </div>
  );
});

/**
 * Image error state for when images fail to load
 */
export const ImageError = memo(function ImageError({
  alt,
  className = ""
}: {
  alt?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
      <div className="text-center">
        <div className="text-2xl mb-1">🖼️</div>
        <div className="text-xs">Image unavailable</div>
        {alt && <div className="text-xs opacity-75">{alt}</div>}
      </div>
    </div>
  );
});

export default {
  ErrorState,
  NetworkError,
  EmptyState,
  LoadingState,
  ImageError
};
