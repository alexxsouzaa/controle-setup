import { useContext, useState } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

const TYPE_ICONS = { create: 'check-circle', update: 'wrench', delete: 'alert', import: 'upload', export: 'download', duplicate: 'file' };
const TYPE_COLORS = { create: 'var(--success)', update: 'var(--info)', delete: 'var(--danger)', import: 'var(--accent)', export: 'var(--fg-secondary)', duplicate: 'var(--warning)' };
const TYPE_VARIANTS = { create: 'success', update: 'info', delete: 'danger', import: 'info', export: 'secondary', duplicate: 'warning' };

export function HistoricoPage() {
  const { history, clearHistory } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const [filter, setFilter] = useState('');

  const filtered = filter ? history.filter(h => h.type === filter || h.entity === filter || (h.detail || '').toLowerCase().includes(filter.toLowerCase())) : history;

  const handleClear = () => {
    if (confirm('Limpar todo o histórico?')) {
      clearHistory();
      toast('Histórico limpo com sucesso!');
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Histórico</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">{history.length} registro{history.length !== 1 ? 's' : ''}</p>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}><Icon name="alert" size={16} />Limpar histórico</Button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)] pointer-events-none"><Icon name="search" size={16} /></span>
          <input className="shad-input pl-9" placeholder="Filtrar por tipo, entidade ou detalhe..." value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filtrar histórico" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Icon name="clock" size={24} />} title={history.length === 0 ? 'Nenhum registro' : 'Nenhum resultado'} desc={history.length === 0 ? 'As ações realizadas no sistema aparecerão aqui.' : 'Tente ajustar o filtro.'} />
      ) : (
        <div className="space-y-1">
          {filtered.map(h => (
            <div key={h.id} className="flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-[var(--bg)] transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${TYPE_COLORS[h.type] || 'var(--fg-muted)'}15`, color: TYPE_COLORS[h.type] || 'var(--fg-muted)' }}>
                <Icon name={TYPE_ICONS[h.type] || 'settings'} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{h.entity}</span>
                  <Badge variant={TYPE_VARIANTS[h.type] || 'secondary'}>{h.type}</Badge>
                </div>
                {h.detail && <div className="text-xs text-[var(--fg-secondary)] mt-0.5 truncate">{h.detail}</div>}
              </div>
              <div className="text-xs text-[var(--fg-muted)] shrink-0">{new Date(h.date).toLocaleString('pt-BR')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
