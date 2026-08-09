import * as React from 'react';
import { Pagination } from './Pagination';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  first?: boolean;
}

interface DataTablePagination {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  perPage: number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  selectionMode: boolean;
  selected: Set<string>;
  allSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  pagination?: DataTablePagination;
  getRowAriaLabel?: (row: T) => string;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectionMode,
  selected,
  allSelected,
  onToggleSelect,
  onToggleSelectAll,
  pagination,
  getRowAriaLabel,
  className,
}: DataTableProps<T>) {
  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-[8px] overflow-hidden overflow-x-auto ${className || ''}`}>
      <table className="w-full text-[13px] border-collapse">
        <thead className="bg-[var(--bg-secondary)]">
          <tr className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
            <th className={`w-8 px-3.5 py-2.5 border-b border-[var(--border)] ${selectionMode ? '' : 'hidden'}`}>
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label="Selecionar todos" className="accent-[var(--fg)] cursor-pointer" />
            </th>
            {columns.map(col => (
              <th key={col.key} className={`text-left py-2.5 border-b border-[var(--border)] ${col.first ? 'px-4' : 'px-3.5'} ${col.headerClassName || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const id = rowKey(row);
            const last = idx === rows.length - 1;
            const label = getRowAriaLabel ? getRowAriaLabel(row) : 'Selecionar';
            return (
              <tr key={id} className={`hover:bg-[var(--surface-hover)] transition-colors ${selected.has(id) ? 'bg-[var(--accent-muted)]' : ''}`} onClick={() => selectionMode && onToggleSelect(id)} style={{ cursor: selectionMode ? 'pointer' : undefined }}>
                <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} ${selectionMode ? '' : 'hidden'}`}>
                  <input type="checkbox" checked={selected.has(id)} onChange={() => onToggleSelect(id)} aria-label={label} className="accent-[var(--fg)] cursor-pointer" />
                </td>
                {columns.map(col => (
                  <td key={col.key} className={`py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} ${col.first ? 'px-4' : 'px-3.5'} ${col.cellClassName || ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {pagination && pagination.totalPages > 1 && (
        <Pagination {...pagination} />
      )}
    </div>
  );
}
