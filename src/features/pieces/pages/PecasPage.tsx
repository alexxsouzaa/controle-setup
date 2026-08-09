import { useState, useRef, useMemo } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import { SearchInput } from '../../../components/shared/SearchInput';
import { ImagePreview } from '../../../components/ImagePreview';
import { usePieces, useAddPiece, useUpdatePiece, useDeletePiece, useDeletePieces, useLogAction } from '../../../queries';
import { useMachines } from '../../../queries';
import { useAppStore } from '../../../stores/appStore';
import { Piece, Machine } from '../../../types';
import { processImageFile } from '../../../lib/image';
import { useDialogAccessibility } from '../../../components/shared/useDialogAccessibility';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Pagination } from '../../../components/shared/Pagination';

const ALL_CATEGORIES = ['Copos', 'Ponteira do Empurrador', 'Ponteira do Centralizador', 'Estação de Limpeza', 'Bico de Envase', 'Suporte do Camisa do Bico de Ar Quente', 'Camisa do Bico de Ar Quente', 'Ponteira do Bico de Ar Quente', 'Faca', 'Mordente', 'Régua do Mordente', 'Batedor do Mordente', 'Berço'];

interface PieceForm {
  name: string;
  specification: string;
  category: string;
  sealingType: string;
  diameterMin: string;
  diameterMax: string;
  compatibleMachineIds: string[];
  image: string;
  createdBy: string;
  createdAt: string;
}

const CATEGORY_STRATEGIES: Record<string, string> = {
  'Faca': 'sealing',
  'Mordente': 'sealing',
  'Régua do Mordente': 'sealing',
  'Batedor do Mordente': 'sealing',
  'Copos': 'diameter',
  'Ponteira do Empurrador': 'diameter',
  'Ponteira do Centralizador': 'diameter',
  'Bico de Envase': 'diameter',
  'Ponteira': 'diameter',
  'Berço': 'diameter',
  'Estação de Limpeza': 'diameter',
  'Bico de Ar Quente': 'combined',
  'Camisa do Bico de Ar Quente': 'combined',
  'Ponteira do Bico de Ar Quente': 'combined',
  'Suporte do Camisa do Bico de Ar Quente': 'combined',
};

function guessCategory(name: string): string {
  const lower = (name || '').toLowerCase();
  for (const cat of ALL_CATEGORIES) {
    if (lower.includes(cat.toLowerCase())) return cat;
  }
  return '';
}

