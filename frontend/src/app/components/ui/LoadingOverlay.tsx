import React from "react";
import type { LoadingOverlayProps } from "@/types";

/**
 * Loading overlay component with descriptive classes for debugging
 */
export default function LoadingOverlay({ 
  isVisible, 
  message = "Loading..." 
}: LoadingOverlayProps) {
  if (!isVisible) return null;
  
  return (
    <div className="loading-overlay-container absolute inset-0 flex items-center justify-center z-50">
      <div className="loading-content-wrapper flex flex-col items-center space-y-4">
        <div className="loading-spinner animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        <div className="loading-message text-gray-800 font-medium bg-white bg-opacity-80 px-3 py-1 rounded-lg shadow-sm">
          {message}
        </div>
      </div>
    </div>
  );
} 