import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, total, limit, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
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

  const btnBase: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 7,
    border: '1px solid var(--border-strong)',
    backgroundColor: 'var(--bg-card)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 12, fontWeight: 500,
    fontFamily: 'Geist Mono, monospace',
    color: 'var(--text-secondary)',
    transition: 'all 0.15s',
  };

  return (
    <div className="flex-between" style={{ padding: '14px 4px', flexWrap: 'wrap' as const, gap: 10 }}>
      <p className="text-caption" style={{ margin: 0 }}>
        Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{start}–{end}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{total}</span>
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          onClick={() => page > 1 && onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft size={14} />
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ width: 24, textAlign: 'center' as const, color: 'var(--text-muted)', fontSize: 12 }}>···</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={{
                ...btnBase,
                backgroundColor: p === page ? 'var(--accent)' : 'var(--bg-card)',
                color: p === page ? 'var(--text-on-yellow)' : 'var(--text-secondary)',
                border: p === page ? 'none' : '1px solid var(--border-strong)',
                fontWeight: p === page ? 700 : 500,
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          style={{ ...btnBase, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          onClick={() => page < totalPages && onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};