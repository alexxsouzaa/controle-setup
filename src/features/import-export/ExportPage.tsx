import { useState, useContext } from 'react';
import { ToastContext } from '../../contexts/ToastContext';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { useExport } from '../../queries';
import { useMachines, useProducts, usePieces, useFlows, useFormatos, useHistory } from '../../queries';
import { useStats } from '../../queries';
import { useAppStore } from '../../stores/appStore';

type ExportKey = 'machines' | 'products' | 'pieces' | 'flows' | 'formatos';

const ENTITIES = [
  { key: 'machines', label: 'Máquinas', icon: 'box' },
  { key: 'products', label: 'Produtos', icon: 'grid-3x3' },
  { key: 'pieces', label: 'Peças', icon: 'box' },
  { key: 'flows', label: 'Fluxos', icon: 'file' },
  { key: 'formatos', label: 'Formatos', icon: 'grid-3x3' },
] as const;

function jsonToXML(obj: Record<string, unknown>, root = 'data'): string {
  const toXML = (val: unknown, name: string): string => {
    if (Array.isArray(val)) return val.map(v => toXML(v, name.slice(0, -1))).join('');
    if (typeof val === 'object' && val !== null) {
      const children = Object.entries(val as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => toXML(v, k)).join('');
      return `<${name}>${children}</${name}>`;
    }
    return `<${name}>${String(val).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</${name}>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>${Object.entries(obj).map(([k, v]) => toXML(v, k)).join('')}</${root}>`;
}

export function ExportPage() {
  const { toast } = useContext(ToastContext) as { toast: (msg: string, type?: string) => number };
  const { data: machines = [] } = useMachines();
  const { data: products = [] } = useProducts();
  const { data: pieces = [] } = usePieces();
  const { data: flows = [] } = useFlows();
  const { data: formatos = [] } = useFormatos();
  const { data: history = [] } = useHistory();
  const exportAll = useExport();
  const stats = useStats();
  const currentUser = useAppStore(s => s.currentUser);
  const data: Record<ExportKey, unknown[]> = { machines, products, pieces, flows, formatos };
  const counts = {} as Record<ExportKey, number>;
  ENTITIES.forEach(e => { counts[e.key] = data[e.key].length; });

  const [selected, setSelected] = useState<Set<string>>(() => new Set(ENTITIES.map(e => e.key)));
  const [format, setFormat] = useState<string>('json');

  const totalSelected = selected.size;
  const totalItems = [...selected].reduce((sum, key) => sum + (counts[key as ExportKey] || 0), 0);

  const toggleEntity = (key: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const handleExport = () => {
    if (totalSelected === 0) { toast('Selecione ao menos uma entidade.', 'warning'); return; }
    const exportData: Record<string, unknown> = {};
    selected.forEach(key => { exportData[key] = data[key as ExportKey]; });
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

  return (
    <div className="p-6 pb-16 max-w-xl">
      <div className="border border-[var(--border)] rounded-[8px] overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[var(--fg)]">Entidades</h3>
          <span className="text-[11px] text-[var(--fg-muted)] font-mono">{totalItems} registro{totalItems !== 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {ENTITIES.map(e => {
            const selectedCount = counts[e.key] || 0;
            const isSelected = selected.has(e.key);
            return (
              <label key={e.key} className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${isSelected ? 'hover:bg-[var(--surface-hover)]' : 'opacity-50 hover:opacity-80'}`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[var(--fg)] border-[var(--fg)]' : 'border-[var(--border)]'}`}>
                  {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <input type="checkbox" checked={isSelected} onChange={() => toggleEntity(e.key)} className="sr-only" />
                <Icon name={e.icon} size={16} />
                <span className="flex-1 text-[13px] font-medium text-[var(--fg)]">{e.label}</span>
                <span className="text-[11px] font-mono text-[var(--fg-muted)]">{selectedCount}</span>
              </label>
            );
          })}
        </div>
        <div className="px-5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--fg-muted)]">{totalSelected} de {ENTITIES.length} entidade{totalSelected !== 1 ? 's' : ''}</span>
          <button type="button" onClick={() => setSelected(totalSelected === ENTITIES.length ? new Set() : new Set(ENTITIES.map(e => e.key)))}
            className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
            {totalSelected === ENTITIES.length ? 'Limpar seleção' : 'Selecionar todos'}
          </button>
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-[8px] overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <h3 className="text-[13px] font-semibold text-[var(--fg)]">Formato de saída</h3>
        </div>
        <div className="flex gap-3 p-4">
          {['json', 'xml'].map(f => (
            <button key={f} type="button" onClick={() => setFormat(f)}
              className={`flex-1 px-4 py-3 rounded-[6px] border text-[13px] font-medium transition-all ${
                format === f ? 'border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-secondary)] hover:border-[var(--fg-muted)]'
              }`}>
              .{f.toUpperCase()}
              <div className="text-[11px] font-normal mt-0.5 opacity-60">{f === 'json' ? 'Estruturado' : 'Universal'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={handleExport} disabled={totalSelected === 0}>
          <Icon name="download" size={15} />Exportar
        </Button>
        {totalSelected > 0 && (
          <span className="text-[11px] text-[var(--fg-muted)] font-mono">
            {totalItems} registro{totalItems !== 1 ? 's' : ''} · {format.toUpperCase()}
          </span>
        )}
      </div>

    </div>
  );
}
