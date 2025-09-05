import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';
import { api } from '@/lib/api';

export interface Establishment {
  id: string;
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  primary_category: string;
  cuisine: string;
  business_status: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  chain_id: string | null;
  chain_name: string | null;
  chain_slug: string | null;
  review_count: number;
  avg_allergen_score: number | null;
  local_image_url?: string | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EstablishmentFilters {
  search: string;
  filter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface UseAdminEstablishmentsReturn {
  establishments: Establishment[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  filters: EstablishmentFilters;
  setFilters: (filters: Partial<EstablishmentFilters>) => void;
  updateEstablishment: (id: string, updates: Partial<Establishment>) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useAdminEstablishments(): UseAdminEstablishmentsReturn {
  const { user } = useContext(AuthContext);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<EstablishmentFilters>({
    search: '',
    filter: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 25
  });

  const fetchEstablishments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        search: filters.search,
        filter: filters.filter,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(`/api/admin/establishments?${params}`, {
        headers: {
          'x-user-id': user?.id?.toString() || ''
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch establishments');
      }
      
      const data = await response.json();
      setEstablishments(data.establishments || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch establishments:', err);
      setError('Failed to load establishments');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const setFilters = useCallback((newFilters: Partial<EstablishmentFilters>) => {
    setFiltersState(prev => {
      const updated = { ...prev, ...newFilters };
      // Reset to page 1 when filters change (except page itself)
      if (newFilters.search !== undefined || newFilters.filter !== undefined || 
          newFilters.sortBy !== undefined || newFilters.sortOrder !== undefined) {
        updated.page = 1;
      }
      return updated;
    });
  }, []);

  const updateEstablishment = useCallback(async (id: string, updates: Partial<Establishment>) => {
    try {
      const response = await fetch(`/api/admin/establishments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || ''
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update establishment');
      }

      const { establishment } = await response.json();
      
      // Update local state
      setEstablishments(prev => 
        prev.map(est => est.id === id ? { ...est, ...establishment } : est)
      );

      return { success: true };
    } catch (err) {
      console.error('Failed to update establishment:', err);
      return { success: false, error: 'Failed to update establishment' };
    }
  }, []);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  return {
    establishments,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    updateEstablishment,
    refetch: fetchEstablishments
  };
}

