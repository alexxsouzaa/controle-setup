// @ts-nocheck
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../../components/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Icon } from '../../../components/Icon';
import { useMachines, useDeleteMachines, useLogAction, useConfig } from '../../../queries';
import { Machine, Config } from '../../../types';
import { MachinesDataTable } from '../components/MachinesDataTable';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  variant: string;
}

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
  const [selectionMode, setSelectionMode] = useState<boolean>(false);

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

  const toggleSelect = (id: string) => { if (!selectionMode) setSelectionMode(true); setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleSelectAll = () => {
    if (!selectionMode && !allSelected) setSelectionMode(true);
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((s: Machine) => s.id)));
  };
  const clearSelection = () => { setSelected(new Set()); setSelectionMode(false); };
  const selectedCount = selected.size;
  const allSelected = filtered.length > 0 && filtered.every((s: Machine) => selected.has(s.id));

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    if (!confirm(`Excluir ${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} selecionada${selectedCount !== 1 ? 's' : ''}?`)) return;
    deleteMachines(Array.from(selected));
    logAction({ type: 'delete', entity: 'Máquina', detail: `${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} em massa` });
    toast(`${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} com sucesso!`);
    clearSelection();
  };

  const UO_FILTERS: { id: string; label: string }[] = [{ id: '', label: 'Todas' }, ...allUos.map((u: string) => ({ id: u, label: u }))];

  return (
    <div className="p-6 pb-16">
      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mb-5">
        {([
          { label: 'Total', value: machines.length, icon: 'box', variant: 'total' },
          { label: 'Com Foto', value: machines.filter((m: Machine) => m.image).length, icon: 'upload', variant: 'updated' },
          { label: 'Com Ferramentais', value: machines.filter((m: Machine) => (m.toolingCategories?.length ?? 0) > 0).length, icon: 'wrench', variant: 'outdated' },
          { label: 'UOs', value: allUos.length, icon: 'grid-3x3', variant: 'failed' },
        ] as StatCard[]).map(s => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[6px] flex items-center justify-center shrink-0 ${
              s.variant === 'total' ? 'bg-[var(--accent-muted)] text-[var(--fg-secondary)]' :
              s.variant === 'updated' ? 'bg-[var(--success-muted)] text-[var(--success)]' :
              s.variant === 'outdated' ? 'bg-[var(--warning-muted)] text-[var(--warning)]' :
              'bg-[var(--danger-muted)] text-[var(--danger)]'
            }`}>
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
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none"><Icon name="search" size={14} /></span>
          <input className="shad-input pl-8 py-1.5 text-[12px]" placeholder="Buscar máquina ou linha..." value={search} onChange={(e) => { setSearch(e.target.value.toLowerCase()); clearSelection(); }} aria-label="Buscar máquinas" />
        </div>

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
                  <DropdownMenuItem key={f.id} onClick={() => { setUoFilter(f.id); clearSelection(); }}>
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

      <MachinesDataTable
        machines={filtered}
        selectionMode={selectionMode}
        selected={selected}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        allSelected={allSelected}
      />
    </div>
  );
}
