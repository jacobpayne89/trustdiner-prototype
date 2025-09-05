import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions<T> {
  data: T[];
  pageSize: number;
  initialPage?: number;
}

/**
 * Hook for client-side pagination
 * Useful for breaking large datasets into manageable chunks
 */
export function usePagination<T>({
  data,
  pageSize,
  initialPage = 1
}: UsePaginationOptions<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate pagination data
  const paginationData = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const currentPageData = data.slice(startIndex, endIndex);

    return {
      currentPageData,
      totalItems,
      totalPages,
      currentPage,
      startIndex: startIndex + 1,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    };
  }, [data, pageSize, currentPage]);

  const goToPage = useCallback((page: number) => {
    const maxPage = Math.ceil(data.length / pageSize);
    setCurrentPage(Math.max(1, Math.min(page, maxPage)));
  }, [data.length, pageSize]);

  const nextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationData.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationData.hasPreviousPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    const maxPage = Math.ceil(data.length / pageSize);
    setCurrentPage(maxPage);
  }, [data.length, pageSize]);

  // Reset to first page when data changes significantly
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    ...paginationData,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    resetPagination
  };
}
