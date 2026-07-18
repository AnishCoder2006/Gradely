import { useState, useCallback } from 'react';

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsePaginationOptions {
  initialPage?: number;
  limit?: number;
}

/**
 * Generic pagination state manager. Pass a fetcher that accepts
 * (page, limit) and returns { data, total }. The hook handles
 * page state, loading, and total-pages math.
 */
export function usePagination<T>(
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  options: UsePaginationOptions = {}
) {
  const { initialPage = 1, limit = 10 } = options;

  const [items, setItems]     = useState<T[]>([]);
  const [page, setPage]       = useState(initialPage);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchPage = useCallback(async (targetPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher(targetPage, limit);
      setItems(result.data);
      setTotal(result.total);
      setPage(targetPage);
    } catch (err: any) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [fetcher, limit]);

  const goToPage = useCallback((p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchPage(p);
  }, [fetchPage, totalPages]);

  const refresh = useCallback(() => fetchPage(page), [fetchPage, page]);

  return {
    items, page, total, totalPages, limit,
    loading, error,
    fetchPage, goToPage, refresh, setItems,
  };
}