interface DataTableSelectionBarProps {
  count: number;
  allSelected: boolean;
  onCancel: () => void;
  actionLabel: string;
  onAction: () => void;
}

export function DataTableSelectionBar({ count, allSelected, onCancel, actionLabel, onAction }: DataTableSelectionBarProps) {
  return (
    <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-[6px] border border-[var(--fg-muted)] bg-[var(--accent-muted)]">
      <span className="text-[12px] font-medium text-[var(--fg)]">{allSelected ? 'Todos selecionados' : `${count} selecionado${count !== 1 ? 's' : ''}`}</span>
      <button type="button" onClick={onAction} className="ml-auto text-[11px] font-medium text-[var(--danger)] hover:underline">{actionLabel}</button>
      <button type="button" onClick={onCancel} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]">Cancelar</button>
    </div>
  );
}
