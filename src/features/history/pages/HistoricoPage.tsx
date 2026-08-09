import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/Button';
import { EmptyState, Loading } from '../../../components/shared/EmptyState';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { SearchInput } from '../../../components/shared/SearchInput';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Pagination } from '../../../components/shared/Pagination';
import { useHistory, useClearHistory, useRestoreHistory } from '../../../queries';
import type { HistoryEntry } from '../../../types';

const TYPE_ICONS = { create: 'check-circle', update: 'wrench', delete: 'trash', import: 'upload', export: 'download', duplicate: 'file' } as const;
const TYPE_COLORS = { create: 'var(--success)', update: 'var(--fg)', delete: 'var(--danger)', import: 'var(--success)', export: 'var(--fg-secondary)', duplicate: 'var(--warning)' } as const;
const TYPE_BG = { create: 'var(--success-muted)', update: 'var(--accent-muted)', delete: 'var(--danger-muted)', import: 'var(--success-muted)', export: 'transparent', duplicate: 'var(--warning-muted)' } as const;
const TYPE_LABELS: Record<string, string> = { create: 'Criação', update: 'Atualização', delete: 'Exclusão', import: 'Importação', export: 'Exportação', duplicate: 'Duplicação' };

const PER_PAGE = 25;

function dateGroupKey(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diff <= 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function HistoricoPage() {
  const { data: history = [], isLoading, isError, refetch } = useHistory();
  const { mutate: clearHistory } = useClearHistory();
  const { mutate: restoreHistory } = useRestoreHistory();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [confirmClear, setConfirmClear] = useState(false);
  const [lastCleared, setLastCleared] = useState<HistoryEntry[] | null>(null);

  useEffect(() => { setPage(1); }, [filter, search]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach(h => counts.set(h.type, (counts.get(h.type) || 0) + 1));
    return counts;
  }, [history]);

  const filters = useMemo(() => {
    const present = Object.keys(TYPE_LABELS).filter(t => typeCounts.has(t));
    return [
      { id: '', label: 'Todos', count: history.length },
      ...present.map(id => ({ id, label: TYPE_LABELS[id], count: typeCounts.get(id) || 0 })),
    ];
  }, [history.length, typeCounts]);

  const filtered = useMemo(() => {
    let items = history;
    if (filter) items = items.filter(h => h.type === filter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(h => (h.entity || '').toLowerCase().includes(q) || (h.detail || '').toLowerCase().includes(q));
    }
    return items;
  }, [history, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const groups = useMemo(() => {
    const out: { label: string; items: HistoryEntry[] }[] = [];
    paged.forEach(h => {
      const key = dateGroupKey(h.date);
      const last = out[out.length - 1];
      if (last && last.label === key) last.items.push(h);
      else out.push({ label: key, items: [h] });
    });
    return out;
  }, [paged]);

  const handleClear = () => {
    setLastCleared(history);
    clearHistory();
    toast('Histórico limpo com sucesso!');
  };

  const handleUndo = () => {
    if (!lastCleared) return;
    restoreHistory(lastCleared);
    setLastCleared(null);
    toast('Histórico restaurado.');
  };

  if (isLoading) return <div className="p-6"><Loading /></div>;

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Icon name="alert" size={24} />}
          title="Erro ao carregar o histórico"
          desc="Não foi possível consultar as ações registradas."
          action={<Button variant="secondary" size="sm" onClick={() => refetch()}>Tentar novamente</Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-6 pb-16">
      <PageHeader title="Histórico" description="Registro de todas as ações realizadas no sistema." />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map(f => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all ${
                filter === f.id ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
              }`}>
              {f.label}
              <span className={`ml-1.5 ${filter === f.id ? 'opacity-70' : 'text-[var(--fg-muted)]'}`}>{f.count}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput className="w-full sm:w-52" placeholder="Buscar..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} aria-label="Buscar no histórico" />
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}><Icon name="trash" size={14} />Limpar</Button>
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
          <ul className="divide-y divide-[var(--border-subtle)]">
            {groups.map(g => (
              <li key={`group-${g.label}`}>
                <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--bg-secondary)] text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)]">
                  <span>{g.label}</span>
                  <span className="text-[10px] font-medium normal-case text-[var(--fg-muted)]">{g.items.length} {g.items.length !== 1 ? 'registros' : 'registro'}</span>
                </div>
                <ul className="divide-y divide-[var(--border-subtle)]">
                  {g.items.map(h => {
                    const t = h.type as keyof typeof TYPE_ICONS;
                    return (
                      <li key={h.id} className="grid grid-cols-[1fr_auto] gap-0 items-center px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: TYPE_BG[t] || 'var(--bg-secondary)', color: TYPE_COLORS[t] || 'var(--fg-muted)' }}>
                            <Icon name={TYPE_ICONS[t] || 'settings'} size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-[var(--fg)]">{h.entity}</span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px]" style={{ background: TYPE_BG[t] || 'var(--bg-secondary)', color: TYPE_COLORS[t] || 'var(--fg-muted)' }}>
                                {TYPE_LABELS[t] || h.type}
                              </span>
                            </div>
                            {h.detail && <div className="text-[12px] text-[var(--fg-secondary)] mt-0.5 truncate" title={h.detail}>{h.detail}</div>}
                          </div>
                        </div>
                        <div className="text-[11px] text-[var(--fg-muted)] font-mono whitespace-nowrap pl-4">
                          {new Date(h.date).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <span className="text-[11px] text-[var(--fg-muted)]">{filtered.length} de {history.length} registro{history.length !== 1 ? 's' : ''}</span>
        {lastCleared && lastCleared.length > 0 && (
          <button
            type="button"
            onClick={handleUndo}
            className="px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium text-[var(--accent-fg)] bg-[var(--accent-light)] hover:bg-[var(--accent-muted)] transition-colors">
            Desfazer limpeza
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={filtered.length} perPage={PER_PAGE} bordered />
      )}

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Limpar todo o histórico?"
        description="Você poderá desfazer esta ação em seguida."
        confirmLabel="Limpar"
        onConfirm={handleClear}
      />
    </div>
  );
}
