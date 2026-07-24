import { useState, useContext, useMemo, useEffect } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { ImagePreview } from '../components/ImagePreview';
import { suggestFormatos, suggestPrimaryParts, suggestAlternativeParts, collectLines } from '../utils/compatibility';

const STEPS = [
  { key: 'context', label: 'Contexto', num: 1 },
  { key: 'product', label: 'Produto', num: 2 },
  { key: 'format', label: 'Formato', num: 3 },
  { key: 'setup', label: 'Setup', num: 4 },
  { key: 'review', label: 'Revisão', num: 5 },
  { key: 'done', label: 'Concluído', num: 6 },
];

const COMPAT_COLORS = { Alta: 'success', Média: 'warning', Baixa: 'info', Ideal: 'success', Condicional: 'warning' };

export function NovoSetupPage({ navigate }) {
  const ctx = useContext(AppDataContext);
  const { machines, products, pieces, flows, formatos, addProduct, addFlow, updateFlow, logAction, getCurrentUser } = ctx;
  const { toast } = useContext(ToastContext);

  const [step, setStep] = useState(1);
  const [createdFlowName, setCreatedFlowName] = useState('');
  const [editingFlowId, setEditingFlowId] = useState(null);
  const isEditing = !!editingFlowId;

  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ code: '', name: '', vol: '', unit: 'ml', category: '' });
  const [codeExists, setCodeExists] = useState(false);

  const [selectedFormato, setSelectedFormato] = useState(null);
  const [showFormatList, setShowFormatList] = useState(false);

  const [partsWithAlternatives, setPartsWithAlternatives] = useState([]);
  const [partSelections, setPartSelections] = useState({});
  const [modalGroup, setModalGroup] = useState(null);
  const [pieceSearch, setPieceSearch] = useState('');
  const [piecePage, setPiecePage] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);

  const lines = useMemo(() => collectLines(machines), [machines]);
  const machineLines = useMemo(() => lines.filter(l => selectedMachine && l === selectedMachine.line), [selectedMachine, lines]);

  useEffect(() => {
    const saved = sessionStorage.getItem('cs-edit-flow');
    if (!saved) return;
    try {
      const flow = JSON.parse(saved);
      setEditingFlowId(flow.id);
      const m = machines.find(mch => mch.id === flow.machineId || mch.name === flow.machine);
      if (m) { setSelectedMachineId(m.id); setSelectedLine(flow.line || m.line); }
      else { setSelectedLine(flow.line || ''); }
      const prod = products.find(p => p.id === flow.productId || p.code === flow.code);
      if (prod) { setSelectedProduct(prod); }
      else if (flow.code && flow.product) {
        setNewProduct({ code: flow.code, name: flow.product, vol: String(parseInt(flow.vol) || ''), unit: (flow.vol || '').includes('g') ? 'g' : 'ml', category: '' });
      }
      if (flow.formatId) {
        const fmt = formatos.find(f => f.id === flow.formatId);
        if (fmt) setSelectedFormato(fmt);
      }
      const primaries = flow.parts?.primary || [];
      const alternatives = flow.parts?.alternative || [];
      const selections = {};
      [...primaries, ...alternatives].forEach(p => {
        const group = p.group || p.pieceCategory || '';
        if (!selections[group]) selections[group] = {};
        if (p.isPrimary) { selections[group].primary = p.pieceName; selections[group].primaryId = p.pieceId; }
        if (p.isAlternative) { selections[group].alternative = p.pieceName; selections[group].alternativeId = p.pieceId; }
      });
      if (Object.keys(selections).length > 0) {
        setPartSelections(selections);
        const allParts = [...primaries.map(p => ({ ...p, pieceCategory: p.group || p.pieceCategory, pieceName: p.pieceName, pieceId: p.pieceId, pieceCode: p.pieceCode || '', isPrimary: true, available: true }))];
        setPartsWithAlternatives(allParts);
      }
      setStep(5);
    } catch (e) { /* ignore */ }
    sessionStorage.removeItem('cs-edit-flow');
  }, []);

  const activeProduct = useMemo(() =>
    selectedProduct || (newProduct.name && newProduct.code && newProduct.vol ? { ...newProduct, vol: Number(newProduct.vol), id: newProduct.code } : null),
    [selectedProduct, newProduct]
  );

  const suggestedFormats = useMemo(() => {
    if (!activeProduct || !selectedMachine) return [];
    return suggestFormatos(selectedMachine, activeProduct, formatos);
  }, [activeProduct, selectedMachine, formatos]);

  const productFiltered = products.filter(p =>
    productSearch && (p.name.toLowerCase().includes(productSearch) || p.code.toLowerCase().includes(productSearch))
  ).slice(0, 10);

  const goToStep = (s) => { if (s >= 1 && s <= 6) setStep(s); };

  const handleSelectMachine = (id) => {
    setSelectedMachineId(id);
    const m = machines.find(mch => mch.id === id);
    if (m) setSelectedLine(m.line);
  };

  const handleSelectLine = (line) => { setSelectedLine(line); };

  const handleProductCodeBlur = () => {
    if (newProduct.code && !selectedProduct) {
      const exists = products.some(p => p.code.toLowerCase() === newProduct.code.toLowerCase());
      setCodeExists(exists);
      if (exists) {
        const existing = products.find(p => p.code.toLowerCase() === newProduct.code.toLowerCase());
        if (existing) {
          setSelectedProduct(existing);
          setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' });
        }
      }
    }
  };

  const handleUseExistingProduct = () => {
    if (codeExists) {
      const existing = products.find(p => p.code.toLowerCase() === newProduct.code.toLowerCase());
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
      addProduct({ ...newProduct, vol: Number(newProduct.vol), created: new Date().toISOString().slice(0, 10), category: newProduct.category || '—', family: '', packaging: '', weight: '', unit: newProduct.unit || 'ml', formato: '' });
      goToStep(3);
    }
  };

  const handleConfirmFormat = (fmt) => {
    setSelectedFormato(fmt);
    const primaries = suggestPrimaryParts(fmt, pieces);
    const withAlts = suggestAlternativeParts(primaries, selectedMachine?.name || '', pieces);
    setPartsWithAlternatives(withAlts);
    const defaults = {};
    withAlts.forEach(p => {
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

  const handleSelectPrimary = (group, piece) => {
    setPartsWithAlternatives(prev => prev.map(p => {
      if ((p.pieceCategory || p.group || '') === group) {
        const full = pieces.find(pp => pp.id === piece.id) || piece;
        const alts = suggestAlternativeParts([{
          pieceId: piece.id,
          pieceName: piece.name,
          pieceCode: piece.code || '',
          pieceCategory: p.pieceCategory || group,
        }], selectedMachine?.name || '', pieces);
        return { ...full, pieceId: piece.id, pieceName: piece.name, pieceCode: piece.code || '', pieceCategory: group, isPrimary: true, available: (full.stock || 0) > (full.min || 0), alternatives: alts[0]?.alternatives || [] };
      }
      return p;
    }));
    setPartSelections(prev => ({ ...prev, [group]: { ...prev[group], primary: piece.name, primaryId: piece.id, alternative: null, alternativeId: null } }));
    setModalGroup(null);
  };

  const handleSelectAlternative = (group, alt) => {
    setPartSelections(prev => ({ ...prev, [group]: { ...prev[group], alternative: alt.piece.name, alternativeId: alt.piece.id } }));
    setModalGroup(null);
  };

  const piecesForCategory = (category) => pieces.filter(p => p.category === category);

  const handleSave = () => {
    const existingVersions = flows.filter(f => f.code === (activeProduct?.code || '') && (!isEditing || f.id !== editingFlowId)).length;
    const newVersion = isEditing ? existingVersions + 1 : existingVersions + 1;
    const flowName = `${activeProduct?.code || '—'} - ${(activeProduct?.name || '').toUpperCase()} - V${newVersion}`;

    const primaryList = [];
    const alternativeList = [];
    Object.entries(partSelections).forEach(([group, sel]) => {
      if (sel.primary) {
        const piece = pieces.find(p => p.id === sel.primaryId || p.name === sel.primary);
        primaryList.push({ group, pieceName: sel.primary, pieceId: sel.primaryId || '', pieceCode: piece?.code || '', pieceCategory: group, isPrimary: true, image: piece?.image || '' });
      }
      if (sel.alternative) {
        const piece = pieces.find(p => p.id === sel.alternativeId || p.name === sel.alternative);
        alternativeList.push({ group, pieceName: sel.alternative, pieceId: sel.alternativeId || '', pieceCode: piece?.code || '', pieceCategory: group, isAlternative: true, image: piece?.image || '' });
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
      tooling: [...primaryList, ...alternativeList],
      toolingCount: primaryList.length,
      toolingTotal: primaryList.length + alternativeList.length,
      status: 'Concluído',
      ver: `V${newVersion}`,
      updatedAt: new Date().toISOString().slice(0, 10),
      updatedBy: getCurrentUser(),
    };

    if (isEditing) {
      const { status: _s, createdBy: _cb, createdAt: _ca, ...updateData } = flowData;
      updateFlow(editingFlowId, updateData);
      logAction('update', 'Fluxo', `${flowName} atualizado`);
      toast('Fluxo atualizado com sucesso!');
    } else {
      addFlow({ ...flowData, createdBy: getCurrentUser() });
      logAction('create', 'Fluxo', flowName);
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
    setEditingFlowId(null);
    goToStep(1);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">{isEditing ? 'Editar Fluxo' : 'Novo Fluxo'}</h2>
        {isEditing && (
          <Button variant="ghost" size="sm" onClick={() => { resetAll(); navigate('/fluxos'); }}>Cancelar edição</Button>
        )}
      </div>
      <div className="mb-6 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              {i > 0 && <div className={`w-8 md:w-12 h-0.5 mx-1 ${i < step ? 'bg-[var(--success)]' : 'bg-[var(--border)]'} transition-colors`} />}
              <div className={`flex items-center gap-1.5 ${i >= step ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s.num ? 'bg-[var(--accent)] text-white shadow-[0_0_0_3px_var(--accent-light)] scale-110' : step > s.num ? 'bg-[var(--success-muted)] text-[var(--success)] border-2 border-[var(--success)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-2 border-[var(--border)]'}`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:inline whitespace-nowrap ${step === s.num ? 'text-[var(--fg)]' : 'text-[var(--fg-secondary)]'}`}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: CONTEXTO */}
      {step === 1 && (
        <Card>
          <h3 className="text-lg font-semibold mb-1">Selecione a máquina</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-2">Escolha a máquina onde este setup será utilizado.</p>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-3 mb-6">
            {machines.map(m => (
              <button type="button" key={m.id} onClick={() => handleSelectMachine(m.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all duration-150 ${selectedMachineId === m.id ? 'border-[var(--accent)] bg-[var(--accent-light)] shadow-sm' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)]'}`}>
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-2"><Icon name="box" size={18} /></div>
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-xs text-[var(--fg-secondary)] mt-0.5">Linha {m.line} · {m.type}</div>
                <div className="mt-2"><Badge>{m.outils} ferramentais</Badge></div>
              </button>
            ))}
          </div>
          {selectedMachine && (
            <div className="border-t border-[var(--border)] pt-4">
              <h3 className="text-lg font-semibold mb-1">Selecione a linha</h3>
              <p className="text-sm text-[var(--fg-secondary)] mb-3">Escolha a linha de produção onde o setup será utilizado.</p>
              {machineLines.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {machineLines.map(l => (
                    <button key={l} type="button" onClick={() => handleSelectLine(l)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${selectedLine === l ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--success-muted)] flex items-center justify-center text-[var(--success)] text-sm font-bold">{l}</div>
                        <div>
                          <div className="text-sm font-semibold">Linha {l}</div>
                          <div className="text-xs text-[var(--fg-secondary)]">Máquina {selectedMachine.name}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--fg-muted)]">Nenhuma linha disponível para esta máquina.</p>
              )}
              <p className="text-xs text-[var(--fg-secondary)]">A linha padrão da máquina "{selectedMachine.line}" foi sugerida.</p>
            </div>
          )}
          <div className="flex justify-between mt-6">
            <Button variant="ghost" disabled>← Anterior</Button>
            <Button variant="primary" onClick={() => { if (selectedLine) goToStep(2); }} disabled={!selectedMachineId || !selectedLine}>Avançar →</Button>
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
              className={`p-4 rounded-lg border-2 text-left transition-all ${!selectedProduct && !newProduct.name ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="grid-3x3" size={18} />
                <span className="text-sm font-semibold">Produto pré-cadastrado</span>
              </div>
              <p className="text-xs text-[var(--fg-secondary)]">Selecione um produto existente no sistema</p>
            </button>
            <button type="button" onClick={() => { setSelectedProduct(null); setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' }); setCodeExists(false); setProductSearch(''); }}
              className={`p-4 rounded-lg border-2 text-left transition-all ${newProduct.name || newProduct.code ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
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
              <input className="shad-input pl-9" placeholder="Buscar produto por nome ou código..." value={productSearch} onChange={e => { setProductSearch(e.target.value.toLowerCase()); setSelectedProduct(null); }} aria-label="Buscar produtos" />
            </div>
            {productSearch && productFiltered.length > 0 && (
              <div className="border border-[var(--border)] rounded-lg mt-2 overflow-hidden max-h-60 overflow-y-auto">
                {productFiltered.map(p => (
                  <button key={p.id} type="button" onClick={() => { setSelectedProduct(p); setNewProduct({ code: '', name: '', vol: '', unit: 'ml', category: '' }); setProductSearch(''); setCodeExists(false); }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${selectedProduct?.id === p.id ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'hover:bg-[var(--bg)]'}`}>
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0"><Icon name="grid-3x3" size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-[var(--fg-secondary)]">{p.code} · {p.vol} {p.unit}{p.formato ? ` · ${p.formato}` : ''}</div>
                    </div>
                    {selectedProduct?.id === p.id && <Icon name="check-circle" size={16} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="mb-4 p-4 bg-[var(--accent-light)] border border-[var(--accent)] rounded-lg">
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
                  <Input placeholder="Ex: Shampoo Nutritivo" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Código *</label>
                  <Input placeholder="Ex: SHP-400-001" value={newProduct.code} onChange={e => { setNewProduct({ ...newProduct, code: e.target.value }); setCodeExists(false); }} onBlur={handleProductCodeBlur} /></div>
              </div>
              <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
                <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Volumetria *</label>
                  <Input type="number" placeholder="400" min="1" value={newProduct.vol} onChange={e => setNewProduct({ ...newProduct, vol: e.target.value })} /></div>
                <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Unidade</label>
                  <Select value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}>{['ml', 'g'].map(u => <option key={u}>{u}</option>)}</Select></div>
                <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Categoria</label>
                  <Select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                    <option value="">Selecione</option>
                    {['Shampoo', 'Condicionador', 'Creme', 'Sérum', 'Loção', 'Gel', 'Pomada', 'Óleo'].map(c => <option key={c}>{c}</option>)}
                  </Select></div>
              </div>
              {codeExists && (
                <div className="p-3 bg-[var(--warning-muted)] border border-[var(--warning)] rounded-lg">
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
            <div className="mb-4 p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)] text-sm">
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
                <Button variant="primary" size="sm" onClick={() => { setSelectedFormato(null); handleConfirmFormat({ pieces: [] }); }}>Continuar sem formato</Button>
              </div>
            </div>
          ) : !showFormatList && suggestedFormats[0] ? (
            <div className="space-y-4">
              <div className="p-5 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent-light)]">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={COMPAT_COLORS[suggestedFormats[0].level] || 'success'}>Recomendado</Badge>
                  <Badge variant={COMPAT_COLORS[suggestedFormats[0].level] || 'success'}>{suggestedFormats[0].level}</Badge>
                </div>
                <div className="text-base font-semibold">{suggestedFormats[0].formato.name}</div>
                <div className="text-sm text-[var(--fg-secondary)] mt-1">
                  {suggestedFormats[0].formato.tipo && <span>{suggestedFormats[0].formato.tipo} · </span>}
                  {suggestedFormats[0].formato.pieces && <span>{suggestedFormats[0].formato.pieces.length} peça{suggestedFormats[0].formato.pieces.length !== 1 ? 's' : ''}</span>}
                  {suggestedFormats[0].formato.volMin != null && <span> · {suggestedFormats[0].formato.volMin}–{suggestedFormats[0].formato.volMax} ml</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(suggestedFormats[0].formato.pieces || []).slice(0, 5).map(p => (
                    <Badge key={p.pieceId}>{p.pieceName}</Badge>
                  ))}
                  {(suggestedFormats[0].formato.pieces || []).length > 5 && <Badge>+{suggestedFormats[0].formato.pieces.length - 5}</Badge>}
                </div>
              </div>
              {suggestedFormats.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Outros formatos compatíveis</p>
                  {suggestedFormats.slice(1).map(({ formato, level }) => (
                    <div key={formato.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{formato.name}</div>
                          <div className="text-xs text-[var(--fg-secondary)]">
                            {formato.tipo && <span>{formato.tipo} · </span>}
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
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedFormato?.id === formato.id ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{formato.name}</span>
                        <Badge variant={COMPAT_COLORS[level] || 'secondary'}>Compatibilidade: {level}</Badge>
                      </div>
                      <div className="text-xs text-[var(--fg-secondary)]">
                        {formato.tipo && <span>{formato.tipo} · </span>}
                        {formato.pieces && <span>{formato.pieces.length} peça{formato.pieces.length !== 1 ? 's' : ''}</span>}
                        {formato.volMin != null && <span> · {formato.volMin}–{formato.volMax} ml</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(formato.pieces || []).slice(0, 5).map(p => <Badge key={p.pieceId}>{p.pieceName}</Badge>)}
                      </div>
                    </div>
                    <Icon name="arrow-right" size={18} />
                  </div>
                </button>
              ))}
              <Button variant="ghost" onClick={() => handleConfirmFormat({ pieces: [] })}>Continuar sem formato</Button>
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
            {partsWithAlternatives.map(part => {
              const group = part.pieceCategory || part.group || '';
              const sel = partSelections[group] || {};
              const primaryPiece = sel.primary ? pieces.find(p => p.id === sel.primaryId || p.name === sel.primary) || part : part;
              const alt = part.alternatives || [];
              return (
                <div key={group} className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="p-4 bg-[var(--bg)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${sel.primary ? 'bg-[var(--success)] text-white' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border border-[var(--border)]'}`}>
                          {sel.primary ? '✓' : '!'}
                        </div>
                        <span className="text-sm font-semibold uppercase tracking-wide">{group}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                      {primaryPiece.image ? (
                        <img src={primaryPiece.image} alt={primaryPiece.pieceName || primaryPiece.name} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)] shrink-0 cursor-pointer" onClick={() => setPreviewImage(primaryPiece.image)} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={18} /></div>
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
                          <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-lg border border-dashed border-[var(--border)]">
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="wrench" size={18} /></div>
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
                            className="w-full p-3 bg-[var(--surface)] rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--fg-secondary)] hover:border-[var(--accent)] transition-colors text-left">
                            + Adicionar peça alternativa ({alt.length} disponíve{alt.length !== 1 ? 'is' : 'l'})
                          </button>
                        )}
                      </div>
                    )}

                    {alt.length === 0 && primaryPiece.available === false && (
                      <div className="mt-3 p-3 bg-[var(--danger-muted)] border border-[var(--danger)] rounded-lg">
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
              <div role="dialog" aria-modal="true" aria-label={`Selecionar peça para ${modalGroup.group}`} className="relative bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 z-10" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold">{modalGroup.group}</h3>
                    <p className="text-xs text-[var(--fg-secondary)] mt-0.5">{modalGroup.type === 'primary' ? 'Selecionar peça principal' : 'Selecionar peça alternativa'}</p>
                    <div className="relative mt-2">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none"><Icon name="search" size={14} /></span>
                      <input className="shad-input pl-8 py-1.5 text-xs" placeholder="Buscar peça..." value={pieceSearch} onChange={e => { setPieceSearch(e.target.value); setPiecePage(1); }} />
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
                        {modalGroup.alternatives.filter(a => !pieceSearch || a.piece.name.toLowerCase().includes(pieceSearch) || (a.piece.code || '').toLowerCase().includes(pieceSearch)).map((a, i) => (
                          <button key={i} type="button" onClick={() => handleSelectAlternative(modalGroup.group, a)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-3 ${partSelections[modalGroup.group]?.alternativeId === a.piece.id ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                            <div className="w-9 h-9 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="wrench" size={16} /></div>
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
                      const filtered = pieceSearch ? catPieces.filter(p => p.name.toLowerCase().includes(pieceSearch) || p.code.toLowerCase().includes(pieceSearch)) : catPieces;
                      const perPage = 8;
                      const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
                      const paged = filtered.slice((piecePage - 1) * perPage, piecePage * perPage);
                      if (catPieces.length === 0) return <div className="flex items-center justify-center h-24 text-center"><p className="text-sm text-[var(--fg-muted)]">Nenhuma peça na categoria "{modalGroup.group}".</p></div>;
                      if (filtered.length === 0) return <div className="flex items-center justify-center h-24 text-xs text-[var(--fg-muted)]">Nenhuma peça encontrada.</div>;
                      return (
                        <>
                          <div className="space-y-2">
                            {paged.map(p => (
                              <button key={p.id} type="button" onClick={() => handleSelectPrimary(modalGroup.group, p)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-3 ${partSelections[modalGroup.group]?.primaryId === p.id ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                                {p.image ? (
                                  <button type="button" onClick={e => { e.stopPropagation(); setPreviewImage(p.image); }}>
                                    <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] shrink-0 hover:ring-2 hover:ring-[var(--accent)] transition-all cursor-pointer" />
                                  </button>
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={16} /></div>
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
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
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
            <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Informações de produção</span>
                <button type="button" onClick={() => goToStep(1)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-[var(--fg-secondary)]">Máquina</div><div className="font-medium">{selectedMachine?.name || '—'}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Linha</div><div className="font-medium">{selectedLine || '—'}</div></div>
              </div>
            </div>

            <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
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

            <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">Formato</span>
                <button type="button" onClick={() => goToStep(3)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
              </div>
              <div className="text-sm font-medium">{selectedFormato?.name || 'Nenhum formato selecionado'}</div>
              {selectedFormato?.tipo && <div className="text-xs text-[var(--fg-secondary)] mt-0.5">Tipo: {selectedFormato.tipo}</div>}
            </div>

            <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
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
              <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
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

            <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2 block">Metadados</span>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-[var(--fg-secondary)]">Criado por</div><div className="font-medium">{getCurrentUser()}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Data</div><div className="font-medium">{new Date().toISOString().slice(0, 10)}</div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Status inicial</div><div className="font-medium"><Badge variant="success">Ativo</Badge></div></div>
                <div><div className="text-xs text-[var(--fg-secondary)]">Versão</div><div className="font-medium font-mono">V{flows.filter(f => f.code === (activeProduct?.code || '')).length + 1}</div></div>
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
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
              <Icon name="check-circle" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-1">{isEditing ? 'Fluxo atualizado com sucesso!' : 'Fluxo criado com sucesso!'}</h3>
            <div className="text-base font-medium text-[var(--accent)] mt-2 mb-1">{createdFlowName}</div>
            <p className="text-sm text-[var(--fg-secondary)] mb-8 max-w-sm mx-auto">{isEditing ? 'O fluxo foi atualizado e está disponível para utilização.' : 'O fluxo foi salvo e está disponível para utilização.'}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={() => navigate('/fluxos')}>
                <Icon name="grid-3x3" size={16} />Ir para lista de fluxos
              </Button>
              <Button variant="secondary" onClick={resetAll}>
                <Icon name="plus" size={16} />Criar novo fluxo
              </Button>
            </div>
          </div>
        </Card>
      )}

      {previewImage && <ImagePreview src={previewImage} alt="Foto da peça" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
