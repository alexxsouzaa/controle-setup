import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { useUnits, useDeleteUnit, useLogAction } from '../../../queries';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { SearchInput } from '../../../components/shared/SearchInput';
import { PageHeader } from '../../../components/shared/PageHeader';
import { DataTable } from '../../../components/shared/DataTable';
import { Unit } from '../../../types';

export function UnitsPage() {
  const navigate = useNavigate();
  const { data: units = [] } = useUnits();
  const { mutate: deleteUnit } = useDeleteUnit();
  const { mutate: logAction } = useLogAction();
  const { toast } = useToast();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<Unit | null>(null);
  const [page, setPage] = useState<number>(1);
  const perPage = 10;

  const filtered = units.filter((u: Unit) =>
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.code.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || u.status === statusFilter)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const activeCount = useMemo(() => units.filter((u: Unit) => u.status === 'active').length, [units]);

  const handleDelete = (u: Unit) => {
    deleteUnit(u.id);
    logAction({ type: 'delete', entity: 'UO', detail: `${u.name} (${u.code}) excluída` });
    toast('UO excluída com sucesso!');
    setConfirmDelete(null);
  };

  return (
    <div className="p-6 pb-16">
      <PageHeader
        title="Unidades Organizacionais"
        description="Gerencie as UOs, linhas e o escopo dos recursos de cada unidade."
        actions={<Button variant="primary" size="sm" onClick={() => navigate('/unidades/new')}><Icon name="plus" size={14} />Nova UO</Button>}
      />
      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mb-5">
        {([
          { label: 'Total', value: units.length, icon: 'grid-3x3' },
          { label: 'Ativas', value: activeCount, icon: 'check-circle' },
        ] as { label: string; value: number; icon: string }[]).map(s => (
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
        <SearchInput className="flex-1 max-w-xs" placeholder="Buscar por nome ou código..." value={search} onChange={(e) => { setSearch(e.target.value.toLowerCase()); setPage(1); }} aria-label="Buscar UOs" />
        <select className="shad-select py-1.5 text-[12px] max-w-[160px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="inactive">Inativas</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--fg-muted)]"><Icon name="grid-3x3" size={24} /></div>
          <p className="text-[15px] font-medium text-[var(--fg)] mb-1">{units.length === 0 ? 'Nenhuma UO cadastrada' : 'Nenhuma UO encontrada'}</p>
          <p className="text-[12px] text-[var(--fg-secondary)] mb-4">{units.length === 0 ? 'Cadastre a primeira unidade organizacional para começar.' : 'Tente ajustar o filtro ou busca.'}</p>
          {units.length === 0 && <Button variant="primary" size="sm" onClick={() => navigate('/unidades/new')}><Icon name="plus" size={14} />Nova UO</Button>}
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'UO', first: true, render: (u: Unit) => (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
                  <Icon name="grid-3x3" size={14} />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[var(--fg)]">{u.name}</div>
                </div>
              </div>
            ) },
            { key: 'code', header: 'Código', render: (u: Unit) => <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{u.code}</span> },
            { key: 'status', header: 'Status', render: (u: Unit) => u.status === 'active'
              ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--success-muted)] text-[var(--success)]">Ativa</span>
              : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--danger-muted)] text-[var(--danger)]">Inativa</span> },
            { key: 'description', header: 'Descrição', headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell text-[12px] text-[var(--fg-muted)]', render: (u: Unit) => u.description || '—' },
            { key: 'createdAt', header: 'Criado em', headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell text-[12px] font-mono text-[var(--fg-muted)]', render: (u: Unit) => u.createdAt },
            { key: 'actions', header: '', headerClassName: 'w-20 text-right', cellClassName: 'text-right', render: (u: Unit) => (
              <div className="flex items-center justify-end gap-0.5">
                <button type="button" onClick={() => navigate('/unidades/' + u.id + '/edit')} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button type="button" onClick={() => setConfirmDelete(u)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] text-[var(--fg-secondary)] hover:text-[var(--danger)] transition-colors" aria-label="Excluir">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ) },
          ]}
          rows={paged}
          rowKey={(u: Unit) => u.id}
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
        title={`Excluir a UO "${confirmDelete?.name}"?`}
        description="Esta ação não pode ser desfeita. Recursos vinculados à UO podem ser afetados."
        confirmLabel="Excluir"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}
