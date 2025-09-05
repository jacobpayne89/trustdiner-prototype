import { useState, useCallback, useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';

export interface Chain {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  local_logo_path?: string | null;
  featured_image_path?: string | null;
  website_url: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
  location_count?: string;
  avg_rating?: string;
}

interface UseAdminChainsOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useAdminChains(options: UseAdminChainsOptions = {}) {
  const { user } = useContext(AuthContext);
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [showChainEditor, setShowChainEditor] = useState(false);
  const [deletingChain, setDeletingChain] = useState<number | null>(null);

  const { onSuccess, onError } = options;

  // Fetch all chains
  const fetchChains = useCallback(async () => {
    if (!user?.id) {
      console.warn('🚫 Cannot fetch chains: user ID not available');
      onError?.('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Fetching chains with user ID:', user.id);
      const response = await fetch('/api/admin/chains', {
        headers: {
          'x-user-id': user.id.toString()
        }
      });
      if (!response.ok) throw new Error('Failed to fetch chains');
      
      const data = await response.json();
      // Handle both response formats: direct array or {chains: array}
      const chainsData = Array.isArray(data) ? data : data.chains || [];
      setChains(chainsData);
    } catch (error) {
      console.error('Error fetching chains:', error);
      onError?.('Failed to load chains');
    } finally {
      setLoading(false);
    }
  }, [user?.id, onError]);

  // Create new chain
  const createChain = useCallback(async (chainData: Partial<Chain>) => {
    if (!user?.id) {
      console.warn('🚫 Cannot create chain: user ID not available');
      onError?.('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/admin/chains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify(chainData),
      });

      if (!response.ok) {
        throw new Error('Failed to create chain');
      }

      const newChain = await response.json();
      setChains(prev => [...prev, newChain]);
      setShowChainEditor(false);
      onSuccess?.('Chain created successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to create chain:', error);
      onError?.('Failed to create chain');
      return { success: false, error: 'Failed to create chain' };
    }
  }, [user?.id, onSuccess, onError]);

  // Update existing chain
  const updateChain = useCallback(async (id: number, updates: Partial<Chain>) => {
    if (!user?.id) {
      console.warn('🚫 Cannot update chain: user ID not available');
      onError?.('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log('🔍 Updating chain with user ID:', user.id);
      const response = await fetch(`/api/admin/chains/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update chain');
      }

      const updatedChain = await response.json();
      setChains(prev => prev.map(chain => chain.id === id ? updatedChain : chain));
      setSelectedChain(null);
      onSuccess?.('Chain updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to update chain:', error);
      onError?.('Failed to update chain');
      return { success: false, error: 'Failed to update chain' };
    }
  }, [user?.id, onSuccess, onError]);

  // Delete chain
  const deleteChain = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this chain? This will unassign all establishments from this chain.')) {
      return;
    }

    if (!user?.id) {
      console.warn('🚫 Cannot delete chain: user ID not available');
      onError?.('User not authenticated');
      return { success: false };
    }

    setDeletingChain(id);
    try {
      const response = await fetch(`/api/admin/chains/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete chain');
      }

      setChains(prev => prev.filter(chain => chain.id !== id));
      onSuccess?.('Chain deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete chain:', error);
      onError?.('Failed to delete chain');
      return { success: false };
    } finally {
      setDeletingChain(null);
    }
  }, [user?.id, onSuccess, onError]);

  // UI state management
  const openChainEditor = useCallback((chain?: Chain) => {
    if (chain) {
      setSelectedChain(chain);
    } else {
      setShowChainEditor(true);
    }
  }, []);

  const closeChainEditor = useCallback(() => {
    setShowChainEditor(false);
    setSelectedChain(null);
  }, []);

  return {
    // Data
    chains,
    selectedChain,
    
    // Loading states
    loading,
    deletingChain,
    
    // UI state
    showChainEditor,
    
    // Actions
    fetchChains,
    createChain,
    updateChain,
    deleteChain,
    openChainEditor,
    closeChainEditor,
    
    // Direct state setters (for complex UI interactions)
    setSelectedChain,
    setShowChainEditor,
  };
}

