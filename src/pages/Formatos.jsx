import { useState, useContext, useMemo } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { EmptyState } from '../components/EmptyState';
import { suggestFormatos, getMachineTooling, getFormatTypeOptions } from '../utils/compatibility';

const STEPS = ['Produto', 'Configuração', 'Máquina', 'Peças', 'Revisão', 'Concluído'];
const STEP_KEYS = ['product', 'config', 'machine', 'parts', 'review', 'done'];
const VOL_UNITS = ['ml', 'g'];
const COMPAT_COLORS = { Alta: 'success', Média: 'warning', Baixa: 'info', Ideal: 'success', Condicional: 'warning' };

export function FormatosPage({ navigate }) {
  const ctx = useContext(AppDataContext);
  const { formatos, products, pieces, machines, addFormato, updateFormato, deleteFormato, logAction, getCurrentUser, config } = ctx;
  const { toast } = useContext(ToastContext);
  const [tab, setTab] = useState('list');
  const [previewImage, setPreviewImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [step, setStep] = useState(1);
  const [savedName, setSavedName] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formatType, setFormatType] = useState('');
  const [volume, setVolume] = useState('');
  const [volumeUnit, setVolumeUnit] = useState('ml');

  const [selectedMachineId, setSelectedMachineId] = useState('');
  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  const [selectedPartIds, setSelectedPartIds] = useState([]);
  const [selectedAltPartIds, setSelectedAltPartIds] = useState([]);
  const [partsWithAlternatives, setPartsWithAlternatives] = useState([]);
  const [modalCategory, setModalCategory] = useState(null);
  const [pieceSearch, setPieceSearch] = useState('');
  const [piecePage, setPiecePage] = useState(1);

  const [formatName, setFormatName] = useState('');
  const [createdBy, setCreatedBy] = useState(getCurrentUser());

  const productFiltered = products.filter(p =>
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
    setSelectedPartIds([]); setSelectedAltPartIds([]);
    setPartsWithAlternatives([]);
    setFormatName(''); setCreatedBy(getCurrentUser());
    setEditingId(null); setStep(1);
  };

  const goToStep = (s) => { if (s >= 1 && s <= 6) setStep(s); };

  const volumeNum = Number(volume) || 0;
  const volForCompat = volumeNum || productVol || 0;
  const availableFormatTypes = getFormatTypeOptions(selectedMachine?.uo, config);

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    setProductSearch('');
    const suggested = p.formato || '';
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
    const tooling = getMachineTooling(selectedMachine);
    const groupedPieces = tooling.map(cat => {
      const catPieces = pieces.filter(p => p.category === cat).sort((a, b) => a.name.localeCompare(b.name));
      return { category: cat, pieces: catPieces };
    }).filter(g => g.pieces.length > 0);
    setPartsWithAlternatives(groupedPieces);
    const selIds = [];
    const altIds = [];
    groupedPieces.forEach(g => {
      if (g.pieces.length > 0) selIds.push(g.pieces[0].id);
      if (g.pieces.length > 1) altIds.push(g.pieces[1].id);
    });
    setSelectedPartIds(selIds);
    setSelectedAltPartIds(altIds);
    goToStep(4);
  };

  const togglePart = (id) => {
    setSelectedPartIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAltPart = (id) => {
    setSelectedAltPartIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const piecesForCategory = (cat) => pieces.filter(p => p.category === cat);

  const handleSave = () => {
    if (!formatName.trim()) { toast('Defina o nome do formato.', 'warning'); return; }
    if (selectedPartIds.length === 0) { toast('Selecione pelo menos uma peça.', 'warning'); return; }
    const fmtPieces = selectedPartIds.map(id => {
      const p = pieces.find(pc => pc.id === id);
      return p ? { pieceId: p.id, pieceName: p.name, pieceCode: p.code || '', pieceCategory: p.category || '' } : null;
    }).filter(Boolean);
    const altPieces = selectedAltPartIds.map(id => {
      const p = pieces.find(pc => pc.id === id);
      return p ? { pieceId: p.id, pieceName: p.name, pieceCode: p.code || '', pieceCategory: p.category || '' } : null;
    }).filter(Boolean);
    const payload = {
      name: formatName.trim(),
      formatType,
      volume: volumeNum,
      volumeUnit,
      machineId: selectedMachineId,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productCode: selectedProduct.code,
      partIds: selectedPartIds,
      alternativePartIds: selectedAltPartIds,
      pieces: [...fmtPieces, ...altPieces.map(p => ({ ...p, isAlternative: true }))],
      createdBy,
    };
    if (editingId) {
      updateFormato(editingId, payload);
      logAction('update', 'Formato', `${formatName} atualizado`);
      toast('Formato atualizado com sucesso!');
    } else {
      addFormato(payload);
      logAction('create', 'Formato', `${formatName} criado`);
      toast('Formato criado com sucesso!');
    }
    setSavedName(formatName.trim());
    goToStep(6);
  };

  const startEdit = (fmt) => {
    setFormatName(fmt.name || '');
    setFormatType(fmt.formatType || fmt.tipo || '');
    setVolume(fmt.volume ? String(fmt.volume) : (fmt.volMin ? String(fmt.volMin) : ''));
    setVolumeUnit(fmt.volumeUnit || 'ml');
    setSelectedMachineId(fmt.machineId || '');
    const prod = products.find(p => p.id === fmt.productId || p.code === fmt.productCode);
    if (prod) setSelectedProduct(prod);
    setSelectedPartIds(fmt.partIds || (fmt.pieces || []).map(p => p.pieceId).filter(Boolean));
    setSelectedAltPartIds(fmt.alternativePartIds || []);
    setCreatedBy(fmt.createdBy || getCurrentUser());
    setEditingId(fmt.id);
    setStep(1);
    setTab('create');
  };

  const go = (s) => goToStep(s);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Formatos</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">{formatos.length} formato{formatos.length !== 1 ? 's' : ''} cadastrado{formatos.length !== 1 ? 's' : ''}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === 'list' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('list'); resetForm(); }}><Icon name="grid-3x3" size={16} />{tab === 'list' ? 'Lista' : 'Ver Lista'}</Button>
          <Button variant={tab === 'create' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />{editingId ? 'Editar' : 'Novo Formato'}</Button>
        </div>
      </div>

      {tab === 'list' ? (
        formatos.length === 0 ? (
          <EmptyState icon={<Icon name="grid-3x3" size={24} />} title="Nenhum formato cadastrado"
            desc="Crie um formato associando um produto às peças que ele utiliza."
            action={<Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />Novo Formato</Button>}
          />
        ) : (
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
            {formatos.map(fmt => (
              <div key={fmt.id} className="shad-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="grid-3x3" size={20} /></div>
                    <div>
                      <div className="text-sm font-semibold">{fmt.name}</div>
                      <div className="text-xs text-[var(--fg-secondary)] mt-0.5">
                        Produto: {fmt.productName} ({fmt.productCode}) · {fmt.formatType || fmt.tipo || '—'}
                        {fmt.volume ? ` · ${fmt.volume} ${fmt.volumeUnit || 'ml'}` : fmt.volMin ? ` · ${fmt.volMin}–${fmt.volMax} ml` : ''}
                        · {(fmt.pieces || []).length} peça{(fmt.pieces || []).length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => startEdit(fmt)} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--accent)] transition-colors">Editar</button>
                    <button type="button" onClick={() => { if (confirm(`Excluir formato "${fmt.name}"?`)) { deleteFormato(fmt.id); logAction('delete', 'Formato', `${fmt.name} excluído`); toast('Formato excluído com sucesso!'); } }}
                      className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--danger)] transition-colors">Excluir</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(fmt.pieces || []).map(p => (
                    <Badge key={p.pieceId}>{p.pieceName}{p.isAlternative ? ' (alternativa)' : ''}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : step < 6 ? (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{editingId ? 'Editar Formato' : 'Novo Formato'}</h2>
              <p className="text-sm text-[var(--fg-secondary)] mt-0.5">Crie um formato de produção a partir de um produto cadastrado.</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-0 mb-6 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                {i > 0 && <div className={`w-6 md:w-10 h-0.5 mx-0.5 ${i < step ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`} />}
                <div className={`flex items-center gap-1 ${i >= step ? 'opacity-50' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step === i + 1 ? 'bg-[var(--accent)] text-white shadow-[0_0_0_3px_var(--accent-light)] scale-110' : step > i + 1 ? 'bg-[var(--success-muted)] text-[var(--success)] border-2 border-[var(--success)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-2 border-[var(--border)]'}`}>
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
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="grid-3x3" size={16} /></div>
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
                    <input className="shad-input pl-9" placeholder="Buscar produto por nome ou código..." value={productSearch} onChange={e => setProductSearch(e.target.value.toLowerCase())} aria-label="Buscar produtos" />
                  </div>
                  {productSearch && productFiltered.length > 0 && (
                    <div className="border border-[var(--border)] rounded-lg mt-2 overflow-hidden max-h-60 overflow-y-auto">
                      {productFiltered.map(p => (
                        <button key={p.id} type="button" onClick={() => handleSelectProduct(p)}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--bg)] transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="grid-3x3" size={16} /></div>
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
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="box" size={16} /></div>
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
                  <Select value={formatType} onChange={e => setFormatType(e.target.value)}>
                    <option value="">Selecione o formato</option>
                    {availableFormatTypes.map(f => <option key={f}>{f}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Volumetria *</label>
                    <Input type="number" min="1" placeholder="250" value={volume} onChange={e => setVolume(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Unid.</label>
                    <Select value={volumeUnit} onChange={e => setVolumeUnit(e.target.value)}>{VOL_UNITS.map(u => <option key={u}>{u}</option>)}</Select>
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
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="box" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">3. Selecionar Máquina</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Escolha a máquina compatível com este formato.</p>
                </div>
              </div>
              <div className="grid lg:grid-cols-2 grid-cols-1 gap-3">
                {machines.map(m => {
                  const isSelected = selectedMachineId === m.id;
                  return (
                    <button key={m.id} type="button" onClick={() => setSelectedMachineId(m.id)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${isSelected ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{m.name}</span>
                        {isSelected && <Badge variant="success">Selecionada</Badge>}
                      </div>
                      <div className="text-xs text-[var(--fg-secondary)]">UO: {m.uo}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(m.lines || (m.line ? [m.line] : [])).map(l => <Badge key={l}>{l}</Badge>)}
                      </div>
                    </button>
                  );
                })}
              </div>
              {machines.length === 0 && (
                <p className="text-sm text-[var(--fg-muted)] text-center py-4">Nenhuma máquina cadastrada.</p>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => go(2)}>← Configuração</Button>
                <Button variant="primary" disabled={!selectedMachineId} onClick={handleMachineNext}>Avançar →</Button>
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="wrench" size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold">4. Selecionar Peças</h3>
                  <p className="text-xs text-[var(--fg-secondary)]">Selecione as peças necessárias para este formato.</p>
                </div>
              </div>
              <div className="space-y-3">
                {partsWithAlternatives.length > 0 ? partsWithAlternatives.map(group => {
                  const catPieces = group.pieces || pieces.filter(p => p.category === group.category);
                  const selectedInCat = selectedPartIds.filter(id => catPieces.some(p => p.id === id));
                  const altInCat = selectedAltPartIds.filter(id => catPieces.some(p => p.id === id));
                  return (
                    <div key={group.category} className="border border-[var(--border)] rounded-lg overflow-hidden">
                      <div className="p-3 bg-[var(--bg)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase">{group.category}</span>
                          <span className="text-xs text-[var(--fg-secondary)]">{selectedInCat.length} selecionada{selectedInCat.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-1.5">
                          {catPieces.map(p => {
                            const isPrimary = selectedPartIds.includes(p.id);
                            const isAlt = selectedAltPartIds.includes(p.id);
                            return (
                              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                                <div className="flex items-center gap-2 min-w-0">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover border border-[var(--border)] shrink-0 cursor-pointer" onClick={() => setPreviewImage(p.image)} />
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
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="grid-3x3" size={16} /></div>
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
                    {selectedPartIds.map(id => { const p = pieces.find(pc => pc.id === id); return p ? <div key={id} className="flex items-center gap-2 text-sm"><Icon name="check-circle" size={14} className="text-[var(--success)]" /><span className="font-medium">{p.name}</span><span className="text-xs text-[var(--fg-secondary)]">Principal</span></div> : null; })}
                    {selectedAltPartIds.map(id => { const p = pieces.find(pc => pc.id === id); return p ? <div key={id} className="flex items-center gap-2 text-sm"><Icon name="wrench" size={14} className="text-[var(--warning)]" /><span>{p.name}</span><span className="text-xs text-[var(--fg-secondary)]">Alternativa</span></div> : null; })}
                  </div>
                </div>

                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-3 block">Nome do formato</span>
                  <Input placeholder={formatNameSuggestion} value={formatName} onChange={e => setFormatName(e.target.value)} />
                  <p className="text-[11px] text-[var(--fg-muted)] mt-1">Sugestão: {formatNameSuggestion}</p>
                </div>

                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-3 block">Registro</span>
                  <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                    <div>
                      <label className="text-xs text-[var(--fg-secondary)] mb-0.5 block">Criado por</label>
                      <Input value={createdBy} onChange={e => setCreatedBy(e.target.value)} />
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
          <img src={previewImage} alt="Peça" className="relative max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
