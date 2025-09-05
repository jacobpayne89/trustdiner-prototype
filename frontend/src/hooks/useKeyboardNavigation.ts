"use client";

import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation and accessibility shortcuts
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onEscape,
    onEnter,
    onSpace,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onHome,
    onEnd,
    enabled = true
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;
      case ' ':
        if (onSpace) {
          event.preventDefault();
          onSpace();
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          event.preventDefault();
          onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          event.preventDefault();
          onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          event.preventDefault();
          onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          event.preventDefault();
          onArrowRight();
        }
        break;
      case 'Tab':
        if (onTab) {
          onTab();
        }
        break;
      case 'Home':
        if (onHome) {
          event.preventDefault();
          onHome();
        }
        break;
      case 'End':
        if (onEnd) {
          event.preventDefault();
          onEnd();
        }
        break;
    }
  }, [enabled, onEscape, onEnter, onSpace, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onHome, onEnd]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  return { handleKeyDown };
}

/**
 * Hook for managing focus trapping within a component (useful for modals)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element when trap becomes active
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}

/**
 * Hook for managing roving tabindex pattern (useful for button groups)
 */
export function useRovingTabindex(
  containerRef: React.RefObject<HTMLElement>,
  activeIndex: number,
  setActiveIndex: (index: number) => void,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const items = Array.from(container.querySelectorAll('[role="option"], button, [data-roving-item]')) as HTMLElement[];

    // Set tabindex for all items
    items.forEach((item, index) => {
      item.tabIndex = index === activeIndex ? 0 : -1;
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const currentIndex = items.indexOf(target);

      if (currentIndex === -1) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          setActiveIndex(nextIndex);
          items[nextIndex]?.focus();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = (currentIndex - 1 + items.length) % items.length;
          setActiveIndex(prevIndex);
          items[prevIndex]?.focus();
          break;
        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          items[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          const lastIndex = items.length - 1;
          setActiveIndex(lastIndex);
          items[lastIndex]?.focus();
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, activeIndex, setActiveIndex, isActive]);
}
