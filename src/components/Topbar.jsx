import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Button } from './Button';

export function Topbar({ title, onNew }) {
  const { theme, toggle } = useContext(ThemeContext);
  return (
    <header className="h-[52px] border-b border-[var(--border)] bg-[var(--bg)] flex items-center px-5 gap-3 sticky top-0 z-10">
      <h1 className="text-[14px] font-semibold text-[var(--fg)] mr-auto">{title}</h1>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[var(--fg-muted)] font-mono">
          {new Date().toLocaleDateString('pt-BR')}
        </span>
        {onNew && (
          <Button variant="primary" size="sm" onClick={onNew} aria-label="Criar novo fluxo">
            <Icon name="plus" size={15} />Novo
          </Button>
        )}
        <button
          type="button"
          onClick={toggle}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-[6px] text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] transition-colors"
          aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
      </div>
    </header>
  );
}
