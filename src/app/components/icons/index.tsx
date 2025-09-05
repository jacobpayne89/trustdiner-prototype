import React from 'react';

// Export all icons
export * from './BaseIcon';
export * from './allergens';

// Import all allergen icons
import {
  AllergenIcon,
  GlutenIcon,
  MilkIcon,
  EggsIcon,
  FishIcon,
  CrustaceansIcon,
  TreeNutsIcon,
  PeanutsIcon,
  SoybeansIcon,
  SesameIcon,
  LupinIcon,
  MolluscsIcon,
  CeleryIcon,
  MustardIcon,
  SulfitesIcon,
  getAllergenIconKey,
} from './allergens';

import { IconProps } from './BaseIcon';

// Create a mapping for easy access using canonical allergen names
export const AllergenIcons = {
  gluten: GlutenIcon,
  milk: MilkIcon,
  eggs: EggsIcon,
  fish: FishIcon,
  crustaceans: CrustaceansIcon,
  tree_nuts: TreeNutsIcon,
  peanuts: PeanutsIcon,
  soybeans: SoybeansIcon,
  sesame: SesameIcon,
  lupin: LupinIcon,
  molluscs: MolluscsIcon,
  celery: CeleryIcon,
  mustard: MustardIcon,
  sulfites: SulfitesIcon,
} as const;

// Type for allergen keys
export type AllergenKey = keyof typeof AllergenIcons;

// Re-export the main AllergenIcon component from allergens.tsx
export { AllergenIcon };

// Backward compatibility exports for legacy names
export const DairyIcon = MilkIcon;
export const ShellfishIcon = CrustaceansIcon;
export const SoyIcon = SoybeansIcon; 