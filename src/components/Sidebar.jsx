import { Icon } from './Icon';

const groups = [
  { label: 'Principal', items: [
    { id: '/dashboard', icon: 'home', label: 'Dashboard' },
    { id: '/fluxos', icon: 'file', label: 'Fluxos de Setup' },
    { id: '/novo-setup', icon: 'wrench', label: 'Novo Fluxo' },
  ]},
  { label: 'Dados', items: [
    { id: '/maquinas', icon: 'box', label: 'Máquinas' },
    { id: '/produtos', icon: 'grid-3x3', label: 'Produtos' },
    { id: '/pecas', icon: 'box', label: 'Peças' },
    { id: '/formatos', icon: 'grid-3x3', label: 'Formatos' },
  ]},
  { label: 'Ferramentas', items: [
    { id: '/importar', icon: 'upload', label: 'Importar' },
    { id: '/exportar', icon: 'download', label: 'Exportar' },
    { id: '/historico', icon: 'clock', label: 'Histórico' },
    { id: '/opcoes', icon: 'settings', label: 'Opções' },
  ]},
];

export function Sidebar({ active, navigate }) {
  return (
    <aside className="w-60 border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col fixed top-0 left-0 bottom-0 z-20">
      <div className="flex items-center gap-2.5 px-[18px] py-4 border-b border-[var(--border)] h-[52px]">
        <div className="w-7 h-7 rounded-[6px] bg-[var(--fg)] flex items-center justify-center">
          <Icon name="box" size={16} />
        </div>
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--fg)]">CS Setup</span>
        <span className="text-[10px] font-mono text-[var(--fg-muted)] bg-[var(--surface)] px-1 py-0.5 rounded-sm ml-auto">v2.4</span>
      </div>

      <nav className="flex-1 px-2.5 py-3">
        {groups.map(group => (
          <div key={group.label}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] px-2 pt-4 pb-1.5">{group.label}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-current={active === item.id ? 'page' : undefined}
                className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[6px] text-[13px] font-medium transition-all duration-100 ${
                  active === item.id
                    ? 'bg-[var(--surface-hover)] text-[var(--fg)] font-semibold'
                    : 'text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                }`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-2.5 py-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--fg-secondary)]">OP</div>
          <div className="overflow-hidden">
            <div className="text-[13px] font-medium text-[var(--fg)]">Operador</div>
            <div className="text-[11px] text-[var(--fg-muted)]">Usuário do sistema</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
