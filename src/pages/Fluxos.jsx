import { useState, useContext, useEffect } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { useSortable } from '../hooks/useSortable';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { EmptyState } from '../components/EmptyState';

const statusVariant = {
  'Concluído': 'success',
  'Em andamento': 'warning',
  'Pendente': 'info',
  'Cancelado': 'danger',
};

export function FluxosPage({ navigate }) {
  const { flows, deleteFlow, duplicateFlow, updateFlow, exportAll, logAction } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const { sorted, toggle, indicator, sortKey } = useSortable(flows, 'date');
  const [search, setSearch] = useState('');
  const [importedNotify, setImportedNotify] = useState(null);
  const [machineFilter, setMachineFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [drawerFlow, setDrawerFlow] = useState(null);
  const perPage = 10;

  useEffect(() => {
    const raw = sessionStorage.getItem('cs-imported-flows');
    if (raw) {
      try {
        const names = JSON.parse(raw);
        if (Array.isArray(names) && names.length > 0) setImportedNotify(names);
      } catch (e) { /* ignore */ }
      sessionStorage.removeItem('cs-imported-flows');
    }
  }, []);

  const filtered = sorted.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search) || s.product.toLowerCase().includes(search) || s.code.toLowerCase().includes(search);
    const matchMachine = !machineFilter || s.machine === machineFilter;
    return matchSearch && matchMachine;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const machineNames = [...new Set(flows.map(f => f.machine).filter(Boolean))];
  const selectedCount = selected.size;

  const toggleSelect = (id) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    if (paged.every(s => selected.has(s.id))) {
      setSelected(new Set([...selected].filter(id => !paged.some(s => s.id === id))));
    } else {
      setSelected(new Set([...selected, ...paged.map(s => s.id)]));
    }
  };
  const clearSelection = () => setSelected(new Set());

  const handleExport = (selectedOnly = false) => {
    const selectedFlows = flows.filter(f => selected.has(f.id));
    const json = selectedOnly ? JSON.stringify({ flows: selectedFlows }, null, 2) : exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = selectedOnly && selectedFlows.length === 1
      ? selectedFlows[0].name.replace(/[<>:"/\\|?*]+/g, '_')
      : `controle-setup-fluxos-${new Date().toISOString().slice(0, 10)}`;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    if (!confirm(`Excluir ${selectedCount} fluxo${selectedCount !== 1 ? 's' : ''} selecionado${selectedCount !== 1 ? 's' : ''}?`)) return;
    selected.forEach(id => deleteFlow(id));
    logAction('delete', 'Fluxo', `${selectedCount} fluxo${selectedCount !== 1 ? 's' : ''} excluído${selectedCount !== 1 ? 's' : ''} em massa`);
    toast(`${selectedCount} fluxo${selectedCount !== 1 ? 's' : ''} excluído${selectedCount !== 1 ? 's' : ''} com sucesso!`);
    clearSelection();
  };

  const allSelected = paged.length > 0 && paged.every(s => selected.has(s.id));

  const FlowDrawer = ({ flow, onClose }) => {
    const status = flow.status || 'Concluído';
    const [localStatus, setLocalStatus] = useState(status);

    const updateStatus = (newStatus) => {
      setLocalStatus(newStatus);
      updateFlow(flow.id, { status: newStatus });
      logAction('update', 'Fluxo', `Status do fluxo alterado para ${newStatus}`);
      toast(`Status alterado para ${newStatus}`);
    };

    return (
      <>
        <div className="fixed inset-0 z-40 bg-[var(--overlay)]" onClick={onClose} onKeyDown={e => e.key === 'Escape' && onClose()} />
        <div role="dialog" aria-modal="true" aria-label={`Detalhes: ${flow.name}`} style={{ width: 'min(520px, 90vw)' }}
          className="fixed top-0 right-0 bottom-0 z-50 bg-[var(--surface)] border-l border-[var(--border)] shadow-lg flex flex-col translate-x-0 transition-transform duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0"><Icon name="file" size={18} /></div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">{flow.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant={statusVariant[localStatus] || 'secondary'}>{localStatus}</Badge>
                  <select value={localStatus} onChange={e => updateStatus(e.target.value)}
                    className="text-[10px] bg-transparent border border-[var(--border)] rounded px-1 py-0.5 text-[var(--fg-secondary)] cursor-pointer hover:border-[var(--accent)] outline-none"
                    aria-label="Alterar status">
                    {['Concluído', 'Em andamento', 'Pendente', 'Cancelado'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar" className="p-1.5 rounded hover:bg-[var(--bg)] text-[var(--fg-secondary)] shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2">Informações</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  ['Máquina', flow.machine],
                  ['Produto', flow.product],
                  ['Código', flow.code],
                  ['Volumetria', flow.vol],
                  ['Data', flow.date],
                  ['Versão', flow.ver],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs text-[var(--fg-secondary)]">{label}</div>
                    <div className="font-medium truncate">{value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
            {flow.toolingCount !== undefined && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2">Ferramentais</h4>
                <div className="text-sm">{flow.toolingCount} de {flow.toolingTotal} grupos selecionados</div>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2">Histórico</h4>
              <div className="space-y-2">
                {[{ label: 'Criado', date: flow.date, detail: 'Fluxo criado' }, { label: 'Versão', date: flow.date, detail: `Versão ${flow.ver}` }].map((h, i) => (
                  <div key={i} className="flex items-start gap-3 pb-2 border-b border-[var(--border)] last:border-0">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">{h.label}</div>
                      <div className="text-xs text-[var(--fg-secondary)]">{h.detail}</div>
                    </div>
                    <div className="text-xs text-[var(--fg-muted)] shrink-0">{h.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[var(--border)] shrink-0">
            <Button variant="secondary" size="sm" onClick={() => {
              const json = JSON.stringify({ flows: [flow] }, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url;
              a.download = `${flow.name.replace(/[<>:"/\\|?*]+/g, '_')}.json`;
              a.click(); URL.revokeObjectURL(url);
            }}><Icon name="download" size={14} />Exportar</Button>
            <Button variant="ghost" size="sm" onClick={() => { duplicateFlow(flow.id); logAction('duplicate', 'Fluxo', `${flow.name} duplicado`); toast('Fluxo duplicado com sucesso!'); onClose(); }}>Duplicar</Button>
            <button type="button" onClick={() => { if (confirm('Excluir este fluxo?')) { deleteFlow(flow.id); logAction('delete', 'Fluxo', `${flow.name} excluído`); toast('Fluxo excluído com sucesso!'); onClose(); } }}
              className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--danger-muted)] text-[var(--danger)] hover:opacity-80 transition-colors">Excluir</button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Fluxos de Setup</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">{filtered.length} fluxo{filtered.length !== 1 ? 's' : ''}{search || machineFilter ? ' encontrado' + (filtered.length !== 1 ? 's' : '') : ' cadastrado' + (filtered.length !== 1 ? 's' : '')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleExport(false)}><Icon name="download" size={16} />Exportar</Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/novo-setup')}><Icon name="plus" size={16} />Novo Fluxo</Button>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="relative max-w-sm flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)] pointer-events-none"><Icon name="search" size={16} /></span>
          <input className="shad-input pl-9" placeholder="Buscar..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); clearSelection(); }} aria-label="Buscar fluxos" />
        </div>
        <select className="shad-select" value={machineFilter} onChange={e => { setMachineFilter(e.target.value); setPage(1); clearSelection(); }} aria-label="Filtrar por máquina">
          <option value="">Todas as máquinas</option>
          {machineNames.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {importedNotify && (
        <div className="flex items-start gap-3 mb-4 px-4 py-3 bg-[var(--success-muted)] border border-[var(--success)] rounded-lg">
          <Icon name="check-circle" size={20} className="text-[var(--success)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--success)]">{importedNotify.length} fluxo{importedNotify.length !== 1 ? 's' : ''} importado{importedNotify.length !== 1 ? 's' : ''}:</p>
            <ul className="text-xs text-[var(--fg)] mt-1 space-y-0.5">
              {importedNotify.map((name, i) => (<li key={i} className="truncate">{name}</li>))}
            </ul>
          </div>
          <button type="button" onClick={() => setImportedNotify(null)} aria-label="Fechar" className="text-[var(--fg-muted)] hover:text-[var(--fg)] shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-[var(--accent-light)] border border-[var(--accent)] rounded-lg">
          <span className="text-sm font-medium text-[var(--accent)]">{selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}</span>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={() => handleExport(true)} className="text-xs px-3 py-1.5 rounded bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"><Icon name="download" size={14} /> Exportar selecionados</button>
            <button type="button" onClick={handleBulkDelete} className="text-xs px-3 py-1.5 rounded bg-[var(--danger)] text-white hover:opacity-90 transition-colors"><Icon name="alert" size={14} /> Excluir selecionados</button>
            <button type="button" onClick={clearSelection} className="text-xs px-2 py-1.5 rounded text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">Limpar</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={<Icon name="file" size={24} />} title="Nenhum fluxo encontrado" desc="Tente ajustar sua busca ou crie um novo fluxo."
          action={<Button variant="primary" size="sm" onClick={() => navigate('/novo-setup')}><Icon name="plus" size={16} />Novo Fluxo</Button>} />
      ) : (
        <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg)]">
                <th className="w-10 px-4 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" className="accent-[var(--accent)] cursor-pointer" /></th>
                {['Nome', 'Máquina', 'Produto', 'Código', 'Volumetria', 'Data', 'Versão', 'Ações'].map(h => {
                  const keys = { Nome: 'name', Máquina: 'machine', Produto: 'product', Código: 'code', Volumetria: 'vol', Data: 'date', Versão: 'ver' };
                  const k = keys[h];
                  return (
                    <th key={h} onClick={k ? () => toggle(k) : undefined} className={`text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider ${k ? 'cursor-pointer hover:text-[var(--fg)] select-none' : ''}`}>
                      {h}{k ? indicator(k) : ''}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paged.map(s => {
                const isSelected = selected.has(s.id);
                return (
                  <tr key={s.id} className={`border-t border-[var(--border)] hover:bg-[var(--bg)] transition-colors ${isSelected ? 'bg-[var(--accent-light)]' : ''}`}>
                    <td className="px-4 py-2.5"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(s.id)} aria-label={`Selecionar ${s.name}`} className="accent-[var(--accent)] cursor-pointer" /></td>
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => setDrawerFlow(s)} className="font-medium text-left hover:text-[var(--accent)] transition-colors">{s.name}</button>
                    </td>
                    <td className="px-4 py-2.5">{s.machine}</td>
                    <td className="px-4 py-2.5">{s.product}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-[var(--fg-secondary)]">{s.code}</td>
                    <td className="px-4 py-2.5">{s.vol}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--fg-secondary)]">{s.date}</td>
                    <td className="px-4 py-2.5"><Badge>{s.ver}</Badge></td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setDrawerFlow(s)} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--accent)] transition-colors">Detalhes</button>
                            <button type="button" onClick={() => { duplicateFlow(s.id); logAction('duplicate', 'Fluxo', `${s.name} duplicado`); toast('Fluxo duplicado com sucesso!'); }} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--accent)] transition-colors">Duplicar</button>
                        <button type="button" onClick={() => { if (confirm('Excluir este fluxo?')) { deleteFlow(s.id); logAction('delete', 'Fluxo', `${s.name} excluído`); toast('Fluxo excluído com sucesso!'); } }} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--danger)] transition-colors">Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4" role="navigation" aria-label="Navegação de páginas">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`w-8 h-8 rounded text-xs ${page === 1 ? 'text-[var(--fg-muted)] opacity-40' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)]'}`} aria-label="Anterior">‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button type="button" key={p} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined}
              className={`w-8 h-8 rounded text-xs ${p === page ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)]'}`}>{p}</button>
          ))}
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`w-8 h-8 rounded text-xs ${page === totalPages ? 'text-[var(--fg-muted)] opacity-40' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)]'}`} aria-label="Próxima">›</button>
        </div>
      )}

      {drawerFlow && <FlowDrawer flow={drawerFlow} onClose={() => setDrawerFlow(null)} />}
    </div>
  );
}
