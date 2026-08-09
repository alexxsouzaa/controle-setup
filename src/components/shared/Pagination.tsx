interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  perPage: number;
  bordered?: boolean;
}

const pageBtn = (active: boolean) =>
  `w-8 h-8 flex items-center justify-center rounded-[6px] text-[13px] font-medium border transition-all ${
    active ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'border-[var(--border)] text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
  }`;

export function Pagination({ page, totalPages, onPageChange, total, perPage, bordered }: PaginationProps) {
  const start = 1 + (page - 1) * perPage;
  const end = Math.min(page * perPage, total);
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${bordered ? 'mt-3 px-4 py-3 border border-[var(--border)] rounded-[8px]' : 'px-4 py-3 border-t border-[var(--border)]'}`}>
      <span className="text-[12px] text-[var(--fg-muted)]">Mostrando {start}–{end} de {total}</span>
      <div className="flex gap-1">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
          className={`${pageBtn(false)} disabled:opacity-40 disabled:cursor-not-allowed`} aria-label="Página anterior">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          if (pg > totalPages) return null;
          return (
            <button key={pg} type="button" onClick={() => onPageChange(pg)} className={pageBtn(pg === page)}>{pg}</button>
          );
        })}
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className={`${pageBtn(false)} disabled:opacity-40 disabled:cursor-not-allowed`} aria-label="Próxima página">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
