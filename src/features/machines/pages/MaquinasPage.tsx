import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../../components/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Icon } from '../../../components/Icon';
import { useMachines, useDeleteMachine, useDeleteMachines, useLogAction, useConfig } from '../../../queries';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { SearchInput } from '../../../components/shared/SearchInput';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Pagination } from '../../../components/shared/Pagination';
import { Machine, Config } from '../../../types';

interface StatCard {
  label: string;
  value: number;
  icon: string;
}

const getLines = (m: Machine) => m.lines || (m.line ? [m.line] : []);

export function MaquinasPage() {
  const navigate = useNavigate();
  const { data: machines = [] } = useMachines();
  const { mutate: deleteMachines } = useDeleteMachines();
  const { mutate: logAction } = useLogAction();
  const { data: config = {} as Config } = useConfig();
  const { toast } = useToast();
  const [search, setSearch] = useState<string>('');
  const [uoFilter, setUoFilter] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const perPage = 10;

  const allUos = useMemo(() => {
    const uos = new Set<string>();
    machines.forEach((m: Machine) => { if (m.uo) uos.add(m.uo); });
    if (config?.uoConfigs) Object.keys(config.uoConfigs).forEach(u => uos.add(u));
    return [...uos].sort();
  }, [machines, config]);

  const filtered = machines.filter((m: Machine) =>
    (!search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.lines || (m.line ? [m.line] : [])).some((l: string) => l.toLowerCase().includes(search.toLowerCase()))) &&
    (!uoFilter || m.uo === uoFilter)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => { if (!selectionMode) setSelectionMode(true); setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleSelectAll = () => {
    if (!selectionMode && !allSelected) setSelectionMode(true);
    if (paged.every((s: Machine) => selected.has(s.id))) setSelected(new Set([...selected].filter(id => !paged.some((s: Machine) => s.id === id))));
    else setSelected(new Set([...selected, ...paged.map((s: Machine) => s.id)]));
  };
  const clearSelection = () => { setSelected(new Set()); setSelectionMode(false); };
  const selectedCount = selected.size;
  const allSelected = paged.length > 0 && paged.every((s: Machine) => selected.has(s.id));

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    setConfirmBulkDelete(true);
  };

  const UO_FILTERS: { id: string; label: string }[] = [{ id: '', label: 'Todas' }, ...allUos.map((u: string) => ({ id: u, label: u }))];

  return (
    <div className="p-6 pb-16">
      <PageHeader title="Máquinas" description="Gerencie as máquinas, UOs e ferramentais de produção." />
      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mb-5">
        {([
          { label: 'Total', value: machines.length, icon: 'box' },
          { label: 'Com Foto', value: machines.filter((m: Machine) => m.image).length, icon: 'upload' },
          { label: 'Com Ferramentais', value: machines.filter((m: Machine) => (m.toolingCategories?.length ?? 0) > 0).length, icon: 'wrench' },
          { label: 'UOs', value: allUos.length, icon: 'grid-3x3' },
        ] as StatCard[]).map(s => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-4 flex items-center gap-3">
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

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput className="flex-1 max-w-xs" placeholder="Buscar máquina ou linha..." value={search} onChange={(e) => { setSearch(e.target.value.toLowerCase()); setPage(1); clearSelection(); }} aria-label="Buscar máquinas" />

        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="shad-select py-1.5 text-[12px] max-w-[180px] flex items-center gap-2 text-left">
                <span className="flex-1">{UO_FILTERS.find(f => f.id === uoFilter)?.label || 'Todas'}</span>
                <ChevronDown className="size-3.5 shrink-0" />
              </button>
            } />
            <DropdownMenuContent className="w-48">
              <DropdownMenuGroup>
                {UO_FILTERS.map(f => (
                  <DropdownMenuItem key={f.id} onClick={() => { setUoFilter(f.id); setPage(1); clearSelection(); }}>
                    {f.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => { if (selectionMode) clearSelection(); else setSelectionMode(true); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium border transition-all ${
              selectionMode ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {selectionMode ? 'Sair' : 'Selecionar'}
          </button>
          <Button variant="primary" size="sm" onClick={() => navigate('/maquinas/new')}><Icon name="plus" size={14} />Nova Máquina</Button>
        </div>
      </div>

      {selectionMode && selectedCount > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-[6px] border border-[var(--fg-muted)] bg-[var(--accent-muted)]">
          <span className="text-[12px] font-medium text-[var(--fg)]">{selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}</span>
          <button type="button" onClick={handleBulkDelete} className="ml-auto text-[11px] font-medium text-[var(--danger)] hover:underline">Excluir selecionadas</button>
          <button type="button" onClick={clearSelection} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]">Cancelar</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--fg-muted)]"><Icon name="box" size={24} /></div>
          <p className="text-[15px] font-medium text-[var(--fg)] mb-1">{machines.length === 0 ? 'Nenhuma máquina cadastrada' : 'Nenhuma máquina encontrada'}</p>
          <p className="text-[12px] text-[var(--fg-secondary)] mb-4">{machines.length === 0 ? 'Cadastre a primeira máquina para começar.' : 'Tente ajustar o filtro ou busca.'}</p>
          {machines.length === 0 && <Button variant="primary" size="sm" onClick={() => navigate('/maquinas/new')}><Icon name="plus" size={14} />Nova Máquina</Button>}
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] overflow-hidden overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead className="bg-[var(--bg-secondary)]">
              <tr className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
                <th className={`w-8 px-3.5 py-2.5 border-b border-[var(--border)] ${selectionMode ? '' : 'hidden'}`}><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" className="accent-[var(--fg)] cursor-pointer" /></th>
                <th className="text-left px-4 py-2.5 border-b border-[var(--border)]">Máquina</th>
                <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] hidden md:table-cell">Linha</th>
                <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] hidden sm:table-cell">UO</th>
                <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] hidden lg:table-cell">Criado em</th>
                <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] hidden xl:table-cell">Criado por</th>
                <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] hidden md:table-cell">Status</th>
                <th className="w-20 px-3.5 py-2.5 border-b border-[var(--border)] text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((m: Machine, idx: number) => {
                const last = idx === paged.length - 1;
                return (
                <tr key={m.id} className={`hover:bg-[var(--surface-hover)] transition-colors ${selected.has(m.id) ? 'bg-[var(--accent-muted)]' : ''}`} onClick={() => selectionMode && toggleSelect(m.id)} style={{ cursor: selectionMode ? 'pointer' : undefined }}>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} ${selectionMode ? '' : 'hidden'}`}>
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} aria-label={`Selecionar ${m.name}`} className="accent-[var(--fg)] cursor-pointer" />
                  </td>
                  <td className={`px-4 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''}`}>
                    <button type="button" onClick={() => navigate('/maquinas/' + m.id)} className="text-left w-full">
                      <div className="flex items-center gap-2">
                        {m.image ? (
                          <img src={m.image} alt={m.name} className="w-7 h-7 rounded-[4px] object-cover border border-[var(--border)] shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
                            <Icon name="box" size={14} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--fg)] truncate">{m.name}</div>
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden md:table-cell`}>
                    <div className="flex flex-wrap gap-1">
                      {getLines(m).map((l: string) => <span key={l} className="text-[12px] font-mono text-[var(--fg-muted)]">{l}</span>)}
                      {getLines(m).length === 0 && <span className="text-[12px] text-[var(--fg-muted)]">—</span>}
                    </div>
                  </td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden sm:table-cell`}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{m.uo}</span>
                  </td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden lg:table-cell text-[12px] font-mono text-[var(--fg-muted)]`}>{m.createdAt}</td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden xl:table-cell text-[12px] text-[var(--fg-muted)]`}>{m.createdBy || '—'}</td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden md:table-cell`}>
                    {(() => {
                      if (!m.updatedAt) return <span className="text-[12px] text-[var(--fg-muted)]">—</span>;
                      const days = Math.floor((Date.now() - new Date(m.updatedAt).getTime()) / 86400000);
                      if (days <= 30) return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--success-muted)] text-[var(--success)]">Ativo</span>;
                      if (days <= 90) return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--warning-muted)] text-[var(--warning)]">Inativo</span>;
                      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--danger-muted)] text-[var(--danger)]">Parado</span>;
                    })()}
                  </td>
                  <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} text-right`}>
                    <div className="flex items-center justify-end gap-0.5">
                      <button type="button" onClick={() => navigate('/maquinas/' + m.id)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Detalhes">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button type="button" onClick={() => navigate('/maquinas/' + m.id + '/edit')} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Editar">
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
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={filtered.length} perPage={perPage} />
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Excluir ${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} selecionada${selectedCount !== 1 ? 's' : ''}?`}
        description="Esta ação não pode ser desfeita."
        onConfirm={() => {
          deleteMachines(Array.from(selected));
          logAction({ type: 'delete', entity: 'Máquina', detail: `${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} em massa` });
          toast(`${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} com sucesso!`);
          clearSelection();
        }}
      />
    </div>
  );
}
