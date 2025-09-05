/**
 * Accessibility helper functions
 */

/**
 * Announces a message to screen readers
 * @param message - The message to announce
 * @param priority - The urgency level
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Sets focus to an element by ID
 * @param elementId - The ID of the element to focus
 */
export function focusElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
  }
}

/**
 * Checks if an element is in the viewport
 * @param element - The element to check
 */
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scrolls an element into view if it's not visible
 * @param element - The element to scroll to
 * @param behavior - The scroll behavior
 */
export function scrollIntoViewIfNeeded(
  element: HTMLElement, 
  behavior: ScrollBehavior = 'smooth'
) {
  if (!isElementInViewport(element)) {
    element.scrollIntoView({ behavior, block: 'nearest' });
  }
}

/**
 * Gets the current focus trap elements within a container
 * @param container - The container element
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];
  
  return Array.from(
    container.querySelectorAll(focusableSelectors.join(','))
  ) as HTMLElement[];
}

/**
 * Creates a focus trap within a container
 * @param container - The container to trap focus within
 * @param onEscape - Callback when escape is pressed
 */
export function createFocusTrap(
  container: HTMLElement,
  onEscape?: () => void
): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && onEscape) {
      onEscape();
      return;
    }

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
  
  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Generates a unique ID for accessibility purposes
 * @param prefix - The prefix for the ID
 */
export function generateAccessibilityId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates color contrast ratio
 * @param foreground - The foreground color (hex)
 * @param background - The background color (hex)
 * @returns The contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return 0;

  const fgLum = getLuminance(fg);
  const bgLum = getLuminance(bg);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color combination meets WCAG contrast requirements
 * @param foreground - The foreground color (hex)
 * @param background - The background color (hex)
 * @param level - The WCAG level ('AA' or 'AAA')
 * @param isLargeText - Whether the text is considered large (18pt+ or 14pt+ bold)
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  } else {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }
}
