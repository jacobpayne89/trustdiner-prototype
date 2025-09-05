import { useState, useCallback } from 'react';

/**
 * Hook for managing chain visibility toggle state
 */
export function useChainToggle() {
  const [showChains, setShowChains] = useState(true);

  const toggleChains = useCallback(() => {
    setShowChains(prev => !prev);
  }, []);

  return {
    showChains,
    setShowChains,
    toggleChains
  };
}
