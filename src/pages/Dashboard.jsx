import { useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';

export function DashboardPage({ navigate }) {
  const { stats, flows } = useContext(AppDataContext);

  const quickActions = [
    { id: '/novo-setup', icon: 'wrench', label: 'Novo Fluxo', desc: 'Criar fluxo de setup' },
    { id: '/fluxos', icon: 'file', label: 'Consultar Fluxos', desc: 'Lista com busca e filtros' },
    { id: '/importar', icon: 'upload', label: 'Importar', desc: 'Arquivos JSON ou XML' },
  ];

  const recent = [...flows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const kpi = [
    { key: 'totalFlows', label: 'Fluxos', suffix: 'cadastrados' },
    { key: 'totalMachines', label: 'Máquinas', suffix: 'em operação' },
    { key: 'flowsToday', label: 'Setups Hoje', suffix: 'nas últimas 24h' },
    { key: 'totalProducts', label: 'Produtos', suffix: 'no catálogo' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Visão Geral</h2>
        <p className="text-sm text-[var(--fg-secondary)] mt-0.5">Resumo dos fluxos de setup cadastrados no sistema.</p>
      </div>
      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4 mb-8">
        {kpi.map(({ key, label, suffix }) => (
          <Card key={key}>
            <div className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">{label}</div>
            <div className="text-2xl font-bold tracking-tight mt-1 font-nums">{stats[key]}</div>
            <div className="text-xs text-[var(--fg-secondary)] mt-0.5">{suffix}</div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 mb-8">
        {quickActions.map(a => (
          <button key={a.id} type="button" onClick={() => navigate(a.id)}
            className="flex items-center gap-4 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors text-left no-underline text-[var(--fg)] cursor-pointer w-full"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
              <Icon name={a.icon} size={20} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{a.label}</div>
              <div className="text-xs text-[var(--fg-secondary)]">{a.desc}</div>
            </div>
            <Icon name="arrow-right" size={16} />
          </button>
        ))}
      </div>
      <div className="mb-3 text-sm font-semibold flex items-center gap-2"><Icon name="file" size={18} />Últimos Registros</div>
      <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg)]">
              {['Nome', 'Máquina', 'Data', 'Versão'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--fg-secondary)] text-sm">Nenhum fluxo registrado ainda.</td></tr>
            ) : (
              recent.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--bg)]">
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-[var(--fg-secondary)]">{r.machine}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--fg-secondary)]">{r.date}</td>
                  <td className="px-4 py-2.5"><Badge>{r.ver}</Badge></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
