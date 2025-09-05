import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';

export interface Review {
  id: number;
  place_id: string;
  user_id: number;
  review_text: string;
  allergen_scores: any;
  overall_rating: number;
  is_flagged: boolean;
  is_hidden: boolean;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  establishment_name: string;
  establishment_address: string;
}

export interface ReviewPaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewFilters {
  search: string;
  filter: 'all' | 'flagged' | 'hidden';
  page: number;
  limit: number;
}

interface UseAdminReviewsReturn {
  reviews: Review[];
  pagination: ReviewPaginationInfo;
  loading: boolean;
  error: string | null;
  filters: ReviewFilters;
  setFilters: (filters: Partial<ReviewFilters>) => void;
  moderateReview: (reviewId: number, updates: Partial<Review>) => Promise<{ success: boolean; error?: string }>;
  deleteReview: (reviewId: number) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
  processingIds: Set<number>;
}

export function useAdminReviews(): UseAdminReviewsReturn {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<ReviewPaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [filters, setFiltersState] = useState<ReviewFilters>({
    search: '',
    filter: 'all',
    page: 1,
    limit: 20
  });

  const fetchReviews = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        filter: filters.filter,
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/reviews?${params}`, {
        headers: {
          'x-user-id': user.id.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      setReviews(data.reviews || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  const setFilters = useCallback((newFilters: Partial<ReviewFilters>) => {
    setFiltersState(prev => {
      const updated = { ...prev, ...newFilters };
      // Reset to page 1 when filters change (except page itself)
      if (newFilters.search !== undefined || newFilters.filter !== undefined) {
        updated.page = 1;
      }
      return updated;
    });
  }, []);

  const moderateReview = useCallback(async (reviewId: number, updates: Partial<Review>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    setProcessingIds(prev => new Set(prev).add(reviewId));
    
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to moderate review');
      }

      const result = await response.json();
      
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, ...result.review } : review
      ));
      
      return { success: true };
    } catch (err) {
      console.error('Failed to moderate review:', err);
      return { success: false, error: 'Failed to moderate review' };
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  }, [user]);

  const deleteReview = useCallback(async (reviewId: number) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    setProcessingIds(prev => new Set(prev).add(reviewId));
    
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      // Remove from local state
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      
      return { success: true };
    } catch (err) {
      console.error('Failed to delete review:', err);
      return { success: false, error: 'Failed to delete review' };
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  }, [user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    moderateReview,
    deleteReview,
    refetch: fetchReviews,
    processingIds
  };
}

