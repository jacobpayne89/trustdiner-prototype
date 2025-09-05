# Accessibility Features

This document outlines the accessibility improvements implemented in the TrustDiner frontend application.

## Overview

The TrustDiner frontend follows WCAG 2.1 Level AA accessibility guidelines to ensure the application is usable by people with disabilities.

## Implemented Features

### 1. Keyboard Navigation

#### Skip Links
- **Location**: Available on all pages
- **Function**: Allows users to skip to main content, navigation, and search
- **Implementation**: `src/app/components/ui/SkipLinks.tsx`

#### Focus Management
- **Tab Navigation**: All interactive elements are keyboard accessible
- **Focus Indicators**: Clear focus rings on all interactive elements
- **Focus Trapping**: Modal dialogs and dropdowns trap focus appropriately
- **Logical Tab Order**: Tab order follows visual layout

#### Keyboard Shortcuts
- **Escape Key**: Closes modals, dropdowns, and navigation menus
- **Enter/Space**: Activates buttons and interactive elements
- **Arrow Keys**: Navigate through search results and filter options

### 2. Screen Reader Support

#### ARIA Labels and Roles
- **Navigation Menu**: Proper `role="navigation"` and `aria-label`
- **Search Dropdown**: `role="combobox"` with `aria-expanded` and `aria-haspopup`
- **Filter Groups**: `role="group"` with descriptive labels
- **Tabs**: Proper `role="tab"`, `role="tablist"`, and `role="tabpanel"`
- **Map**: `role="application"` with descriptive labels

#### Live Regions
- **Search Results**: Announced when search completes
- **Loading States**: Status updates announced to screen readers
- **Form Validation**: Error messages announced appropriately

#### Semantic HTML
- **Landmarks**: `header`, `main`, `nav`, `section` elements
- **Headings**: Proper heading hierarchy (h1-h6)
- **Lists**: Proper list markup for navigation and content

### 3. Visual Accessibility

#### Color Contrast
- **WCAG AA Compliance**: All text meets 4.5:1 contrast ratio
- **Large Text**: 3:1 contrast ratio for text 18pt+ or 14pt+ bold
- **Interactive Elements**: Clear visual indication of focus and hover states

#### Focus Indicators
- **Visible Focus**: Blue focus rings with adequate contrast
- **Focus Offset**: Ring offset to ensure visibility on all backgrounds
- **Consistent Styling**: Uniform focus indicators across the application

#### Text and Typography
- **Font Sizes**: Minimum 16px for body text
- **Line Height**: Adequate spacing for readability
- **Text Scaling**: Supports browser zoom up to 200%

### 4. Responsive Design

#### Mobile Accessibility
- **Touch Targets**: Minimum 44px touch targets on mobile
- **Orientation Support**: Works in both portrait and landscape
- **Pinch Zoom**: Zoom functionality not disabled

#### Responsive Navigation
- **Hamburger Menu**: Accessible on mobile with proper ARIA attributes
- **Mobile Floating Button**: Clear labels and keyboard support

### 5. User Preferences

#### Reduced Motion
- **Detection**: Respects `prefers-reduced-motion` media query
- **Graceful Degradation**: Animations disabled when requested

#### High Contrast
- **Detection**: Respects `prefers-contrast` media query
- **Enhanced Visibility**: Improved contrast in high contrast mode

## Component-Specific Features

### Header Component
- **Hamburger Menu**: Proper button with ARIA attributes
- **Navigation Drawer**: Modal with focus trapping and escape key support
- **Logo**: Descriptive alt text and focus indicator
- **Search Input**: Combobox role with proper ARIA attributes

### Search Component
- **Input Field**: Descriptive labels and autocomplete attributes
- **Results Dropdown**: Listbox role with option roles
- **Loading States**: Announced to screen readers
- **Error Handling**: Clear error messages

### Filter Components
- **Allergen Filters**: Button group with pressed states
- **Rating Filters**: Descriptive labels for color-coded buttons
- **Clear Filters**: Clear action labels

### Map Component
- **Application Role**: Indicates interactive map region
- **Marker Labels**: Descriptive labels for map markers
- **Info Windows**: Proper heading hierarchy

### Place Cards
- **Tab Navigation**: Proper tab pattern for scores/reviews
- **Close Button**: Clear action labels
- **Content Structure**: Semantic heading hierarchy

## Testing

### Automated Testing
- **axe-core**: Integrated for automated accessibility testing
- **eslint-plugin-jsx-a11y**: Lint rules for accessibility

### Manual Testing
- **Keyboard Navigation**: Tab through entire application
- **Screen Reader**: Test with NVDA, JAWS, or VoiceOver
- **High Contrast**: Test in high contrast mode
- **Zoom**: Test at 200% browser zoom

### Testing Checklist
- [ ] All interactive elements keyboard accessible
- [ ] Skip links work correctly
- [ ] Focus indicators visible and consistent
- [ ] Screen reader announces content appropriately
- [ ] Color contrast meets WCAG AA standards
- [ ] Works with zoom up to 200%
- [ ] Respects user motion preferences
- [ ] Mobile touch targets adequate size

## Utilities and Hooks

### Accessibility Context
- **Location**: `src/app/context/AccessibilityContext.tsx`
- **Features**: Screen reader announcements, focus management, user preferences

### Keyboard Navigation Hook
- **Location**: `src/hooks/useKeyboardNavigation.ts`
- **Features**: Keyboard event handling, focus trapping, roving tabindex

### Accessibility Helpers
- **Location**: `src/utils/accessibilityHelpers.ts`
- **Features**: Contrast checking, focus management, screen reader utilities

## Future Improvements

### Planned Features
- [ ] Voice navigation support
- [ ] Enhanced keyboard shortcuts
- [ ] Better mobile screen reader support
- [ ] Customizable color themes
- [ ] Font size controls

### Ongoing Maintenance
- [ ] Regular accessibility audits
- [ ] User testing with disability community
- [ ] WCAG 2.2 compliance evaluation
- [ ] Performance optimization for assistive technologies

## Resources

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Accessibility Guidelines](https://webaim.org/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- [NVDA (Windows)](https://www.nvaccess.org/)
- [JAWS (Windows)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (macOS/iOS)](https://www.apple.com/accessibility/mac/vision/)
- [TalkBack (Android)](https://support.google.com/accessibility/android/answer/6283677)

## Support

For accessibility-related issues or questions, please:
1. Create an issue in the project repository
2. Include specific details about the accessibility barrier
3. Mention the assistive technology being used
4. Provide steps to reproduce the issue
