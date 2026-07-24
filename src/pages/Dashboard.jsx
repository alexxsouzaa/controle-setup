import { useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

export function DashboardPage({ navigate }) {
  const { stats, flows, machines, pieces } = useContext(AppDataContext);

  const recent = [...flows].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

  return (
    <div className="p-6">
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

      <div className="grid lg:grid-cols-3 md:grid-cols-1 gap-4">
        <div className="lg:col-span-2 border border-[var(--border)] rounded-[8px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-2">
              <Icon name="file" size={15} />
              <span className="text-[13px] font-semibold text-[var(--fg)]">Fluxos Recentes</span>
            </div>
            <button type="button" onClick={() => navigate('/fluxos')} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
              Ver todos →
            </button>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {recent.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] text-[var(--fg-muted)]">Nenhum fluxo registrado.</p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => navigate('/novo-setup')}>Criar primeiro fluxo</Button>
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)]">
                    <th className="text-left px-5 py-2.5 font-medium">Nome</th>
                    <th className="text-left px-5 py-2.5 font-medium hidden md:table-cell">Máquina</th>
                    <th className="text-left px-5 py-2.5 font-medium w-20">Status</th>
                    <th className="text-right px-5 py-2.5 font-medium w-24 hidden sm:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(r => (
                    <tr key={r.id} className="hover:bg-[var(--surface-hover)] cursor-pointer" onClick={() => navigate('/fluxos')}>
                      <td className="px-5 py-2.5">
                        <div className="font-medium truncate max-w-[300px]">{r.name}</div>
                        <div className="text-[11px] text-[var(--fg-muted)] md:hidden">{r.machine} · {r.date}</div>
                      </td>
                      <td className="px-5 py-2.5 text-[var(--fg-secondary)] hidden md:table-cell">{r.machine}</td>
                      <td className="px-5 py-2.5">
                        <Badge>{r.ver || '—'}</Badge>
                      </td>
                      <td className="px-5 py-2.5 text-[11px] text-[var(--fg-muted)] font-mono text-right hidden sm:table-cell">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="border border-[var(--border)] rounded-[8px] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <Icon name="arrow-right" size={15} />
            <span className="text-[13px] font-semibold text-[var(--fg)]">Acesso Rápido</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {[
              { id: '/novo-setup', icon: 'wrench', label: 'Novo Fluxo', desc: 'Criar fluxo de setup' },
              { id: '/maquinas', icon: 'box', label: 'Máquinas', desc: `${stats.totalMachines} cadastrada${stats.totalMachines !== 1 ? 's' : ''}` },
              { id: '/produtos', icon: 'grid-3x3', label: 'Produtos', desc: `${stats.totalProducts} no catálogo` },
              { id: '/formatos', icon: 'grid-3x3', label: 'Formatos', desc: `${stats.totalFormatos} cadastrado${stats.totalFormatos !== 1 ? 's' : ''}` },
            ].map(a => (
              <button key={a.id} type="button" onClick={() => navigate(a.id)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[var(--surface-hover)] transition-colors">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)] shrink-0">
                  <Icon name={a.icon} size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[var(--fg)]">{a.label}</div>
                  <div className="text-[11px] text-[var(--fg-muted)]">{a.desc}</div>
                </div>
                <Icon name="arrow-right" size={14} className="text-[var(--fg-muted)]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
