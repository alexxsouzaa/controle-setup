import { useState, useContext, useRef } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';

const CATEGORIES = ['Shampoo', 'Condicionador', 'Creme', 'SÃ©rum', 'LoÃ§Ã£o', 'Gel', 'Pomada', 'Ã“leo'];

export function ProdutosPage() {
  const { products, addProduct, deleteProduct, deleteProducts, updateProduct, logAction } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [drawerItem, setDrawerItem] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const perPage = 10;
  const [form, setForm] = useState({ code: '', name: '', category: '', vol: '', unit: 'ml', formato: '', image: '' });
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);
  const MAX_IMAGE_SIZE = 500 * 1024;

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const resetForm = () => { setForm({ code: '', name: '', category: '', vol: '', unit: 'ml', formato: '', image: '' }); setEditingId(null); setImageError(''); };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImageError('Formato de imagem não suportado.'); return; }
    if (file.size > MAX_IMAGE_SIZE) { setImageError(`Imagem muito grande (máx. ${Math.round(MAX_IMAGE_SIZE / 1024)} KB).`); return; }
    setImageError('');
    try { const dataURL = await readFileAsDataURL(file); setForm(prev => ({ ...prev, image: dataURL })); }
    catch { setImageError('Erro ao processar a imagem.'); }
  };

  const handleSave = () => {
    if (!form.code || !form.name || !form.vol) { toast('Preencha os campos obrigatÃ³rios: CÃ³digo, Nome e Volume.', 'warning'); return; }
    if (editingId) { updateProduct(editingId, { ...form, vol: Number(form.vol) }); }
    else { addProduct({ ...form, vol: Number(form.vol), created: new Date().toISOString().slice(0, 10) }); }
    logAction(editingId ? 'update' : 'create', 'Produto', editingId ? `${form.name} atualizado` : `${form.name} cadastrado`);
    toast(editingId ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
    resetForm();
    setTab('list');
  };

  const startEdit = (p) => {
    setForm({ code: p.code, name: p.name, category: p.category || '', vol: String(p.vol || ''), unit: p.unit || 'ml', formato: p.formato || '', image: p.image || '' });
    setEditingId(p.id);
    setTab('create');
  };

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id) => { if (!selectionMode) setSelectionMode(true); setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleSelectAll = () => {
    if (!selectionMode && !allSelected) setSelectionMode(true);
    if (paged.every(s => selected.has(s.id))) setSelected(new Set([...selected].filter(id => !paged.some(s => s.id === id))));
    else setSelected(new Set([...selected, ...paged.map(s => s.id)]));
  };
  const clearSelection = () => { setSelected(new Set()); setSelectionMode(false); };
  const selectedCount = selected.size;
  const allSelected = paged.length > 0 && paged.every(s => selected.has(s.id));

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    if (!confirm(`Excluir ${selectedCount} produto${selectedCount !== 1 ? 's' : ''} selecionado${selectedCount !== 1 ? 's' : ''}?`)) return;
    deleteProducts(Array.from(selected));
    logAction('delete', 'Produto', `${selectedCount} produto${selectedCount !== 1 ? 's' : ''} excluÃ­do${selectedCount !== 1 ? 's' : ''} em massa`);
    toast(`${selectedCount} produto${selectedCount !== 1 ? 's' : ''} excluÃ­do${selectedCount !== 1 ? 's' : ''} com sucesso!`);
    clearSelection();
  };


  return (
    <div className="p-6 pb-16">
      {tab === 'list' ? (
        <>
          <div className="grid lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Produtos', value: products.length, icon: 'grid-3x3' },
              { label: 'Categorias', value: CATEGORIES.length, icon: 'box' },
              { label: 'Com CÃ³digo', value: products.filter(p => p.code).length, icon: 'file' },
              { label: 'Com Formato', value: products.filter(p => p.formato).length, icon: 'settings' },
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
            <div className="relative max-w-xs">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none"><Icon name="search" size={14} /></span>
              <input className="shad-input pl-8 py-1.5 text-[12px]" placeholder="Buscar por nome ou cÃ³digo..." value={search} onChange={e => { setSearch(e.target.value.toLowerCase()); setPage(1); clearSelection(); }} aria-label="Buscar produtos" />
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
              <Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={14} />Novo Produto</Button>
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
              <p className="text-[15px] font-medium text-[var(--fg)] mb-1">{products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}</p>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-4">{products.length === 0 ? 'Cadastre o primeiro produto.' : 'Tente ajustar a busca.'}</p>
              {products.length === 0 && <Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={14} />Novo Produto</Button>}
            </div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] overflow-hidden">
              <table className="w-full text-[13px] border-collapse">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">
                    <th className={`w-8 px-3.5 py-2.5 border-b border-[var(--border)] ${selectionMode ? '' : 'hidden'}`}><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" className="accent-[var(--fg)] cursor-pointer" /></th>
                    <th className="text-left px-4 py-2.5 border-b border-[var(--border)]">Produto</th>
                    <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] w-20">Volume</th>
                    <th className="text-left px-3.5 py-2.5 border-b border-[var(--border)] w-24 hidden sm:table-cell">Criado em</th>
                    <th className="w-20 px-3.5 py-2.5 border-b border-[var(--border)] text-right">AÃ§Ãµes</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p, idx) => {
                    const last = idx === paged.length - 1;
                    return (
                    <tr key={p.id} className={`hover:bg-[var(--surface-hover)] transition-colors ${selected.has(p.id) ? 'bg-[var(--accent-muted)]' : ''}`} onClick={() => selectionMode && toggleSelect(p.id)} style={{ cursor: selectionMode ? 'pointer' : undefined }}>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} ${selectionMode ? '' : 'hidden'}`}>
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label={`Selecionar ${p.name}`} className="accent-[var(--fg)] cursor-pointer" />
                      </td>
                      <td className={`px-4 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''}`}>
                        <button type="button" onClick={() => setDrawerItem(p)} className="text-left w-full">
                          <div className="font-medium text-[var(--fg)] truncate max-w-[360px]">{p.name}</div>
                          <div className="text-[12px] font-mono text-[var(--fg-muted)]">{p.code}</div>
                        </button>
                      </td>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} text-[12px] font-mono text-[var(--fg-secondary)]`}>{p.vol} {p.unit}</td>
                      <td className={`px-3.5 py-2.5 border-b border-[var(--border-subtle)] ${last ? 'border-b-0' : ''} text-[12px] text-[var(--fg-muted)] font-mono hidden sm:table-cell`}>{p.created}</td>
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
                  <span className="text-[12px] text-[var(--fg-muted)]">Mostrando {1 + (page - 1) * perPage}â€“{Math.min(page * perPage, filtered.length)} de {filtered.length}</span>
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
      ) : (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <button type="button" onClick={() => { resetForm(); setTab('list'); }} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">← Voltar</button>
          </div>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="grid-3x3" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Informações básicas do produto.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Código *</label>
                <Input placeholder="Ex: SHP-400-001" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Nome do produto *</label>
                <Input placeholder="Ex: Shampoo Nutritivo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="box" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">Características</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Especificações técnicas do produto.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_1fr] gap-4 mb-4">
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Volume *</label>
                <Input type="number" placeholder="400" value={form.vol} onChange={e => setForm({ ...form, vol: e.target.value })} />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Unidade</label>
                <Select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}><option>ml</option><option>g</option></Select>
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Formato</label>
                <Select value={form.formato} onChange={e => setForm({ ...form, formato: e.target.value })}>
                  <option value="">Selecione</option>
                  <option>Reto</option><option>Boomerang</option><option>Transforms</option><option>Angular</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Categoria</label>
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Selecione</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
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
          <div className="flex items-center justify-end gap-3 pb-4">
            <Button variant="ghost" size="sm" onClick={() => { resetForm(); setTab('list'); }}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>{editingId ? 'Salvar' : 'Criar Produto'}</Button>
          </div>
        </div>
      )}
      {drawerItem && (
        <>
          <div className="fixed inset-0 z-40 bg-[var(--overlay)]" onClick={() => setDrawerItem(null)} onKeyDown={e => e.key === 'Escape' && setDrawerItem(null)} />
          <div role="dialog" aria-modal="true" aria-label={`Detalhes: ${drawerItem.name}`} style={{ width: 'min(420px, 90vw)' }}
            className="fixed top-0 right-0 bottom-0 z-50 bg-[var(--bg)] border-l border-[var(--border)] shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="grid-3x3" size={16} /></div>
                <h3 className="text-[14px] font-semibold truncate">{drawerItem.name}</h3>
              </div>
              <button type="button" onClick={() => setDrawerItem(null)} aria-label="Fechar" className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--fg-secondary)] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">CÃ³digo</div>
                    <div className="text-[13px] font-mono text-[var(--fg)] mt-0.5">{drawerItem.code}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Volume</div>
                    <div className="text-[13px] text-[var(--fg)] mt-0.5">{drawerItem.vol} {drawerItem.unit}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Categoria</div>
                  <div className="text-[13px] text-[var(--fg)] mt-0.5">{drawerItem.category || 'â€”'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Formato</div>
                  <div className="text-[13px] text-[var(--fg)] mt-0.5">{drawerItem.formato || 'â€”'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Criado em</div>
                  <div className="text-[13px] text-[var(--fg)] mt-0.5">{drawerItem.created || 'â€”'}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border)] shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { const p = drawerItem; setDrawerItem(null); startEdit(p); }}>Editar</Button>
              <button type="button" onClick={() => { if (confirm(`Excluir ${drawerItem.name}?`)) { deleteProduct(drawerItem.id); logAction('delete', 'Produto', `${drawerItem.name} excluÃ­do`); toast('Produto excluÃ­do com sucesso!'); setDrawerItem(null); } }}
                className="px-3 py-1.5 rounded-[4px] border border-[var(--danger)] text-[11px] font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors">Excluir</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

