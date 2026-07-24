import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
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
  const { theme, toggle } = useContext(ThemeContext);
  return (
    <aside className="w-60 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col fixed top-0 left-0 bottom-0 z-20">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)]">
        <Icon name="box" size={24} />
        <span className="text-sm font-semibold tracking-tight">Controle de Setup</span>
      </div>
      {groups.map(group => (
        <div key={group.label}>
          <div className="px-6 pt-4 pb-1 text-[11px] font-semibold text-[var(--fg-secondary)] uppercase tracking-widest">{group.label}</div>
          {group.items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              aria-current={active === item.id ? 'page' : undefined}
              className={`flex items-center gap-3 w-full px-6 py-2.5 text-sm transition-colors ${active === item.id ? 'bg-[var(--accent-light)] text-[var(--accent)] font-medium' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)] hover:text-[var(--fg)]'}`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </div>
      ))}
      <div className="mt-auto px-6 py-4 border-t border-[var(--border)] flex items-center justify-end">
        <button type="button" onClick={toggle} className="p-1.5 rounded-md hover:bg-[var(--bg)] text-[var(--fg-secondary)]" aria-label="Alternar tema">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
      </div>
    </aside>
  );
}
