import { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from '../../../contexts/ToastContext';
import { useSortable } from '../../../hooks/useSortable';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { Icon } from '../../../components/Icon';
import { printPDF } from '../../import-export/pages/pdf';
import type { PDFBlock } from '../../import-export/pages/pdf';
import { useDialogAccessibility } from '../../../components/shared/useDialogAccessibility';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { Flow } from '../../../types';
import { useFlows, useUpdateFlow, useDeleteFlow, useDeleteFlows, useDuplicateFlow, useLogAction, useExport } from '../../../queries';

const statusVariant: Record<string, string> = {
  'Concluído': 'success',
  'Em andamento': 'warning',
  'Pendente': 'info',
  'Cancelado': 'danger',
};

const STATUSES = ['Concluído', 'Em andamento', 'Pendente', 'Cancelado'];

interface FlowDrawerProps {
  flow: Flow;
  onClose: () => void;
  updateFlow: (variables: { id: string; updates: Partial<Flow> }) => void;
  deleteFlow: (id: string) => void;
  duplicateFlow: (id: string) => void;
  logAction: (variables: { type: string; entity: string; detail: string }) => void;
  toast: (msg: string, type?: string) => void;
  handleExportPDF: (flow: Flow) => void;
}

function FlowDrawer({ flow, onClose, updateFlow, deleteFlow, duplicateFlow, logAction, toast, handleExportPDF }: FlowDrawerProps) {
  const navigate = useNavigate();
  const drawerRef = useDialogAccessibility(true, onClose);
  const status = flow.status || 'Concluído';
  const [localStatus, setLocalStatus] = useState<string>(status);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateStatus = (newStatus: string) => {
    setLocalStatus(newStatus);
    updateFlow({ id: flow.id, updates: { status: newStatus } });
    logAction({ type: 'update', entity: 'Fluxo', detail: `Status do fluxo alterado para ${newStatus}` });
    toast(`Status alterado para ${newStatus}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[var(--overlay)]" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`Detalhes: ${flow.name}`} ref={drawerRef} tabIndex={-1} style={{ width: 'min(520px, 90vw)' }}
        className="fixed top-0 right-0 bottom-0 z-50 bg-[var(--surface)] border-l border-[var(--border)] shadow-lg flex flex-col outline-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)] shrink-0"><Icon name="file" size={18} /></div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{flow.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant={(statusVariant[localStatus] || 'secondary') as 'success' | 'warning' | 'info' | 'danger' | 'secondary'}>{localStatus}</Badge>
                <select value={localStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateStatus(e.target.value)}
                  className="text-[10px] bg-transparent border border-[var(--border)] rounded px-1 py-0.5 text-[var(--fg-secondary)] cursor-pointer hover:border-[var(--fg-muted)] outline-none"
                  aria-label="Alterar status">
                  {STATUSES.map((s: string) => (<option key={s} value={s}>{s}</option>))}
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
              {[['Máquina', flow.machine], ['Produto', flow.product], ['Código', flow.code],
                ['Volumetria', flow.vol], ['Data', flow.date], ['Versão', flow.ver],
              ].map(([label, value]) => (
                <div key={label}><div className="text-xs text-[var(--fg-secondary)]">{label}</div><div className="font-medium truncate">{value || '—'}</div></div>
              ))}
            </div>
          </div>
          {flow.tooling && flow.tooling.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2">Peças Selecionadas ({flow.tooling.length})</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {flow.tooling.map((t: Record<string, unknown>, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                    {t.image ? (
                      <img src={t.image as string} alt={t.pieceName as string} className="w-7 h-7 rounded object-cover border border-[var(--border)] shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)] shrink-0"><Icon name="box" size={12} /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{t.pieceName as string}</div>
                      <div className="text-[10px] text-[var(--fg-muted)]">{t.group as string} · {t.pieceCode as string}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : flow.toolingCount !== undefined ? (
            <div><h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2">Ferramentais</h4><div className="text-sm">{flow.toolingCount} de {flow.toolingTotal} grupos selecionados</div></div>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[var(--border)] shrink-0">
          <Button variant="primary" size="sm" onClick={() => {
            sessionStorage.setItem('cs-edit-flow', JSON.stringify(flow));
            navigate('/novo-fluxo');
            onClose();
          }}><Icon name="edit" size={14} />Editar</Button>
          <Button variant="secondary" size="sm" onClick={() => {
            const json = JSON.stringify({ flows: [flow] }, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            a.download = `${flow.name.replace(/[<>:"/\\|?*]+/g, '_')}.json`;
            a.click(); URL.revokeObjectURL(url);
          }}><Icon name="download" size={14} />Exportar</Button>
          <button type="button" onClick={() => { handleExportPDF(flow); }} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--bg)] transition-colors">PDF</button>
          <Button variant="ghost" size="sm" onClick={() => { duplicateFlow(flow.id); logAction({ type: 'duplicate', entity: 'Fluxo', detail: `${flow.name} duplicado` }); toast('Fluxo duplicado com sucesso!'); onClose(); }}>Duplicar</Button>
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--danger-muted)] text-[var(--danger)] hover:opacity-80 transition-colors">Excluir</button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Excluir ${flow.name}?`}
        description="Esta ação não pode ser desfeita."
        onConfirm={() => {
          deleteFlow(flow.id);
          logAction({ type: 'delete', entity: 'Fluxo', detail: `${flow.name} excluído` });
          toast('Fluxo excluído com sucesso!');
          onClose();
        }}
      />
    </>
  );
}

