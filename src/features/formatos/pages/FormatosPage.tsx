import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { SearchInput } from '../../../components/shared/SearchInput';
import { getMachineTooling, getFormatTypeOptions } from '../../compatibility';
import { useMachines, usePieces, useFormatos, useAddFormato, useUpdateFormato, useDeleteFormatos, useLogAction } from '../../../queries';
import { useConfig } from '../../../queries';
import { useAppStore } from '../../../stores/appStore';
import { useUoStore } from '../../../stores/uoStore';
import { useUnits } from '../../../queries';
import { useDialogAccessibility } from '../../../components/shared/useDialogAccessibility';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { PageHeader } from '../../../components/shared/PageHeader';
import { DataTable } from '../../../components/shared/DataTable';
import { DataTableSelectionBar } from '../../../components/shared/DataTableSelectionBar';
import { Formato, Piece, Machine, Config } from '../../../types';

const STEPS = ['Configuração', 'Máquina', 'Peças', 'Revisão', 'Concluído'];
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
  uo: string;
  unitId?: string;
  category?: string;
  diameter?: number;
  volume: number;
  volumeUnit: string;
  machineId: string;
  partIds: string[];
  alternativePartIds: string[];
  pieces: FormatoPiece[];
  createdBy: string;
}

export function FormatosPage() {
  const navigate = useNavigate();
  const { data: formatos = [] } = useFormatos();
  const { data: pieces = [] } = usePieces();
  const { data: machines = [] } = useMachines();
  const { data: config = {} as Config } = useConfig();
  const { data: units = [] } = useUnits();
  const { mutate: addFormato } = useAddFormato();
  const { mutate: updateFormato } = useUpdateFormato();
  const { mutate: deleteFormatos } = useDeleteFormatos();
  const { mutate: logAction } = useLogAction();
  const currentUser = useAppStore(s => s.currentUser);
  const activeUnitId = useUoStore(s => s.activeUnitId);
  const { toast } = useToast();
  const [tab, setTab] = useState<string>('list');
  const [search, setSearch] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [page, setPage] = useState<number>(1);
  const perPage = 10;
  const [savedName, setSavedName] = useState<string>('');

  const [selectedUo, setSelectedUo] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [diameter, setDiameter] = useState<string>('');

  const previewRef = useDialogAccessibility(!!previewImage, () => setPreviewImage(null));

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

  const [formatName, setFormatName] = useState<string>('');
  const [createdBy, setCreatedBy] = useState<string>(currentUser);

  const formatNameSuggestion = useMemo(() => {
    const uoLabel = selectedUo || '';
    const cat = category || '';
    const diam = diameter ? `Ø${diameter}` : '';
    const vol = volume || '';
    const unit = volumeUnit || 'ml';
    const fmt = formatType || '';
    return `${uoLabel}${cat ? ` - ${cat}` : ''}${diam ? ` ${diam}` : ''} - ${fmt} - ${vol}${unit}`.toUpperCase();
  }, [selectedUo, category, diameter, volume, volumeUnit, formatType]);

  const resetForm = () => {
    setSelectedUo(''); setCategory(''); setDiameter('');
    setFormatType(''); setVolume(''); setVolumeUnit('ml');
    setSelectedMachineId('');
    setSelectedLine('');
    setMachineSearch('');
    setSelectedPartIds([]); setSelectedAltPartIds([]);
    setPartsWithAlternatives([]);
    setFormatName(''); setCreatedBy(currentUser);
    setEditingId(null); setStep(1);
  };

  const goToStep = (s: number) => { if (s >= 1 && s <= 5) setStep(s); };

  const volumeNum = Number(volume) || 0;

  const handleConfigNext = () => {
    if (!selectedUo) { toast('Selecione a UO.', 'warning'); return; }
    if (!formatType) { toast('Selecione o tipo de formato.', 'warning'); return; }
    if (!volumeNum || volumeNum <= 0) { toast('Informe uma volumetria válida.', 'warning'); return; }
    goToStep(2);
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
    goToStep(3);
  };

  const togglePart = (id: string, category: string) => {
    setSelectedPartIds(prev => {
      const withoutCurrent = prev.filter((x: string) => {
        const p = pieces.find((pc: Piece) => pc.id === x);
        return p?.category !== category;
      });
      if (prev.includes(id)) return withoutCurrent;
      setSelectedAltPartIds(alt => alt.filter((x: string) => x !== id));
      return [...withoutCurrent, id];
    });
  };
  const toggleAltPart = (id: string, category: string) => {
    setSelectedAltPartIds(prev => {
      const withoutCurrent = prev.filter((x: string) => {
        const p = pieces.find((pc: Piece) => pc.id === x);
        return p?.category !== category;
      });
      if (prev.includes(id)) return withoutCurrent;
      setSelectedPartIds(part => part.filter((x: string) => x !== id));
      return [...withoutCurrent, id];
    });
  };

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
      uo: selectedUo,
      unitId: selectedMachine?.unitId,
      category,
      diameter: diameter ? Number(diameter) : undefined,
      volume: volumeNum,
      volumeUnit,
      machineId: selectedMachineId,
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
    goToStep(5);
  };

  const startEdit = (fmt: Formato) => {
    setFormatName(fmt.name || '');
    setFormatType(fmt.formatType || fmt.tipo || '');
    setSelectedUo(fmt.uo || '');
    setCategory(fmt.category || '');
    setDiameter(fmt.diameter ? String(fmt.diameter) : '');
    setVolume(fmt.volume ? String(fmt.volume) : (fmt.volMin ? String(fmt.volMin) : ''));
    setVolumeUnit(fmt.volumeUnit || 'ml');
    setSelectedMachineId(fmt.machineId || '');
    setSelectedPartIds(fmt.partIds || (fmt.pieces || []).map((p: FormatoPiece | Record<string, unknown>) => (p as FormatoPiece).pieceId).filter(Boolean) as string[]);
    setSelectedAltPartIds(fmt.alternativePartIds || []);
    setCreatedBy(fmt.createdBy || currentUser);
    setEditingId(fmt.id);
    setStep(1);
    setTab('create');
  };

  const go = (s: number) => goToStep(s);

  const scopedFormatos = useMemo(() => {
    if (!activeUnitId) return formatos;
    const unit = units.find((u: { id: string; name: string }) => u.id === activeUnitId);
    return formatos.filter((f: Formato) => {
      if (f.unitId) return f.unitId === activeUnitId;
      if (unit && f.uo) return f.uo === unit.name;
      return true;
    });
  }, [formatos, activeUnitId, units]);

  const filtered = search ? scopedFormatos.filter((f: Formato) => f.name?.toLowerCase().includes(search) || (f.uo || '').toLowerCase().includes(search) || (f.formatType || f.tipo || '').toLowerCase().includes(search)) : scopedFormatos;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => { if (!selectionMode) setSelectionMode(true); setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleSelectAll = () => {
    if (!selectionMode && !allSelected) setSelectionMode(true);
    if (paged.every((s: Formato) => selected.has(s.id))) setSelected(new Set([...selected].filter(id => !paged.some((s: Formato) => s.id === id))));
    else setSelected(new Set([...selected, ...paged.map((s: Formato) => s.id)]));
  };
  const clearSelection = () => { setSelected(new Set()); setSelectionMode(false); };
  const selectedCount = selected.size;
  const allSelected = paged.length > 0 && paged.every((s: Formato) => selected.has(s.id));

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    setConfirmBulkDelete(true);
  };

  return (
    <div className="p-6 pb-16">
      {tab === 'list' ? (
        <>
          <PageHeader title="Formatos" description="Gerencie os formatos de produção por máquina e peça." />
          <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mb-5">
            {[
              { label: 'Formatos', value: scopedFormatos.length, icon: 'grid-3x3' },
              { label: 'UOs', value: [...new Set(machines.map((m: Machine) => m.uo).filter(Boolean))].length, icon: 'box' },
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

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <SearchInput className="flex-1 max-w-xs" placeholder="Buscar formato..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value.toLowerCase()); setPage(1); clearSelection(); }} aria-label="Buscar formatos" />
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
            <DataTableSelectionBar count={selectedCount} allSelected={allSelected} onCancel={clearSelection} actionLabel="Excluir selecionados" onAction={handleBulkDelete} />
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--fg-muted)]"><Icon name="grid-3x3" size={24} /></div>
              <p className="text-[15px] font-medium text-[var(--fg)] mb-1">{formatos.length === 0 ? 'Nenhum formato cadastrado' : 'Nenhum formato encontrado'}</p>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-4">{formatos.length === 0 ? 'Cadastre o primeiro formato.' : 'Tente ajustar a busca.'}</p>
              {formatos.length === 0 && <Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={14} />Novo Formato</Button>}
            </div>
          ) : (
            <DataTable
              columns={[
                { key: 'name', header: 'Formato', first: true, render: (fmt: Formato) => (
                  <button type="button" onClick={() => navigate('/formatos/' + fmt.id)} className="text-left w-full">
                    <div className="font-medium text-[var(--fg)] truncate max-w-[360px]">{fmt.name}</div>
                    <div className="text-[12px] font-mono text-[var(--fg-muted)]">{fmt.formatType || fmt.tipo || '—'}</div>
                  </button>
                ) },
                { key: 'tipo', header: 'Tipo', headerClassName: 'hidden sm:table-cell', cellClassName: 'hidden sm:table-cell', render: (fmt: Formato) => (
                  <span className="text-[12px] font-mono text-[var(--fg-muted)]">{fmt.formatType || fmt.tipo || '—'}</span>
                ) },
                { key: 'uo', header: 'UO', headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell', render: (fmt: Formato) => (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{fmt.uo || '—'}</span>
                ) },
                { key: 'pecas', header: 'Peças', headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell', render: (fmt: Formato) => (
                  <span className="text-[12px] font-mono text-[var(--fg-muted)]">{(fmt.pieces || []).length}</span>
                ) },
                { key: 'createdAt', header: 'Criado em', headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell text-[12px] font-mono text-[var(--fg-muted)]', render: (fmt: Formato) => fmt.createdAt || '—' },
                { key: 'createdBy', header: 'Criado por', headerClassName: 'hidden xl:table-cell', cellClassName: 'hidden xl:table-cell text-[12px] text-[var(--fg-muted)]', render: (fmt: Formato) => fmt.createdBy || '—' },
                { key: 'status', header: 'Status', headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell', render: (fmt: Formato) => {
                  if (!fmt.updatedAt) return <span className="text-[12px] text-[var(--fg-muted)]">—</span>;
                  const days = Math.floor((Date.now() - new Date(fmt.updatedAt).getTime()) / 86400000);
                  if (days <= 30) return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--success-muted)] text-[var(--success)]">Ativo</span>;
                  if (days <= 90) return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--warning-muted)] text-[var(--warning)]">Inativo</span>;
                  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[var(--danger-muted)] text-[var(--danger)]">Parado</span>;
                } },
                { key: 'actions', header: '', headerClassName: 'w-20 text-right', cellClassName: 'text-right', render: (fmt: Formato) => (
                  <div className="flex items-center justify-end gap-0.5">
                    <button type="button" onClick={() => navigate('/formatos/' + fmt.id)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Detalhes">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button type="button" onClick={() => startEdit(fmt)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                ) },
              ]}
              rows={paged}
              rowKey={(fmt: Formato) => fmt.id}
              selectionMode={selectionMode}
              selected={selected}
              allSelected={allSelected}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              getRowAriaLabel={(fmt: Formato) => `Selecionar ${fmt.name}`}
              pagination={{ page, totalPages, onPageChange: setPage, total: filtered.length, perPage }}
            />
          )}
        </>
      ) : step < 5 ? (
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
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="box" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">1. Configuração do Formato</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Defina a UO, o tipo de formato e a volumetria.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--fg)] mb-1 block">UO *</label>
                  <Select value={selectedUo} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSelectedUo(e.target.value); setFormatType(''); }}>
                    <option value="">Selecione a UO</option>
                    {[...new Set(machines.map((m: Machine) => m.uo).filter(Boolean))].map((uo: string) => <option key={uo}>{uo}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Formato *</label>
                  <Select value={formatType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormatType(e.target.value)}>
                    <option value="">Selecione o formato</option>
                    {selectedUo ? getFormatTypeOptions(selectedUo, config).map((f: string) => <option key={f}>{f}</option>) : <option value="" disabled>Selecione uma UO primeiro</option>}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Categoria</label>
                  <Select value={category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}>
                    <option value="">Selecione a categoria</option>
                    {selectedUo ? (config.uoConfigs?.[selectedUo]?.categorias || config.uoConfigs?.[selectedUo]?.productCategories || []).map((c: string) => <option key={c}>{c}</option>) : []}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Diâmetro (mm)</label>
                  <Input type="number" min="1" placeholder="Ex: 35" value={diameter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiameter(e.target.value)} />
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
                <Button variant="ghost" onClick={() => { resetForm(); setTab('list'); }}>Cancelar</Button>
                <Button variant="primary" onClick={handleConfigNext}>Avançar →</Button>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="box" size={15} /></div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[var(--fg)]">2. Selecione a máquina</h3>
                  <p className="text-[11px] text-[var(--fg-secondary)]">Escolha a máquina e linha para este formato.</p>
                </div>
              </div>
              <div className="mb-4">
                <SearchInput placeholder="Buscar máquina por nome, UO ou linha..." value={machineSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMachineSearch(e.target.value.toLowerCase()); setSelectedMachineId(''); setSelectedLine(''); }} />
                {machineSearch ? (() => {
                  const filtered = machines.filter((m: Machine) => {
                    if (selectedUo && m.uo !== selectedUo) return false;
                    return m.name.toLowerCase().includes(machineSearch) || (m.uo || '').toLowerCase().includes(machineSearch) || (m.lines || (m.line ? [m.line] : [])).some((l: string) => l.toLowerCase().includes(machineSearch));
                  });
                  if (filtered.length === 0) return <p className="text-[12px] text-[var(--fg-muted)] mt-2">Nenhuma máquina encontrada para esta UO.</p>;
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
                })() : selectedMachine && (
                  <div className="mt-2" />
                )}
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
                <p className="text-[12px] text-[var(--fg-secondary)] mb-4">Busque e selecione uma máquina acima.</p>
              )}
              {selectedMachine && (
                <div className="border-t border-[var(--border-subtle)] pt-4">
                  <label className="text-[12px] font-medium text-[var(--fg)] mb-2 block">Linha de produção</label>
                  <div className="flex flex-wrap gap-2">
                    {(selectedMachine.lines || (selectedMachine.line ? [selectedMachine.line] : [])).map((l: string) => (
                      <button key={l} type="button" onClick={() => { setSelectedLine(l); }}
                        className={`px-4 py-2.5 rounded-[6px] border text-[13px] font-medium transition-all ${selectedLine === l ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-secondary)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>
                        Linha {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => go(1)}>← Configuração</Button>
                <Button variant="primary" size="sm" disabled={!selectedMachineId || !selectedLine} onClick={handleMachineNext}>Avançar →</Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="wrench" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">3. Selecionar Peças</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Selecione as peças necessárias para este formato.</p>
                </div>
              </div>
              <div className="space-y-3">
                {partsWithAlternatives.length > 0 ? partsWithAlternatives.map((group: FormatoGroup) => {
                  const catPieces = group.pieces || pieces.filter((p: Piece) => p.category === group.category);
                  const primaryInCat = selectedPartIds.find((id: string) => catPieces.some((p: Piece) => p.id === id));
                  const altInCat = selectedAltPartIds.find((id: string) => catPieces.some((p: Piece) => p.id === id));
                  return (
                    <div key={group.category} className="border border-[var(--border)] rounded-lg overflow-hidden">
                      <div className="p-3 bg-[var(--bg)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase">{group.category}</span>
                          <span className="text-xs text-[var(--fg-secondary)]">{primaryInCat ? '1 principal' : '0 principal'} · {altInCat ? '1 alternativa' : '0 alternativa'}</span>
                        </div>
                        <div className="space-y-1.5">
                          {catPieces.map((p: Piece) => {
                            const isPrimary = selectedPartIds.includes(p.id);
                            const isAlt = selectedAltPartIds.includes(p.id);
                            const disabled = Boolean(!isPrimary && !isAlt && primaryInCat && altInCat);
                            return (
                              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${isPrimary ? 'border-[var(--fg)] bg-[var(--accent-muted)]' : isAlt ? 'border-[var(--warning)] bg-[var(--warning-muted)]' : 'border-[var(--border)] bg-[var(--surface)]'} ${disabled ? 'opacity-40' : ''}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover border border-[var(--border)] shrink-0 cursor-pointer" onClick={() => setPreviewImage(p.image || null)} />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={14} /></div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium truncate">{p.name}</div>
                                    <div className="text-[10px] text-[var(--fg-secondary)]">{p.code} · Est: {p.stock}{isPrimary ? ' · Principal' : ''}{isAlt ? ' · Alternativa' : ''}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button type="button" onClick={() => togglePart(p.id, group.category)}
                                    disabled={disabled && !isPrimary}
                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${isPrimary ? 'bg-[var(--fg)] text-[var(--bg)]' : disabled ? 'opacity-30 cursor-not-allowed' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--fg-muted)]'}`}>
                                    Principal
                                  </button>
                                  <button type="button" onClick={() => toggleAltPart(p.id, group.category)}
                                    disabled={disabled && !isAlt}
                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${isAlt ? 'bg-[var(--warning)] text-[var(--bg)]' : disabled ? 'opacity-30 cursor-not-allowed' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--fg-muted)]'}`}>
                                    Alternativa
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
                <Button variant="ghost" onClick={() => go(2)}>← Máquina</Button>
                <Button variant="primary" onClick={() => { if (selectedPartIds.length === 0) { toast('Selecione pelo menos uma peça principal.', 'warning'); return; } go(4); }}>Avançar →</Button>
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="grid-3x3" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">4. Revisar Formato</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Confira as informações e defina o nome antes de criar.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Configuração</span>
                    <button type="button" onClick={() => go(1)} className="text-xs text-[var(--accent-fg)] hover:underline">Editar</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><div className="text-xs text-[var(--fg-secondary)]">UO</div><div className="font-medium">{selectedUo || '—'}</div></div>
                    <div><div className="text-xs text-[var(--fg-secondary)]">Formato</div><div className="font-medium">{formatType || '—'}</div></div>
                    <div><div className="text-xs text-[var(--fg-secondary)]">Categoria</div><div className="font-medium">{category || '—'}</div></div>
                    <div><div className="text-xs text-[var(--fg-secondary)]">Diâmetro</div><div className="font-medium">{diameter ? `${diameter} mm` : '—'}</div></div>
                    <div><div className="text-xs text-[var(--fg-secondary)]">Volumetria</div><div className="font-medium">{volumeNum} {volumeUnit}</div></div>
                  </div>
                </div>

                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Máquina</span>
                    <button type="button" onClick={() => go(2)} className="text-xs text-[var(--accent-fg)] hover:underline">Editar</button>
                  </div>
                  <div className="text-sm font-medium">{selectedMachine?.name || '—'}</div>
                  <div className="text-xs text-[var(--fg-secondary)]">UO: {selectedMachine?.uo} · Linha: {selectedLine || '—'} · Linhas: {(selectedMachine?.lines || (selectedMachine?.line ? [selectedMachine.line] : [])).join(', ')}</div>
                </div>

                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Peças</span>
                    <button type="button" onClick={() => go(3)} className="text-xs text-[var(--accent-fg)] hover:underline">Editar</button>
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
                <Button variant="ghost" onClick={() => go(3)}>← Peças</Button>
                <Button variant="primary" onClick={handleSave}><Icon name="plus" size={16} />{editingId ? 'Salvar Alterações' : 'Criar Formato'}</Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
              <Icon name="check-circle" size={28} />
            </div>
            <h3 className="text-lg font-semibold mb-1">{editingId ? 'Formato atualizado com sucesso!' : 'Formato criado com sucesso!'}</h3>
            <div className="text-[14px] font-medium text-[var(--accent-fg)] mt-1 mb-1">{savedName}</div>
            <p className="text-[12px] text-[var(--fg-secondary)] mb-6">{selectedUo} · {formatType} · {volumeNum}{volumeUnit}</p>
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
          <div ref={previewRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Visualizar peça" className="relative outline-none">
            <img src={previewImage} alt="Peça" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Excluir ${selectedCount} formato${selectedCount !== 1 ? 's' : ''} selecionado${selectedCount !== 1 ? 's' : ''}?`}
        description="Esta ação não pode ser desfeita."
        onConfirm={() => {
          deleteFormatos(Array.from(selected));
          logAction({ type: 'delete', entity: 'Formato', detail: `${selectedCount} formato${selectedCount !== 1 ? 's' : ''} excluído${selectedCount !== 1 ? 's' : ''} em massa` });
          toast(`${selectedCount} formato${selectedCount !== 1 ? 's' : ''} excluído${selectedCount !== 1 ? 's' : ''} com sucesso!`);
          clearSelection();
        }}
      />
    </div>
  );
}
