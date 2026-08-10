import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { useLines, useUnits, useDeleteLine, useLogAction } from '../../../queries';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { SearchInput } from '../../../components/shared/SearchInput';
import { PageHeader } from '../../../components/shared/PageHeader';
import { DataTable } from '../../../components/shared/DataTable';
import { Line } from '../../../types';

export function LinesPage() {
  const navigate = useNavigate();
  const { data: lines = [] } = useLines();
  const { data: units = [] } = useUnits();
  const { mutate: deleteLine } = useDeleteLine();
  const { mutate: logAction } = useLogAction();
  const { toast } = useToast();
  const [search, setSearch] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<Line | null>(null);
  const [page, setPage] = useState<number>(1);
  const perPage = 10;

  const unitName = useMemo(() => {
    const map = new Map(units.map((u) => [u.id, u.name]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [units]);

  const filtered = lines.filter((l: Line) =>
    (!search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.code ?? '').toLowerCase().includes(search.toLowerCase())) &&
    (!unitFilter || l.unitId === unitFilter)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = (l: Line) => {
    deleteLine(l.id);
    logAction({ type: 'delete', entity: 'Linha', detail: `${l.name} excluída` });
    toast('Linha excluída com sucesso!');
    setConfirmDelete(null);
  };

  return (
    <div className="p-6 pb-16">
      <PageHeader
        title="Linhas"
        description="Linhas de produção vinculadas a uma UO."
        actions={<Button variant="primary" size="sm" onClick={() => navigate('/linhas/new')}><Icon name="plus" size={14} />Nova Linha</Button>}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput className="flex-1 max-w-xs" placeholder="Buscar por nome ou código..." value={search} onChange={(e) => { setSearch(e.target.value.toLowerCase()); setPage(1); }} aria-label="Buscar linhas" />
        <select className="shad-select py-1.5 text-[12px] max-w-[200px]" value={unitFilter} onChange={(e) => { setUnitFilter(e.target.value); setPage(1); }} aria-label="Filtrar por UO">
          <option value="">Todas as UOs</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--fg-muted)]"><Icon name="box" size={24} /></div>
          <p className="text-[15px] font-medium text-[var(--fg)] mb-1">{lines.length === 0 ? 'Nenhuma linha cadastrada' : 'Nenhuma linha encontrada'}</p>
          <p className="text-[12px] text-[var(--fg-secondary)] mb-4">{lines.length === 0 ? 'Cadastre a primeira linha de produção.' : 'Tente ajustar o filtro ou busca.'}</p>
          {lines.length === 0 && <Button variant="primary" size="sm" onClick={() => navigate('/linhas/new')}><Icon name="plus" size={14} />Nova Linha</Button>}
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'Linha', first: true, render: (l: Line) => (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
                  <Icon name="box" size={14} />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[var(--fg)]">{l.name}</div>
                  {l.code && <div className="text-[11px] font-mono text-[var(--fg-muted)]">{l.code}</div>}
                </div>
              </div>
            ) },
            { key: 'unit', header: 'UO', render: (l: Line) => <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{unitName(l.unitId) || '—'}</span> },
            { key: 'machines', header: 'Máquinas', headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell text-[12px] text-[var(--fg-muted)]', render: (l: Line) => `${l.machineIds?.length ?? 0}` },
            { key: 'status', header: 'Status', render: (l: Line) => l.status === 'active'
              ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--success-muted)] text-[var(--success)]">Ativa</span>
              : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--danger-muted)] text-[var(--danger)]">Inativa</span> },
            { key: 'createdAt', header: 'Criado em', headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell text-[12px] font-mono text-[var(--fg-muted)]', render: (l: Line) => l.createdAt },
            { key: 'actions', header: '', headerClassName: 'w-20 text-right', cellClassName: 'text-right', render: (l: Line) => (
              <div className="flex items-center justify-end gap-0.5">
                <button type="button" onClick={() => navigate('/linhas/' + l.id + '/edit')} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button type="button" onClick={() => setConfirmDelete(l)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] text-[var(--fg-secondary)] hover:text-[var(--danger)] transition-colors" aria-label="Excluir">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ) },
          ]}
          rows={paged}
          rowKey={(l: Line) => l.id}
          selectionMode={false}
          selected={new Set()}
          allSelected={false}
          onToggleSelect={() => undefined}
          onToggleSelectAll={() => undefined}
          pagination={{ page, totalPages, onPageChange: setPage, total: filtered.length, perPage }}
        />
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title={`Excluir a linha "${confirmDelete?.name}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}
