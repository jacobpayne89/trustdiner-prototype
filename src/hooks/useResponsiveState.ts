"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing responsive state and window dimensions
 */
export function useResponsiveState() {
  const [isClient, setIsClient] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  // Client-side mounting and window resize handling
  useEffect(() => {
    setIsClient(true);
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isClient,
    windowWidth,
  };
}
