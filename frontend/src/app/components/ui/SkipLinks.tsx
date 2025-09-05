"use client";

import React, { memo } from 'react';

/**
 * Skip links component for accessibility - allows users to jump to main content
 */
const SkipLinks = memo(function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-[9999] bg-blue-600 text-white px-4 py-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform -translate-y-full focus:translate-y-0 transition-transform"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="absolute top-0 left-20 z-[9999] bg-blue-600 text-white px-4 py-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform -translate-y-full focus:translate-y-0 transition-transform"
      >
        Skip to navigation
      </a>
      <a
        href="#search"
        className="absolute top-0 left-40 z-[9999] bg-blue-600 text-white px-4 py-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform -translate-y-full focus:translate-y-0 transition-transform"
      >
        Skip to search
      </a>
    </div>
  );
});

export default SkipLinks;
