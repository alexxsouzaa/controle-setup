import { useContext, useState, useMemo } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

const TYPE_ICONS = { create: 'check-circle', update: 'wrench', delete: 'alert', import: 'upload', export: 'download', duplicate: 'file' };
const TYPE_COLORS = { create: 'var(--success)', update: 'var(--fg)', delete: 'var(--danger)', import: 'var(--fg)', export: 'var(--fg-secondary)', duplicate: 'var(--warning)' };
const TYPE_BG = { create: 'var(--success-muted)', update: 'var(--accent-muted)', delete: 'var(--danger-muted)', import: 'var(--accent-muted)', export: 'transparent', duplicate: 'var(--warning-muted)' };
const TYPE_LABELS = { create: 'Criação', update: 'Atualização', delete: 'Exclusão', import: 'Importação', export: 'Exportação', duplicate: 'Duplicação' };
const FILTERS = [
  { id: '', label: 'Todos' },
  { id: 'create', label: 'Criações' },
  { id: 'update', label: 'Atualizações' },
  { id: 'delete', label: 'Exclusões' },
];

export function HistoricoPage() {
  const { history, clearHistory } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let items = history;
    if (filter) items = items.filter(h => h.type === filter);
    if (search) items = items.filter(h => (h.entity || '').toLowerCase().includes(search) || (h.detail || '').toLowerCase().includes(search));
    return items;
  }, [history, filter, search]);

  const handleClear = () => {
    if (confirm('Limpar todo o histórico?')) {
      clearHistory();
      toast('Histórico limpo com sucesso!');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all ${
                filter === f.id ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none"><Icon name="search" size={14} /></span>
            <input className="shad-input pl-8 py-1.5 text-[12px] w-52" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar no histórico" />
          </div>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear}><Icon name="alert" size={14} />Limpar</Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16">
          <EmptyState icon={<Icon name="clock" size={24} />} title={history.length === 0 ? 'Nenhum registro' : 'Nenhum resultado'}
            desc={history.length === 0 ? 'As ações realizadas no sistema aparecerão aqui.' : 'Tente ajustar o filtro ou busca.'} />
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-[8px] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto] gap-0 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)] bg-[var(--bg-secondary)] px-4 py-2.5 border-b border-[var(--border)]">
            <span>Ação</span>
            <span>Data</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map(h => (
              <div key={h.id} className="grid grid-cols-[1fr_auto] gap-0 items-center px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: TYPE_BG[h.type] || 'var(--bg-secondary)', color: TYPE_COLORS[h.type] || 'var(--fg-muted)' }}>
                    <Icon name={TYPE_ICONS[h.type] || 'settings'} size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[var(--fg)]">{h.entity}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px]" style={{ background: TYPE_BG[h.type] || 'var(--bg-secondary)', color: TYPE_COLORS[h.type] || 'var(--fg-muted)' }}>
                        {TYPE_LABELS[h.type] || h.type}
                      </span>
                    </div>
                    {h.detail && <div className="text-[12px] text-[var(--fg-secondary)] mt-0.5 truncate">{h.detail}</div>}
                  </div>
                </div>
                <div className="text-[11px] text-[var(--fg-muted)] font-mono whitespace-nowrap pl-4">
                  {new Date(h.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-[11px] text-[var(--fg-muted)]">{filtered.length} de {history.length} registro{history.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
