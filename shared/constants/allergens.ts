/**
 * CANONICAL ALLERGEN REGISTRY
 * Single source of truth for all allergen keys across the application
 * 
 * All components, schemas, and database operations MUST use these exact keys
 * Format: snake_case, 14 standard allergens
 */

/**
 * REQUIRED ALLERGEN ORDER - DO NOT CHANGE
 * This order must be consistent across all UI components
 */
export const ALLERGEN_ORDER = [
  'milk',
  'eggs', 
  'peanuts',
  'tree_nuts',
  'gluten',
  'fish',
  'crustaceans',
  'molluscs',
  'soybeans',
  'sesame',
  'mustard',
  'celery',
  'sulfites',
  'lupin'
] as const;

export const CANONICAL_ALLERGENS = ALLERGEN_ORDER;

export type CanonicalAllergen = typeof CANONICAL_ALLERGENS[number];

/**
 * Allergen display names for UI - matches the required order
 */
export const ALLERGEN_DISPLAY_NAMES: Record<CanonicalAllergen, string> = {
  milk: 'Milk',
  eggs: 'Eggs',
  peanuts: 'Peanuts',
  tree_nuts: 'Tree Nuts',
  gluten: 'Gluten',
  fish: 'Fish',
  crustaceans: 'Crustaceans',
  molluscs: 'Molluscs',
  soybeans: 'Soybeans',
  sesame: 'Sesame',
  mustard: 'Mustard',
  celery: 'Celery',
  sulfites: 'Sulphites', // British spelling as requested
  lupin: 'Lupin'
};

/**
 * Validation helper: Check if a key is a canonical allergen
 */
export function isCanonicalAllergen(key: string): key is CanonicalAllergen {
  return CANONICAL_ALLERGENS.includes(key as CanonicalAllergen);
}

/**
 * Validation helper: Filter object to only canonical allergen keys
 */
export function filterToCanonicalAllergens<T>(obj: Record<string, T>): Record<CanonicalAllergen, T> {
  const filtered: Partial<Record<CanonicalAllergen, T>> = {};
  
  for (const key of CANONICAL_ALLERGENS) {
    if (key in obj) {
      filtered[key] = obj[key];
    }
  }
  
  return filtered as Record<CanonicalAllergen, T>;
}

/**
 * Get all canonical allergens with fallback values
 */
export function getAllergensWithFallback<T>(
  allergenScores: Partial<Record<string, T>>, 
  fallbackValue: T
): Record<CanonicalAllergen, T> {
  const result: Partial<Record<CanonicalAllergen, T>> = {};
  
  for (const allergen of CANONICAL_ALLERGENS) {
    result[allergen] = allergenScores[allergen] ?? fallbackValue;
  }
  
  return result as Record<CanonicalAllergen, T>;
}

/**
 * ALLERGEN SORTING HELPER
 * Sorts allergens according to the required order
 * Unknown allergens appear at the end
 */
export function sortAllergens(allergens: string[]): string[] {
  const allergenOrderMap = new Map(ALLERGEN_ORDER.map((allergen, index) => [allergen as string, index]));
  
  return allergens.sort((a, b) => {
    const indexA = allergenOrderMap.get(a) ?? 999; // Unknown allergens go to end
    const indexB = allergenOrderMap.get(b) ?? 999;
    return indexA - indexB;
  });
}

/**
 * Sort allergen objects by allergen key
 * For objects with an 'allergen' or 'name' field
 */
export function sortAllergenObjects<T extends { allergen?: string; name?: string }>(
  allergenObjects: T[]
): T[] {
  const allergenOrderMap = new Map(ALLERGEN_ORDER.map((allergen, index) => [allergen as string, index]));
  
  return allergenObjects.sort((a, b) => {
    const allergenA = a.allergen || a.name || '';
    const allergenB = b.allergen || b.name || '';
    const indexA = allergenOrderMap.get(allergenA) ?? 999;
    const indexB = allergenOrderMap.get(allergenB) ?? 999;
    return indexA - indexB;
  });
}

/**
 * Sort allergen entries (key-value pairs)
 * For Record<string, T> converted to entries
 */
export function sortAllergenEntries<T>(entries: [string, T][]): [string, T][] {
  const allergenOrderMap = new Map(ALLERGEN_ORDER.map((allergen, index) => [allergen as string, index]));
  
  return entries.sort(([a], [b]) => {
    const indexA = allergenOrderMap.get(a) ?? 999;
    const indexB = allergenOrderMap.get(b) ?? 999;
    return indexA - indexB;
  });
}
