import React from 'react';

export interface AllergenIconProps {
  allergen: string | { id: string | number; name: string; severity?: string };
  size?: number;
  className?: string;
  title?: string;
}

// Map allergen names to their SVG filenames
const ALLERGEN_SVG_MAP: Record<string, string> = {
  'gluten': 'gluten.svg',
  'wheat': 'gluten.svg', // Map wheat to gluten icon for backward compatibility
  'milk': 'milk.svg',
  'dairy': 'milk.svg', // Legacy name mapping
  'eggs': 'eggs.svg',
  'fish': 'fish.svg',
  'soybeans': 'soybean.svg',
  'soy': 'soybean.svg', // Legacy name mapping
  'crustacean shellfish': 'crustraceans.svg',
  'crustaceans': 'crustraceans.svg',
  'shellfish': 'crustraceans.svg', // Legacy name mapping
  'tree_nuts': 'treenuts.svg',
  'tree nuts': 'treenuts.svg', // Handle display name with space
  'treenuts': 'treenuts.svg', // Alternative spelling
  'nuts': 'treenuts.svg', // Legacy name mapping
  'peanuts': 'peanuts.svg',

  'sesame': 'sesame.svg',
  'lupin': 'lupin.svg',
  'molluscs': 'molluscs.svg',
  'celery': 'celery.svg',
  'mustard': 'mustard.svg',
  'sulfites': 'sulfites.svg',
  'sulphites': 'sulfites.svg' // Alternative spelling (British English)
};

export const AllergenIcon: React.FC<AllergenIconProps> = ({ 
  allergen, 
  size = 24, 
  className = '', 
  title 
}) => {
  // Handle both string and object formats
  const allergenName = typeof allergen === 'string' ? allergen : allergen.name;
  const allergenSeverity = typeof allergen === 'object' ? allergen.severity : undefined;
  
  const normalizedAllergen = allergenName.toLowerCase();
  const svgFileName = ALLERGEN_SVG_MAP[normalizedAllergen];
  
  if (!svgFileName) {
    console.warn(`No SVG found for allergen: ${allergenName}`);
    return <div className={`w-6 h-6 rounded ${className}`} style={{ backgroundColor: '#C7C7C7' }} title={title || allergenName} />;
  }

  const svgPath = `/icons/${svgFileName}`;
  
  // Check if className contains text-white to apply filter for white color
  const isWhite = className.includes('text-white');
  const filterStyle = isWhite ? {
    filter: 'brightness(0) saturate(100%) invert(100%)',
  } : {};
  
  return (
    <img
      src={svgPath}
      alt={title || allergenName}
      title={title || allergenName}
      className={`inline-block ${className}`}
      style={{ 
        width: size, 
        height: size,
        objectFit: 'contain',
        ...filterStyle
      }}
    />
  );
};

// Helper function to get the allergen icon key (for backward compatibility)
export function getAllergenIconKey(allergen: string): string {
  return allergen.toLowerCase();
}

// Keep individual exports for backward compatibility if needed
export const GlutenIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="gluten" />
);

export const MilkIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="milk" />
);

export const EggsIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="eggs" />
);

export const FishIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="fish" />
);

export const CrustaceansIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="crustaceans" />
);

export const TreeNutsIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="tree_nuts" />
);

export const PeanutsIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="peanuts" />
);

export const SoybeansIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="soybeans" />
);

export const SesameIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="sesame" />
);

export const LupinIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="lupin" />
);

export const MolluscsIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="molluscs" />
);

export const CeleryIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="celery" />
);

export const MustardIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="mustard" />
);

export const SulfitesIcon: React.FC<Omit<AllergenIconProps, 'allergen'>> = (props) => (
  <AllergenIcon {...props} allergen="sulfites" />
); 