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

export function PecasPage() {
  const { pieces, addPiece, deletePiece, updatePiece, logAction } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const { sorted, toggle, indicator } = useSortable(pieces, 'name');
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [drawerItem, setDrawerItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', category: '', compat: '', location: '', stock: '', min: '', image: '' });
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setForm({ code: '', name: '', category: '', compat: '', location: '', stock: '', min: '', image: '' });
    setEditingId(null);
    setImageError('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Formato de imagem não suportado.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Imagem muito grande (máx. ${Math.round(MAX_IMAGE_SIZE / 1024)} KB).`);
      return;
    }
    setImageError('');
    try {
      const dataURL = await readFileAsDataURL(file);
      setForm(prev => ({ ...prev, image: dataURL }));
    } catch {
      setImageError('Erro ao processar a imagem.');
    }
  };

  const handleSave = () => {
    if (!form.code || !form.name || !form.stock) return;
    if (editingId) {
      updatePiece(editingId, { ...form, stock: Number(form.stock), min: Number(form.min) || 0 });
    } else {
      addPiece({ ...form, stock: Number(form.stock), min: Number(form.min) || 0, unit: 'un' });
    }
    logAction(editingId ? 'update' : 'create', 'Peça', editingId ? `${form.name} atualizada` : `${form.name} cadastrada`);
    toast(editingId ? 'Peça atualizada com sucesso!' : 'Peça cadastrada com sucesso!');
    resetForm();
    setTab('list');
  };

  const startEdit = (p) => {
    setForm({
      code: p.code, name: p.name, category: p.category || '', compat: p.compat || '',
      location: p.location || '', stock: String(p.stock || ''), min: String(p.min || ''), image: p.image || '',
    });
    setEditingId(p.id);
    setTab('create');
  };

  const stockBadge = (s, min) => s <= min ? 'danger' : s <= min * 2 ? 'warning' : 'success';
  const filtered = sorted.filter(p => !search || p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search) || p.category.toLowerCase().includes(search));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Peças</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">{pieces.length} peça{pieces.length !== 1 ? 's' : ''} cadastrada{pieces.length !== 1 ? 's' : ''}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === 'list' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('list'); resetForm(); }}><Icon name="box" size={16} />{tab === 'list' ? 'Estoque' : 'Ver Estoque'}</Button>
          <Button variant={tab === 'create' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />{editingId ? 'Editar' : 'Nova Peça'}</Button>
        </div>
      </div>
      {tab === 'list' ? (
        <>
          <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <div className="relative max-w-sm flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)] pointer-events-none"><Icon name="search" size={16} /></span>
              <input className="shad-input pl-9" placeholder="Buscar por nome, código ou categoria..." value={search} onChange={e => setSearch(e.target.value.toLowerCase())} aria-label="Buscar peças" />
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={<Icon name="box" size={24} />} title="Nenhuma peça encontrada" desc="Tente ajustar sua busca ou cadastre uma nova peça."
              action={<Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />Nova Peça</Button>}
            />
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg)]">
                    {['', 'Código', 'Nome', 'Categoria', 'Máquinas Compatíveis', 'Localização', 'Estoque', 'Estoque Mín.', 'Status', 'Ações'].map(h => {
                      const ks = { Código:'code', Nome:'name', Categoria:'category', 'Máquinas Compatíveis':'compat', Localização:'location', Estoque:'stock', 'Estoque Mín.':'min' };
                      const k = ks[h];
                      return (<th scope="col" key={h} onClick={k ? () => toggle(k) : undefined} className={`text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider ${k ? 'cursor-pointer hover:text-[var(--fg)] select-none' : ''}`}>{h}{k ? indicator(k) : ''}</th>);
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--bg)]">
                      <td className="px-4 py-2.5">
                        {p.image ? (
                          <button type="button" onClick={() => setPreviewImage(p.image)} className="cursor-pointer">
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)] hover:ring-2 hover:ring-[var(--accent)] transition-all" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--fg-muted)]">
                            <Icon name="box" size={18} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent)]">
                        <button type="button" onClick={() => setDrawerItem(p)} className="hover:text-[var(--fg)] transition-colors">{p.code}</button>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{p.name}</td>
                      <td className="px-4 py-2.5"><Badge>{p.category}</Badge></td>
                      <td className="px-4 py-2.5 text-xs text-[var(--fg-secondary)]">{p.compat}</td>
                      <td className="px-4 py-2.5 text-[var(--fg-secondary)]">{p.location}</td>
                      <td className="px-4 py-2.5 font-nums font-medium">{p.stock}</td>
                      <td className="px-4 py-2.5 font-nums text-[var(--fg-secondary)]">{p.min}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={stockBadge(p.stock, p.min)}>
                          {p.stock <= p.min ? 'Baixo' : p.stock <= p.min * 2 ? 'Atenção' : 'Normal'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setDrawerItem(p)} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--accent)] transition-colors">Detalhes</button>
                          <button type="button" onClick={() => startEdit(p)} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--accent)] transition-colors">Editar</button>
                          <button type="button" onClick={() => { if (confirm(`Excluir ${p.name}?`)) { deletePiece(p.id); logAction('delete', 'Peça', `${p.name} excluída`); toast('Peça excluída com sucesso!'); } }} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--danger)] transition-colors">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <Card>
          <h3 className="text-base font-semibold mb-4">{editingId ? 'Editar Peça' : 'Nova Peça'}</h3>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Código *</label><Input placeholder="Ex: CP-PD-001" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Nome da peça *</label><Input placeholder="Ex: Copos Padrão" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          </div>
          <div className="mt-4 mb-4 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
            <label className="text-xs font-medium text-[var(--fg)] mb-2 block">Foto da peça</label>
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
                className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all w-full text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="upload" size={16} /></div>
                <div>
                  <div className="text-sm text-[var(--fg)]">Clique para adicionar foto</div>
                  <div className="text-xs text-[var(--fg-secondary)]">PNG, JPG • Máx. {MAX_IMAGE_SIZE / 1024} KB</div>
                </div>
              </button>
            )}
            {imageError && <p className="text-xs text-[var(--danger)] mt-1">{imageError}</p>}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div className="grid md:grid-cols-3 grid-cols-1 gap-4 mt-4">
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Categoria</label><Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Selecione</option>{categories.map(o => <option key={o}>{o}</option>)}</Select></div>
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Máquinas compatíveis</label><Input placeholder="Ex: Norden C5, C6" value={form.compat} onChange={e => setForm({ ...form, compat: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Localização</label><Input placeholder="Ex: Armário A3" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4 mt-4">
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Quantidade em estoque *</label><Input type="number" placeholder="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Estoque mínimo</label><Input type="number" placeholder="0" value={form.min} onChange={e => setForm({ ...form, min: e.target.value })} /></div>
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
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[
                    ['Código', drawerItem.code], ['Categoria', drawerItem.category],
                    ['Máquinas Compatíveis', drawerItem.compat], ['Localização', drawerItem.location],
                    ['Estoque', `${drawerItem.stock} ${drawerItem.unit}`],
                    ['Estoque Mínimo', `${drawerItem.min} ${drawerItem.unit}`],
                    ['Status', drawerItem.stock <= drawerItem.min ? 'Baixo' : drawerItem.stock <= drawerItem.min * 2 ? 'Atenção' : 'Normal'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-xs text-[var(--fg-secondary)]">{label}</div>
                      <div className="font-medium truncate">{value || '—'}</div>
                    </div>
                  ))}
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
