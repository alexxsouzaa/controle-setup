import { useState, useContext, useRef } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { useSortable } from '../hooks/useSortable';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { EmptyState } from '../components/EmptyState';
import { ImagePreview } from '../components/ImagePreview';

const categories = ['Copos', 'Ponteira do Empurrador', 'Ponteira do Centralizador', 'Estação de Limpeza', 'Bico de Envase', 'Suporte do Camisa do Bico de Ar Quente', 'Camisa do Bico de Ar Quente', 'Ponteira do Bico de Ar Quente', 'Faca', 'Mordente', 'Régua do Mordente', 'Batedor do Mordente', 'Berço'];

const MAX_IMAGE_SIZE = 500 * 1024;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

function guessCategory(name) {
  const lower = (name || '').toLowerCase();
  for (const cat of categories) {
    if (lower.includes(cat.toLowerCase())) return cat;
  }
  return '';
}

export function PecasPage() {
  const { pieces, machines, addPiece, deletePiece, deletePieces, updatePiece, logAction } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const { sorted, toggle, indicator } = useSortable(pieces, 'name');
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [drawerItem, setDrawerItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [form, setForm] = useState({ name: '', specification: '', compatibleMachineIds: [], image: '' });
  const [imageError, setImageError] = useState('');
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setForm({ name: '', specification: '', compatibleMachineIds: [], image: '' });
    setEditingId(null);
    setImageError('');
  };

  const toggleMachine = (id) => {
    setForm(prev => {
      const ids = prev.compatibleMachineIds.includes(id)
        ? prev.compatibleMachineIds.filter(mid => mid !== id)
        : [...prev.compatibleMachineIds, id];
      return { ...prev, compatibleMachineIds: ids };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImageError('Formato de imagem não suportado. Use JPG, PNG ou WEBP.'); return; }
    if (file.size > MAX_IMAGE_SIZE) { setImageError(`Imagem muito grande (máx. ${Math.round(MAX_IMAGE_SIZE / 1024)} KB).`); return; }
    setImageError('');
    try {
      const dataURL = await readFileAsDataURL(file);
      setForm(prev => ({ ...prev, image: dataURL }));
    } catch { setImageError('Erro ao processar a imagem.'); }
  };

  const handleSave = () => {
    if (!form.name) { toast('Informe o nome da peça.', 'warning'); return; }
    if (!form.specification) { toast('Informe a especificação da peça.', 'warning'); return; }
    if (form.compatibleMachineIds.length === 0) { toast('Selecione pelo menos uma máquina compatível.', 'warning'); return; }
    if (!form.image) { toast('Adicione uma foto da peça.', 'warning'); return; }
    const category = guessCategory(form.name);
    if (editingId) { updatePiece(editingId, { ...form, category }); }
    else { addPiece({ ...form, category }); }
    logAction(editingId ? 'update' : 'create', 'Peça', editingId ? `${form.name} atualizada` : `${form.name} cadastrada`);
    toast(editingId ? 'Peça atualizada com sucesso!' : `Peça "${form.name} — ${form.specification}" cadastrada com sucesso!`);
    resetForm();
    setTab('list');
  };

  const startEdit = (p) => {
    setForm({
      name: p.name || '',
      specification: p.specification || '',
      compatibleMachineIds: p.compatibleMachineIds || [],
      image: p.image || '',
    });
    setEditingId(p.id);
    setTab('create');
  };

  const filtered = sorted.filter(p => !search || p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search) || (p.category || '').toLowerCase().includes(search));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id) => { setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleSelectAll = () => {
    if (paged.every(s => selected.has(s.id))) { setSelected(new Set([...selected].filter(id => !paged.some(s => s.id === id)))); }
    else { setSelected(new Set([...selected, ...paged.map(s => s.id)])); }
  };
  const clearSelection = () => setSelected(new Set());
  const selectedCount = selected.size;
  const allSelected = paged.length > 0 && paged.every(s => selected.has(s.id));

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    if (!confirm(`Excluir ${selectedCount} peça${selectedCount !== 1 ? 's' : ''} selecionada${selectedCount !== 1 ? 's' : ''}?`)) return;
    deletePieces(Array.from(selected));
    logAction('delete', 'Peça', `${selectedCount} peça${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} em massa`);
    toast(`${selectedCount} peça${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} com sucesso!`);
    clearSelection();
  };

  const compNames = (p) => {
    if (p.compatibleMachineIds && p.compatibleMachineIds.length > 0) {
      return p.compatibleMachineIds.map(id => machines.find(m => m.id === id)?.name).filter(Boolean);
    }
    if (p.compat) return p.compat.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Peças</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">{pieces.length} peça{pieces.length !== 1 ? 's' : ''} cadastrada{pieces.length !== 1 ? 's' : ''}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === 'list' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('list'); resetForm(); }}><Icon name="box" size={16} />{tab === 'list' ? 'Catálogo' : 'Ver Catálogo'}</Button>
          <Button variant={tab === 'create' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />{editingId ? 'Editar' : 'Nova Peça'}</Button>
        </div>
      </div>
      {tab === 'list' ? (
        <>
          <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <div className="relative max-w-sm flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)] pointer-events-none"><Icon name="search" size={16} /></span>
              <input className="shad-input pl-9" placeholder="Buscar por nome, código ou categoria..." value={search} onChange={e => { setSearch(e.target.value.toLowerCase()); setPage(1); clearSelection(); }} aria-label="Buscar peças" />
            </div>
          </div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-[var(--accent-light)] border border-[var(--accent)] rounded-lg">
              <span className="text-sm font-medium text-[var(--accent)]">{selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}</span>
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={handleBulkDelete} className="text-xs px-3 py-1.5 rounded bg-[var(--danger)] text-white hover:opacity-90 transition-colors"><Icon name="alert" size={14} /> Excluir selecionadas</button>
                <button type="button" onClick={clearSelection} className="text-xs px-2 py-1.5 rounded text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">Limpar</button>
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <EmptyState icon={<Icon name="box" size={24} />} title="Nenhuma peça encontrada" desc="Tente ajustar sua busca ou cadastre uma nova peça."
              action={<Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />Nova Peça</Button>}
            />
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg)]">
                    <th className="w-10 px-4 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" className="accent-[var(--accent)] cursor-pointer" /></th>
                    {['', 'Código', 'Nome', 'Especificação', 'Compatível com', 'Ações'].map(h => {
                      const ks = { Código:'code', Nome:'name', Especificação:'specification', 'Compatível com': null };
                      const k = ks[h];
                      return (<th scope="col" key={h} onClick={k ? () => toggle(k) : undefined} className={`text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider ${k ? 'cursor-pointer hover:text-[var(--fg)] select-none' : ''}`}>{h}{k ? indicator(k) : ''}</th>);
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(p => {
                    const names = compNames(p);
                    return (
                    <tr key={p.id} className={`border-t border-[var(--border)] hover:bg-[var(--bg)] transition-colors ${selected.has(p.id) ? 'bg-[var(--accent-light)]' : ''}`}>
                      <td className="px-4 py-2.5"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label={`Selecionar ${p.name}`} className="accent-[var(--accent)] cursor-pointer" /></td>
                      <td className="px-4 py-2.5">
                        {p.image ? (
                          <button type="button" onClick={() => setPreviewImage(p.image)} className="cursor-pointer">
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)] hover:ring-2 hover:ring-[var(--accent)] transition-all" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)]"><Icon name="box" size={18} /></div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent)]">
                        <button type="button" onClick={() => setDrawerItem(p)} className="hover:text-[var(--fg)] transition-colors">{p.code}</button>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{p.name}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-[var(--fg-secondary)]">{p.specification || '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {names.length > 0 ? names.map(n => <Badge key={n}>{n}</Badge>) : <span className="text-xs text-[var(--fg-muted)]">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <button type="button" onClick={() => setDrawerItem(p)} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors">Detalhes</button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4" role="navigation" aria-label="Navegação de páginas">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`w-8 h-8 rounded text-xs ${page === 1 ? 'text-[var(--fg-muted)] opacity-40' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)]'}`} aria-label="Anterior">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button type="button" key={p} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined}
                  className={`w-8 h-8 rounded text-xs ${p === page ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)]'}`}>{p}</button>
              ))}
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`w-8 h-8 rounded text-xs ${page === totalPages ? 'text-[var(--fg-muted)] opacity-40' : 'text-[var(--fg-secondary)] hover:bg-[var(--bg)]'}`} aria-label="Próxima">›</button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <h3 className="text-base font-semibold mb-4">{editingId ? 'Editar Peça' : 'Nova Peça'}</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Nome da peça *</label>
              <Input placeholder="Ex: Bico de Envase" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Especificação *</label>
              <Input placeholder="Ex: 250 mm ou F9-F10" value={form.specification} onChange={e => setForm({ ...form, specification: e.target.value })} />
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Especificação dimensional (mm) ou referência alfanumérica da peça.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Máquinas compatíveis *</label>
              <p className="text-[11px] text-[var(--fg-muted)] mb-2">Selecione as máquinas onde esta peça pode ser utilizada.</p>
              <div className="relative">
                {form.compatibleMachineIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.compatibleMachineIds.map(id => {
                      const m = machines.find(mch => mch.id === id);
                      return m ? (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--accent-light)] border border-[var(--accent)] text-xs">
                          {m.name}
                          <button type="button" onClick={() => setForm(prev => ({ ...prev, compatibleMachineIds: prev.compatibleMachineIds.filter(mid => mid !== id) }))} className="text-[var(--fg-secondary)] hover:text-[var(--danger)] ml-0.5">&times;</button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <button type="button" onClick={() => setMachineDropdownOpen(!machineDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm hover:border-[var(--accent)] transition-colors text-left">
                  <span className={form.compatibleMachineIds.length === 0 ? 'text-[var(--fg-muted)]' : ''}>
                    {form.compatibleMachineIds.length === 0 ? 'Selecione as máquinas...' : `${form.compatibleMachineIds.length} máquina${form.compatibleMachineIds.length !== 1 ? 's' : ''} selecionada${form.compatibleMachineIds.length !== 1 ? 's' : ''}`}
                  </span>
                  <Icon name="arrow-right" size={14} className={`transition-transform ${machineDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
                </button>
                {machineDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {machines.map(m => {
                      const checked = form.compatibleMachineIds.includes(m.id);
                      return (
                        <button key={m.id} type="button" onClick={() => toggleMachine(m.id)}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-[var(--bg)] transition-colors ${checked ? 'bg-[var(--accent-light)]' : ''}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'}`}>
                            {checked && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                          </div>
                          <span>{m.name}</span>
                          <span className="text-xs text-[var(--fg-secondary)] ml-auto">{m.line}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
              <label className="text-xs font-medium text-[var(--fg)] mb-2 block">Foto da peça *</label>
              {form.image ? (
                <div className="flex items-center gap-3">
                  <img src={form.image} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-[var(--border)]" />
                  <div>
                    <button type="button" onClick={() => { setForm(prev => ({ ...prev, image: '' })); setImageError(''); }} className="text-xs text-[var(--danger)] hover:underline">Remover foto</button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-[var(--accent)] hover:underline ml-3">Trocar</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all w-full"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="upload" size={20} /></div>
                  <div><div className="text-sm text-[var(--fg)]">Adicionar foto</div><div className="text-xs text-[var(--fg-secondary)]">Arraste ou clique para selecionar</div></div>
                  <div className="text-[11px] text-[var(--fg-muted)]">PNG, JPG, WEBP • Máx. {MAX_IMAGE_SIZE / 1024} KB</div>
                </button>
              )}
              {imageError && <p className="text-xs text-[var(--danger)] mt-1">{imageError}</p>}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={handleSave}><Icon name="plus" size={16} />{editingId ? 'Salvar Alterações' : 'Cadastrar Peça'}</Button>
            <Button variant="ghost" onClick={() => { resetForm(); setTab('list'); }}>Cancelar</Button>
          </div>
        </Card>
      )}
      {drawerItem && (
        <>
          <div className="fixed inset-0 z-40 bg-[var(--overlay)]" onClick={() => setDrawerItem(null)} onKeyDown={e => e.key === 'Escape' && setDrawerItem(null)} />
          <div role="dialog" aria-modal="true" aria-label={`Detalhes: ${drawerItem.name}`} style={{ width: 'min(480px, 90vw)' }}
            className="fixed top-0 right-0 bottom-0 z-50 bg-[var(--surface)] border-l border-[var(--border)] shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {drawerItem.image ? (
                  <img src={drawerItem.image} alt={drawerItem.name} className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0"><Icon name="box" size={18} /></div>
                )}
                <h3 className="text-sm font-semibold truncate">{drawerItem.name}</h3>
              </div>
              <button type="button" onClick={() => setDrawerItem(null)} aria-label="Fechar" className="p-1.5 rounded hover:bg-[var(--bg)] text-[var(--fg-secondary)] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {drawerItem.image && (
                <div className="flex justify-center">
                  <button type="button" onClick={() => setPreviewImage(drawerItem.image)} className="cursor-pointer">
                    <img src={drawerItem.image} alt={drawerItem.name} className="w-32 h-32 rounded-xl object-cover border border-[var(--border)] hover:ring-2 hover:ring-[var(--accent)] transition-all" />
                  </button>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2">Informações</h4>
                <div className="space-y-3 text-sm">
                  {[['Código', drawerItem.code], ['Especificação', drawerItem.specification], ['Criado por', drawerItem.createdBy], ['Criado em', drawerItem.createdAt],
                  ].map(([label, value]) => (
                    <div key={label}><div className="text-xs text-[var(--fg-secondary)]">{label}</div><div className="font-medium">{value || '—'}</div></div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2">Máquinas compatíveis</h4>
                <div className="flex flex-wrap gap-1.5">
                  {compNames(drawerItem).map(n => <Badge key={n}>{n}</Badge>)}
                  {compNames(drawerItem).length === 0 && <span className="text-xs text-[var(--fg-muted)]">Nenhuma máquina compatível</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[var(--border)] shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { const p = drawerItem; setDrawerItem(null); startEdit(p); }}>Editar</Button>
              <button type="button" onClick={() => { if (confirm(`Excluir ${drawerItem.name}?`)) { deletePiece(drawerItem.id); logAction('delete', 'Peça', `${drawerItem.name} excluída`); toast('Peça excluída com sucesso!'); setDrawerItem(null); } }}
                className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--danger-muted)] text-[var(--danger)] hover:opacity-80 transition-colors">Excluir</button>
            </div>
          </div>
        </>
      )}
      {previewImage && <ImagePreview src={previewImage} alt="Foto da peça" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
