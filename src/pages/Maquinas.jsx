import { useState, useContext, useRef } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { useSortable } from '../hooks/useSortable';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { EmptyState } from '../components/EmptyState';
import { ImagePreview } from '../components/ImagePreview';

const uos = ['Bisnagas', 'Potes', 'Refil'];
const MAX_IMAGE_SIZE = 500 * 1024;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export function MaquinasPage() {
  const { machines, addMachine, deleteMachine, deleteMachines, updateMachine, logAction } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const { sorted, toggle, indicator } = useSortable(machines, 'name');
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [uoFilter, setUoFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [drawerItem, setDrawerItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [form, setForm] = useState({ name: '', line: '', uo: '', createdBy: '', image: '' });
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const resetForm = () => { setForm({ name: '', line: '', uo: '', createdBy: '', image: '' }); setEditingId(null); setImageError(''); };

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
    if (!form.name || !form.line || !form.uo) return;
    if (editingId) { updateMachine(editingId, form); }
    else { addMachine(form); }
    logAction(editingId ? 'update' : 'create', 'Máquina', editingId ? `${form.name} atualizada` : `${form.name} cadastrada`);
    toast(editingId ? 'Máquina atualizada com sucesso!' : 'Máquina cadastrada com sucesso!');
    resetForm();
    setTab('list');
  };

  const startEdit = (m) => {
    setForm({ name: m.name, line: m.line, uo: m.uo, createdBy: m.createdBy || '', image: m.image || '' });
    setEditingId(m.id);
    setTab('create');
  };

  const filtered = sorted.filter(m => (!search || m.name.toLowerCase().includes(search) || m.line.toLowerCase().includes(search)) && (!uoFilter || m.uo === uoFilter));
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
    if (!confirm(`Excluir ${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} selecionada${selectedCount !== 1 ? 's' : ''}?`)) return;
    deleteMachines(Array.from(selected));
    logAction('delete', 'Máquina', `${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} em massa`);
    toast(`${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} com sucesso!`);
    clearSelection();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Máquinas</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">{machines.length} equipamento{machines.length !== 1 ? 's' : ''} cadastrado{machines.length !== 1 ? 's' : ''} em {uos.length} UO{uos.length !== 1 ? 's' : ''}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === 'list' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('list'); resetForm(); }}><Icon name="box" size={16} />{tab === 'list' ? 'Lista' : 'Ver Lista'}</Button>
          <Button variant={tab === 'create' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />{editingId ? 'Editar' : 'Nova Máquina'}</Button>
        </div>
      </div>
      {tab === 'list' ? (
        <>
          <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <div className="relative max-w-sm flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)] pointer-events-none"><Icon name="search" size={16} /></span>
              <input className="shad-input pl-9" placeholder="Buscar por nome ou linha..." value={search} onChange={e => { setSearch(e.target.value.toLowerCase()); setPage(1); clearSelection(); }} aria-label="Buscar máquinas" />
            </div>
            <Select value={uoFilter} onChange={e => { setUoFilter(e.target.value); setPage(1); clearSelection(); }}>
              <option value="">Todas as UOs</option>
              {uos.map(u => <option key={u} value={u}>{u}</option>)}
            </Select>
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
            <EmptyState icon={<Icon name="box" size={24} />} title="Nenhuma máquina encontrada" desc="Tente ajustar os filtros de busca."
              action={<Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />Nova Máquina</Button>}
            />
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg)]">
                    <th className="w-10 px-4 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" className="accent-[var(--accent)] cursor-pointer" /></th>
                    {['Nome', 'Linha', 'UO', 'Última Atualização', 'Criado em', 'Criado por', 'Ações'].map(h => {
                      const ks = { Nome:'name', Linha:'line', UO:'uo', 'Última Atualização':'updatedAt', 'Criado em':'createdAt', 'Criado por':'createdBy' };
                      const k = ks[h];
                      return (<th scope="col" key={h} onClick={k ? () => toggle(k) : undefined} className={`text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider ${k ? 'cursor-pointer hover:text-[var(--fg)] select-none' : ''}`}>{h}{k ? indicator(k) : ''}</th>);
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id} className={`border-t border-[var(--border)] hover:bg-[var(--bg)] transition-colors ${selected.has(m.id) ? 'bg-[var(--accent-light)]' : ''}`}>
                      <td className="px-4 py-2.5"><input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} aria-label={`Selecionar ${m.name}`} className="accent-[var(--accent)] cursor-pointer" /></td>
                      <td className="px-4 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          {m.image ? (
                            <button type="button" onClick={() => setPreviewImage(m.image)} className="cursor-pointer shrink-0">
                              <img src={m.image} alt={m.name} className="w-8 h-8 rounded-lg object-cover border border-[var(--border)] hover:ring-2 hover:ring-[var(--accent)] transition-all" />
                            </button>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0"><Icon name="box" size={16} /></div>
                          )}
                          <button type="button" onClick={() => setDrawerItem(m)} className="font-medium text-left hover:text-[var(--accent)] transition-colors">{m.name}</button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[var(--fg-secondary)]">{m.line}</td>
                      <td className="px-4 py-2.5"><Badge>{m.uo}</Badge></td>
                      <td className="px-4 py-2.5 text-xs text-[var(--fg-secondary)]">{m.updatedAt}</td>
                      <td className="px-4 py-2.5 text-xs text-[var(--fg-secondary)]">{m.createdAt}</td>
                      <td className="px-4 py-2.5 text-xs">{m.createdBy}</td>
                      <td className="px-4 py-2.5">
                        <button type="button" onClick={() => setDrawerItem(m)} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors">Detalhes</button>
                      </td>
                    </tr>
                  ))}
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
          <h3 className="text-base font-semibold mb-4">{editingId ? 'Editar Máquina' : 'Nova Máquina'}</h3>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Nome da máquina *</label><Input placeholder="Ex: Norden C14" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Linha *</label><Input placeholder="Ex: C14" value={form.line} onChange={e => setForm({ ...form, line: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">UO *</label><Select value={form.uo} onChange={e => setForm({ ...form, uo: e.target.value })}><option value="">Selecione</option>{uos.map(u => <option key={u}>{u}</option>)}</Select></div>
            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Criado por</label>
              <Input placeholder="Ex: Carlos Silva" value={form.createdBy} onChange={e => setForm({ ...form, createdBy: e.target.value })} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4 mt-4">
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Foto da máquina</label>
              {form.image ? (
                <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                  <img src={form.image} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-[var(--border)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">Foto da máquina</div>
                    <div className="flex gap-2 mt-1">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-[var(--accent)] hover:underline">Trocar</button>
                      <button type="button" onClick={() => { setForm(prev => ({ ...prev, image: '' })); setImageError(''); }} className="text-xs text-[var(--danger)] hover:underline">Remover</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all w-full text-left">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0"><Icon name="upload" size={18} /></div>
                  <div className="text-left"><div className="text-sm text-[var(--fg)]">Adicionar foto</div><div className="text-xs text-[var(--fg-secondary)]">PNG, JPG • 500 KB máx</div></div>
                </button>
              )}
              {imageError && <p className="text-xs text-[var(--danger)] mt-1">{imageError}</p>}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={handleSave}><Icon name="plus" size={16} />{editingId ? 'Salvar Alterações' : 'Cadastrar Máquina'}</Button>
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
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[['Linha', drawerItem.line], ['UO', drawerItem.uo],
                    ['Última Atualização', drawerItem.updatedAt], ['Criado em', drawerItem.createdAt],
                    ['Criado por', drawerItem.createdBy],
                  ].map(([label, value]) => (
                    <div key={label}><div className="text-xs text-[var(--fg-secondary)]">{label}</div><div className="font-medium truncate">{value || '—'}</div></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[var(--border)] shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { const m = drawerItem; setDrawerItem(null); startEdit(m); }}>Editar</Button>
              <button type="button" onClick={() => { if (confirm(`Excluir ${drawerItem.name}?`)) { deleteMachine(drawerItem.id); logAction('delete', 'Máquina', `${drawerItem.name} excluída`); toast('Máquina excluída com sucesso!'); setDrawerItem(null); } }}
                className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--danger-muted)] text-[var(--danger)] hover:opacity-80 transition-colors">Excluir</button>
            </div>
          </div>
        </>
      )}
      {previewImage && <ImagePreview src={previewImage} alt="Foto da máquina" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
