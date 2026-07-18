import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  mono?: boolean;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
}

const SkeletonRow = ({ cols }: { cols: number }) => (
  <tr style={{ borderBottom: '1px solid var(--border)' }}>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: '14px 18px' }}>
        <div
          className="skeleton"
          style={{
            height: 13,
            width: `${55 + (i % 3) * 20}%`,
            borderRadius: 4,
          }}
        />
      </td>
    ))}
  </tr>
);

export const Table = <T extends { _id?: string; id?: string }>({
  data,
  columns,
  isLoading,
  emptyMessage = 'No records found',
  emptySubtext = 'Add one to get started.',
}: TableProps<T>) => {
  const getKey = (item: T, i: number) =>
    (item as any)._id ?? (item as any).id ?? i;

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map((col, i) => (
              <th key={i} className="table-header">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Loading state — skeleton rows */}
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} cols={columns.length} />
          ))}

          {/* Empty state */}
          {!isLoading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length}>
                <div className="empty-state">
                  <svg
                    width="36" height="36"
                    viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5"
                    style={{ marginBottom: 12, opacity: 0.3 }}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  <p className="empty-state-title">{emptyMessage}</p>
                  <p className="empty-state-body">{emptySubtext}</p>
                </div>
              </td>
            </tr>
          )}

          {/* Data rows */}
          {!isLoading && data.map((item, rowIndex) => (
            <tr key={getKey(item, rowIndex)} className="table-row">
              {columns.map((col, colIndex) => {
                const value = typeof col.accessor === 'function'
                  ? col.accessor(item)
                  : String(item[col.accessor] ?? '—');

                return (
                  <td
                    key={colIndex}
                    className={`table-cell ${col.mono ? 'table-cell-mono' : ''} ${col.className ?? ''}`}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};