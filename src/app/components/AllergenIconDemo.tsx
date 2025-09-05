"use client";

import React from 'react';
import { AllergenIcon, AllergenIcons, type AllergenKey } from './icons';
import { ALLERGENS } from '@/types';

export const AllergenIconDemo: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Allergen Icons Demo</h2>
      
      {/* Size variations */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Size Variations</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <AllergenIcon allergen="gluten" size={16} className="text-gray-600" />
          <AllergenIcon allergen="gluten" size={24} className="text-gray-600" />
          <AllergenIcon allergen="gluten" size={32} className="text-gray-600" />
          <AllergenIcon allergen="gluten" size={48} className="text-gray-600" />
        </div>
      </div>

      {/* Color variations */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Color Variations</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <AllergenIcon allergen="dairy" size={32} className="text-blue-500" />
          <AllergenIcon allergen="dairy" size={32} className="text-green-500" />
          <AllergenIcon allergen="dairy" size={32} className="text-red-500" />
          <AllergenIcon allergen="dairy" size={32} className="text-purple-500" />
          <AllergenIcon allergen="dairy" size={32} className="text-yellow-500" />
        </div>
      </div>

      {/* All allergen icons */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-700">All Allergen Icons</h3>
        <div className="grid grid-cols-7 gap-6">
          {ALLERGENS.map((allergen) => (
            <div key={allergen} className="flex flex-col items-center text-center">
              <AllergenIcon 
                allergen={allergen} 
                size={32} 
                className="text-gray-700 mb-2" 
              />
              <span className="text-sm font-medium text-gray-600 capitalize">
                {allergen}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage examples */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Usage Examples</h3>
        <div className="space-y-3 text-sm font-mono">
          <div>
            <code className="bg-white px-2 py-1 rounded text-blue-600">
              {"<AllergenIcon allergen=\"gluten\" size={24} className=\"text-blue-500\" />"}
            </code>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded text-blue-600">
              {"<GlutenIcon size={32} color=\"red\" />"}
            </code>
          </div>
          <div>
            <code className="bg-white px-2 py-1 rounded text-blue-600">
              {"const IconComponent = AllergenIcons['dairy'];"}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}; 