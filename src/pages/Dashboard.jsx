import { useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';

export function DashboardPage({ navigate }) {
  const { stats, flows } = useContext(AppDataContext);

  const recent = [...flows].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

  return (
    <div className="p-6 pb-16">
      <div className="flex items-center justify-between mb-6 py-0.5">
        <div>
          <h1 className="text-[16px] font-semibold text-[var(--fg)]">Visão Geral</h1>
          <p className="text-[12px] text-[var(--fg-muted)] mt-0.5 font-mono">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/novo-setup')}>
            <Icon name="plus" size={14} />Novo Fluxo
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/fluxos')}>
            Ver todos <Icon name="arrow-right" size={14} />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mb-6">
        {[
          { label: 'Fluxos de Setup', value: stats.totalFlows, icon: 'file', color: 'var(--fg)' },
          { label: 'Máquinas', value: stats.totalMachines, icon: 'box', color: 'var(--success)' },
          { label: 'Setups Hoje', value: stats.flowsToday, icon: 'clock', color: 'var(--warning)' },
          { label: 'Peças Cadastradas', value: stats.totalPieces, icon: 'box', color: 'var(--fg-secondary)' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-4 flex flex-col gap-2 transition-colors hover:border-[var(--fg-muted)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">{s.label}</span>
              <div className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: `${s.color}15`, color: s.color }}>
                <Icon name={s.icon} size={16} />
              </div>
            </div>
            <div className="text-[24px] font-semibold font-mono text-[var(--fg)]">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="border border-[var(--border)] rounded-[8px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <Icon name="file" size={15} />
            <span className="text-[13px] font-semibold text-[var(--fg)]">Fluxos Recentes</span>
          </div>
          <button type="button" onClick={() => navigate('/fluxos')} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
            Ver todos →
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="w-9 h-9 rounded-[8px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3 text-[var(--fg-muted)]">
              <Icon name="file" size={18} />
            </div>
            <p className="text-[13px] text-[var(--fg-muted)] mb-1">Nenhum fluxo registrado</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/novo-setup')}>Criar primeiro fluxo</Button>
          </div>
        ) : (
          <div>
            {recent.map(r => (
              <button key={r.id} type="button" onClick={() => navigate('/fluxos')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--success-muted)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-[var(--fg)] truncate">{r.name}</div>
                  <div className="text-[11px] text-[var(--fg-muted)]">{r.machine} · {r.product}</div>
                </div>
                <div className="text-[10px] text-[var(--fg-muted)] font-mono whitespace-nowrap">{r.date}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
