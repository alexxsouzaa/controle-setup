import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { SearchInput } from '../../../components/shared/SearchInput';
import { ImagePreview } from '../../../components/ImagePreview';
import { PieceSelector } from '../../../components/shadcn-studio/command/PieceSelector';
import { Separator } from '../../../components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { resolveSetup, getFormatTypeOptions } from '../../compatibility';
import { useMachines, useProducts, usePieces, useFlows, useAddProduct, useAddFlow, useUpdateFlow, useLogAction, useConfig } from '../../../queries';
import { useAppStore } from '../../../stores/appStore';
import { useUoStore } from '../../../stores/uoStore';
import { filterByUnitScope } from '../../../lib/unitScope';
import { Machine, Product, Piece, Flow, FlowPart, Config } from '../../../types';

const STEPS = [
  { key: 'context', label: 'Contexto', num: 1 },
  { key: 'product', label: 'Produto', num: 2 },
  { key: 'config', label: 'Configuração', num: 3 },
  { key: 'review', label: 'Revisão', num: 4 },
  { key: 'done', label: 'Concluído', num: 5 },
];

interface NewProductForm {
  code: string;
  name: string;
  vol: string;
  unit: string;
  category: string;
}

interface PartSelection {
  primary: string | null;
  primaryId: string | null;
  alternative: string | null;
  alternativeId: string | null;
}

interface PartWithAlt {
  pieceId: string;
  pieceName: string;
  pieceCode: string;
  pieceCategory: string;
  group?: string;
  isPrimary?: boolean;
  available?: boolean;
  stock?: number;
  min?: number;
  unit?: string;
  compat?: string;
  name?: string;
  code?: string;
  image?: string;
  alternatives?: Array<{ piece: Piece; level: string; requiresAdjustment?: boolean }>;
}

interface ModalGroup {
  group: string;
  type: 'primary' | 'alternative';
  alternatives?: Array<{ piece: Piece; level: string; requiresAdjustment?: boolean }>;
}

