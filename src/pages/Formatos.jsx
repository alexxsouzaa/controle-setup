import { useState, useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { EmptyState } from '../components/EmptyState';
import { ImagePreview } from '../components/ImagePreview';

const categoryIcons = {
  'Copos': 'box',
  'Ponteira do Empurrador': 'wrench',
  'Ponteira do Centralizador': 'wrench',
  'Estação de Limpeza': 'settings',
  'Bico de Envase': 'wrench',
  'Suporte do Camisa do Bico de Ar Quente': 'settings',
  'Camisa do Bico de Ar Quente': 'settings',
  'Ponteira do Bico de Ar Quente': 'wrench',
  'Faca': 'wrench',
  'Mordente': 'box',
  'Régua do Mordente': 'box',
  'Batedor do Mordente': 'box',
  'Berço': 'box',
};

export function FormatosPage({ navigate }) {
  const { formatos, products, pieces, addFormato, updateFormato, deleteFormato, logAction } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const [tab, setTab] = useState('list');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPieces, setSelectedPieces] = useState({});
  const [formatoName, setFormatoName] = useState('');
  const [formatoType, setFormatoType] = useState('');
  const [volMin, setVolMin] = useState('');
  const [volMax, setVolMax] = useState('');
  const [modalCategory, setModalCategory] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [createStep, setCreateStep] = useState(1);

  const resetForm = () => {
    setProductSearch('');
    setSelectedProduct(null);
    setSelectedPieces({});
    setFormatoName('');
    setFormatoType('');
    setVolMin('');
    setVolMax('');
    setEditingId(null);
    setCreateStep(1);
  };

  const pieceCount = Object.keys(selectedPieces).length;

  const startEdit = (fmt) => {
    setFormatoName(fmt.name || '');
    setFormatoType(fmt.tipo || '');
    setVolMin(fmt.volMin != null ? String(fmt.volMin) : '');
    setVolMax(fmt.volMax != null ? String(fmt.volMax) : '');
    const prod = products.find(p => p.id === fmt.productId || p.code === fmt.productCode);
    setSelectedProduct(prod || null);
    const piecesMap = {};
    (fmt.pieces || []).forEach(p => { piecesMap[p.pieceId] = p; });
    setSelectedPieces(piecesMap);
    setEditingId(fmt.id);
    setCreateStep(1);
    setTab('create');
  };

  const handleSave = () => {
    if (!selectedProduct || pieceCount === 0) return;
    const name = formatoName.trim() || `${selectedProduct.name} — ${pieceCount} peças`;
    const payload = {
      name,
      tipo: formatoType,
      volMin: volMin ? Number(volMin) : null,
      volMax: volMax ? Number(volMax) : null,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productCode: selectedProduct.code,
      pieces: Object.values(selectedPieces),
    };
    if (editingId) {
      updateFormato(editingId, payload);
      logAction('update', 'Formato', `${name} atualizado`);
      toast('Formato atualizado com sucesso!');
    } else {
      addFormato(payload);
      logAction('create', 'Formato', `${name} criado`);
      toast('Formato criado com sucesso!');
    }
    resetForm();
    setTab('list');
  };  


  const handleUseFormato = (fmt) => {
    sessionStorage.setItem('cs-selected-formato', JSON.stringify({
      productId: fmt.productId,
      productName: fmt.productName,
      productCode: fmt.productCode,
      pieces: fmt.pieces,
    }));
    navigate('/novo-setup');
  };



  const productFiltered = products.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch) || p.code.toLowerCase().includes(productSearch)
  );

  const piecesByCategory = {};
  pieces.forEach(p => {
    if (!piecesByCategory[p.category]) piecesByCategory[p.category] = [];
    piecesByCategory[p.category].push(p);
  });

  const togglePieceInCategory = (piece) => {
    setSelectedPieces(prev => {
      const next = { ...prev };
      if (next[piece.id]) {
        delete next[piece.id];
      } else {
        next[piece.id] = { pieceId: piece.id, pieceName: piece.name, pieceCode: piece.code, pieceCategory: piece.category };
      }
      return next;
    });
  };

  const categorySelectedCount = (category) => {
    return Object.values(selectedPieces).filter(p => p.pieceCategory === category).length;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Formatos</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">{formatos.length} formato{formatos.length !== 1 ? 's' : ''} cadastrado{formatos.length !== 1 ? 's' : ''}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === 'list' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('list'); resetForm(); }}><Icon name="grid-3x3" size={16} />{tab === 'list' ? 'Lista' : 'Ver Lista'}</Button>
          <Button variant={tab === 'create' ? 'primary' : 'secondary'} size="sm" onClick={() => { if (editingId) resetForm(); setTab('create'); }}><Icon name="plus" size={16} />{editingId ? 'Editar' : 'Novo Formato'}</Button>
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
                        Produto: {fmt.productName} ({fmt.productCode}){fmt.tipo ? ` · ${fmt.tipo}` : ''}{fmt.volMin || fmt.volMax ? ` · ${fmt.volMin || '—'}–${fmt.volMax || '—'} ml` : ''} · {fmt.pieces.length} peça{fmt.pieces.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="primary" size="sm" onClick={() => handleUseFormato(fmt)}>Usar no Fluxo</Button>
                    <button type="button" onClick={() => startEdit(fmt)} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--accent)] transition-colors">Editar</button>
                    <button type="button" onClick={() => { if (confirm(`Excluir formato "${fmt.name}"?`)) { deleteFormato(fmt.id); logAction('delete', 'Formato', `${fmt.name} excluído`); toast('Formato excluído com sucesso!'); } }}
                      className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--danger)] transition-colors">Excluir</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {fmt.pieces.map(p => (
                    <Badge key={p.pieceId}>{p.pieceName}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          {/* Stepper */}
          <div className="flex items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-x-auto">
            {[
              { n: 1, label: 'Produto' },
              { n: 2, label: 'Configuração' },
              { n: 3, label: 'Peças' },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-2 shrink-0">
                {s.n > 1 && <div className={`w-6 h-0.5 ${s.n <= createStep ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s.n === createStep ? 'bg-[var(--accent)] text-white shadow-[0_0_0_3px_var(--accent-light)]' : s.n < createStep ? 'bg-[var(--success-muted)] text-[var(--success)] border-2 border-[var(--success)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-2 border-[var(--border)]'}`}>
                  {s.n < createStep ? '✓' : s.n}
                </div>
                <span className={`text-xs whitespace-nowrap ${s.n === createStep ? 'text-[var(--fg)] font-medium' : 'text-[var(--fg-secondary)]'}`}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Produto */}
          {createStep === 1 && (
            <Card>
              <h3 className="text-base font-semibold mb-4">1. Selecionar Produto</h3>
              {selectedProduct ? (
                <div className="p-4 bg-[var(--accent-light)] border border-[var(--accent)] rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[var(--accent)]">{selectedProduct.name}</div>
                    <div className="text-xs text-[var(--fg-secondary)] mt-0.5">{selectedProduct.code} · {selectedProduct.category} · {selectedProduct.vol} {selectedProduct.unit}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(null); setProductSearch(''); }}>Trocar</Button>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg mb-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)] pointer-events-none"><Icon name="search" size={16} /></span>
                      <input className="shad-input pl-9" placeholder="Buscar produto por nome ou código..." value={productSearch} onChange={e => setProductSearch(e.target.value.toLowerCase())} aria-label="Buscar produtos" />
                    </div>
                    {productSearch && productFiltered.length > 0 && (
                      <div className="border border-[var(--border)] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                        {productFiltered.map(p => (
                          <button key={p.id} type="button" onClick={() => { setSelectedProduct(p); setProductSearch(''); }}
                            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--bg)] transition-colors"
                          >
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
                      <p className="text-sm text-[var(--fg-secondary)] py-2">Nenhum produto encontrado.</p>
                    )}
                  </div>
                  {!productSearch && !selectedProduct && (
                    <p className="text-sm text-[var(--fg-secondary)]">Use a busca acima para localizar um produto pelo nome ou código.</p>
                  )}
                </>
              )}
              <div className="flex justify-end mt-6">
                <Button variant="primary" onClick={() => selectedProduct && setCreateStep(2)} disabled={!selectedProduct}>
                  Avançar →
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Configuração */}
          {createStep === 2 && selectedProduct && (
            <Card>
              <h3 className="text-base font-semibold mb-1">2. Configuração do Formato</h3>
              <p className="text-xs text-[var(--fg-secondary)] mb-5">Defina as características do formato para {selectedProduct.name}.</p>

              <div className="mb-5 p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                <label className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider mb-1 block">Nome do formato</label>
                <p className="text-[11px] text-[var(--fg-secondary)] mb-2">Se não for informado, será gerado automaticamente com base no produto.</p>
                <Input placeholder={`${selectedProduct.name} — 0 peças`} value={formatoName} onChange={e => setFormatoName(e.target.value)} />
              </div>

              <div className="grid md:grid-cols-2 grid-cols-1 gap-5">
                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <label className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider mb-3 block">Tipo</label>
                  <Select value={formatoType} onChange={e => setFormatoType(e.target.value)}>
                    <option value="">Selecione o tipo</option>
                    <option value="Reto">Reto</option>
                    <option value="Boomerang">Boomerang</option>
                    <option value="Transforms">Transforms</option>
                    <option value="Angular">Angular</option>
                  </Select>
                </div>
                <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <label className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wider mb-3 block">Volumetria (ml)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[var(--fg-secondary)] mb-0.5 block">Mínima</label>
                      <Input type="number" placeholder="0" value={volMin} onChange={e => setVolMin(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--fg-secondary)] mb-0.5 block">Máxima</label>
                      <Input type="number" placeholder="0" value={volMax} onChange={e => setVolMax(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setCreateStep(1)}>← Produto</Button>
                <Button variant="primary" onClick={() => setCreateStep(3)}>Avançar →</Button>
              </div>
            </Card>
          )}

          {/* Step 3: Peças */}
          {createStep === 3 && selectedProduct && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">3. Selecionar Peças</h3>
                  <p className="text-xs text-[var(--fg-secondary)] mt-0.5">{pieceCount} peça{pieceCount !== 1 ? 's' : ''} selecionada{pieceCount !== 1 ? 's' : ''}</p>
                </div>
                {formatoType && <Badge>{formatoType}</Badge>}
              </div>
              <div className="space-y-2">
                {Object.entries(piecesByCategory).map(([category, catPieces]) => {
                  const selCount = categorySelectedCount(category);
                  return (
                    <button key={category} type="button" onClick={() => setModalCategory(category)}
                      className={`w-full text-left flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-150 ${selCount > 0 ? 'border-[var(--success)] bg-[var(--success-muted)]' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)]'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${selCount > 0 ? 'bg-[var(--success)] text-white' : 'bg-[var(--bg)] text-[var(--fg-secondary)]'}`}>
                        {selCount > 0 ? '✓' : <Icon name={categoryIcons[category] || 'box'} size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-xs text-[var(--fg-secondary)] shrink-0">{selCount}/{catPieces.length}</span>
                        </div>
                        {selCount > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.values(selectedPieces).filter(p => p.pieceCategory === category).map(p => (
                              <Badge key={p.pieceId}>{p.pieceName}</Badge>
                            ))}
                          </div>
                        )}
                        {selCount === 0 && (
                          <span className="text-xs text-[var(--fg-muted)]">{catPieces.length} peça{catPieces.length !== 1 ? 's' : ''} disponíve{catPieces.length !== 1 ? 'is' : 'l'}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {modalCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setModalCategory(null)} onKeyDown={e => e.key === 'Escape' && setModalCategory(null)}>
                  <div className="absolute inset-0 bg-[var(--overlay)]" />
                  <div role="dialog" aria-modal="true" aria-label={modalCategory} className="relative bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 z-10" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold">{modalCategory}</h3>
                        <p className="text-xs text-[var(--fg-secondary)] mt-0.5">Selecione as peças desejadas</p>
                      </div>
                      <button type="button" onClick={() => setModalCategory(null)} aria-label="Fechar" className="p-1 rounded hover:bg-[var(--bg)] text-[var(--fg-secondary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                      {(piecesByCategory[modalCategory] || []).map(p => {
                        const isSelected = !!selectedPieces[p.id];
                        return (
                          <button key={p.id} type="button" onClick={() => togglePieceInCategory(p)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-3 ${isSelected ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)]'}`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'}`}>
                              {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                            </div>
                            {p.image ? (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewImage(p.image); }}>
                                <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] shrink-0 hover:ring-2 hover:ring-[var(--accent)] transition-all cursor-pointer" />
                              </button>
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
                                <Icon name="box" size={16} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{p.name}</div>
                              <div className="flex items-center gap-2 text-[11px] text-[var(--fg-secondary)]">
                                <span className="font-mono">{p.code}</span>
                                <span>·</span>
                                <span className={p.stock <= p.min ? 'text-[var(--danger)] font-medium' : ''}>Est: {p.stock}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-[var(--fg-secondary)]">{categorySelectedCount(modalCategory)} selecionada{categorySelectedCount(modalCategory) !== 1 ? 's' : ''}</span>
                      <Button variant="primary" size="sm" onClick={() => setModalCategory(null)}>Concluído</Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setCreateStep(2)}>← Configuração</Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { resetForm(); setTab('list'); }}>Cancelar</Button>
                  <Button variant="primary" onClick={handleSave} disabled={pieceCount === 0}>
                    <Icon name="plus" size={16} />{editingId ? 'Salvar Alterações' : 'Criar Formato'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
      {previewImage && <ImagePreview src={previewImage} alt="Foto da peça" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
