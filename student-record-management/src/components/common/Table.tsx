import { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  mono?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
  onRowClick?: (item: T) => void;
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
  onRowClick,
}: TableProps<T>) => {
  const getKey = (item: T, i: number) =>
    item._id ?? item.id ?? i;

  const renderCellValue = (item: T, col: Column<T>) => {
    if (typeof col.accessor === 'function') {
      return col.accessor(item);
    }
    const val = item[col.accessor];
    if (val === null || val === undefined || val === '') {
      return '—';
    }
    return String(val);
  };

  return (
    <div className="table-wrapper" style={{ width: '100%', overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map((col, i) => (
              <th
                key={i}
                className="table-header"
                style={{ textAlign: col.align || 'left' }}
              >
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
                <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
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
          {!isLoading && data.map((item, rowIndex) => {
            const isClickable = Boolean(onRowClick);

            return (
              <tr
                key={getKey(item, rowIndex)}
                className={`table-row ${isClickable ? 'table-row-clickable' : ''}`}
                onClick={() => onRowClick?.(item)}
                style={{
                  cursor: isClickable ? 'pointer' : 'default',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`table-cell ${col.mono ? 'table-cell-mono' : ''} ${col.className ?? ''}`}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {renderCellValue(item, col)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};