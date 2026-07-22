import { useState, useContext, useEffect } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { ImagePreview } from '../components/ImagePreview';

const steps = ['Máquina', 'Produto', 'Peças', 'Revisão', 'Publicação'];
const PAGE_TITLES = ['Selecionar Máquina', 'Informações do Produto', 'Seleção de Peças', 'Revisão do Fluxo', 'Publicar Fluxo'];
const PAGE_DESCS_BASE = ['Escolha o equipamento para iniciar o setup.', 'Selecione um produto cadastrado ou crie um novo.', '', 'Confira as informações antes de publicar.', ''];
const STEP_TO_INDEX = { Máquina: 1, Produto: 2, Peças: 3 };
const TOOLING_NORDEN = ['Copos', 'Ponteira do Empurrador', 'Ponteira do Centralizador', 'Estação de Limpeza', 'Bico de Envase', 'Suporte do Camisa do Bico de Ar Quente', 'Camisa do Bico de Ar Quente', 'Ponteira do Bico de Ar Quente', 'Faca', 'Mordente', 'Régua do Mordente', 'Batedor do Mordente', 'Berço'];
const TOOLING_TGM = ['Copos', 'Ponteira do Empurrador', 'Ponteira do Centralizador', 'Bico de Envase', 'Faca', 'Mordente', 'Régua do Mordente', 'Berço'];
const PRODUCT_CATEGORIES = ['Shampoo', 'Condicionador', 'Creme', 'Sérum', 'Loção', 'Gel', 'Pomada', 'Óleo'];

