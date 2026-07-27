import { useState, useContext, useMemo, useEffect } from 'react';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { ImagePreview } from '../components/ImagePreview';
import { suggestFormatos, suggestPrimaryParts, suggestAlternativeParts } from '../utils/compatibility';
import { useMachines, useProducts, usePieces, useFlows, useFormatos, useAddProduct, useAddFlow, useUpdateFlow, useLogAction } from '../queries';
import { useAppStore } from '../stores/appStore';
import { Machine, Product, Piece, Flow, Formato, FlowPart } from '../types';

const STEPS = [
  { key: 'context', label: 'Contexto', num: 1 },
  { key: 'product', label: 'Produto', num: 2 },
  { key: 'format', label: 'Formato', num: 3 },
  { key: 'setup', label: 'Setup', num: 4 },
  { key: 'review', label: 'Revisão', num: 5 },
  { key: 'done', label: 'Concluído', num: 6 },
];

const COMPAT_COLORS: Record<string, string> = { Alta: 'success', Média: 'warning', Baixa: 'info', Ideal: 'success', Condicional: 'warning' };

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

export function NovoSetupPage({ navigate }: { navigate: (path: string) => void }) {
  const { data: machines = [] } = useMachines();
  const { data: products = [] } = useProducts();
  const { data: pieces = [] } = usePieces();
  const { data: flows = [] } = useFlows();
  const { data: formatos = [] } = useFormatos();
  const { mutate: addProduct } = useAddProduct();
  const { mutate: addFlow } = useAddFlow();
  const { mutate: updateFlow } = useUpdateFlow();
  const { mutate: logAction } = useLogAction();
  const currentUser = useAppStore(s => s.currentUser);
  const { toast } = useContext(ToastContext) as { toast: (msg: string, type?: string) => void };

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

  const [selectedFormato, setSelectedFormato] = useState<Formato | null>(null);
  const [showFormatList, setShowFormatList] = useState<boolean>(false);

  const [partsWithAlternatives, setPartsWithAlternatives] = useState<PartWithAlt[]>([]);
  const [partSelections, setPartSelections] = useState<Record<string, PartSelection>>({});
  const [modalGroup, setModalGroup] = useState<ModalGroup | null>(null);
  const [pieceSearch, setPieceSearch] = useState<string>('');
  const [piecePage, setPiecePage] = useState<number>(1);
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
      if (flow.formatId) {
        const fmt = formatos.find((f: Formato) => f.id === flow.formatId);
        if (fmt) setSelectedFormato(fmt);
      }
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
    } catch (e) {
      toast('Erro ao carregar dados do fluxo para edição.', 'warning');
      sessionStorage.removeItem('cs-edit-flow');
    }
  }, []);

  const activeProduct = useMemo(() =>
    selectedProduct || (newProduct.name && newProduct.code && newProduct.vol ? { ...newProduct, vol: Number(newProduct.vol), id: newProduct.code } as unknown as Product : null),
    [selectedProduct, newProduct]
  );

  const suggestedFormats = useMemo(() => {
    if (!activeProduct || !selectedMachine) return [];
    return suggestFormatos(selectedMachine, activeProduct, formatos);
  }, [activeProduct, selectedMachine, formatos]);

  const productFiltered = products.filter((p: Product) =>
    productSearch && (p.name.toLowerCase().includes(productSearch) || p.code.toLowerCase().includes(productSearch))
  ).slice(0, 10);

  const goToStep = (s: number) => { if (s >= 1 && s <= 6) setStep(s); };

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

  const handleConfirmFormat = (fmt: Formato | { pieces: never[] }) => {
    setSelectedFormato(fmt as Formato);
    const primaries = suggestPrimaryParts(fmt as Formato, pieces);
    const withAlts = suggestAlternativeParts(primaries, selectedMachine, pieces);
    setPartsWithAlternatives(withAlts);
    const defaults: Record<string, PartSelection> = {};
    withAlts.forEach((p: PartWithAlt) => {
      defaults[p.pieceCategory || p.group || ''] = {
        primary: p.pieceName,
        primaryId: p.pieceId,
        alternative: p.alternatives && p.alternatives.length > 0 ? p.alternatives[0].piece.name : null,
        alternativeId: p.alternatives && p.alternatives.length > 0 ? p.alternatives[0].piece.id : null,
      };
    });
    setPartSelections(defaults);
    goToStep(4);
  };

  const handleSelectPrimary = (group: string, piece: Piece) => {
    setPartsWithAlternatives(prev => prev.map((p: PartWithAlt) => {
      if ((p.pieceCategory || p.group || '') === group) {
        const full = pieces.find((pp: Piece) => pp.id === piece.id) || piece;
        const alts = suggestAlternativeParts([{
          pieceId: piece.id,
          pieceName: piece.name,
          pieceCode: piece.code || '',
          pieceCategory: p.pieceCategory || group,
        }], selectedMachine, pieces);
        return { ...full, pieceId: piece.id, pieceName: piece.name, pieceCode: piece.code || '', pieceCategory: group, isPrimary: true, available: (full.stock || 0) > (full.min || 0), alternatives: alts[0]?.alternatives || [] };
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

  const piecesForCategory = (category: string) => pieces.filter((p: Piece) => p.category === category);

  const handleSave = () => {
    const sameCodeFlows = flows.filter((f: Flow) => f.code === (activeProduct?.code || ''));
    const maxVersion = Math.max(0, ...sameCodeFlows.map((f: Flow) => parseInt((f.ver || 'V0').replace('V', '')) || 0));
    const newVersion = maxVersion + 1;
    const flowName = `${activeProduct?.code || '—'} - ${(activeProduct?.name || '').toUpperCase()} - V${newVersion}`;

    const primaryList: FlowPart[] = [];
    const alternativeList: FlowPart[] = [];
    Object.entries(partSelections).forEach(([group, sel]) => {
      if (sel.primary) {
        const piece = pieces.find((p: Piece) => p.id === sel.primaryId || p.name === sel.primary);
        primaryList.push({ group, pieceName: sel.primary, pieceId: sel.primaryId || '', pieceCode: piece?.code || '', pieceCategory: group, isPrimary: true, image: piece?.image || '' } as unknown as FlowPart);
      }
      if (sel.alternative) {
        const piece = pieces.find((p: Piece) => p.id === sel.alternativeId || p.name === sel.alternative);
        alternativeList.push({ group, pieceName: sel.alternative, pieceId: sel.alternativeId || '', pieceCode: piece?.code || '', pieceCategory: group, isAlternative: true, image: piece?.image || '' } as unknown as FlowPart);
      }
    });

    const flowData = {
      name: flowName,
      machine: selectedMachine?.name || '—',
      machineId: selectedMachineId,
      line: selectedLine,
      product: activeProduct?.name || '—',
      productId: activeProduct?.id || '',
      code: activeProduct?.code || '—',
      vol: activeProduct ? `${activeProduct.vol} ${activeProduct.unit || 'ml'}` : '—',
      formatId: selectedFormato?.id || '',
      formatoName: selectedFormato?.name || '',
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
    goToStep(6);
  };

  const resetAll = () => {
    setSelectedMachineId(''); setSelectedLine(''); setSelectedProduct(null);
    setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' });
    setCodeExists(false); setProductSearch('');
    setSelectedFormato(null); setShowFormatList(false);
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
              className={`p-4 rounded-[6px] border-2 text-left transition-all ${!selectedProduct && !newProduct.name ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="grid-3x3" size={18} />
                <span className="text-sm font-semibold">Produto pré-cadastrado</span>
              </div>
              <p className="text-xs text-[var(--fg-secondary)]">Selecione um produto existente no sistema</p>
            </button>
            <button type="button" onClick={() => { setSelectedProduct(null); setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' }); setCodeExists(false); setProductSearch(''); }}
              className={`p-4 rounded-[6px] border-2 text-left transition-all ${newProduct.name || newProduct.code ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="plus" size={18} />
                <span className="text-sm font-semibold">Novo produto</span>
              </div>
              <p className="text-xs text-[var(--fg-secondary)]">Cadastre um novo produto</p>
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)] pointer-events-none"><Icon name="search" size={16} /></span>
              <input className="shad-input pl-9" placeholder="Buscar produto por nome ou código..." value={productSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setProductSearch(e.target.value.toLowerCase()); setSelectedProduct(null); }} aria-label="Buscar produtos" />
            </div>
            {productSearch && productFiltered.length > 0 && (
              <div className="border border-[var(--border)] rounded-[6px] mt-2 overflow-hidden max-h-60 overflow-y-auto">
                {productFiltered.map((p: Product) => (
                  <button key={p.id} type="button" onClick={() => { setSelectedProduct(p); setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' }); setProductSearch(''); setCodeExists(false); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${selectedProduct?.id === p.id ? 'bg-[var(--accent-muted)] text-[var(--accent)]' : 'hover:bg-[var(--bg)]'}`}>
                    <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)] shrink-0"><Icon name="grid-3x3" size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-[var(--fg-secondary)]">{p.code} · {p.vol} {p.unit}{p.image ? ` · ${p.image}` : ''}</div>
                    </div>
                    {selectedProduct?.id === p.id && <Icon name="check-circle" size={16} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="mb-4 p-4 bg-[var(--accent-muted)] border border-[var(--accent)] rounded-[6px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent)]">{selectedProduct.name}</div>
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

      {/* STEP 3: FORMATO */}
      {step === 3 && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Formato recomendado</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">Com base nas características do produto e na máquina selecionada, encontramos os formatos compatíveis.</p>

          {activeProduct && (
            <div className="mb-4 p-3 bg-[var(--bg)] rounded-[6px] border border-[var(--border)] text-sm">
              <span className="font-medium">{activeProduct.name}</span>
              <span className="text-[var(--fg-secondary)]"> · {activeProduct.code} · {activeProduct.vol} {activeProduct.unit || 'ml'}</span>
              <span className="text-[var(--fg-secondary)]"> · Máquina {selectedMachine?.name}</span>
            </div>
          )}

          {suggestedFormats.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                <Icon name="alert" size={24} />
              </div>
              <p className="text-sm font-medium mb-1">Nenhum formato compatível encontrado</p>
              <p className="text-xs text-[var(--fg-secondary)] mb-4">Não existem formatos cadastrados para este produto. Cadastre um formato ou selecione as peças manualmente.</p>
              <div className="flex gap-2 justify-center">
                <Button variant="secondary" size="sm" onClick={() => navigate('/formatos')}>Cadastrar formato</Button>
                <Button variant="primary" size="sm" onClick={() => { setSelectedFormato(null); handleConfirmFormat({ pieces: [] } as unknown as Formato); }}>Continuar sem formato</Button>
              </div>
            </div>
          ) : !showFormatList && suggestedFormats[0] ? (
            <div className="space-y-4">
              <div className="p-5 rounded-[6px] border-2 border-[var(--accent)] bg-[var(--accent-muted)]">
                <div className="flex items-center gap-2 mb-2">
                   <Badge variant={COMPAT_COLORS[suggestedFormats[0].level] as 'success' | 'warning' | 'danger' | 'info' | 'secondary'}>Recomendado</Badge>
                  <Badge variant={COMPAT_COLORS[suggestedFormats[0].level] as 'success' | 'warning' | 'danger' | 'info' | 'secondary'}>{suggestedFormats[0].level}</Badge>
                </div>
                <div className="text-base font-semibold">{suggestedFormats[0].formato.name}</div>
                <div className="text-sm text-[var(--fg-secondary)] mt-1">
                  {((suggestedFormats[0].formato as unknown as Record<string, string>).tipo) && <span>{(suggestedFormats[0].formato as unknown as Record<string, string>).tipo} · </span>}
                  {suggestedFormats[0].formato.pieces && <span>{suggestedFormats[0].formato.pieces.length} peça{suggestedFormats[0].formato.pieces.length !== 1 ? 's' : ''}</span>}
                  {((suggestedFormats[0].formato as unknown as Record<string, number>).volMin) != null && <span> · {(suggestedFormats[0].formato as unknown as Record<string, string>).volMin as string}–{(suggestedFormats[0].formato as unknown as Record<string, string>).volMax as string} ml</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(suggestedFormats[0].formato.pieces || []).slice(0, 5).map((p) => (
                    <Badge key={p.pieceId as string}>{p.pieceName as string}</Badge>
                  ))}
                  {(suggestedFormats[0]!.formato.pieces || []).length > 5 && <Badge>+{suggestedFormats[0]!.formato.pieces!.length - 5}</Badge>}
                </div>
              </div>
              {suggestedFormats.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Outros formatos compatíveis</p>
                  {suggestedFormats.slice(1).map(({ formato, level }) => (
                    <div key={formato.id} className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{formato.name}</div>
                          <div className="text-xs text-[var(--fg-secondary)]">
                            {((formato as unknown as Record<string, string>).tipo) && <span>{(formato as unknown as Record<string, string>).tipo} · </span>}
                            {formato.pieces && <span>{formato.pieces.length} peça{formato.pieces.length !== 1 ? 's' : ''} · </span>}
                            Compatibilidade: {level}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleConfirmFormat(formato)}>Selecionar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="primary" onClick={() => handleConfirmFormat(suggestedFormats[0].formato)}>Confirmar formato</Button>
                <Button variant="ghost" onClick={() => setShowFormatList(true)}>Escolher outro formato</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedFormats.map(({ formato, level }) => (
                <button key={formato.id} type="button" onClick={() => handleConfirmFormat(formato)}
                  className={`w-full text-left p-4 rounded-[6px] border-2 transition-all ${selectedFormato?.id === formato.id ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{formato.name}</span>
                        <Badge variant={COMPAT_COLORS[level] as 'success' | 'warning' | 'danger' | 'info' | 'secondary'}>Compatibilidade: {level}</Badge>
                      </div>
                      <div className="text-xs text-[var(--fg-secondary)]">
                        {((formato as unknown as Record<string, string>).tipo) && <span>{(formato as unknown as Record<string, string>).tipo} · </span>}
                        {formato.pieces && <span>{formato.pieces.length} peça{formato.pieces.length !== 1 ? 's' : ''}</span>}
                        {((formato as unknown as Record<string, number>).volMin) != null && <span> · {(formato as unknown as Record<string, string>).volMin as string}–{(formato as unknown as Record<string, string>).volMax as string} ml</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(formato.pieces || []).slice(0, 5).map((p) => <Badge key={p.pieceId as string}>{p.pieceName as string}</Badge>)}
                      </div>
                    </div>
                    <Icon name="arrow-right" size={18} />
                  </div>
                </button>
              ))}
              <Button variant="ghost" onClick={() => handleConfirmFormat({ pieces: [] } as unknown as Formato)}>Continuar sem formato</Button>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => goToStep(2)}>← Produto</Button>
            <div />
          </div>
        </Card>
      )}

      {/* STEP 4: SETUP (PEÇAS) */}
      {step === 4 && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Configuração das peças</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">
            {selectedFormato ? `Peças sugeridas pelo formato "${selectedFormato.name}".` : 'Selecione manualmente as peças para cada componente.'}
          </p>

          {partsWithAlternatives.length === 0 && (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                <Icon name="box" size={24} />
              </div>
              <p className="text-sm font-medium mb-1">Nenhuma peça sugerida</p>
              <p className="text-xs text-[var(--fg-secondary)] mb-4">Não foi possível sugerir peças automaticamente. Selecione manualmente.</p>
            </div>
          )}

          <div className="space-y-3">
            {partsWithAlternatives.map((part: PartWithAlt) => {
              const group = part.pieceCategory || part.group || '';
              const sel = partSelections[group] || { primary: null, primaryId: null, alternative: null, alternativeId: null };
              const primaryPiece = (sel.primary ? pieces.find((p: Piece) => p.id === sel.primaryId || p.name === sel.primary) || part : part) as PartWithAlt;
              const alt = part.alternatives || [];
              return (
                <div key={group} className="border border-[var(--border)] rounded-[6px] overflow-hidden">
                  <div className="p-4 bg-[var(--bg)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${sel.primary ? 'bg-[var(--success)] text-white' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border border-[var(--border)]'}`}>
                          {sel.primary ? '✓' : '!'}
                        </div>
                        <span className="text-sm font-semibold uppercase tracking-wide">{group}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[6px] border border-[var(--border)]">
                      {primaryPiece.image ? (
                        <img src={primaryPiece.image} alt={primaryPiece.pieceName || primaryPiece.name} className="w-10 h-10 rounded-[6px] object-cover border border-[var(--border)] shrink-0 cursor-pointer" onClick={() => setPreviewImage(primaryPiece.image || null)} />
                      ) : (
                        <div className="w-10 h-10 rounded-[6px] bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={18} /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{sel.primary || part.pieceName || '—'}</span>
                          <Badge variant={sel.primary ? 'success' : 'warning'}>{sel.primary ? 'Principal' : 'Pendente'}</Badge>
                        </div>
                        <div className="text-xs text-[var(--fg-secondary)]">
                          {primaryPiece.pieceCode && <span className="font-mono">{primaryPiece.pieceCode}</span>}
                          {primaryPiece.stock != null && <span> · Estoque: {primaryPiece.stock} {primaryPiece.unit || 'un'}</span>}
                          {primaryPiece.compat && <span> · Compat: {primaryPiece.compat}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setModalGroup({ group, type: 'primary' })}>Alterar</Button>
                    </div>

                    {alt.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-[var(--fg-secondary)] mb-1.5 font-medium">Peça alternativa</p>
                        {sel.alternative ? (
                          <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-[6px] border border-dashed border-[var(--border)]">
                            <div className="w-10 h-10 rounded-[6px] bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="wrench" size={18} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{sel.alternative}</span>
                                <Badge>Alternativa</Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setModalGroup({ group, type: 'alternative', alternatives: alt })}>Alterar</Button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setModalGroup({ group, type: 'alternative', alternatives: alt })}
                            className="w-full p-3 bg-[var(--surface)] rounded-[6px] border border-dashed border-[var(--border)] text-sm text-[var(--fg-secondary)] hover:border-[var(--accent)] transition-colors text-left">
                            + Adicionar peça alternativa ({alt.length} disponíve{alt.length !== 1 ? 'is' : 'l'})
                          </button>
                        )}
                      </div>
                    )}

                    {alt.length === 0 && primaryPiece.available === false && (
                      <div className="mt-3 p-3 bg-[var(--danger-muted)] border border-[var(--danger)] rounded-[6px]">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name="alert" size={16} />
                          <span className="text-sm font-medium text-[var(--danger)]">Peça principal indisponível</span>
                        </div>
                        <p className="text-xs text-[var(--fg-secondary)]">Nenhuma alternativa encontrada. Selecione manualmente ou revise os dados.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {modalGroup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setModalGroup(null); setPieceSearch(''); setPiecePage(1); }}>
              <div className="absolute inset-0 bg-[var(--overlay)]" />
              <div role="dialog" aria-modal="true" aria-label={`Selecionar peça para ${modalGroup.group}`} className="relative bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 z-10" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold">{modalGroup.group}</h3>
                    <p className="text-xs text-[var(--fg-secondary)] mt-0.5">{modalGroup.type === 'primary' ? 'Selecionar peça principal' : 'Selecionar peça alternativa'}</p>
                    <div className="relative mt-2">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none"><Icon name="search" size={14} /></span>
                      <input className="shad-input pl-8 py-1.5 text-xs" placeholder="Buscar peça..." value={pieceSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPieceSearch(e.target.value); setPiecePage(1); }} />
                    </div>
                  </div>
                  <button type="button" onClick={() => { setModalGroup(null); setPieceSearch(''); setPiecePage(1); }} className="p-1 rounded hover:bg-[var(--bg)] text-[var(--fg-secondary)] shrink-0 ml-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto -mx-6 px-6" style={{ minHeight: 150 }}>
                  {modalGroup.type === 'alternative' && modalGroup.alternatives ? (
                    modalGroup.alternatives.length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-xs text-[var(--fg-muted)]">Nenhuma alternativa encontrada.</div>
                    ) : (
                      <div className="space-y-2">
                        {modalGroup.alternatives.filter((a: { piece: Piece; level: string; requiresAdjustment?: boolean }) => !pieceSearch || a.piece.name.toLowerCase().includes(pieceSearch) || (a.piece.code || '').toLowerCase().includes(pieceSearch)).map((a: { piece: Piece; level: string; requiresAdjustment?: boolean }, i: number) => (
                          <button key={i} type="button" onClick={() => handleSelectAlternative(modalGroup.group, a)}
                            className={`w-full text-left px-3 py-2.5 rounded-[6px] border text-sm transition-all flex items-center gap-3 ${partSelections[modalGroup.group]?.alternativeId === a.piece.id ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                            <div className="w-9 h-9 rounded-[6px] bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="wrench" size={16} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{a.piece.name}</div>
                              <div className="flex items-center gap-2 text-[11px] text-[var(--fg-secondary)]">
                                {a.piece.code && <span className="font-mono">{a.piece.code}</span>}
                                <span>· Compat: {a.level}</span>
                                {a.piece.stock != null && <span>· Est: {a.piece.stock}</span>}
                                {a.requiresAdjustment && <span className="text-[var(--warning)]">· Requer ajuste</span>}
                              </div>
                            </div>
                            {partSelections[modalGroup.group]?.alternativeId === a.piece.id && <Badge variant="success">Selecionado</Badge>}
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    (() => {
                      const catPieces = piecesForCategory(modalGroup.group);
                      const filtered = pieceSearch ? catPieces.filter((p: Piece) => p.name.toLowerCase().includes(pieceSearch) || p.code.toLowerCase().includes(pieceSearch)) : catPieces;
                      const perPage = 8;
                      const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
                      const paged = filtered.slice((piecePage - 1) * perPage, piecePage * perPage);
                      if (catPieces.length === 0) return <div className="flex items-center justify-center h-24 text-center"><p className="text-sm text-[var(--fg-muted)]">Nenhuma peça na categoria "{modalGroup.group}".</p></div>;
                      if (filtered.length === 0) return <div className="flex items-center justify-center h-24 text-xs text-[var(--fg-muted)]">Nenhuma peça encontrada.</div>;
                      return (
                        <>
                          <div className="space-y-2">
                            {paged.map((p: Piece) => (
                              <button key={p.id} type="button" onClick={() => handleSelectPrimary(modalGroup.group, p)}
                                className={`w-full text-left px-3 py-2.5 rounded-[6px] border text-sm transition-all flex items-center gap-3 ${partSelections[modalGroup.group]?.primaryId === p.id ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                                {p.image ? (
                                  <button type="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setPreviewImage(p.image || null); }}>
                                    <img src={p.image} alt={p.name} className="w-9 h-9 rounded-[6px] object-cover border border-[var(--border)] shrink-0 hover:ring-2 hover:ring-[var(--accent)] transition-all cursor-pointer" />
                                  </button>
                                ) : (
                                  <div className="w-9 h-9 rounded-[6px] bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={16} /></div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{p.name}</div>
                                  <div className="flex items-center gap-2 text-[11px] text-[var(--fg-secondary)]">
                                    <span className="font-mono">{p.code}</span>
                                    <span>· Est: {p.stock} {p.unit || 'un'}</span>
                                  </div>
                                </div>
                                {partSelections[modalGroup.group]?.primaryId === p.id && <Icon name="check-circle" size={16} />}
                              </button>
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-1 mt-3">
                              <button type="button" onClick={() => setPiecePage(p => Math.max(1, p - 1))} disabled={piecePage === 1} className={`w-7 h-7 rounded text-[11px] ${piecePage === 1 ? 'text-[var(--fg-muted)] opacity-30' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)]'}`}>‹</button>
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg: number) => (
                                <button key={pg} onClick={() => setPiecePage(pg)} className={`w-7 h-7 rounded text-[11px] ${pg === piecePage ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)]'}`}>{pg}</button>
                              ))}
                              <button type="button" onClick={() => setPiecePage(p => Math.min(totalPages, p + 1))} disabled={piecePage === totalPages} className={`w-7 h-7 rounded text-[11px] ${piecePage === totalPages ? 'text-[var(--fg-muted)] opacity-30' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)]'}`}>›</button>
                            </div>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)]"><Button variant="ghost" onClick={() => { setModalGroup(null); setPieceSearch(''); setPiecePage(1); }} className="w-full">Fechar</Button></div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => goToStep(3)}>← Formato</Button>
            <Button variant="primary" onClick={() => goToStep(5)}>Avançar →</Button>
          </div>
        </Card>
      )}

      {/* STEP 5: REVISÃO */}
      {step === 5 && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Revise o setup</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">Confira as informações antes de salvar o fluxo.</p>

          <div className="space-y-4">
            <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Informações de produção</span>
                <button type="button" onClick={() => goToStep(1)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-[var(--fg-secondary)]">Máquina</div><div className="font-medium">{selectedMachine?.name || '—'}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Linha</div><div className="font-medium">{selectedLine || '—'}</div></div>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Produto</span>
                <button type="button" onClick={() => goToStep(2)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-[var(--fg-secondary)]">Nome</div><div className="font-medium">{activeProduct?.name || '—'}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Código</div><div className="font-medium font-mono">{activeProduct?.code || '—'}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Volumetria</div><div className="font-medium">{activeProduct?.vol} {activeProduct?.unit || 'ml'}</div></div>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Formato</span>
                <button type="button" onClick={() => goToStep(3)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
              </div>
              <div className="text-sm font-medium">{selectedFormato?.name || 'Nenhum formato selecionado'}</div>
              {selectedFormato?.tipo && <div className="text-xs text-[var(--fg-secondary)] mt-0.5">Tipo: {selectedFormato.tipo}</div>}
            </div>

            <div className="p-4 bg-[var(--bg)] rounded-[6px] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Peças principais</span>
                <button type="button" onClick={() => goToStep(4)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
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
                  <button type="button" onClick={() => goToStep(4)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
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
            <Button variant="ghost" onClick={() => goToStep(4)}>← Setup</Button>
            <Button variant="primary" onClick={handleSave}>Salvar fluxo</Button>
          </div>
        </Card>
      )}

      {/* STEP 6: CONCLUÍDO */}
      {step === 6 && (
        <div className="max-w-lg mx-auto">
          <Card>
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
                <Icon name="check-circle" size={28} />
              </div>
              <h3 className="text-[16px] font-semibold mb-1">{isEditing ? 'Fluxo atualizado!' : 'Fluxo criado!'}</h3>
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
