export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[var(--border)] rounded-lg bg-[var(--surface)]">
      {icon && <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-4">{icon}</div>}
      <h2 className="text-sm font-semibold mb-1">{title || 'Nenhum registro'}</h2>
      {desc && <p className="text-xs text-[var(--fg-secondary)] mb-4 max-w-xs leading-relaxed">{desc}</p>}
      {action}
    </div>
  );
}

export function Loading() {
  return <div className="flex items-center justify-center py-16"><div className="spinner" /></div>;
}
