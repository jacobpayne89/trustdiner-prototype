"use client";

import { AllergenIcon, type AllergenKey } from "@/app/components/icons";
import { ALLERGENS, ALLERGEN_DISPLAY_NAMES, sortAllergens, type AllergenKey } from "@/types";

// Helper function to get allergen key for icon mapping
function getAllergenIconKey(allergen: AllergenKey): string {
  const mapping: Record<AllergenKey, string> = {
    eggs: "eggs",
    milk: "milk",
    fish: "fish",
    crustaceans: "crustaceans",
    tree_nuts: "treenuts",
    peanuts: "peanuts",
    gluten: "gluten",
    soybeans: "soybeans",
    sesame: "sesame",
    celery: "celery",
    mustard: "mustard",
    lupin: "lupin",
    molluscs: "molluscs",
    sulfites: "sulfites",
  };
  return mapping[allergen] || allergen;
}

interface AllergenPreference {
  id: string | number;
  name: string;
  severity?: string;
}

interface AllergenSelectorProps {
  // Common props
  allergens: (string | AllergenPreference)[] | null;
  
  // Edit mode props
  isEditMode: boolean;
  editAllergens?: string[];
  onAllergenChange?: (allergen: string) => void;
  disabled?: boolean;
}

export default function AllergenSelector({
  allergens,
  isEditMode,
  editAllergens = [],
  onAllergenChange,
  disabled = false
}: AllergenSelectorProps) {
  
  if (isEditMode) {
    // Edit Mode - Interactive allergen selection
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allergy preferences
        </label>
        <p className="text-xs text-gray-500 mb-3">Select the allergens you are sensitive to:</p>
        <div className="grid grid-cols-2 gap-3">
          {ALLERGENS.map((allergen) => {
            const isSelected = editAllergens.includes(allergen);
            return (
              <button
                key={allergen}
                type="button"
                onClick={() => onAllergenChange?.(allergen)}
                disabled={disabled}
                className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-600'
                  }`}
                >
                  ✓
                </div>
                <AllergenIcon allergen={getAllergenIconKey(allergen) as AllergenKey} size={16} className="text-gray-700" />
                <span className="text-sm text-gray-700 flex-1 text-left">{ALLERGEN_DISPLAY_NAMES[allergen]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Read Mode - Display-only allergen list
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Allergens
      </label>
      {allergens && allergens.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 border border-gray-300 rounded-md p-3 bg-gray-50">
          {allergens.map((allergen, index) => {
            // Handle both string and object formats
            const allergenName = typeof allergen === 'string' ? allergen : allergen.name;
            const allergenSeverity = typeof allergen === 'object' ? allergen.severity : undefined;
            const allergenKey = allergenName.toLowerCase().replace(/\s+/g, '_') as AllergenKey;
            
            return (
              <div
                key={typeof allergen === 'string' ? allergen : `${allergen.id}-${allergen.name}`}
                className="flex items-center gap-2 p-2 rounded-lg border-2 border-green-500 bg-green-50"
              >
                <div className="w-6 h-6 rounded-full border-2 bg-green-500 border-green-500 text-white flex items-center justify-center text-xs font-medium">
                  ✓
                </div>
                <AllergenIcon allergen={getAllergenIconKey(allergenKey)} size={16} className="text-gray-700" />
                <div className="flex-1 text-left">
                  <span className="text-sm text-gray-700">{ALLERGEN_DISPLAY_NAMES[allergenKey] || allergenName}</span>
                  {allergenSeverity && allergenSeverity !== 'null' && (
                    <span className="text-xs text-gray-500 ml-1">({allergenSeverity})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-400 italic sm:text-sm">
          No allergens selected
        </div>
      )}
    </div>
  );
}