export function NovoSetupPage() {
  const navigate = useNavigate();
  const { data: machines = [] } = useMachines();
  const { data: products = [] } = useProducts();
  const { data: pieces = [] } = usePieces();
  const { data: flows = [] } = useFlows();
  const { data: config = {} as Config } = useConfig();
  const { mutate: addProduct } = useAddProduct();
  const { mutate: addFlow } = useAddFlow();
  const { mutate: updateFlow } = useUpdateFlow();
  const { mutate: logAction } = useLogAction();
  const currentUser = useAppStore(s => s.currentUser);
  const activeUnitId = useUoStore(s => s.activeUnitId);
  const scopedMachines = filterByUnitScope(machines, activeUnitId);
  const scopedProducts = filterByUnitScope(products, activeUnitId);
  const scopedPieces = filterByUnitScope(pieces, activeUnitId);
  const { toast } = useToast();

  const [step, setStep] = useState<number>(1);
  const [createdFlowName, setCreatedFlowName] = useState<string>('');
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const isEditing = !!editingFlowId;

  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [machineSearch, setMachineSearch] = useState<string>('');
  const selectedMachine = machines.find((m: Machine) => m.id === selectedMachineId);

  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<NewProductForm>({ code: '', name: '', vol: '', unit: 'ml', category: '' });
  const [codeExists, setCodeExists] = useState<boolean>(false);

  const [sealingType, setSealingType] = useState<string>('');
  const [tubeDiameter, setTubeDiameter] = useState<string>('');

  const [partsWithAlternatives, setPartsWithAlternatives] = useState<PartWithAlt[]>([]);
  const [partSelections, setPartSelections] = useState<Record<string, PartSelection>>({});
  const [modalGroup, setModalGroup] = useState<ModalGroup | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('cs-edit-flow');
    if (!saved) return;
    try {
      const flow = JSON.parse(saved);
      if (!flow.id) { toast('Erro: fluxo inválido para edição.', 'warning'); sessionStorage.removeItem('cs-edit-flow'); return; }
      const currentFlow = flows.find((f: Flow) => f.id === flow.id);
      if (!currentFlow) { toast('Fluxo não encontrado. Ele pode ter sido excluído.', 'warning'); sessionStorage.removeItem('cs-edit-flow'); return; }
      setEditingFlowId(flow.id);
      const m = machines.find((mch: Machine) => mch.id === flow.machineId || mch.name === flow.machine);
      if (m) { setSelectedMachineId(m.id); setSelectedLine(flow.line || m.line || ''); }
      else { setSelectedLine(flow.line || ''); }
      const prod = products.find((p: Product) => p.id === flow.productId || p.code === flow.code);
      if (prod) { setSelectedProduct(prod); }
      else if (flow.code && flow.product) {
        setNewProduct({ code: flow.code, name: flow.product, vol: String(parseInt(flow.vol) || ''), unit: (flow.vol || '').includes('g') ? 'g' : 'ml', category: '' });
      }
      if (flow.sealingType) setSealingType(flow.sealingType);
      if (flow.tubeDiameter) setTubeDiameter(flow.tubeDiameter);
      const primaries = flow.parts?.primary || (flow.tooling || []).filter((t: Record<string, unknown>) => t.isPrimary) || [];
      const alternatives = flow.parts?.alternative || (flow.tooling || []).filter((t: Record<string, unknown>) => t.isAlternative) || [];
      const selections: Record<string, PartSelection> = {};
      [...primaries, ...alternatives].forEach((p: Record<string, unknown>) => {
        const group = (p.group || p.pieceCategory || '') as string;
        if (!selections[group]) selections[group] = { primary: null, primaryId: null, alternative: null, alternativeId: null };
        if (p.isPrimary) { selections[group].primary = p.pieceName as string; selections[group].primaryId = p.pieceId as string; }
        if (p.isAlternative) { selections[group].alternative = p.pieceName as string; selections[group].alternativeId = p.pieceId as string; }
      });
      if (Object.keys(selections).length > 0) {
        setPartSelections(selections);
        const allParts = [...primaries.map((p: Record<string, unknown>) => ({ ...p, pieceCategory: p.group || p.pieceCategory, pieceName: p.pieceName, pieceId: p.pieceId, pieceCode: p.pieceCode || '', isPrimary: true, available: true } as PartWithAlt))];
        setPartsWithAlternatives(allParts);
      }
      setStep(5);
      sessionStorage.removeItem('cs-edit-flow');
    } catch {
      toast('Erro ao carregar dados do fluxo para edição.', 'warning');
      sessionStorage.removeItem('cs-edit-flow');
    }
  }, [toast, products, machines, flows]);

  const activeProduct = useMemo(() =>
    selectedProduct || (newProduct.name && newProduct.code && newProduct.vol ? { ...newProduct, vol: Number(newProduct.vol), id: newProduct.code } as unknown as Product : null),
    [selectedProduct, newProduct]
  );

  const productFiltered = scopedProducts.filter((p: Product) =>
    productSearch && (p.name.toLowerCase().includes(productSearch) || p.code.toLowerCase().includes(productSearch))
  ).slice(0, 10);

  const goToStep = (s: number) => { if (s >= 1 && s <= 5) setStep(s); };

  const handleSelectLine = (line: string) => { setSelectedLine(line); };

  const handleProductCodeBlur = () => {
    if (newProduct.code && !selectedProduct) {
      const exists = products.some((p: Product) => p.code.toLowerCase() === newProduct.code.toLowerCase());
      setCodeExists(exists);
      if (exists) {
        const existing = products.find((p: Product) => p.code.toLowerCase() === newProduct.code.toLowerCase());
        if (existing) {
          setSelectedProduct(existing);
          setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' });
        }
      }
    }
  };

  const handleUseExistingProduct = () => {
    if (codeExists) {
      const existing = products.find((p: Product) => p.code.toLowerCase() === newProduct.code.toLowerCase());
      if (existing) {
        setSelectedProduct(existing);
        setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' });
        setCodeExists(false);
      }
    }
  };

  const handleProductNext = () => {
    if (selectedProduct) {
      goToStep(3);
    } else if (newProduct.name && newProduct.code && newProduct.vol) {
      if (codeExists) {
        toast('Já existe um produto cadastrado com este código. Use o produto existente ou corrija o código.', 'warning');
        return;
      }
      addProduct({ ...newProduct, vol: Number(newProduct.vol), created: new Date().toISOString().slice(0, 10), category: newProduct.category || '—', family: '', packaging: '', weight: '', unit: newProduct.unit || 'ml' });
      goToStep(3);
    }
  };

  const setupResolution = useMemo(() => {
    if (!selectedMachine || (!sealingType && !tubeDiameter)) return null;
    return resolveSetup(
      { sealingType, tubeDiameter: Number(tubeDiameter) || 0 },
      selectedMachine,
      scopedPieces,
    );
  }, [selectedMachine, sealingType, tubeDiameter, scopedPieces]);

  const handleSuggestSetup = () => {
    if (!setupResolution || setupResolution.parts.length === 0) return;
    const withAlts: PartWithAlt[] = setupResolution.parts.map((sp) => {
      const sameCategory = scopedPieces.filter((p: Piece) => p.category === sp.piece.category && p.id !== sp.piece.id);
      return {
        pieceId: sp.piece.id,
        pieceName: sp.piece.name,
        pieceCode: sp.piece.code || '',
        pieceCategory: sp.piece.category || sp.group,
        isPrimary: true,
        available: (sp.piece.stock || 0) > (sp.piece.min || 0),
        image: sp.piece.image,
        stock: sp.piece.stock,
        min: sp.piece.min,
        unit: sp.piece.unit,
        compat: sp.piece.compat,
        code: sp.piece.code,
        name: sp.piece.name,
        group: sp.group,
        category: sp.piece.category,
        alternatives: sameCategory.map((p: Piece) => ({
          piece: p,
          level: p.sealingType === sealingType ? 'exact' : p.diameterMin != null && Number(tubeDiameter) >= p.diameterMin && Number(tubeDiameter) <= (p.diameterMax || Infinity) ? 'range' : 'fallback',
          requiresAdjustment: false,
        })),
      };
    });
    setPartsWithAlternatives(withAlts);
    const defaults: Record<string, PartSelection> = {};
    withAlts.forEach((p: PartWithAlt) => {
      defaults[p.pieceCategory || p.group || ''] = {
        primary: p.pieceName,
        primaryId: p.pieceId,
        alternative: null,
        alternativeId: null,
      };
    });
    setPartSelections(defaults);
  };

  useEffect(() => {
    if (setupResolution && partsWithAlternatives.length === 0) {
      handleSuggestSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupResolution]);

  const handleSelectPrimary = (group: string, piece: Piece) => {
    setPartsWithAlternatives(prev => prev.map((p: PartWithAlt) => {
      if ((p.pieceCategory || p.group || '') === group) {
        const full = scopedPieces.find((pp: Piece) => pp.id === piece.id) || piece;
        const sameCategory = scopedPieces.filter((pp: Piece) => pp.category === (p.pieceCategory || group) && pp.id !== piece.id);
        return { ...full, pieceId: piece.id, pieceName: piece.name, pieceCode: piece.code || '', pieceCategory: group, isPrimary: true, available: (full.stock || 0) > (full.min || 0), alternatives: sameCategory.map((pp: Piece) => ({ piece: pp, level: pp.sealingType === sealingType ? 'exact' : 'fallback', requiresAdjustment: false })) };
      }
      return p;
    }));
    setPartSelections(prev => ({ ...prev, [group]: { ...prev[group], primary: piece.name, primaryId: piece.id, alternative: null, alternativeId: null } }));
    setModalGroup(null);
  };

  const handleSelectAlternative = (group: string, alt: { piece: Piece; level: string; requiresAdjustment?: boolean }) => {
    setPartSelections(prev => ({ ...prev, [group]: { ...prev[group], alternative: alt.piece.name, alternativeId: alt.piece.id } }));
    setModalGroup(null);
  };

  const handleSave = () => {
    const sameCodeFlows = flows.filter((f: Flow) => f.code === (activeProduct?.code || ''));
    const maxVersion = Math.max(0, ...sameCodeFlows.map((f: Flow) => parseInt((f.ver || 'V0').replace('V', '')) || 0));
    const newVersion = maxVersion + 1;
    const flowName = `${activeProduct?.code || '—'} - ${(activeProduct?.name || '').toUpperCase()} - V${newVersion}`;

    const primaryList: FlowPart[] = [];
    const alternativeList: FlowPart[] = [];
    Object.entries(partSelections).forEach(([group, sel]) => {
      if (sel.primary) {
        const piece = scopedPieces.find((p: Piece) => p.id === sel.primaryId || p.name === sel.primary);
        primaryList.push({ group, pieceName: sel.primary, pieceId: sel.primaryId || '', pieceCode: piece?.code || '', pieceCategory: group, isPrimary: true, image: piece?.image || '' } as unknown as FlowPart);
      }
      if (sel.alternative) {
        const piece = scopedPieces.find((p: Piece) => p.id === sel.alternativeId || p.name === sel.alternative);
        alternativeList.push({ group, pieceName: sel.alternative, pieceId: sel.alternativeId || '', pieceCode: piece?.code || '', pieceCategory: group, isAlternative: true, image: piece?.image || '' } as unknown as FlowPart);
      }
    });

    const flowData = {
      name: flowName,
      machine: selectedMachine?.name || '—',
      machineId: selectedMachineId,
      unitId: selectedMachine?.unitId || '',
      line: selectedLine,
      product: activeProduct?.name || '—',
      productId: activeProduct?.id || '',
      code: activeProduct?.code || '—',
      vol: activeProduct ? `${activeProduct.vol} ${activeProduct.unit || 'ml'}` : '—',
      sealingType,
      tubeDiameter,
      parts: { primary: primaryList, alternative: alternativeList },
      tooling: [...primaryList, ...alternativeList] as unknown as Record<string, unknown>[],
      toolingCount: primaryList.length,
      toolingTotal: primaryList.length + alternativeList.length,
      status: 'Concluído',
      ver: `V${newVersion}`,
      updatedAt: new Date().toISOString().slice(0, 10),
      updatedBy: currentUser,
    };

    if (isEditing) {
      if (!flows.some((f: Flow) => f.id === editingFlowId)) {
        toast('Erro: fluxo não encontrado para edição.', 'warning');
        return;
      }
      const { status: _s, ...updateData } = flowData;
      updateFlow({ id: editingFlowId!, updates: updateData });
      logAction({ type: 'update', entity: 'Fluxo', detail: `${flowName} atualizado` });
      toast('Fluxo atualizado com sucesso!');
    } else {
      addFlow({ ...flowData, createdBy: currentUser });
      logAction({ type: 'create', entity: 'Fluxo', detail: flowName });
      toast('Fluxo criado com sucesso!');
    }
    setCreatedFlowName(flowName);
    goToStep(5);
  };

  const resetAll = () => {
    setSelectedMachineId(''); setSelectedLine(''); setSelectedProduct(null);
    setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' });
    setCodeExists(false); setProductSearch('');
    setSealingType(''); setTubeDiameter('');
    setPartsWithAlternatives([]);
    setPartSelections({}); setCreatedFlowName('');
    setEditingFlowId(null); setMachineSearch('');
    goToStep(1);
  };

  return (
    <div className="p-6 pb-16">
      {isEditing && (
        <div className="flex justify-end mb-3">
          <Button variant="ghost" size="sm" onClick={() => { resetAll(); navigate('/fluxos'); }}>Cancelar edição</Button>
        </div>
      )}
      <div className="mb-6 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[8px]">
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              {i > 0 && <div className={`w-6 md:w-10 h-0.5 mx-0.5 ${i < step ? 'bg-[var(--success)]' : 'bg-[var(--border)]'} transition-colors`} />}
              <div className={`flex items-center gap-1 ${i >= step ? 'opacity-50' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step === s.num ? 'bg-[var(--fg)] text-[var(--bg)]' : step > s.num ? 'bg-[var(--success-muted)] text-[var(--success)] border-2 border-[var(--success)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-2 border-[var(--border)]'}`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-[11px] font-medium hidden sm:inline whitespace-nowrap ${step === s.num ? 'text-[var(--fg)]' : 'text-[var(--fg-secondary)]'}`}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: CONTEXTO */}
      {step === 1 && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="box" size={15} /></div>
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--fg)]">1. Selecione a máquina</h3>
              <p className="text-[11px] text-[var(--fg-secondary)]">Escolha a máquina e linha para este setup.</p>
            </div>
          </div>
          <div className="mb-4">
            <SearchInput placeholder="Buscar máquina por nome, UO ou linha..." value={machineSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMachineSearch(e.target.value.toLowerCase()); setSelectedMachineId(''); setSelectedLine(''); }} />
            {machineSearch && (() => {
              const filtered = scopedMachines.filter((m: Machine) => !machineSearch || m.name.toLowerCase().includes(machineSearch) || (m.uo || '').toLowerCase().includes(machineSearch) || (m.lines || (m.line ? [m.line] : [])).some((l: string) => l.toLowerCase().includes(machineSearch)));
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
            <p className="text-[12px] text-[var(--fg-secondary)] mb-4">Busque e selecione uma máquina acima.</p>
          )}
          {selectedMachine && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <label className="text-[12px] font-medium text-[var(--fg)] mb-2 block">Linha de produção</label>
              <div className="flex flex-wrap gap-2">
                {(selectedMachine.lines || (selectedMachine.line ? [selectedMachine.line] : [])).map((l: string) => (
                  <button key={l} type="button" onClick={() => handleSelectLine(l)}
                    className={`px-4 py-2.5 rounded-[6px] border text-[13px] font-medium transition-all ${selectedLine === l ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-secondary)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>
                    Linha {l}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between mt-6">
            <Button variant="ghost" disabled>← Anterior</Button>
            <Button variant="primary" size="sm" onClick={() => { if (selectedLine) goToStep(2); }} disabled={!selectedMachineId || !selectedLine}>Avançar →</Button>
          </div>
        </Card>
      )}

      {/* STEP 2: PRODUTO */}
      {step === 2 && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Selecionar ou cadastrar produto</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">{selectedMachine ? `Máquina ${selectedMachine.name} — Linha ${selectedLine}` : 'Escolha o produto para este setup.'}</p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button type="button" onClick={() => { setSelectedProduct(null); setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' }); setCodeExists(false); }}
              className={`p-4 rounded-[6px] border-2 text-left transition-all ${!selectedProduct && !newProduct.name ? 'border-[var(--fg)] bg-[var(--accent-muted)]' : 'border-[var(--border)] hover:border-[var(--fg-muted)]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="grid-3x3" size={18} />
                <span className="text-sm font-semibold">Produto pré-cadastrado</span>
              </div>
              <p className="text-xs text-[var(--fg-secondary)]">Selecione um produto existente no sistema</p>
            </button>
            <button type="button" onClick={() => { setSelectedProduct(null); setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' }); setCodeExists(false); setProductSearch(''); }}
              className={`p-4 rounded-[6px] border-2 text-left transition-all ${newProduct.name || newProduct.code ? 'border-[var(--fg)] bg-[var(--accent-muted)]' : 'border-[var(--border)] hover:border-[var(--fg-muted)]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="plus" size={18} />
                <span className="text-sm font-semibold">Novo produto</span>
              </div>
              <p className="text-xs text-[var(--fg-secondary)]">Cadastre um novo produto</p>
            </button>
          </div>

          <div className="mb-4">
            <SearchInput placeholder="Buscar produto por nome ou código..." value={productSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setProductSearch(e.target.value.toLowerCase()); setSelectedProduct(null); }} aria-label="Buscar produtos" />
            {productSearch && productFiltered.length > 0 && (
              <div className="border border-[var(--border)] rounded-[6px] mt-2 overflow-hidden max-h-60 overflow-y-auto">
                {productFiltered.map((p: Product) => (
                  <button key={p.id} type="button" onClick={() => { setSelectedProduct(p); setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' }); setProductSearch(''); setCodeExists(false); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${selectedProduct?.id === p.id ? 'bg-[var(--accent-muted)] text-[var(--accent-fg)]' : 'hover:bg-[var(--bg)]'}`}>
                    <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)] shrink-0"><Icon name="grid-3x3" size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-[var(--fg-secondary)]">{p.code} · {p.vol} {p.unit}</div>
                    </div>
                    {selectedProduct?.id === p.id && <Icon name="check-circle" size={16} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="mb-4 p-4 bg-[var(--accent-muted)] border border-[var(--fg)] rounded-[6px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent-fg)]">{selectedProduct.name}</div>
                  <div className="text-xs text-[var(--fg-secondary)] mt-0.5">Código: {selectedProduct.code} · {selectedProduct.category || '—'} · {selectedProduct.vol} {selectedProduct.unit}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(null); setProductSearch(''); }}>Remover</Button>
              </div>
            </div>
          )}

          {!selectedProduct && (
            <div className="border-t border-[var(--border)] pt-4 space-y-3">
              <div className="flex items-center gap-2"><span className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Novo produto</span></div>
              <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Nome do produto *</label>
                  <Input placeholder="Ex: Shampoo Nutritivo" value={newProduct.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Código *</label>
                  <Input placeholder="Ex: SHP-400-001" value={newProduct.code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewProduct({ ...newProduct, code: e.target.value }); setCodeExists(false); }} onBlur={handleProductCodeBlur} /></div>
              </div>
              <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
                <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Volumetria *</label>
                  <Input type="number" placeholder="400" min="1" value={newProduct.vol} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProduct({ ...newProduct, vol: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Unidade</label>
                  <Select value={newProduct.unit} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewProduct({ ...newProduct, unit: e.target.value })}>{['ml', 'g'].map((u: string) => <option key={u}>{u}</option>)}</Select></div>
                <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Categoria</label>
                  <Select value={newProduct.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewProduct({ ...newProduct, category: e.target.value })}>
                    <option value="">Selecione</option>
                    {['Shampoo', 'Condicionador', 'Creme', 'Sérum', 'Loção', 'Gel', 'Pomada', 'Óleo'].map((c: string) => <option key={c}>{c}</option>)}
                  </Select></div>
              </div>
              {codeExists && (
                <div className="p-3 bg-[var(--warning-muted)] border border-[var(--warning)] rounded-[6px]">
                  <div className="flex items-center gap-2">
                    <Icon name="alert" size={16} />
                    <span className="text-sm text-[var(--warning)]">Já existe um produto cadastrado com este código.</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="primary" size="sm" onClick={handleUseExistingProduct}>Usar produto existente</Button>
                    <Button variant="ghost" size="sm" onClick={() => setCodeExists(false)}>Corrigir código</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => goToStep(1)}>← Contexto</Button>
            <Button variant="primary" onClick={handleProductNext}
              disabled={!selectedProduct && (!newProduct.name || !newProduct.code || !newProduct.vol)}>
              Avançar →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: CONFIGURAÇÃO */}
      {step === 3 && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Configuração do setup</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">Informe as características do produto para sugerir as peças automaticamente.</p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Tipo de selagem</label>
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <button className="shad-select w-full flex items-center gap-2 text-left py-1.5 text-[13px]">
                    <span className="flex-1">{sealingType || 'Selecione...'}</span>
                    <ChevronDown className="size-3.5 shrink-0 text-[var(--fg-muted)]" />
                  </button>
                } />
                <DropdownMenuContent className="w-[--trigger-width] min-w-[200px]">
                  <DropdownMenuGroup>
                    {getFormatTypeOptions(selectedMachine?.uo, config).map((opt) => (
                      <DropdownMenuItem key={opt} onClick={() => { setSealingType(opt); setPartsWithAlternatives([]); setPartSelections({}); }}>
                        {opt}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Diâmetro do tubo (mm)</label>
              <Input type="number" placeholder="Ex: 35" min="1" value={tubeDiameter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTubeDiameter(e.target.value); setPartsWithAlternatives([]); setPartSelections({}); }} />
            </div>
          </div>

          {setupResolution && setupResolution.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-[var(--warning-muted)] border border-[var(--warning)] rounded-[6px]">
              <div className="flex items-start gap-2">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                <div className="text-sm text-[var(--warning)]">
                  {setupResolution.warnings.map((w, i) => <p key={i}>{w}</p>)}
                </div>
              </div>
            </div>
          )}

          {partsWithAlternatives.length > 0 && (
            <>
              <p className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-3">Peças sugeridas</p>
              <div className="flex flex-col">
                {partsWithAlternatives.map((part: PartWithAlt, idx) => {
                  const group = part.pieceCategory || part.group || '';
                  const sel = partSelections[group] || { primary: null, primaryId: null, alternative: null, alternativeId: null };
                  const primaryPiece = (sel.primary ? scopedPieces.find((p: Piece) => p.id === sel.primaryId || p.name === sel.primary) || part : part) as PartWithAlt;
                  const alt = part.alternatives || [];
                  return (
                    <React.Fragment key={group}>
                      {idx > 0 && <Separator className="my-1" />}
                    <div key={group} className="border border-[var(--border)] rounded-[6px] overflow-hidden">
                      <div className="px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide">{group}</span>
                            <Badge variant={sel.primary ? 'success' : 'warning'}>{sel.primary ? 'OK' : 'Pendente'}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[var(--fg-muted)]">
                            {alt.length > 0 && <span>{alt.length} alternativa{alt.length !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-[var(--surface)]">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {primaryPiece.image ? (
                              <img src={primaryPiece.image} alt={primaryPiece.pieceName || primaryPiece.name} className="w-9 h-9 rounded-[4px] object-cover border border-[var(--border)] shrink-0 cursor-pointer" onClick={() => setPreviewImage(primaryPiece.image || null)} />
                            ) : (
                              <div className="w-9 h-9 rounded-[4px] bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={16} /></div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{sel.primary || part.pieceName || 'Nenhuma peça selecionada'}</div>
                              <div className="text-[11px] text-[var(--fg-secondary)]">
                                {primaryPiece.pieceCode && <span className="font-mono">{primaryPiece.pieceCode}</span>}
                                {primaryPiece.stock != null && <span> · Est: {primaryPiece.stock}</span>}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setModalGroup({ group, type: 'primary' })}>{sel.primary ? 'Trocar' : 'Selecionar'}</Button>
                        </div>

                        {alt.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-9 h-9 rounded-[4px] bg-[var(--bg)] border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="wrench" size={16} /></div>
                                <div className="min-w-0 flex-1">
                                  {sel.alternative ? (
                                    <div className="text-sm font-medium truncate">{sel.alternative}</div>
                                  ) : (
                                    <div className="text-sm text-[var(--fg-muted)]">Nenhuma alternativa selecionada</div>
                                  )}
                                  <div className="text-[11px] text-[var(--fg-secondary)]">
                                    {sel.alternative ? 'Peça alternativa' : `${alt.length} disponíve${alt.length !== 1 ? 'is' : 'l'}`}
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setModalGroup({ group, type: 'alternative', alternatives: alt })}>
                                {sel.alternative ? 'Trocar' : 'Adicionar'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {alt.length === 0 && primaryPiece.available === false && (
                        <div className="px-3 pb-3">
                          <div className="p-2.5 bg-[var(--danger-muted)] border border-[var(--danger)] rounded-[4px] flex items-center gap-2">
                            <Icon name="alert" size={14} className="text-[var(--danger)] shrink-0" />
                            <span className="text-[11px] text-[var(--danger)]">Peça indisponível. Selecione manualmente.</span>
                          </div>
                        </div>
                      )}
                    </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}

          {!sealingType && !tubeDiameter && (
            <div className="py-6 text-center border-t border-[var(--border)] pt-6">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                <Icon name="box" size={24} />
              </div>
              <p className="text-sm font-medium mb-1">Preencha as características</p>
              <p className="text-xs text-[var(--fg-secondary)]">Informe o tipo de selagem e/ou diâmetro para que o motor de compatibilidade sugira as peças ideais.</p>
            </div>
          )}

          {sealingType && !setupResolution?.parts?.length && partsWithAlternatives.length === 0 && (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                <Icon name="alert" size={24} />
              </div>
              <p className="text-sm font-medium mb-1">Nenhuma peça compatível encontrada</p>
              <p className="text-xs text-[var(--fg-secondary)]">Não há peças cadastradas que correspondam às características informadas. Cadastre novas peças ou ajuste os critérios.</p>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => goToStep(2)}>← Produto</Button>
            <Button variant="primary" onClick={() => goToStep(4)} disabled={!Object.values(partSelections).some(s => s.primary)}>Revisar →</Button>
          </div>
        </Card>
      )}

      {modalGroup && (
        <PieceSelector
          open={!!modalGroup}
          onOpenChange={(open) => { if (!open) setModalGroup(null); }}
          pieces={modalGroup.type === 'alternative' && modalGroup.alternatives
            ? modalGroup.alternatives.map(a => a.piece)
            : scopedPieces.filter(p => p.category === modalGroup.group)
          }
          selectedId={modalGroup.type === 'primary'
            ? partSelections[modalGroup.group]?.primaryId
            : partSelections[modalGroup.group]?.alternativeId
          }
          onSelect={(piece) => {
            if (modalGroup.type === 'alternative') {
              const alt = modalGroup.alternatives?.find(a => a.piece.id === piece.id);
              if (alt) handleSelectAlternative(modalGroup.group, alt);
            } else {
              handleSelectPrimary(modalGroup.group, piece);
            }
          }}
          title={modalGroup.type === 'primary' ? `Selecionar peça principal - ${modalGroup.group}` : `Selecionar peça alternativa - ${modalGroup.group}`}
        />
      )}



      {/* STEP 4: REVISÃO */}
      {step === 4 && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Revise o setup</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">Confira as informações antes de salvar o fluxo.</p>

          <div className="space-y-4">
            <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Informações de produção</span>
                <button type="button" onClick={() => goToStep(1)} className="text-xs text-[var(--accent-fg)] hover:underline">Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-[var(--fg-secondary)]">Máquina</div><div className="font-medium">{selectedMachine?.name || '—'}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Linha</div><div className="font-medium">{selectedLine || '—'}</div></div>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Produto</span>
                <button type="button" onClick={() => goToStep(2)} className="text-xs text-[var(--accent-fg)] hover:underline">Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-[var(--fg-secondary)]">Nome</div><div className="font-medium">{activeProduct?.name || '—'}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Código</div><div className="font-medium font-mono">{activeProduct?.code || '—'}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Volumetria</div><div className="font-medium">{activeProduct?.vol} {activeProduct?.unit || 'ml'}</div></div>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Características</span>
                <button type="button" onClick={() => goToStep(3)} className="text-xs text-[var(--accent-fg)] hover:underline">Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-[var(--fg-secondary)]">Tipo de selagem</div><div className="font-medium">{sealingType || '—'}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Diâmetro do tubo</div><div className="font-medium">{tubeDiameter ? `${tubeDiameter} mm` : '—'}</div></div>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Peças principais</span>
                <button type="button" onClick={() => goToStep(3)} className="text-xs text-[var(--accent-fg)] hover:underline">Editar</button>
              </div>
              {Object.entries(partSelections).filter(([, s]) => s.primary).length === 0 ? (
                <p className="text-sm text-[var(--fg-muted)]">Nenhuma peça configurada.</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(partSelections).filter(([, s]) => s.primary).map(([group, sel]) => (
                    <div key={group} className="flex items-center gap-2 text-sm">
                      <Icon name="check-circle" size={14} className="text-[var(--success)]" />
                      <span className="text-[var(--fg-secondary)]">{group}:</span>
                      <span className="font-medium">{sel.primary}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {Object.entries(partSelections).some(([, s]) => s.alternative) && (
              <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Peças alternativas</span>
                <button type="button" onClick={() => goToStep(3)} className="text-xs text-[var(--accent-fg)] hover:underline">Editar</button>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(partSelections).filter(([, s]) => s.alternative).map(([group, sel]) => (
                    <div key={group} className="flex items-center gap-2 text-sm">
                      <Icon name="wrench" size={14} className="text-[var(--warning)]" />
                      <span className="text-[var(--fg-secondary)]">{group}:</span>
                      <span className="font-medium">{sel.alternative}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2 block">Metadados</span>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-[var(--fg-secondary)]">Criado por</div><div className="font-medium">{currentUser}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Data</div><div className="font-medium">{new Date().toISOString().slice(0, 10)}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Status inicial</div><div className="font-medium"><Badge variant="success">Ativo</Badge></div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Versão</div><div className="font-medium font-mono">V{flows.filter((f: Flow) => f.code === (activeProduct?.code || '')).length + 1}</div></div>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => goToStep(3)}>← Configuração</Button>
            <Button variant="primary" onClick={handleSave}>Salvar fluxo</Button>
          </div>
        </Card>
      )}

      {/* STEP 5: CONCLUÍDO */}
      {step === 5 && (
        <div className="max-w-lg mx-auto">
          <Card>
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
                <Icon name="check-circle" size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-1">{isEditing ? 'Fluxo atualizado!' : 'Fluxo criado!'}</h3>
              <div className="text-[14px] font-medium text-[var(--fg)] mt-1 mb-1">{createdFlowName}</div>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-6">{isEditing ? 'Disponível para utilização.' : 'O fluxo foi salvo e está disponível.'}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" size="sm" onClick={() => navigate('/fluxos')}>
                  <Icon name="grid-3x3" size={14} />Ver fluxos
                </Button>
                <Button variant="secondary" size="sm" onClick={resetAll}>
                  <Icon name="plus" size={14} />Criar novo fluxo
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {previewImage && <ImagePreview src={previewImage} alt="Foto da peça" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
