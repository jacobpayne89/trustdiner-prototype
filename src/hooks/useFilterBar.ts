import { useState } from 'react';
import { ALLERGENS, ALLERGEN_DISPLAY_NAMES, type AllergenKey } from '@/types';

// Generate allergen list from canonical source with icon mappings
export const ALL_ALLERGENS = ALLERGENS.map(allergen => ({
  key: allergen,
  label: ALLERGEN_DISPLAY_NAMES[allergen],
  icon: getIconForAllergen(allergen)
}));

// Helper function to map canonical allergen keys to icon names
function getIconForAllergen(allergen: AllergenKey): string {
  const iconMapping: Record<AllergenKey, string> = {
    'milk': 'dairy',
    'eggs': 'eggs', 
    'peanuts': 'peanuts',
    'tree_nuts': 'treenuts',
    'gluten': 'gluten',
    'fish': 'fish',
    'crustaceans': 'shellfish',
    'soybeans': 'soy',
    'sesame': 'sesame',
    'molluscs': 'molluscs',
    'celery': 'celery',
    'mustard': 'mustard',
    'sulfites': 'sulphites',
    'lupin': 'lupin',
  };
  return iconMapping[allergen];
}

export const RATING_OPTIONS = [
  { value: 1, label: 'Unsafe' },
  { value: 2, label: 'Avoid' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Excellent' },
];

// Fixed allergen display count - always show first 4 allergens in collapsed state
const getInitialAllergenCount = (): number => {
  return 4; // Always show exactly 4 allergens: Milk, Eggs, Peanuts, Tree Nuts
};

interface UseFilterBarOptions {
  selectedAllergens?: string[];
  selectedRating?: number;
  onAllergenToggle?: (allergen: string) => void;
  onRatingFilter?: (rating: number) => void;
}

export function useFilterBar({
  selectedAllergens = [],
  selectedRating,
  onAllergenToggle,
  onRatingFilter
}: UseFilterBarOptions) {
  const [showMoreAllergens, setShowMoreAllergens] = useState(false);

  // Calculate how many allergens to show initially - fixed at 4
  const initialAllergenCount = getInitialAllergenCount();
  const visibleAllergens = showMoreAllergens ? ALL_ALLERGENS : ALL_ALLERGENS.slice(0, initialAllergenCount);
  const hasMoreAllergens = ALL_ALLERGENS.length > initialAllergenCount;

  const handleAllergenClick = (allergen: string) => {
    onAllergenToggle?.(allergen);
  };

  const handleRatingClick = (rating: number) => {
    // Toggle rating - if same rating clicked, deselect it
    const newRating = selectedRating === rating ? undefined : rating;
    onRatingFilter?.(newRating);
  };

  const toggleShowMoreAllergens = () => {
    setShowMoreAllergens(!showMoreAllergens);
  };

  return {
    // State
    showMoreAllergens,
    
    // Computed values
    visibleAllergens,
    hasMoreAllergens,
    
    // Handlers
    handleAllergenClick,
    handleRatingClick,
    toggleShowMoreAllergens,
    
    // Props
    selectedAllergens,
    selectedRating,
  };
}

