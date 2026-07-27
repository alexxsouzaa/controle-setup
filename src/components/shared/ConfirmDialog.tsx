interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'default', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-[var(--fg)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--fg-secondary)] mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] transition-colors">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`px-4 py-2 text-sm font-medium rounded-md text-white transition-colors ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--fg)] text-[var(--bg)]'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
