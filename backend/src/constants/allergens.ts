/**
 * BACKEND ALLERGEN CONSTANTS
 * Must match the frontend order exactly
 */

// REQUIRED ALLERGEN ORDER - DO NOT CHANGE
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

export type AllergenKey = typeof ALLERGEN_ORDER[number];

/**
 * Sort allergen object to maintain consistent order
 */
export function sortAllergenScores<T>(scores: Record<string, T>): Record<string, T> {
  const sorted: Record<string, T> = {};
  
  // Add allergens in the required order first
  for (const allergen of ALLERGEN_ORDER) {
    if (allergen in scores) {
      sorted[allergen] = scores[allergen];
    }
  }
  
  // Add any unknown allergens at the end
  for (const [key, value] of Object.entries(scores)) {
    if (!ALLERGEN_ORDER.includes(key as AllergenKey)) {
      sorted[key] = value;
    }
  }
  
  return sorted;
}
