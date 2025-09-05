/**
 * TrustDiner Venue Type Service
 * 
 * Manages venue type validation and categorization for dining establishments.
 * Ensures only appropriate dining venues are imported from Google Places.
 */

export interface VenueTypeValidation {
  isValid: boolean;
  primaryCategory: string;
  diningType: string;
  excludedReasons?: string[];
}

export class VenueTypeService {
  
  /**
   * TrustDiner's approved dining venue types (in priority order)
   * These are the Google Places types we want to include
   */
  static readonly APPROVED_DINING_TYPES = [
    'restaurant',           // Primary catch-all for sit-down and takeout
    'cafe',                // Coffee shops, tea houses, casual hangouts  
    'bakery',              // Bread/pastries, relevant for allergens & chains
    'bar',                 // Pubs, wine bars, breweries that serve food
    'meal_takeaway',       // Takeout/fast food counters
    'meal_delivery',       // Delivery-only / ghost kitchens
    'food_court',          // Mall/airport dining clusters
    'ice_cream_shop',      // Dessert-specific venues
    'pizza_restaurant',    // Pizza-specific (often tagged separately)
    'sandwich_shop',       // Sandwich/deli venues
    'food'                 // Generic food category (fallback)
  ];

  /**
   * Venue types to exclude (non-dining establishments)
   */
  static readonly EXCLUDED_TYPES = [
    'supermarket', 
    'grocery_or_supermarket', 
    'convenience_store', 
    'liquor_store', 
    'store', 
    'gas_station', 
    'beauty_salon', 
    'pharmacy',
    'shopping_mall',
    'department_store',
    'electronics_store',
    'clothing_store',
    'bank',
    'atm',
    'hospital',
    'doctor',
    'dentist'
  ];

  /**
   * Internal dining type mapping for TrustDiner categorization
   */
  static readonly DINING_TYPE_MAP: { [key: string]: string } = {
    'restaurant': 'restaurant',
    'cafe': 'cafe', 
    'bakery': 'bakery',
    'bar': 'bar',
    'meal_takeaway': 'takeaway',
    'meal_delivery': 'delivery',
    'food_court': 'food_court',
    'ice_cream_shop': 'dessert',
    'pizza_restaurant': 'pizza',
    'sandwich_shop': 'sandwich',
    'food': 'general'
  };

  /**
   * Validate if a venue with given Google Places types should be included in TrustDiner
   */
  static validateVenueTypes(googlePlacesTypes: string[]): VenueTypeValidation {
    const types = googlePlacesTypes || [];
    
    // Check for excluded types first
    const excludedReasons = types.filter(type => this.EXCLUDED_TYPES.includes(type));
    if (excludedReasons.length > 0) {
      return {
        isValid: false,
        primaryCategory: 'excluded',
        diningType: 'excluded',
        excludedReasons
      };
    }

    // Find the best matching approved dining type
    const primaryCategory = types.find(type => this.APPROVED_DINING_TYPES.includes(type));
    
    if (!primaryCategory) {
      return {
        isValid: false,
        primaryCategory: 'unknown',
        diningType: 'unknown',
        excludedReasons: ['No recognized dining venue type found']
      };
    }

    // Map to internal dining type
    const diningType = this.DINING_TYPE_MAP[primaryCategory] || 'general';

    return {
      isValid: true,
      primaryCategory,
      diningType
    };
  }

  /**
   * Get Google Places API type parameter for dining-focused searches
   */
  static getSearchTypes(): string[] {
    return ['restaurant']; // Primary type for Google Places API searches
  }

  /**
   * Get expanded search types for comprehensive venue discovery
   */
  static getExpandedSearchTypes(): string[] {
    return [
      'restaurant',
      'cafe', 
      'bakery',
      'bar',
      'meal_takeaway'
    ];
  }

  /**
   * Check if a venue name suggests it might be a non-dining establishment
   */
  static validateVenueName(name: string): boolean {
    const excludedNamePatterns = [
      /supermarket/i,
      /grocery/i,
      /convenience/i,
      /pharmacy/i,
      /chemist/i,
      /boots/i,
      /tesco(?!\s+(cafe|express))/i, // Exclude Tesco unless it's Tesco Cafe/Express
      /sainsbury(?!s?\s+cafe)/i,
      /asda(?!\s+cafe)/i,
      /morrisons(?!\s+cafe)/i,
      /lidl/i,
      /aldi/i,
      /co-?op(?!\s+(cafe|deli))/i
    ];

    return !excludedNamePatterns.some(pattern => pattern.test(name));
  }
}