export function PecasPage() {
  const { data: pieces = [] } = usePieces();
  const { data: machines = [] } = useMachines();
  const { mutate: addPiece } = useAddPiece();
  const { mutate: updatePiece } = useUpdatePiece();
  const { mutate: deletePiece } = useDeletePiece();
  const { mutate: deletePieces } = useDeletePieces();
  const { mutate: logAction } = useLogAction();
  const currentUser = useAppStore(s => s.currentUser);
  const { toast } = useToast();
  const [tab, setTab] = useState<string>('list');
  const [search, setSearch] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerItem, setDrawerItem] = useState<Piece | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ kind: 'bulk' | 'single' } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const perPage = 10;
  const [form, setForm] = useState<PieceForm>({ name: '', specification: '', category: '', sealingType: '', diameterMin: '', diameterMax: '', compatibleMachineIds: [], image: '', createdBy: currentUser, createdAt: new Date().toISOString().slice(0, 10) });
  const [imageError, setImageError] = useState<string>('');
  const [machineDropdownOpen, setMachineDropdownOpen] = useState<boolean>(false);
  const [machineSearch, setMachineSearch] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMachines = machineSearch ? machines.filter((m: Machine) => m.name.toLowerCase().includes(machineSearch.toLowerCase())) : machines;

  const resetForm = () => {
    setForm({ name: '', specification: '', category: '', sealingType: '', diameterMin: '', diameterMax: '', compatibleMachineIds: [], image: '', createdBy: currentUser, createdAt: new Date().toISOString().slice(0, 10) });
    setEditingId(null); setImageError(''); setMachineSearch('');
  };

  const drawerRef = useDialogAccessibility(!!drawerItem, () => setDrawerItem(null));

  const toggleMachine = (id: string) => setForm(prev => {
    const ids = prev.compatibleMachineIds.includes(id) ? prev.compatibleMachineIds.filter((mid: string) => mid !== id) : [...prev.compatibleMachineIds, id];
    return { ...prev, compatibleMachineIds: ids };
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataURL = await processImageFile(file);
      setForm(prev => ({ ...prev, image: dataURL }));
      setImageError('');
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Erro ao processar a imagem.');
    }
  };

  const handleSave = () => {
    if (!form.name) { toast('Informe o nome da peça.', 'warning'); return; }
    if (!form.specification) { toast('Informe a especificação da peça.', 'warning'); return; }
    if (form.compatibleMachineIds.length === 0) { toast('Selecione pelo menos uma máquina compatível.', 'warning'); return; }
    const category = form.category || guessCategory(form.name);
    const sealingType = form.sealingType || undefined;
    const diameterMin = form.diameterMin ? Number(form.diameterMin) : undefined;
    const diameterMax = form.diameterMax ? Number(form.diameterMax) : undefined;
    if (editingId) { updatePiece({ id: editingId, updates: { ...form, category, sealingType, diameterMin, diameterMax } }); }
    else { addPiece({ ...form, category, sealingType, diameterMin, diameterMax }); }
    logAction({ type: editingId ? 'update' : 'create', entity: 'Peça', detail: editingId ? `${form.name} atualizada` : `${form.name} cadastrada` });
    toast(editingId ? 'Peça atualizada com sucesso!' : 'Peça cadastrada com sucesso!');
    resetForm();
    setTab('list');
  };

  const startEdit = (p: Piece) => {
    setForm({
      name: p.name || '', specification: p.specification || '',
      category: p.category || '', sealingType: p.sealingType || '',
      diameterMin: p.diameterMin != null ? String(p.diameterMin) : '',
      diameterMax: p.diameterMax != null ? String(p.diameterMax) : '',
      compatibleMachineIds: p.compatibleMachineIds || [], image: p.image || '',
      createdBy: p.createdBy || currentUser, createdAt: p.createdAt || new Date().toISOString().slice(0, 10),
    });
    setEditingId(p.id);
    setTab('create');
  };

  const filtered = pieces.filter((p: Piece) => !search || p.name.toLowerCase().includes(search) || (p.specification || '').toLowerCase().includes(search) || (p.category || '').toLowerCase().includes(search));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => { if (!selectionMode) setSelectionMode(true); setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleSelectAll = () => {
    if (!selectionMode && !allSelected) setSelectionMode(true);
    if (paged.every((s: Piece) => selected.has(s.id))) setSelected(new Set([...selected].filter(id => !paged.some((s: Piece) => s.id === id))));
    else setSelected(new Set([...selected, ...paged.map((s: Piece) => s.id)]));
  };
  const clearSelection = () => { setSelected(new Set()); setSelectionMode(false); };
  const selectedCount = selected.size;
  const allSelected = paged.length > 0 && paged.every((s: Piece) => selected.has(s.id));

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    setConfirmTarget({ kind: 'bulk' });
  };

  const compNames = (p: Piece): string[] => {
    if (p.compatibleMachineIds && p.compatibleMachineIds.length > 0) return p.compatibleMachineIds.map((id: string) => machines.find((m: Machine) => m.id === id)?.name).filter(Boolean) as string[];
    if (p.compat) return p.compat.split(',').map((s: string) => s.trim()).filter(Boolean);
    return [];
  };

  const getMachNames = (ids: string[]): string[] => ids.map((id: string) => machines.find((m: Machine) => m.id === id)?.name).filter(Boolean) as string[];

  return (
    <div className="p-6 pb-16">
      {tab === 'list' ? (
        <>
          <PageHeader title="Peças" description="Cadastre e gerencie as peças utilizadas nos setups." />
          <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mb-5">
            {[
              { label: 'Peças', value: pieces.length, icon: 'box' },
              { label: 'Categorias', value: ALL_CATEGORIES.length, icon: 'settings' },
              { label: 'Com Foto', value: pieces.filter((p: Piece) => p.image).length, icon: 'upload' },
              { label: 'Máquinas compat.', value: machines.length, icon: 'grid-3x3' },
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

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <SearchInput className="flex-1 max-w-xs" placeholder="Buscar peça..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value.toLowerCase()); setPage(1); clearSelection(); }} aria-label="Buscar peças" />
            <div className="flex-1" />
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => { if (selectionMode) clearSelection(); else setSelectionMode(true); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium border transition-all ${
                  selectionMode ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                {selectionMode ? 'Sair' : 'Selecionar'}
              </button>
              <Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={14} />Nova Peça</Button>
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
              <p className="text-[15px] font-medium text-[var(--fg)] mb-1">{pieces.length === 0 ? 'Nenhuma peça cadastrada' : 'Nenhuma peça encontrada'}</p>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-4">{pieces.length === 0 ? 'Cadastre a primeira peça.' : 'Tente ajustar a busca.'}</p>
              {pieces.length === 0 && <Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={14} />Nova Peça</Button>}
            </div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] overflow-hidden overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
                    <th className={`w-8 px-3.5 py-2.5 border-b border-[var(--border)] ${selectionMode ? '' : 'hidden'}`}><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" className="accent-[var(--fg)] cursor-pointer" /></th>
                    <th className="text-left px-4 py-2.5 border-b border-[var(--border)]">Peça</th>
                    <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] hidden md:table-cell">Máquinas</th>
                    <th className="w-20 px-3.5 py-2.5 border-b border-[var(--border)] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p: Piece, idx: number) => {
                    const last = idx === paged.length - 1;
                    const names = compNames(p);
                    return (
                    <tr key={p.id} className={`hover:bg-[var(--surface-hover)] transition-colors ${selected.has(p.id) ? 'bg-[var(--accent-muted)]' : ''}`} onClick={() => selectionMode && toggleSelect(p.id)} style={{ cursor: selectionMode ? 'pointer' : undefined }}>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} ${selectionMode ? '' : 'hidden'}`}>
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label={`Selecionar ${p.name}`} className="accent-[var(--fg)] cursor-pointer" />
                      </td>
                      <td className={`px-4 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''}`}>
                        <button type="button" onClick={() => setDrawerItem(p)} className="text-left w-full">
                          <div className="flex items-center gap-2">
                            {p.image ? <img src={p.image} alt="" className="w-7 h-7 rounded-[4px] object-cover border border-[var(--border)] shrink-0" /> : null}
                            <div className="min-w-0">
                              <div className="font-medium text-[var(--fg)] truncate">{p.name}</div>
                              <div className="text-[12px] font-mono text-[var(--fg-muted)]">{p.specification || '—'}</div>
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden md:table-cell`}>
                        <div className="flex flex-wrap gap-1">
                          {names.slice(0, 3).map((n: string) => <span key={n} className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-medium font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{n}</span>)}
                          {names.length > 3 && <span className="text-[10px] text-[var(--fg-muted)] font-mono">+{names.length - 3}</span>}
                        </div>
                      </td>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} text-right`}>
                        <div className="flex items-center justify-end gap-0.5">
                          <button type="button" onClick={() => setDrawerItem(p)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Detalhes">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button type="button" onClick={() => startEdit(p)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Editar">
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
        </>
      ) : (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <button type="button" onClick={() => { resetForm(); setTab('list'); }} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">← Voltar</button>
          </div>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="box" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">{editingId ? 'Editar Peça' : 'Nova Peça'}</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Informações da peça.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-[1fr_120px] gap-4">
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Nome *</label>
                <Input placeholder="Ex: Bico de Envase" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Especificação *</label>
                <Input placeholder="Ex: 250 mm" value={form.specification} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, specification: e.target.value })} />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Categoria</label>
              <select
                value={form.category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, category: e.target.value })}
                className="shad-select w-full"
              >
                <option value="">Auto-detectar pelo nome</option>
                {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            {form.category && CATEGORY_STRATEGIES[form.category] === 'sealing' && (
              <div className="mt-4">
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Tipo de Selagem</label>
                <Input placeholder="Ex: padrão, serrilhada, lisa" value={form.sealingType} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, sealingType: e.target.value })} />
              </div>
            )}
            {form.category && (CATEGORY_STRATEGIES[form.category] === 'diameter' || CATEGORY_STRATEGIES[form.category] === 'combined') && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Diâmetro Mínimo (mm)</label>
                  <Input type="number" min="0" placeholder="Ex: 30" value={form.diameterMin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, diameterMin: e.target.value })} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Diâmetro Máximo (mm)</label>
                  <Input type="number" min="0" placeholder="Ex: 50" value={form.diameterMax} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, diameterMax: e.target.value })} />
                </div>
              </div>
            )}
            {form.category && CATEGORY_STRATEGIES[form.category] === 'combined' && (
              <div className="mt-4">
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Tipo de Selagem</label>
                <Input placeholder="Ex: padrão, reforçado" value={form.sealingType} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, sealingType: e.target.value })} />
              </div>
            )}
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="settings" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">Compatibilidade</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Máquinas onde esta peça pode ser utilizada.</p>
              </div>
            </div>
            <div className="relative">
              {form.compatibleMachineIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {getMachNames(form.compatibleMachineIds).map((n: string) => (
                    <span key={n} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] text-[11px]">
                      {n}
                      <button type="button" onClick={() => {
                        const m = machines.find((mch: Machine) => mch.name === n);
                        if (m) setForm(prev => ({ ...prev, compatibleMachineIds: prev.compatibleMachineIds.filter((mid: string) => mid !== m.id) }));
                      }} className="text-[var(--fg-muted)] hover:text-[var(--danger)] leading-none">&times;</button>
                    </span>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setMachineDropdownOpen(!machineDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[12px] hover:border-[var(--fg-muted)] transition-colors">
                <span className={form.compatibleMachineIds.length === 0 ? 'text-[var(--fg-muted)]' : ''}>Selecionar máquinas...</span>
                <Icon name="arrow-right" size={12} className={`transition-transform ${machineDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
              </button>
              {machineDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-[6px] shadow-md">
                  <div className="p-2 border-b border-[var(--border)]">
                    <input className="shad-input w-full py-1 text-[11px]" placeholder="Buscar máquina..." value={machineSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMachineSearch(e.target.value)} />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredMachines.map((m: Machine) => (
                      <button key={m.id} type="button" onClick={() => { toggleMachine(m.id); }}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 text-[12px] hover:bg-[var(--surface-hover)] transition-colors ${form.compatibleMachineIds.includes(m.id) ? 'bg-[var(--accent-muted)]' : ''}`}>
                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${form.compatibleMachineIds.includes(m.id) ? 'bg-[var(--fg)] border-[var(--fg)]' : 'border-[var(--border)]'}`}>
                          {form.compatibleMachineIds.includes(m.id) && <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                        </div>
                        <span>{m.name}</span>
                        <span className="text-[10px] text-[var(--fg-muted)] ml-auto">{m.line}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="upload" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">Foto</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Opcional.</p>
              </div>
            </div>
            {form.image ? (
              <div className="flex items-center gap-3">
                <img src={form.image} alt="Preview" className="w-14 h-14 rounded-[6px] object-cover border border-[var(--border)]" />
                <div className="space-y-1">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] block">Trocar</button>
                  <button type="button" onClick={() => { setForm(prev => ({ ...prev, image: '' })); setImageError(''); }} className="text-[11px] text-[var(--danger)] hover:underline block">Remover</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-6 rounded-[6px] border-2 border-dashed border-[var(--border)] hover:border-[var(--fg-muted)] hover:bg-[var(--surface)] transition-all w-full">
                <Icon name="upload" size={18} />
                <span className="text-[12px] text-[var(--fg-muted)]">Adicionar foto</span>
              </button>
            )}
            {imageError && <p className="text-[11px] text-[var(--danger)] mt-1">{imageError}</p>}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="clock" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">Registro</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Informações de criação.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Criado por</label>
                <Input value={form.createdBy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, createdBy: e.target.value })} />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Data de criação</label>
                <Input type="date" value={form.createdAt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, createdAt: e.target.value })} />
              </div>
            </div>
          </Card>
          <div className="flex items-center justify-end gap-3 pb-4">
            <Button variant="ghost" size="sm" onClick={() => { resetForm(); setTab('list'); }}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>{editingId ? 'Salvar' : 'Criar Peça'}</Button>
          </div>
        </div>
      )}
      {drawerItem && (
        <>
          <div className="fixed inset-0 z-40 bg-[var(--overlay)]" onClick={() => setDrawerItem(null)} />
          <div role="dialog" aria-modal="true" aria-label={`Detalhes: ${drawerItem.name}`} ref={drawerRef} tabIndex={-1} style={{ width: 'min(420px, 90vw)' }}
            className="fixed top-0 right-0 bottom-0 z-50 bg-[var(--bg)] border-l border-[var(--border)] shadow-lg flex flex-col outline-none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {drawerItem.image ? (
                  <img src={drawerItem.image} alt="" className="w-8 h-8 rounded-[4px] object-cover border border-[var(--border)] shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={16} /></div>
                )}
                <h3 className="text-[14px] font-semibold truncate">{drawerItem.name}</h3>
              </div>
              <button type="button" onClick={() => setDrawerItem(null)} aria-label="Fechar" className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--fg-secondary)] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {drawerItem.image && (
                <div className="flex justify-center">
                  <img src={drawerItem.image} alt="" className="w-28 h-28 rounded-[8px] object-cover border border-[var(--border)]" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Especificação</div>
                  <div className="text-[13px] font-mono text-[var(--fg)] mt-0.5">{drawerItem.specification || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Criado por</div>
                  <div className="text-[13px] text-[var(--fg)] mt-0.5">{drawerItem.createdBy || '—'}</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mb-1.5">Máquinas compatíveis</div>
                <div className="flex flex-wrap gap-1">
                  {compNames(drawerItem).map((n: string) => <span key={n} className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-[10px] font-medium font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{n}</span>)}
                  {compNames(drawerItem).length === 0 && <span className="text-[12px] text-[var(--fg-muted)]">Nenhuma</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border)] shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { const p = drawerItem; setDrawerItem(null); startEdit(p); }}>Editar</Button>
              <button type="button" onClick={() => setConfirmTarget({ kind: 'single' })}
                className="px-3 py-1.5 rounded-[4px] border border-[var(--danger)] text-[11px] font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors">Excluir</button>
            </div>
          </div>
        </>
      )}
      {previewImage && <ImagePreview src={previewImage} alt="Foto da peça" onClose={() => setPreviewImage(null)} />}
      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(o) => { if (!o) setConfirmTarget(null); }}
        title={confirmTarget?.kind === 'bulk'
          ? `Excluir ${selectedCount} peça${selectedCount !== 1 ? 's' : ''} selecionada${selectedCount !== 1 ? 's' : ''}?`
          : drawerItem ? `Excluir ${drawerItem.name}?` : 'Excluir?'}
        description="Esta ação não pode ser desfeita."
        onConfirm={() => {
          if (confirmTarget?.kind === 'bulk') {
            deletePieces(Array.from(selected));
            logAction({ type: 'delete', entity: 'Peça', detail: `${selectedCount} peça${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} em massa` });
            toast(`${selectedCount} peça${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} com sucesso!`);
            clearSelection();
          } else if (drawerItem) {
            deletePiece(drawerItem.id);
            logAction({ type: 'delete', entity: 'Peça', detail: `${drawerItem.name} excluída` });
            toast('Peça excluída com sucesso!');
            setDrawerItem(null);
          }
        }}
      />
    </div>
  );
}
