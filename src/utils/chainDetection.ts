/**
 * Utility functions for detecting chain restaurants
 */

export const isChainRestaurant = (name: string): boolean => {
  const chainPatterns = [
    /^McDonalds?'?s?/i,  // Matches McDonald, McDonalds, McDonald's
    /^KFC/i,
    /^Burger King/i,
    /^Subway/i,
    /^Pizza Hut/i,
    /^Domino'?s/i,  // Matches Domino's or Dominos
    /^Taco Bell/i,
    /^Starbucks/i,
    /^Costa Coffee/i,
    /^Nando'?s/i,  // Matches Nando's or Nandos
    /^Wagamama/i,
    /^TGI Friday'?s?/i,
    /^Prezzo/i,
    /^Zizzi/i,
    /^ASK Italian/i,
    /^Bella Italia/i,
    /^Frankie & Benny'?s/i,
    /^Harvester/i,
    /^Wetherspoon/i,
    /^Greggs/i,
    /^Chipotle/i,
    /^Hola Guacamole/i,
    /^Five Guys/i,
    /^Pret A Manger/i,
    /^Leon/i,
    /^Panda Express/i,
    /^Shake Shack/i,
    /^Tim Hortons/i,
    /^Dunkin'/i
  ];
  return chainPatterns.some(pattern => pattern.test(name));
};

/**
 * Determines if a place is a chain restaurant based on chain data or name pattern
 */
export const isPlaceChain = (place: { 
  name: string; 
  chain?: { name: string } | null;
  chainName?: string | null;
  chain_id?: number | null;
  chainId?: number | null;
}): boolean => {
  // Check new canonical format
  if (place.chain?.name) return true;
  if (place.chain_id) return true;
  
  // Check legacy format
  if (place.chainName) return true;
  if (place.chainId) return true;
  
  // Fallback to name pattern matching
  return isChainRestaurant(place.name);
};
