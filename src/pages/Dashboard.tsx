import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import type { Flow, Machine } from '../types';
import { useMachines, useFlows, useStats } from '../queries';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: flows = [] } = useFlows();
  const { data: machines = [] } = useMachines();
  const stats = useStats();

  const recent = useMemo(() => [...flows].sort((a: Flow, b: Flow) => (b.date || '').localeCompare(a.date || '')).slice(0, 5), [flows]);
  const recentMachines = useMemo(() => [...machines].slice(-4), [machines]);

  const today = flows.filter(f => f.date === new Date().toISOString().slice(0, 10)).length;
  const yesterday = flows.filter(f => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return f.date === d.toISOString().slice(0, 10);
  }).length;
  const pctChange = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : (today > 0 ? 100 : 0);

  return (
    <div className="p-6 pb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[16px] font-semibold text-[var(--fg)]">Dashboard</h1>
          <p className="text-[12px] text-[var(--fg-muted)] mt-0.5 font-mono">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/fluxos')}>
            <Icon name="file" size={14} />Fluxos
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/novo-setup')}>
            <Icon name="plus" size={14} />Novo Fluxo
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mb-6">
        {[
          { label: 'Total de Fluxos', value: stats.totalFlows, icon: 'file' as const, sub: `${today} hoje` },
          { label: 'Máquinas Ativas', value: stats.totalMachines, icon: 'box' as const, sub: 'em operação' },
          { label: 'Setups Hoje', value: today, icon: 'clock' as const, sub: yesterday > 0 ? `${pctChange >= 0 ? '+' : ''}${pctChange}% vs ontem` : 'primeiro do dia' },
          { label: 'Produtos', value: stats.totalProducts, icon: 'grid-3x3' as const, sub: `${stats.totalFormatos} formatos` },
        ].map(s => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-4 flex flex-col gap-2 hover:border-[var(--fg-muted)] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">{s.label}</span>
              <div className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: 'var(--accent-muted)', color: 'var(--fg-secondary)' }}>
                <Icon name={s.icon} size={16} />
              </div>
            </div>
            <div className="text-[28px] font-bold font-mono tracking-[-0.02em] text-[var(--fg)] leading-none">{s.value}</div>
            <div className="text-[11px] text-[var(--fg-muted)]">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-[var(--border)] rounded-[8px] overflow-hidden">
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
            <div className="px-4 py-12 text-center">
              <div className="w-10 h-10 rounded-[8px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3 text-[var(--fg-muted)]">
                <Icon name="file" size={20} />
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
                    <div className="text-[11px] text-[var(--fg-muted)]">{r.machine} · {r.product} · {r.ver}</div>
                  </div>
                  <div className="text-[10px] text-[var(--fg-muted)] font-mono whitespace-nowrap">{r.date}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border border-[var(--border)] rounded-[8px] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <Icon name="grid-3x3" size={15} />
            <span className="text-[13px] font-semibold text-[var(--fg)]">Resumo do Sistema</span>
          </div>
          <div className="p-4 space-y-1">
            {[
              { label: 'Produtos', value: stats.totalProducts, icon: 'grid-3x3' as const, href: '/produtos' },
              { label: 'Peças', value: stats.totalPieces, icon: 'box' as const, href: '/pecas' },
              { label: 'Formatos', value: stats.totalFormatos, icon: 'grid-3x3' as const, href: '/formatos' },
            ].map(item => (
              <button key={item.label} type="button" onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] hover:bg-[var(--surface-hover)] transition-colors text-left">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
                  <Icon name={item.icon} size={14} />
                </div>
                <span className="text-[12px] font-medium text-[var(--fg)] flex-1">{item.label}</span>
                <span className="text-[11px] font-mono text-[var(--fg-muted)]">{item.value}</span>
              </button>
            ))}
            <div className="pt-3 mt-3 border-t border-[var(--border)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)] mb-2">Ações rápidas</p>
              <div className="space-y-1">
                {[
                  { label: 'Criar Novo Fluxo', icon: 'wrench' as const, href: '/novo-setup' },
                  { label: 'Importar Dados', icon: 'upload' as const, href: '/importar' },
                  { label: 'Configurações', icon: 'settings' as const, href: '/opcoes' },
                ].map(item => (
                  <button key={item.label} type="button" onClick={() => navigate(item.href)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] text-[12px] text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] transition-colors text-left">
                    <Icon name={item.icon} size={14} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-[8px] overflow-hidden mt-4">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <Icon name="box" size={15} />
          <span className="text-[13px] font-semibold text-[var(--fg)]">Máquinas</span>
        </div>
        <div className="grid md:grid-cols-4 grid-cols-2">
          {recentMachines.length === 0 ? (
            <div className="col-span-full px-4 py-6 text-center text-[12px] text-[var(--fg-muted)]">Nenhuma máquina cadastrada.</div>
          ) : (
            recentMachines.map(m => (
              <button key={m.id} type="button" onClick={() => navigate('/maquinas')}
                className="flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors border-r border-b border-[var(--border-subtle)] last:border-r-0">
                {(m as Machine & { image?: string }).image ? (
                  <img src={(m as Machine & { image?: string }).image} alt="" className="w-8 h-8 rounded-[6px] object-cover border border-[var(--border)] shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={16} /></div>
                )}
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[var(--fg)] truncate">{m.name}</div>
                  <div className="text-[10px] text-[var(--fg-muted)]">{m.uo}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
