// Utility functions for allergen processing
// Extracted from ListView.tsx to maintain exact functionality

import { ALLERGEN_DISPLAY_NAMES, type AllergenKey } from '@/types';

export function getAllergenIconKey(allergen: string): string {
  const mapping: Record<string, string> = {
    'eggs': 'eggs',
    'milk': 'milk',
    'fish': 'fish',
    'crustaceans': 'crustaceans',
    'tree_nuts': 'treenuts',
    'treenuts': 'treenuts',
    'peanuts': 'peanuts',
    'gluten': 'gluten',
    'soybeans': 'soybeans',
    'sesame': 'sesame',
    'celery': 'celery',
    'mustard': 'mustard',
    'lupin': 'lupin',
    'molluscs': 'molluscs',
    'sulfites': 'sulfites',
    'sulphites': 'sulfites'
  };
  
  return mapping[allergen.toLowerCase()] || allergen.toLowerCase();
}

export function formatAllergenName(allergen: string): string {
  // Use canonical display names if available
  if (allergen in ALLERGEN_DISPLAY_NAMES) {
    return ALLERGEN_DISPLAY_NAMES[allergen as AllergenKey];
  }
  
  // Fallback to capitalize first letter if not in canonical display names
  return allergen.charAt(0).toUpperCase() + allergen.slice(1);
}

export function getAverageAllergenRating(ratings: Record<string, { rating: number; count: number }> | null, averageScores?: Record<string, number> | null) {
  // Use averageScores if available (both new avg_allergen_scores and legacy averageAllergenScores)
  if (averageScores && Object.keys(averageScores).length > 0) {
    const scores = Object.values(averageScores);
    const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  }
  
  // Add null check for ratings
  if (!ratings || typeof ratings !== 'object') {
    return 0;
  }
  
  const validRatings = Object.values(ratings).filter(r => r && typeof r === 'object' && r.count > 0);
  if (validRatings.length === 0) return 0;
  const average = validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length;
  return Math.round(average * 10) / 10; // Round to 1 decimal place
}

export function getSafeAllergens(ratings: Record<string, { rating: number; count: number }> | null, averageScores?: Record<string, number> | null) {
  // Use averageScores if available (both new avg_allergen_scores and legacy averageAllergenScores)
  if (averageScores && Object.keys(averageScores).length > 0) {
    return Object.entries(averageScores)
      .filter(([_, rating]) => rating >= 4.0)
      .map(([allergen, _]) => allergen);
  }
  
  // Add null check for ratings
  if (!ratings || typeof ratings !== 'object') {
    return [];
  }
  
  return Object.entries(ratings)
    .filter(([_, data]) => data && typeof data === 'object' && data.rating >= 4.0)
    .map(([allergen, _]) => allergen);
}

export function getScoreColor(score: number, hasRating: boolean = true): string {
  if (!hasRating || score === 0) return "#D1D5DB"; // light grey for no ratings
  if (score >= 5) return "#22C55E"; // green (5 - Excellent)
  if (score >= 4) return "#84CC16"; // lime (4 - Good)
  if (score >= 3) return "#EAB308"; // yellow (3 - Okay)
  if (score >= 2) return "#F97316"; // orange (2 - Avoid)
  if (score >= 1) return "#EF4444"; // red (1 - Unsafe)
  return "#D1D5DB"; // light grey for no score
}

export function getScoreLabel(score: number): string {
  if (score >= 5) return "Excellent";
  if (score >= 4) return "Good";
  if (score >= 3) return "Okay";
  if (score >= 2) return "Avoid";
  if (score >= 1) return "Unsafe";
  return "No Rating";
}
