import { Icon } from './Icon';
import { Button } from './Button';

export function Topbar({ title, onNew }) {
  const today = new Date();
  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--fg-secondary)]">{today.toLocaleDateString('pt-BR')}</span>
        {onNew && (
          <Button variant="primary" size="sm" onClick={onNew} aria-label="Criar novo fluxo">
            <Icon name="plus" size={16} />Novo
          </Button>
        )}
      </div>
    </header>
  );
}
