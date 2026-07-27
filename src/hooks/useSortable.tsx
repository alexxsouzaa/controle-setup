import { useState, useMemo } from 'react';

interface SortableRecord {
  [key: string]: unknown;
}

interface SortableResult {
  sorted: SortableRecord[];
  toggle: (key: string) => void;
  indicator: (key: string) => string;
  sortKey: string;
  sortDir: string;
}

export function useSortable(data: SortableRecord[], defaultKey = 'name'): SortableResult {
  const [sortKey, setSortKey] = useState<string>(defaultKey);
  const [sortDir, setSortDir] = useState<string>('asc');

  const toggle = (key: string) => {
    if (key === sortKey) {
      setSortDir((d: string) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    return [...data].sort((a: SortableRecord, b: SortableRecord) => {
      const aVal = String(a[sortKey] ?? '').toLowerCase();
      const bVal = String(b[sortKey] ?? '').toLowerCase();
      const cmp = aVal.localeCompare(bVal, 'pt-BR', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const indicator = (key: string) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return { sorted, toggle, indicator, sortKey, sortDir };
}
