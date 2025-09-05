import { useState, useCallback } from 'react';

export interface Establishment {
  id: number;
  place_id: string;
  name: string;
  address: string;
  chain_id: number | null;
  chain_name: string | null;
  chain_slug: string | null;
  primary_category: string;
  cuisine: string;
  rating: number;
  user_ratings_total: number;
}

interface UseEstablishmentAssignmentOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useEstablishmentAssignment(options: UseEstablishmentAssignmentOptions = {}) {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);

  const { onSuccess, onError } = options;

  // Fetch establishments with optional filters
  const fetchEstablishments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (showUnassignedOnly) params.append('unassigned_only', 'true');
      
      const response = await fetch(`/api/admin/establishments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch establishments');
      
      const data = await response.json();
      setEstablishments(data.establishments || []);
    } catch (error) {
      console.error('Error fetching establishments:', error);
      onError?.('Failed to load establishments');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showUnassignedOnly, onError]);

  // Assign establishment to chain
  const assignToChain = useCallback(async (establishmentId: number, chainId: number | null) => {
    setProcessingIds(prev => new Set(prev).add(establishmentId));
    
    try {
      const response = await fetch(`/api/admin/establishments/${establishmentId}/assign-chain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chain_id: chainId }),
      });

      if (!response.ok) throw new Error('Failed to assign chain');
      
      const result = await response.json();
      onSuccess?.(result.message);
      
      // Refresh the data
      await fetchEstablishments();
      
    } catch (error) {
      console.error('Error assigning chain:', error);
      onError?.('Failed to assign chain');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(establishmentId);
        return newSet;
      });
    }
  }, [fetchEstablishments, onSuccess, onError]);

  // Filter establishments for display
  const filteredEstablishments = establishments.filter(establishment => {
    const matchesSearch = !searchTerm || 
      establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      establishment.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !showUnassignedOnly || !establishment.chain_id;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: establishments.length,
    assigned: establishments.filter(est => est.chain_id).length,
    unassigned: establishments.filter(est => !est.chain_id).length,
  };

  return {
    // Data
    establishments,
    filteredEstablishments,
    stats,
    
    // Loading states
    loading,
    processingIds,
    
    // Filters
    searchTerm,
    showUnassignedOnly,
    setSearchTerm,
    setShowUnassignedOnly,
    
    // Actions
    fetchEstablishments,
    assignToChain,
  };
}