export function NovoSetupPage({ navigate }) {
  const ctx = useContext(AppDataContext);
  const { machines, products, pieces, addProduct, addFlow, logAction } = ctx;

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ code: '', name: '', category: '', vol: '', unit: 'ml' });
  const [toolingSelections, setToolingSelections] = useState({});
  const [modalGroup, setModalGroup] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const selectedMachine = machines.find(m => m.id === selected);
  const toolingGroups = selected && selected.startsWith('tgm') ? TOOLING_TGM : TOOLING_NORDEN;
  const productFiltered = products.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch) || p.code.toLowerCase().includes(productSearch));
  const selectPiece = (group, piece) => { setToolingSelections(prev => ({ ...prev, [group]: piece })); setModalGroup(null); };

  useEffect(() => {
    const saved = sessionStorage.getItem('cs-selected-formato');
    if (saved) {
      try {
        const fmt = JSON.parse(saved);
        const match = products.find(p => p.id === fmt.productId || p.code === fmt.productCode);
        if (match) setSelectedProduct(match);
        const selections = {};
        (fmt.pieces || []).forEach(p => {
          if (p.pieceCategory) selections[p.pieceCategory] = p.pieceName;
        });
        if (Object.keys(selections).length > 0) setToolingSelections(selections);
      } catch (e) { /* ignore */ }
      sessionStorage.removeItem('cs-selected-formato');
    }
  }, []);
  const piecesFor = (group) => pieces.filter(p => p.category === group);
  const selectedCount = Object.values(toolingSelections).filter(Boolean).length;

  const handlePublish = () => {
    const name = selectedProduct ? selectedProduct.name : newProduct.name || 'Fluxo';
    const code = selectedProduct ? selectedProduct.code : newProduct.code || '—';
    const vol = selectedProduct ? `${selectedProduct.vol} ${selectedProduct.unit}` : newProduct.vol ? `${newProduct.vol} ${newProduct.unit}` : '—';
    const toolingList = Object.entries(toolingSelections)
      .filter(([, pieceName]) => pieceName)
      .map(([group, pieceName]) => {
        const piece = pieces.find(p => p.name === pieceName);
        return {
          group,
          pieceName,
          pieceId: piece?.id || '',
          pieceCode: piece?.code || '',
          image: piece?.image || '',
        };
      });
    addFlow({
      name: `${code} - ${name} (v1.0)`,
      machine: selectedMachine?.name || '—',
      product: name,
      code,
      vol,
      toolingCount: selectedCount,
      toolingTotal: toolingGroups.length,
      tooling: toolingList,
      status: 'Concluído',
    });
    logAction('create', 'Fluxo', `${code} - ${name} criado`);
    navigate('/fluxos');
  };

  const pageDescStep2 = `Selecione os ferramentais para ${selectedMachine?.name || 'a máquina'} — clique em cada grupo para escolher a peça.`;

  return (
    <div className="p-6">
      <div className="flex items-center mb-6 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            {i > 0 && <div className={`w-8 h-0.5 ${i < step ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`} />}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${i + 1 === step ? 'bg-[var(--accent)] text-white shadow-[0_0_0_4px_var(--accent-light)]' : i + 1 < step ? 'border-2 border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-2 border-[var(--border)]'}`}>
              {i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i + 1 === step ? 'text-[var(--fg)] font-medium' : 'text-[var(--fg-secondary)]'}`}>{s}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <h3 className="text-base font-semibold mb-1">{PAGE_TITLES[0]}</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">{PAGE_DESCS_BASE[0]}</p>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-3">
            {machines.map(m => (
              <button type="button" key={m.id} onClick={() => setSelected(m.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all duration-150 ${selected === m.id ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)]'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-2"><Icon name="box" size={18} /></div>
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-xs text-[var(--fg-secondary)] mt-0.5">{m.type}</div>
                <div className="mt-2"><Badge>{m.outils} ferramentais</Badge></div>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="ghost" disabled>← Anterior</Button>
            <Button variant="primary" onClick={() => selected && setStep(2)} disabled={!selected}>Avançar →</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h3 className="text-base font-semibold mb-1">{PAGE_TITLES[1]}</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">{PAGE_DESCS_BASE[1]}</p>
          <div className="mb-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)]"><Icon name="search" size={16} /></span>
              <input className="shad-input pl-9" placeholder="Buscar produto por nome ou código..." value={productSearch} onChange={e => { setProductSearch(e.target.value.toLowerCase()); setSelectedProduct(null); setNewProduct({ code: '', name: '', category: '', vol: '', unit: 'ml' }); }} aria-label="Buscar produtos" />
            </div>
          </div>
          {productSearch && productFiltered.length > 0 && (
            <div className="mb-4 border border-[var(--border)] rounded-lg overflow-hidden">
              {productFiltered.map(p => (
                <button key={p.id} type="button" onClick={() => { setSelectedProduct(p); setNewProduct({ code: '', name: '', category: '', vol: '', unit: 'ml' }); setProductSearch(''); }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${selectedProduct && selectedProduct.id === p.id ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'hover:bg-[var(--bg)]'}`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-[var(--fg-secondary)]">{p.code} · {p.category} · {p.vol} {p.unit}</div>
                  </div>
                  {selectedProduct && selectedProduct.id === p.id && <Icon name="check-circle" size={16} />}
                </button>
              ))}
            </div>
          )}
          {selectedProduct && (
            <div className="mb-4 p-4 bg-[var(--accent-light)] border border-[var(--accent)] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--accent)]">{selectedProduct.name}</div>
                  <div className="text-xs text-[var(--fg-secondary)] mt-0.5">Código: {selectedProduct.code} · {selectedProduct.category} · {selectedProduct.vol} {selectedProduct.unit}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(null); setProductSearch(''); }}>Limpar</Button>
              </div>
            </div>
          )}
          <div className={`border-t border-[var(--border)] mt-3 pt-3 ${selectedProduct ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Ou crie um novo produto</span>
            </div>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
              <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Nome do produto *</label><Input placeholder="Ex: Shampoo Nutritivo" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Código interno *</label><Input placeholder="Ex: SHP-400-001" value={newProduct.code} onChange={e => setNewProduct({ ...newProduct, code: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-3 grid-cols-1 gap-4 mt-4">
              <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Categoria</label><Select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}><option value="">Selecione</option>{PRODUCT_CATEGORIES.map(o => <option key={o}>{o}</option>)}</Select></div>
              <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Volumetria *</label><Input type="number" placeholder="400" value={newProduct.vol} onChange={e => setNewProduct({ ...newProduct, vol: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Unidade</label><Select value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}><option>ml</option><option>g</option></Select></div>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(1)}>← Máquina</Button>
            <Button variant="primary" disabled={!selectedProduct && (!newProduct.name || !newProduct.code || !newProduct.vol)}
              onClick={() => {
                if (newProduct.name && newProduct.code && newProduct.vol) {
                  addProduct({ ...newProduct, vol: Number(newProduct.vol), created: new Date().toISOString().slice(0, 10), category: newProduct.category || '—', family: '', packaging: '', weight: '' });
                }
                setStep(3);
              }}>Avançar →</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h3 className="text-base font-semibold mb-1">{PAGE_TITLES[2]}</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">{pageDescStep2}</p>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-3">
            {toolingGroups.map(g => (
              <button key={g} type="button" onClick={() => setModalGroup(g)}
                className={`text-left p-3 rounded-lg border-2 transition-all duration-150 ${toolingSelections[g] ? 'border-[var(--success)] bg-[var(--success-muted)]' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)]'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${toolingSelections[g] ? 'bg-[var(--success)] text-white' : 'bg-[var(--bg)] text-[var(--fg-secondary)]'}`}>
                      {toolingSelections[g] ? '✓' : '+'}
                    </div>
                    <span className="text-sm">{g}</span>
                  </div>
                  {toolingSelections[g] && <span className="text-xs text-[var(--fg-secondary)]">{toolingSelections[g]}</span>}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
            <span className="text-xs text-[var(--fg-secondary)]">{selectedCount} de {toolingGroups.length} grupos selecionados</span>
          </div>

          {modalGroup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setModalGroup(null)} onKeyDown={e => e.key === 'Escape' && setModalGroup(null)}>
              <div className="absolute inset-0 bg-[var(--overlay)]" />
              <div role="dialog" aria-modal="true" aria-label={modalGroup} className="relative bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg w-full max-w-sm mx-4 p-6 z-10" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold">{modalGroup}</h3>
                  <button type="button" onClick={() => setModalGroup(null)} aria-label="Fechar" className="p-1 rounded hover:bg-[var(--bg)] text-[var(--fg-secondary)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                <p className="text-xs text-[var(--fg-secondary)] mb-4">Selecione a peça desejada:</p>
                {piecesFor(modalGroup).length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-[var(--danger-muted)] flex items-center justify-center mx-auto mb-3 text-[var(--danger)]"><Icon name="alert" size={20} /></div>
                    <p className="text-sm font-medium text-[var(--fg)] mb-1">Nenhuma peça cadastrada</p>
                    <p className="text-xs text-[var(--fg-secondary)]">Não existem peças na categoria "{modalGroup}" no catálogo.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {piecesFor(modalGroup).map(op => (
                      <button key={op.id} type="button" onClick={() => selectPiece(modalGroup, op.name)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-3 ${toolingSelections[modalGroup] === op.name ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)] font-medium' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)]'}`}
                      >
                        {op.image ? (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewImage(op.image); }}>
                            <img src={op.image} alt={op.name} className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] shrink-0 hover:ring-2 hover:ring-[var(--accent)] transition-all cursor-pointer" />
                          </button>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
                            <Icon name="box" size={16} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{op.name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-[var(--fg-secondary)]">
                            <span className="font-mono">{op.code}</span>
                            <span>·</span>
                            <span>Est: {op.stock} {op.unit}</span>
                          </div>
                        </div>
                        {toolingSelections[modalGroup] === op.name && <Icon name="check-circle" size={16} />}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-4"><Button variant="ghost" onClick={() => setModalGroup(null)} className="w-full">Fechar</Button></div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(2)}>← Produto</Button>
            <Button variant="primary" onClick={() => setStep(4)}>Avançar →</Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <h3 className="text-base font-semibold mb-1">{PAGE_TITLES[3]}</h3>
          <p className="text-sm text-[var(--fg-secondary)] mb-4">{PAGE_DESCS_BASE[3]}</p>
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
            {['Máquina', 'Produto', 'Peças'].map(s => (
              <div key={s} className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">{s}</span>
                  <button type="button" className="text-xs text-[var(--accent)] hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit" onClick={() => setStep(STEP_TO_INDEX[s])}>editar</button>
                </div>
                {s === 'Máquina' && <div className="text-sm">{selectedMachine?.name || '—'}</div>}
                {s === 'Produto' && <div className="text-sm">{selectedProduct ? `${selectedProduct.name} (${selectedProduct.vol} ${selectedProduct.unit})` : newProduct.name ? `${newProduct.name} (${newProduct.vol} ${newProduct.unit})` : '—'}</div>}
                {s === 'Peças' && <div className="text-sm font-nums">{selectedCount}/{toolingGroups.length} grupos</div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(3)}>← Peças</Button>
            <Button variant="primary" onClick={() => setStep(5)}>Avançar →</Button>
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4"><Icon name="check-circle" size={28} /></div>
            <h3 className="text-lg font-semibold mb-1">Publicar Fluxo</h3>
            <p className="text-sm text-[var(--fg-secondary)] mb-6 max-w-sm mx-auto">Revisei os dados e estou ciente que este fluxo será aplicado na máquina selecionada.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={() => setStep(4)}>← Revisar</Button>
              <Button variant="primary" onClick={handlePublish}>Publicar Fluxo</Button>
            </div>
          </div>
        </Card>
      )}
      {previewImage && <ImagePreview src={previewImage} alt="Foto da peça" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
