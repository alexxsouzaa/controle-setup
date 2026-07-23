import { useState, useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';

const ENTITIES = [
  { key: 'machines', label: 'Máquinas' },
  { key: 'products', label: 'Produtos' },
  { key: 'pieces', label: 'Peças' },
  { key: 'flows', label: 'Fluxos' },
  { key: 'formatos', label: 'Formatos' },
];

function jsonToXML(obj, root = 'data') {
  const toXML = (val, name) => {
    if (Array.isArray(val)) return val.map(v => toXML(v, name.slice(0, -1))).join('');
    if (typeof val === 'object' && val) {
      const children = Object.entries(val)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => toXML(v, k)).join('');
      return `<${name}>${children}</${name}>`;
    }
    return `<${name}>${String(val).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</${name}>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>${Object.entries(obj).map(([k, v]) => toXML(v, k)).join('')}</${root}>`;
}

export function ExportPage() {
  const ctx = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const data = {};
  ENTITIES.forEach(e => {
    data[e.key] = ctx[e.key] || [];
  });

  const [selected, setSelected] = useState(() => new Set(ENTITIES.map(e => e.key)));
  const [format, setFormat] = useState('json');

  const toggleEntity = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === ENTITIES.length) setSelected(new Set());
    else setSelected(new Set(ENTITIES.map(e => e.key)));
  };

  const handleExport = () => {
    if (selected.size === 0) { toast('Selecione ao menos uma entidade para exportar.', 'warning'); return; }
    const exportData = {};
    selected.forEach(key => { exportData[key] = data[key]; });
    const content = format === 'xml' ? jsonToXML(exportData, 'export') : JSON.stringify(exportData, null, 2);
    const ext = format === 'xml' ? 'xml' : 'json';
    const blob = new Blob([content], { type: format === 'xml' ? 'application/xml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle-setup-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Arquivo exportado com sucesso!');
  };

  const counts = { machines: ctx.machines?.length || 0, products: ctx.products?.length || 0, pieces: ctx.pieces?.length || 0, flows: ctx.flows?.length || 0, formatos: ctx.formatos?.length || 0 };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold tracking-tight mb-1">Exportar Dados</h2>
      <p className="text-sm text-[var(--fg-secondary)] mb-6">Selecione as entidades e o formato para exportar.</p>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Entidades</h3>
          <button type="button" onClick={toggleAll} className="text-xs text-[var(--accent)] hover:underline">
            {selected.size === ENTITIES.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>
        <div className="space-y-2">
          {ENTITIES.map(e => (
            <label key={e.key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)] cursor-pointer transition-colors">
              <input type="checkbox" checked={selected.has(e.key)} onChange={() => toggleEntity(e.key)} className="accent-[var(--accent)]" />
              <span className="flex-1 text-sm font-medium">{e.label}</span>
              <Badge>{counts[e.key]} registro{counts[e.key] !== 1 ? 's' : ''}</Badge>
            </label>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="text-base font-semibold mb-3">Formato</h3>
        <div className="flex gap-3">
          {['json', 'xml'].map(f => (
            <button key={f} type="button" onClick={() => setFormat(f)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${format === f ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-secondary)] hover:border-[var(--accent)]'}`}
            >
              .{f.toUpperCase()}
              <div className="text-xs font-normal mt-0.5 opacity-70">{f === 'json' ? 'Estruturado' : 'Universal'}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant="primary" onClick={handleExport} disabled={selected.size === 0}>
          <Icon name="download" size={16} />Exportar {selected.size} entidade{selected.size !== 1 ? 's' : ''}
        </Button>
      </div>

      <div className="mt-12 pt-6 border-t border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--danger)] mb-2">Zona de Perigo</h3>
        <p className="text-xs text-[var(--fg-secondary)] mb-3">Remove todos os dados cadastrados e restaura o sistema ao estado inicial.</p>
        <Button variant="ghost" size="sm" onClick={() => {
          if (confirm('Tem certeza? Todos os dados serão perdidos permanentemente.')) {
            if (confirm('Esta ação não pode ser desfeita. Confirma a exclusão total dos dados?')) {
localStorage.clear();
window.location.href = window.location.pathname + '?reset=' + Date.now();
            }
          }
        }}><Icon name="alert" size={16} />Resetar todos os dados</Button>
      </div>
    </div>
  );
}
