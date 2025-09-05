export declare const ALLERGEN_ORDER: readonly ["milk", "eggs", "peanuts", "tree_nuts", "gluten", "fish", "crustaceans", "molluscs", "soybeans", "sesame", "mustard", "celery", "sulfites", "lupin"];
export declare const CANONICAL_ALLERGENS: readonly ["milk", "eggs", "peanuts", "tree_nuts", "gluten", "fish", "crustaceans", "molluscs", "soybeans", "sesame", "mustard", "celery", "sulfites", "lupin"];
export type CanonicalAllergen = typeof CANONICAL_ALLERGENS[number];
export declare const ALLERGEN_DISPLAY_NAMES: Record<CanonicalAllergen, string>;
export declare function isCanonicalAllergen(key: string): key is CanonicalAllergen;
export declare function filterToCanonicalAllergens<T>(obj: Record<string, T>): Record<CanonicalAllergen, T>;
export declare function getAllergensWithFallback<T>(allergenScores: Partial<Record<string, T>>, fallbackValue: T): Record<CanonicalAllergen, T>;
export declare function sortAllergens(allergens: string[]): string[];
export declare function sortAllergenObjects<T extends {
    allergen?: string;
    name?: string;
}>(allergenObjects: T[]): T[];
export declare function sortAllergenEntries<T>(entries: [string, T][]): [string, T][];
//# sourceMappingURL=allergens.d.ts.map