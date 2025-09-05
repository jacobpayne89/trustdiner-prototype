import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Hook for implementing infinite scroll functionality
 * Useful for large datasets like establishments list
 */
export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px'
}: UseInfiniteScrollOptions) {
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading && !loadingMore) {
      setLoadingMore(true);
      onLoadMore();
    }
  }, [hasMore, loading, loadingMore, onLoadMore]);

  useEffect(() => {
    if (loading) {
      setLoadingMore(false);
    }
  }, [loading]);

  useEffect(() => {
    const element = triggerRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  return {
    triggerRef,
    loadingMore
  };
}
