"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  setFocus: (elementId: string) => void;
  isReducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  isHighContrast: boolean;
  setHighContrast: (highContrast: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [isReducedMotion, setReducedMotion] = useState(false);
  const [isHighContrast, setHighContrast] = useState(false);
  const announceRef = useRef<HTMLDivElement>(null);

  // Announce messages to screen readers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // Clear the message after a short delay to ensure it can be announced again later
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  // Set focus to a specific element
  const setFocus = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
    }
  }, []);

  // Detect user preferences for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detect user preferences for high contrast
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value: AccessibilityContextType = {
    announceToScreenReader,
    setFocus,
    isReducedMotion,
    setReducedMotion,
    isHighContrast,
    setHighContrast
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Screen reader announcement area */}
      <div
        ref={announceRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </AccessibilityContext.Provider>
  );
}