export function FluxosPage() {
  const navigate = useNavigate();
  const { data: flows = [] } = useFlows();
  const { mutate: updateFlow } = useUpdateFlow();
  const { mutate: deleteFlow } = useDeleteFlow();
  const { mutate: deleteFlows } = useDeleteFlows();
  const { mutate: duplicateFlow } = useDuplicateFlow();
  const { mutate: logAction } = useLogAction();
  const exportAll = useExport();
  const { toast } = useContext(ToastContext) as { toast: (msg: string, type?: string) => void };
  const { sorted } = useSortable(flows as unknown as Record<string, string>[], 'date');
  const [search, setSearch] = useState<string>('');
  const [importedNotify, setImportedNotify] = useState<string[] | null>(null);
  const [machineFilter, setMachineFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [drawerFlow, setDrawerFlow] = useState<Flow | null>(null);
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

  const filtered = sorted.filter((s: Record<string, unknown>) => {
    const matchSearch = !search || (s.name as string).toLowerCase().includes(search) || (s.product as string).toLowerCase().includes(search) || (s.code as string).toLowerCase().includes(search);
    const matchMachine = !machineFilter || s.machine === machineFilter;
    return matchSearch && matchMachine;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const machineNames = [...new Set(flows.map((f: Flow) => f.machine).filter(Boolean))];
  const selectedCount = selected.size;

  const toggleSelect = (id: string) => {
    if (!selectionMode) setSelectionMode(true);
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    if (!selectionMode && !allSelected) setSelectionMode(true);
    if (paged.every((s: Record<string, unknown>) => selected.has(s.id as string))) {
      setSelected(new Set([...selected].filter(id => !paged.some((s: Record<string, unknown>) => s.id === id))));
    } else {
      setSelected(new Set([...selected, ...paged.map((s: Record<string, unknown>) => s.id as string)]));
    }
  };
  const clearSelection = () => { setSelected(new Set()); setSelectionMode(false); };

  const handleExport = (selectedOnly = false) => {
    const selectedFlows = flows.filter((f: Flow) => selected.has(f.id));
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
    setConfirmBulkDelete(true);
  };

  const handleExportPDF = (flow: Flow) => {
    const fields: PDFBlock[] = [
      { type: 'field', label: 'Máquina', value: flow.machine },
      { type: 'field', label: 'Produto', value: flow.product },
      { type: 'field', label: 'Código', value: flow.code },
      { type: 'field', label: 'Volumetria', value: flow.vol },
      { type: 'field', label: 'Versão', value: flow.ver },
      { type: 'field', label: 'Data', value: flow.date },
      { type: 'field', label: 'Status', value: flow.status || 'Concluído' },
    ];
    if (flow.toolingCount !== undefined) {
      fields.push({ type: 'field', label: 'Ferramentais', value: `${flow.toolingCount} de ${flow.toolingTotal} grupos` });
    }
    const blocks: PDFBlock[] = [
      { type: 'grid-start', title: 'Informações do Fluxo' },
      ...fields,
      { type: 'grid-end' },
    ];
    if (flow.tooling && flow.tooling.length > 0) {
      blocks.push({
        type: 'table',
        title: `Peças Selecionadas (${flow.tooling.length})`,
        headers: ['#', 'Grupo', 'Peça', 'Código'],
        rows: flow.tooling.map((t: Record<string, unknown>, i: number) => [i + 1, t.group, t.pieceName, t.pieceCode] as (string | number)[]),
      });
    }
    printPDF(flow.name, blocks, toast);
  };

  const allSelected = paged.length > 0 && paged.every((s: Record<string, unknown>) => selected.has(s.id as string));

  const drawerActions = useMemo(() => ({ updateFlow, deleteFlow, duplicateFlow, logAction, toast, navigate, handleExportPDF }), [updateFlow, deleteFlow, duplicateFlow, logAction, toast, navigate, handleExportPDF]);

  return (
    <div className="p-6 pb-16">
      <div className="grid lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Fluxos', value: flows.length, icon: 'file' },
          { label: 'Máquinas', value: [...new Set(flows.map((f: Flow) => f.machine).filter(Boolean))].length, icon: 'box' },
          { label: 'Setups Hoje', value: flows.filter((f: Flow) => f.date === new Date().toISOString().slice(0, 10)).length, icon: 'clock' },
          { label: 'Versões', value: [...new Set(flows.map((f: Flow) => f.ver).filter(Boolean))].length, icon: 'grid-3x3' },
        ].map((s, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[var(--accent-muted)] text-[var(--fg-secondary)] flex items-center justify-center shrink-0">
              <Icon name={s.icon} size={20} />
            </div>
            <div>
              <div className="text-[24px] font-bold font-mono tracking-[-0.02em] text-[var(--fg)] leading-none">{s.value}</div>
              <div className="text-[12px] text-[var(--fg-secondary)] mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none"><Icon name="search" size={14} /></span>
          <input className="shad-input pl-8 py-1.5 text-[12px]" placeholder="Buscar fluxo..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); clearSelection(); }} aria-label="Buscar fluxos" />
        </div>
        <div className="flex items-center gap-1.5 flex-1 flex-wrap">
          {machineNames.map((m: string) => (
            <button key={m} onClick={() => { setMachineFilter(machineFilter === m ? '' : m); setPage(1); clearSelection(); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium border transition-all ${
                machineFilter === m ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-muted)]" />
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => { if (selectionMode) clearSelection(); else setSelectionMode(true); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium border transition-all ${
              selectionMode ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {selectionMode ? 'Sair' : 'Selecionar'}
          </button>
          <Button variant="primary" size="sm" onClick={() => navigate('/novo-fluxo')}><Icon name="plus" size={14} />Novo Fluxo</Button>
        </div>
      </div>

      {selectionMode && selectedCount > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-[6px] border border-[var(--fg-muted)] bg-[var(--accent-muted)]">
          <span className="text-[12px] font-medium text-[var(--fg)]">{selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}</span>
          <button type="button" onClick={handleBulkDelete} className="ml-auto text-[11px] font-medium text-[var(--danger)] hover:underline">Excluir selecionados</button>
          <button type="button" onClick={clearSelection} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]">Cancelar</button>
        </div>
      )}

      {importedNotify && (
        <div className="flex items-start gap-3 mb-4 px-4 py-3 bg-[var(--success-muted)] border border-[var(--success)] rounded-lg">
          <Icon name="check-circle" size={18} className="text-[var(--success)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[var(--success)]">{importedNotify.length} fluxo{importedNotify.length !== 1 ? 's' : ''} importado{importedNotify.length !== 1 ? 's' : ''}:</p>
            <ul className="text-[12px] text-[var(--fg)] mt-1 space-y-0.5">
              {importedNotify.map((name: string, i: number) => (<li key={i} className="truncate">{name}</li>))}
            </ul>
          </div>
          <button type="button" onClick={() => setImportedNotify(null)} aria-label="Fechar" className="text-[var(--fg-muted)] hover:text-[var(--fg)] shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--fg-muted)]"><Icon name="file" size={24} /></div>
          <p className="text-[15px] font-medium text-[var(--fg)] mb-1">{flows.length === 0 ? 'Nenhum fluxo cadastrado' : 'Nenhum fluxo encontrado'}</p>
          <p className="text-[12px] text-[var(--fg-secondary)] mb-4">{flows.length === 0 ? 'Crie o primeiro fluxo de setup.' : 'Tente ajustar a busca.'}</p>
          {flows.length === 0 && <Button variant="primary" size="sm" onClick={() => navigate('/novo-fluxo')}><Icon name="plus" size={14} />Novo Fluxo</Button>}
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] overflow-hidden">
          <table className="w-full text-[13px] border-collapse">
            <thead className="bg-[var(--bg-secondary)]">
              <tr className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
                <th className={`w-8 px-3.5 py-2.5 border-b border-[var(--border)] ${selectionMode ? '' : 'hidden'}`}><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" className="accent-[var(--fg)] cursor-pointer" /></th>
                <th className="text-left px-4 py-2.5 border-b border-[var(--border)]">Fluxo</th>
                <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] hidden md:table-cell">Máquina</th>
                <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] hidden lg:table-cell">Status</th>
                <th className="text-right px-3.5 py-2.5 border-b border-[var(--border)] w-24 hidden sm:table-cell">Data</th>
                <th className="w-20 px-3.5 py-2.5 border-b border-[var(--border)] text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s: Record<string, unknown>, idx: number) => {
                const last = idx === paged.length - 1;
                return (
                <tr key={s.id as string} className={`hover:bg-[var(--surface-hover)] transition-colors ${selected.has(s.id as string) ? 'bg-[var(--accent-muted)]' : ''}`} onClick={() => selectionMode && toggleSelect(s.id as string)} style={{ cursor: selectionMode ? 'pointer' : undefined }}>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} ${selectionMode ? '' : 'hidden'}`}>
                    <input type="checkbox" checked={selected.has(s.id as string)} onChange={() => toggleSelect(s.id as string)} aria-label={`Selecionar ${s.name as string}`} className="accent-[var(--fg)] cursor-pointer" />
                  </td>
                  <td className={`px-4 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''}`}>
                    <button type="button" onClick={() => setDrawerFlow(s as unknown as Flow)} className="text-left w-full">
                      <div className="font-medium text-[var(--fg)] truncate max-w-[360px]">{s.name as string}</div>
                      <div className="text-[12px] font-mono text-[var(--fg-muted)]">{s.product as string} · {s.code as string}</div>
                    </button>
                  </td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden md:table-cell text-[var(--fg-secondary)]`}>{s.machine as string}</td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden lg:table-cell`}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium font-mono ${
                      s.status === 'Concluído' ? 'bg-[var(--success-muted)] text-[var(--success)]' : s.status === 'Em andamento' ? 'bg-[var(--warning-muted)] text-[var(--warning)]' : s.status === 'Cancelado' ? 'bg-[var(--danger-muted)] text-[var(--danger)]' : 'bg-[var(--accent-muted)] text-[var(--fg-secondary)]'
                    }`}>{s.status as string || '—'}</span>
                  </td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} text-[12px] font-mono text-[var(--fg-muted)] text-right hidden sm:table-cell`}>{s.date as string}</td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} text-right`}>
                    <div className="flex items-center justify-end gap-0.5">
                      <button type="button" onClick={() => setDrawerFlow(s as unknown as Flow)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Detalhes">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button type="button" onClick={() => { sessionStorage.setItem('cs-edit-flow', JSON.stringify(s)); navigate('/novo-fluxo'); }} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
              <span className="text-[12px] text-[var(--fg-muted)]">Mostrando {1 + (page - 1) * perPage}–{Math.min(page * perPage, filtered.length)} de {filtered.length}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[13px] font-medium border border-[var(--border)] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] text-[var(--fg-secondary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const pg = start + i;
                  if (pg > totalPages) return null;
                  return (
                    <button key={pg} type="button" onClick={() => setPage(pg)}
                      className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-[13px] font-medium border transition-all ${
                        pg === page ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'border-[var(--border)] text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                      }`}>{pg}</button>
                  );
                })}
                <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[13px] font-medium border border-[var(--border)] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] text-[var(--fg-secondary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {drawerFlow && <FlowDrawer flow={drawerFlow} onClose={() => setDrawerFlow(null)} {...drawerActions} />}
      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Excluir ${selectedCount} fluxo${selectedCount !== 1 ? 's' : ''} selecionado${selectedCount !== 1 ? 's' : ''}?`}
        description="Esta ação não pode ser desfeita."
        onConfirm={() => {
          const ids = Array.from(selected);
          clearSelection();
          deleteFlows(ids);
          logAction({ type: 'delete', entity: 'Fluxo', detail: `${ids.length} fluxo${ids.length !== 1 ? 's' : ''} excluído${ids.length !== 1 ? 's' : ''} em massa` });
          toast(`${ids.length} fluxo${ids.length !== 1 ? 's' : ''} excluído${ids.length !== 1 ? 's' : ''} com sucesso!`);
        }}
      />
    </div>
  );
}
