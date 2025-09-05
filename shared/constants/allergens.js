"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLERGEN_DISPLAY_NAMES = exports.CANONICAL_ALLERGENS = exports.ALLERGEN_ORDER = void 0;
exports.isCanonicalAllergen = isCanonicalAllergen;
exports.filterToCanonicalAllergens = filterToCanonicalAllergens;
exports.getAllergensWithFallback = getAllergensWithFallback;
exports.sortAllergens = sortAllergens;
exports.sortAllergenObjects = sortAllergenObjects;
exports.sortAllergenEntries = sortAllergenEntries;
exports.ALLERGEN_ORDER = [
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
];
exports.CANONICAL_ALLERGENS = exports.ALLERGEN_ORDER;
exports.ALLERGEN_DISPLAY_NAMES = {
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
    sulfites: 'Sulphites',
    lupin: 'Lupin'
};
function isCanonicalAllergen(key) {
    return exports.CANONICAL_ALLERGENS.includes(key);
}
function filterToCanonicalAllergens(obj) {
    const filtered = {};
    for (const key of exports.CANONICAL_ALLERGENS) {
        if (key in obj) {
            filtered[key] = obj[key];
        }
    }
    return filtered;
}
function getAllergensWithFallback(allergenScores, fallbackValue) {
    const result = {};
    for (const allergen of exports.CANONICAL_ALLERGENS) {
        result[allergen] = allergenScores[allergen] ?? fallbackValue;
    }
    return result;
}
function sortAllergens(allergens) {
    const allergenOrderMap = new Map(exports.ALLERGEN_ORDER.map((allergen, index) => [allergen, index]));
    return allergens.sort((a, b) => {
        const indexA = allergenOrderMap.get(a) ?? 999;
        const indexB = allergenOrderMap.get(b) ?? 999;
        return indexA - indexB;
    });
}
function sortAllergenObjects(allergenObjects) {
    const allergenOrderMap = new Map(exports.ALLERGEN_ORDER.map((allergen, index) => [allergen, index]));
    return allergenObjects.sort((a, b) => {
        const allergenA = a.allergen || a.name || '';
        const allergenB = b.allergen || b.name || '';
        const indexA = allergenOrderMap.get(allergenA) ?? 999;
        const indexB = allergenOrderMap.get(allergenB) ?? 999;
        return indexA - indexB;
    });
}
function sortAllergenEntries(entries) {
    const allergenOrderMap = new Map(exports.ALLERGEN_ORDER.map((allergen, index) => [allergen, index]));
    return entries.sort(([a], [b]) => {
        const indexA = allergenOrderMap.get(a) ?? 999;
        const indexB = allergenOrderMap.get(b) ?? 999;
        return indexA - indexB;
    });
}
//# sourceMappingURL=allergens.js.map