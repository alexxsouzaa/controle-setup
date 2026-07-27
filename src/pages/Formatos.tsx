import { useState, useContext, useMemo } from 'react';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { suggestFormatos, getMachineTooling, getFormatTypeOptions } from '../utils/compatibility';
import { useProducts, useMachines, usePieces, useFormatos, useAddFormato, useUpdateFormato, useDeleteFormatos, useLogAction } from '../queries';
import { useConfig } from '../queries';
import { useAppStore } from '../stores/appStore';
import { Formato, Product, Piece, Machine, Config } from '../types';

const STEPS = ['Produto', 'Configuração', 'Máquina', 'Peças', 'Revisão', 'Concluído'];
const VOL_UNITS = ['ml', 'g'];

interface FormatoPiece {
  pieceId: string;
  pieceName: string;
  pieceCode: string;
  pieceCategory: string;
}

interface FormatoGroup {
  category: string;
  pieces: Piece[];
}

interface FormatoPayload {
  name: string;
  formatType: string;
  volume: number;
  volumeUnit: string;
  machineId: string;
  productId: string;
  productName: string;
  productCode: string;
  partIds: string[];
  alternativePartIds: string[];
  pieces: FormatoPiece[];
  createdBy: string;
}

export function FormatosPage({ navigate }: { navigate: (path: string) => void }) {
  const { data: formatos = [] } = useFormatos();
  const { data: products = [] } = useProducts();
  const { data: pieces = [] } = usePieces();
  const { data: machines = [] } = useMachines();
  const { data: config = {} as Config } = useConfig();
  const { mutate: addFormato } = useAddFormato();
  const { mutate: updateFormato } = useUpdateFormato();
  const { mutate: deleteFormatos } = useDeleteFormatos();
  const { mutate: logAction } = useLogAction();
  const currentUser = useAppStore(s => s.currentUser);
  const { toast } = useContext(ToastContext) as { toast: (msg: string, type?: string) => void };
  const [tab, setTab] = useState<string>('list');
  const [search, setSearch] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const perPage = 10;
  const [savedName, setSavedName] = useState<string>('');

  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formatType, setFormatType] = useState<string>('');
  const [volume, setVolume] = useState<string>('');
  const [volumeUnit, setVolumeUnit] = useState<string>('ml');

  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [machineSearch, setMachineSearch] = useState<string>('');
  const selectedMachine = machines.find((m: Machine) => m.id === selectedMachineId);

  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [selectedAltPartIds, setSelectedAltPartIds] = useState<string[]>([]);
  const [partsWithAlternatives, setPartsWithAlternatives] = useState<FormatoGroup[]>([]);
  const [pieceSearch, setPieceSearch] = useState<string>('');
  const [piecePage, setPiecePage] = useState<number>(1);

  const [formatName, setFormatName] = useState<string>('');
  const [createdBy, setCreatedBy] = useState<string>(currentUser);

  const productFiltered = products.filter((p: Product) =>
    !productSearch || p.name.toLowerCase().includes(productSearch) || p.code.toLowerCase().includes(productSearch)
  ).slice(0, 15);

  const activeProduct = selectedProduct;
  const productVol = activeProduct ? Number(activeProduct.vol) : 0;
  const formatNameSuggestion = useMemo(() => {
    const code = activeProduct?.code || '';
    const vol = volume || activeProduct?.vol || '';
    const unit = volumeUnit || activeProduct?.unit || 'ml';
    const fmt = formatType || '';
    return `${code} - ${fmt} - ${vol}${unit}`.toUpperCase();
  }, [activeProduct, volume, volumeUnit, formatType]);

  const suggestedFormats = useMemo(() => {
    if (!activeProduct || !selectedMachine) return [];
    return suggestFormatos(selectedMachine, activeProduct, formatos);
  }, [activeProduct, selectedMachine, formatos]);

  const resetForm = () => {
    setSelectedProduct(null); setProductSearch('');
    setFormatType(''); setVolume(''); setVolumeUnit('ml');
    setSelectedMachineId('');
    setSelectedLine('');
    setMachineSearch('');
    setSelectedPartIds([]); setSelectedAltPartIds([]);
    setPartsWithAlternatives([]);
    setFormatName(''); setCreatedBy(currentUser);
    setEditingId(null); setStep(1);
  };

  const goToStep = (s: number) => { if (s >= 1 && s <= 6) setStep(s); };

  const volumeNum = Number(volume) || 0;
  const volForCompat = volumeNum || productVol || 0;
  const availableFormatTypes = getFormatTypeOptions(selectedMachine?.uo, config);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductSearch('');
    const suggested = p.image || '';
    if (suggested && availableFormatTypes.includes(suggested)) setFormatType(suggested);
    if (p.vol) setVolume(String(p.vol));
    if (p.unit) setVolumeUnit(p.unit);
  };

  const handleConfigNext = () => {
    if (!formatType) { toast('Selecione o tipo de formato.', 'warning'); return; }
    if (!volumeNum || volumeNum <= 0) { toast('Informe uma volumetria válida.', 'warning'); return; }
    goToStep(3);
  };

  const handleMachineNext = () => {
    if (!selectedMachineId) { toast('Selecione uma máquina compatível.', 'warning'); return; }
    if (!selectedLine) { toast('Selecione a linha de produção.', 'warning'); return; }
    const tooling = getMachineTooling(selectedMachine, config);
    const groupedPieces = tooling.map((cat: string) => {
      const catPieces = pieces.filter((p: Piece) => p.category === cat).sort((a: Piece, b: Piece) => a.name.localeCompare(b.name));
      return { category: cat, pieces: catPieces };
    }).filter((g: FormatoGroup) => g.pieces.length > 0);
    setPartsWithAlternatives(groupedPieces);
    const selIds: string[] = [];
    const altIds: string[] = [];
    groupedPieces.forEach((g: FormatoGroup) => {
      if (g.pieces.length > 0) selIds.push(g.pieces[0].id);
      if (g.pieces.length > 1) altIds.push(g.pieces[1].id);
    });
    setSelectedPartIds(selIds);
    setSelectedAltPartIds(altIds);
    goToStep(4);
  };

  const togglePart = (id: string) => {
    setSelectedPartIds(prev => prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id]);
  };
  const toggleAltPart = (id: string) => {
    setSelectedAltPartIds(prev => prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id]);
  };
  const piecesForCategory = (cat: string) => pieces.filter((p: Piece) => p.category === cat);

  const handleSave = () => {
    if (!formatName.trim()) { toast('Defina o nome do formato.', 'warning'); return; }
    if (selectedPartIds.length === 0) { toast('Selecione pelo menos uma peça.', 'warning'); return; }
    const fmtPieces = selectedPartIds.map((id: string) => {
      const p = pieces.find((pc: Piece) => pc.id === id);
      return p ? { pieceId: p.id, pieceName: p.name, pieceCode: p.code || '', pieceCategory: p.category || '' } : null;
    }).filter(Boolean) as FormatoPiece[];
    const altPieces = selectedAltPartIds.map((id: string) => {
      const p = pieces.find((pc: Piece) => pc.id === id);
      return p ? { pieceId: p.id, pieceName: p.name, pieceCode: p.code || '', pieceCategory: p.category || '' } : null;
    }).filter(Boolean) as FormatoPiece[];
    const payload: FormatoPayload = {
      name: formatName.trim(),
      formatType,
      volume: volumeNum,
      volumeUnit,
      machineId: selectedMachineId,
      productId: selectedProduct!.id,
      productName: selectedProduct!.name,
      productCode: selectedProduct!.code,
      partIds: selectedPartIds,
      alternativePartIds: selectedAltPartIds,
      pieces: [...fmtPieces, ...altPieces.map((p: FormatoPiece) => ({ ...p, isAlternative: true }))],
      createdBy,
    };
    if (editingId) {
      updateFormato({ id: editingId, updates: payload });
      logAction({ type: 'update', entity: 'Formato', detail: `${formatName} atualizado` });
      toast('Formato atualizado com sucesso!');
    } else {
      addFormato(payload);
      logAction({ type: 'create', entity: 'Formato', detail: `${formatName} criado` });
      toast('Formato criado com sucesso!');
    }
    setSavedName(formatName.trim());
    goToStep(6);
  };

  const startEdit = (fmt: Formato) => {
    setFormatName(fmt.name || '');
    setFormatType(fmt.formatType || fmt.tipo || '');
    setVolume(fmt.volume ? String(fmt.volume) : (fmt.volMin ? String(fmt.volMin) : ''));
    setVolumeUnit(fmt.volumeUnit || 'ml');
    setSelectedMachineId(fmt.machineId || '');
    const prod = products.find((p: Product) => p.id === fmt.productId || p.code === (fmt as unknown as Record<string, unknown>).productCode);
    if (prod) setSelectedProduct(prod);
    setSelectedPartIds(fmt.partIds || (fmt.pieces || []).map((p: FormatoPiece | Record<string, unknown>) => (p as FormatoPiece).pieceId).filter(Boolean) as string[]);
    setSelectedAltPartIds(fmt.alternativePartIds || []);
    setCreatedBy(fmt.createdBy || currentUser);
    setEditingId(fmt.id);
    setStep(1);
    setTab('create');
  };

  const go = (s: number) => goToStep(s);

  const filtered = search ? formatos.filter((f: Formato) => f.name?.toLowerCase().includes(search) || ((f as unknown as Record<string, unknown>).productName as string || '').toLowerCase().includes(search)) : formatos;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => { if (!selectionMode) setSelectionMode(true); setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const clearSelection = () => { setSelected(new Set()); setSelectionMode(false); };
  const selectedCount = selected.size;

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    if (!confirm(`Excluir ${selectedCount} formato${selectedCount !== 1 ? 's' : ''} selecionado${selectedCount !== 1 ? 's' : ''}?`)) return;
    deleteFormatos(Array.from(selected));
    logAction({ type: 'delete', entity: 'Formato', detail: `${selectedCount} formato${selectedCount !== 1 ? 's' : ''} excluído${selectedCount !== 1 ? 's' : ''} em massa` });
    toast(`${selectedCount} formato${selectedCount !== 1 ? 's' : ''} excluído${selectedCount !== 1 ? 's' : ''} com sucesso!`);
    clearSelection();
  };

  return (
    <div className="p-6 pb-16">
      {tab === 'list' ? (
        <>
          <div className="grid lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Formatos', value: formatos.length, icon: 'grid-3x3' },
              { label: 'Produtos', value: products.length, icon: 'box' },
              { label: 'Máquinas', value: machines.length, icon: 'settings' },
              { label: 'Peças', value: pieces.length, icon: 'wrench' },
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
              <input className="shad-input pl-8 py-1.5 text-[12px]" placeholder="Buscar formato..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value.toLowerCase()); setPage(1); clearSelection(); }} aria-label="Buscar formatos" />
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => { if (selectionMode) clearSelection(); else setSelectionMode(true); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium border transition-all ${
                  selectionMode ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                {selectionMode ? 'Sair' : 'Selecionar'}
              </button>
              <Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={14} />Novo Formato</Button>
            </div>
          </div>

          {selectionMode && selectedCount > 0 && (
            <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-[6px] border border-[var(--fg-muted)] bg-[var(--accent-muted)]">
              <span className="text-[12px] font-medium text-[var(--fg)]">{selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}</span>
              <button type="button" onClick={handleBulkDelete} className="ml-auto text-[11px] font-medium text-[var(--danger)] hover:underline">Excluir selecionados</button>
              <button type="button" onClick={clearSelection} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]">Cancelar</button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--fg-muted)]"><Icon name="grid-3x3" size={24} /></div>
              <p className="text-[15px] font-medium text-[var(--fg)] mb-1">{formatos.length === 0 ? 'Nenhum formato cadastrado' : 'Nenhum formato encontrado'}</p>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-4">{formatos.length === 0 ? 'Cadastre o primeiro formato.' : 'Tente ajustar a busca.'}</p>
              {formatos.length === 0 && <Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={14} />Novo Formato</Button>}
            </div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] overflow-hidden">
              <table className="w-full text-[13px] border-collapse">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
                    <th className={`w-8 px-3.5 py-2.5 border-b border-[var(--border)] ${selectionMode ? '' : 'hidden'}`}><input type="checkbox" checked={false} onChange={() => {}} aria-label="Selecionar todos" className="accent-[var(--fg)] cursor-pointer" /></th>
                    <th className="text-left px-4 py-2.5 border-b border-[var(--border)]">Formato</th>
                    <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] hidden md:table-cell">Produto</th>
                    <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] w-20 hidden sm:table-cell">Peças</th>
                    <th className="w-20 px-3.5 py-2.5 border-b border-[var(--border)] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((fmt: Formato, idx: number) => {
                    const last = idx === paged.length - 1;
                    return (
                    <tr key={fmt.id} className={`hover:bg-[var(--surface-hover)] transition-colors ${selected.has(fmt.id) ? 'bg-[var(--accent-muted)]' : ''}`} onClick={() => selectionMode && toggleSelect(fmt.id)} style={{ cursor: selectionMode ? 'pointer' : undefined }}>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} ${selectionMode ? '' : 'hidden'}`}>
                        <input type="checkbox" checked={selected.has(fmt.id)} onChange={() => toggleSelect(fmt.id)} aria-label={`Selecionar ${fmt.name}`} className="accent-[var(--fg)] cursor-pointer" />
                      </td>
                      <td className={`px-4 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''}`}>
                        <button type="button" onClick={() => startEdit(fmt)} className="text-left w-full">
                          <div className="font-medium text-[var(--fg)] truncate max-w-[360px]">{fmt.name}</div>
                          <div className="text-[12px] font-mono text-[var(--fg-muted)]">{fmt.formatType || fmt.tipo || '—'} · {(fmt.pieces || []).length} peça{(fmt.pieces || []).length !== 1 ? 's' : ''}</div>
                        </button>
                      </td>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden md:table-cell text-[var(--fg-secondary)]`}>{(fmt as unknown as Record<string, unknown>).productName as string} <span className="text-[var(--fg-muted)] font-mono text-[11px]">({(fmt as unknown as Record<string, unknown>).productCode as string})</span></td>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} hidden sm:table-cell text-[12px] font-mono text-[var(--fg-muted)]`}>{(fmt.pieces || []).length}</td>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} text-right`}>
                        <div className="flex items-center justify-end gap-0.5">
                          <button type="button" onClick={() => startEdit(fmt)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Detalhes">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button type="button" onClick={() => startEdit(fmt)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Editar">
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
        </>
      ) : step < 6 ? (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-0 mb-6 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[8px]">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                {i > 0 && <div className={`w-6 md:w-10 h-0.5 mx-0.5 ${i < step ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`} />}
                <div className={`flex items-center gap-1 ${i >= step ? 'opacity-50' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step === i + 1 ? 'bg-[var(--fg)] text-[var(--bg)]' : step > i + 1 ? 'bg-[var(--success-muted)] text-[var(--success)] border-2 border-[var(--success)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-2 border-[var(--border)]'}`}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:inline whitespace-nowrap ${step === i + 1 ? 'text-[var(--fg)]' : 'text-[var(--fg-secondary)]'}`}>{s}</span>
                </div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="grid-3x3" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">1. Selecionar Produto</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Escolha o produto que será associado a este formato.</p>
                </div>
              </div>
              {selectedProduct ? (
                <div className="p-4 bg-[var(--accent-light)] border border-[var(--accent)] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[var(--accent)]">{selectedProduct.name}</div>
                      <div className="text-xs text-[var(--fg-secondary)] mt-0.5">{selectedProduct.code} · {selectedProduct.category || '—'} · {selectedProduct.vol} {selectedProduct.unit}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(null); setProductSearch(''); }}>Trocar</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)] pointer-events-none"><Icon name="search" size={16} /></span>
                    <input className="shad-input pl-9" placeholder="Buscar produto por nome ou código..." value={productSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductSearch(e.target.value.toLowerCase())} aria-label="Buscar produtos" />
                  </div>
                  {productSearch && productFiltered.length > 0 && (
                    <div className="border border-[var(--border)] rounded-lg mt-2 overflow-hidden max-h-60 overflow-y-auto">
                      {productFiltered.map((p: Product) => (
                        <button key={p.id} type="button" onClick={() => handleSelectProduct(p)}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--bg)] transition-colors">
                          <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="grid-3x3" size={16} /></div>
                          <div>
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-xs text-[var(--fg-secondary)]">{p.code} · {p.category} · {p.vol} {p.unit}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {productSearch && productFiltered.length === 0 && (
                    <p className="text-sm text-[var(--fg-secondary)] mt-2">Nenhum produto encontrado.</p>
                  )}
                </div>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => { resetForm(); setTab('list'); }}>Cancelar</Button>
                <Button variant="primary" disabled={!selectedProduct} onClick={() => { if (selectedProduct) go(2); }}>Avançar →</Button>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="box" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">2. Configuração do Formato</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Defina o formato e a volumetria para o produto selecionado.</p>
                </div>
              </div>
              {selectedProduct && (
                <div className="mb-4 p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)] text-sm">
                  <span className="font-medium">{selectedProduct.name}</span>
                  <span className="text-[var(--fg-secondary)]"> · {selectedProduct.code} · {selectedProduct.vol} {selectedProduct.unit}</span>
                </div>
              )}
              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Formato *</label>
                  <Select value={formatType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormatType(e.target.value)}>
                    <option value="">Selecione o formato</option>
                    {availableFormatTypes.map((f: string) => <option key={f}>{f}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Volumetria *</label>
                    <Input type="number" min="1" placeholder="250" value={volume} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVolume(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Unid.</label>
                    <Select value={volumeUnit} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVolumeUnit(e.target.value)}>{VOL_UNITS.map((u: string) => <option key={u}>{u}</option>)}</Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => go(1)}>← Produto</Button>
                <Button variant="primary" onClick={handleConfigNext}>Avançar →</Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="box" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">3. Selecionar Máquina</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Escolha a máquina compatível com este formato.</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none"><Icon name="search" size={14} /></span>
                  <input className="shad-input pl-8 py-1.5 text-[12px]" placeholder="Buscar máquina por nome, UO ou linha..." value={machineSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMachineSearch(e.target.value.toLowerCase()); setSelectedMachineId(''); setSelectedLine(''); }} />
                </div>
                {machineSearch && (() => {
                   const filtered = machines.filter((m: Machine) => !machineSearch || m.name.toLowerCase().includes(machineSearch) || (m.uo || '').toLowerCase().includes(machineSearch) || (m.lines || (m.line ? [m.line] : [])).some((l: string) => l.toLowerCase().includes(machineSearch)));
                  if (filtered.length === 0) return <p className="text-[12px] text-[var(--fg-muted)] mt-2">Nenhuma máquina encontrada.</p>;
                  return (
                    <div className="border border-[var(--border)] rounded-[6px] mt-2 max-h-60 overflow-y-auto">
                      {filtered.map((m: Machine) => (
                        <button key={m.id} type="button" onClick={() => { setSelectedMachineId(m.id); setMachineSearch(''); }}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--surface-hover)] transition-colors ${selectedMachineId === m.id ? 'bg-[var(--accent-muted)]' : ''}`}>
                          <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={16} /></div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium text-[var(--fg)] truncate">{m.name}</div>
                            <div className="text-[11px] text-[var(--fg-muted)]">{m.uo} · {(m.lines || [m.line]).length} linha{(m.lines || [m.line]).length !== 1 ? 's' : ''}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
              {selectedMachine ? (
                <div className="p-4 bg-[var(--accent-muted)] border border-[var(--fg-muted)] rounded-[6px] mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--fg)]">{selectedMachine.name}</div>
                      <div className="text-[11px] text-[var(--fg-secondary)]">UO: {selectedMachine.uo} · {(selectedMachine.lines || [selectedMachine.line]).length} linha{(selectedMachine.lines || [selectedMachine.line]).length !== 1 ? 's' : ''}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedMachineId(''); setSelectedLine(''); }}>Trocar</Button>
                  </div>
                </div>
              ) : !machineSearch && (
                <p className="text-[12px] text-[var(--fg-secondary)]">Busque e selecione uma máquina acima.</p>
              )}
              {selectedMachine && (
                <div className="mt-4 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                  <label className="text-[12px] font-medium text-[var(--fg)] mb-2 block">Linha de produção</label>
                  <Select value={selectedLine} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedLine(e.target.value)}>
                    <option value="">Selecione a linha...</option>
                    {(selectedMachine.lines || (selectedMachine.line ? [selectedMachine.line] : [])).map((l: string) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => go(2)}>← Configuração</Button>
                <Button variant="primary" disabled={!selectedMachineId || !selectedLine} onClick={handleMachineNext}>Avançar →</Button>
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="wrench" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">4. Selecionar Peças</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Selecione as peças necessárias para este formato.</p>
                </div>
              </div>
              <div className="space-y-3">
                {partsWithAlternatives.length > 0 ? partsWithAlternatives.map((group: FormatoGroup) => {
                  const catPieces = group.pieces || pieces.filter((p: Piece) => p.category === group.category);
                  const selectedInCat = selectedPartIds.filter((id: string) => catPieces.some((p: Piece) => p.id === id));
                  const altInCat = selectedAltPartIds.filter((id: string) => catPieces.some((p: Piece) => p.id === id));
                  return (
                    <div key={group.category} className="border border-[var(--border)] rounded-lg overflow-hidden">
                      <div className="p-3 bg-[var(--bg)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase">{group.category}</span>
                          <span className="text-xs text-[var(--fg-secondary)]">{selectedInCat.length} selecionada{selectedInCat.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-1.5">
                          {catPieces.map((p: Piece) => {
                            const isPrimary = selectedPartIds.includes(p.id);
                            const isAlt = selectedAltPartIds.includes(p.id);
                            return (
                              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                                <div className="flex items-center gap-2 min-w-0">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover border border-[var(--border)] shrink-0 cursor-pointer" onClick={() => setPreviewImage(p.image || null)} />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={14} /></div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium truncate">{p.name}</div>
                                    <div className="text-[10px] text-[var(--fg-secondary)]">{p.code} · Est: {p.stock}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button type="button" onClick={() => togglePart(p.id)}
                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${isPrimary ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--accent)]'}`}>
                                    {isPrimary ? 'Principal' : 'Principal'}
                                  </button>
                                  <button type="button" onClick={() => toggleAltPart(p.id)}
                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${isAlt ? 'bg-[var(--warning)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--accent)]'}`}>
                                    {isAlt ? 'Alternativa' : 'Alternativa'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3"><Icon name="box" size={20} /></div>
                    <p className="text-sm font-medium mb-1">Nenhuma peça compatível encontrada</p>
                    <p className="text-xs text-[var(--fg-secondary)]">Cadastre peças com compatibilidade para esta máquina.</p>
                    <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/pecas')}>Cadastrar peça</Button>
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => go(3)}>← Máquina</Button>
                <Button variant="primary" onClick={() => { if (selectedPartIds.length === 0) { toast('Selecione pelo menos uma peça principal.', 'warning'); return; } go(5); }}>Avançar →</Button>
              </div>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="grid-3x3" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">5. Revisar Formato</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Confira as informações e defina o nome antes de criar.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Produto</span>
                    <button type="button" onClick={() => go(1)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
                  </div>
                  <div className="text-sm font-medium">{selectedProduct?.name}</div>
                  <div className="text-xs text-[var(--fg-secondary)]">{selectedProduct?.code} · {selectedProduct?.vol} {selectedProduct?.unit}</div>
                </div>

                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Configuração</span>
                    <button type="button" onClick={() => go(2)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
                  </div>
                  <div className="text-sm">{formatType} · {volumeNum} {volumeUnit}</div>
                </div>

                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Máquina</span>
                    <button type="button" onClick={() => go(3)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
                  </div>
                  <div className="text-sm font-medium">{selectedMachine?.name || '—'}</div>
                  <div className="text-xs text-[var(--fg-secondary)]">UO: {selectedMachine?.uo} · Linhas: {(selectedMachine?.lines || (selectedMachine?.line ? [selectedMachine.line] : [])).join(', ')}</div>
                </div>

                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Peças</span>
                    <button type="button" onClick={() => go(4)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
                  </div>
                  <div className="space-y-1">
                    {selectedPartIds.map((id: string) => { const p = pieces.find((pc: Piece) => pc.id === id); return p ? <div key={id} className="flex items-center gap-2 text-sm"><Icon name="check-circle" size={14} className="text-[var(--success)]" /><span className="font-medium">{p.name}</span><span className="text-xs text-[var(--fg-secondary)]">Principal</span></div> : null; })}
                    {selectedAltPartIds.map((id: string) => { const p = pieces.find((pc: Piece) => pc.id === id); return p ? <div key={id} className="flex items-center gap-2 text-sm"><Icon name="wrench" size={14} className="text-[var(--warning)]" /><span>{p.name}</span><span className="text-xs text-[var(--fg-secondary)]">Alternativa</span></div> : null; })}
                  </div>
                </div>

                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-3 block">Nome do formato</span>
                  <Input placeholder={formatNameSuggestion} value={formatName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormatName(e.target.value)} />
                  <p className="text-[11px] text-[var(--fg-muted)] mt-1">Sugestão: {formatNameSuggestion}</p>
                </div>

                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-3 block">Registro</span>
                  <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                    <div>
                      <label className="text-xs text-[var(--fg-secondary)] mb-0.5 block">Criado por</label>
                      <Input value={createdBy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreatedBy(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--fg-secondary)] mb-0.5 block">Data de criação</label>
                      <Input value={new Date().toISOString().slice(0, 10)} disabled className="opacity-70" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => go(4)}>← Peças</Button>
                <Button variant="primary" onClick={handleSave}><Icon name="plus" size={16} />{editingId ? 'Salvar Alterações' : 'Criar Formato'}</Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
              <Icon name="check-circle" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-1">{editingId ? 'Formato atualizado com sucesso!' : 'Formato criado com sucesso!'}</h3>
            <div className="text-base font-medium text-[var(--accent)] mt-2 mb-1">{savedName}</div>
            <p className="text-sm text-[var(--fg-secondary)] mb-6">{selectedProduct?.name} · {formatType} · {volumeNum}{volumeUnit}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={() => { navigate('/formatos'); }}><Icon name="grid-3x3" size={16} />Ver formatos</Button>
              <Button variant="secondary" onClick={() => { resetForm(); setTab('create'); }}><Icon name="plus" size={16} />Criar novo formato</Button>
            </div>
          </div>
        </Card>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPreviewImage(null)}>
          <div className="absolute inset-0 bg-[var(--overlay)]" />
          <img src={previewImage} alt="Peça" className="relative max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
