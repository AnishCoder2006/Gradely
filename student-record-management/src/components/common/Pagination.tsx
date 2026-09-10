import { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Build page number list with ellipsis for large ranges
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (page > 3) pages.push('...');

    const startP = Math.max(2, page - 1);
    const endP = Math.min(totalPages - 1, page + 1);

    for (let i = startP; i <= endP; i++) pages.push(i);

    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  const btnBase: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 7,
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--bg-card)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'IBM Plex Mono, monospace',
    color: 'var(--text-secondary)',
    transition: 'all 0.15s ease',
    outline: 'none',
  };

  return (
    <nav
      aria-label="Pagination Navigation"
      className="flex-between"
      style={{ padding: '14px 4px', flexWrap: 'wrap', gap: 10, width: '100%' }}
    >
      {/* Range Status */}
      <p className="text-caption" style={{ margin: 0 }}>
        Showing{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {start}–{end}
        </span>{' '}
        of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {total}
        </span>
      </p>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Previous Button */}
        <button
          style={{
            ...btnBase,
            opacity: page <= 1 ? 0.4 : 1,
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
          }}
          onClick={() => page > 1 && onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page Item Buttons */}
        {getPageNumbers().map((p, idx) =>
          p === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              style={{
                width: 24,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 12,
                userSelect: 'none',
              }}
            >
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              style={{
                ...btnBase,
                backgroundColor: p === page ? 'var(--accent)' : 'var(--bg-card)',
                color: p === page ? 'var(--text-on-yellow)' : 'var(--text-secondary)',
                borderColor: p === page ? 'var(--accent)' : 'var(--border-strong)',
                fontWeight: p === page ? 700 : 500,
              }}
            >
              {p}
            </button>
          )
        )}

        {/* Next Button */}
        <button
          style={{
            ...btnBase,
            opacity: page >= totalPages ? 0.4 : 1,
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          }}
          onClick={() => page < totalPages && onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Go to next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
};