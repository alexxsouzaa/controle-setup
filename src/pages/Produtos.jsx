import { useState, useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { useSortable } from '../hooks/useSortable';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { EmptyState } from '../components/EmptyState';

const categories = ['Shampoo', 'Condicionador', 'Creme', 'Sérum', 'Loção', 'Gel', 'Pomada', 'Óleo'];

export function ProdutosPage() {
  const { products, addProduct, deleteProduct, deleteProducts, updateProduct, logAction } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const { sorted, toggle, indicator } = useSortable(products, 'name');
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [drawerItem, setDrawerItem] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [form, setForm] = useState({ code: '', name: '', category: '', vol: '', unit: 'ml' });

  const resetForm = () => { setForm({ code: '', name: '', category: '', vol: '', unit: 'ml' }); setEditingId(null); };

  const handleSave = () => {
    if (!form.code || !form.name || !form.vol) return;
    if (editingId) { updateProduct(editingId, { ...form, vol: Number(form.vol) }); }
    else { addProduct({ ...form, vol: Number(form.vol), created: new Date().toISOString().slice(0, 10) }); }
    logAction(editingId ? 'update' : 'create', 'Produto', editingId ? `${form.name} atualizado` : `${form.name} cadastrado`);
    toast(editingId ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
    resetForm();
    setTab('list');
  };

  const startEdit = (p) => {
    setForm({ code: p.code, name: p.name, category: p.category || '', vol: String(p.vol || ''), unit: p.unit || 'ml' });
    setEditingId(p.id);
    setTab('create');
  };

  const filtered = sorted.filter(p => !search || p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search));
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
    if (!confirm(`Excluir ${selectedCount} produto${selectedCount !== 1 ? 's' : ''} selecionado${selectedCount !== 1 ? 's' : ''}?`)) return;
    deleteProducts(Array.from(selected));
    logAction('delete', 'Produto', `${selectedCount} produto${selectedCount !== 1 ? 's' : ''} excluído${selectedCount !== 1 ? 's' : ''} em massa`);
    toast(`${selectedCount} produto${selectedCount !== 1 ? 's' : ''} excluído${selectedCount !== 1 ? 's' : ''} com sucesso!`);
    clearSelection();
  };

  const handleExportList = () => {
    const json = JSON.stringify({ products: filtered }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produtos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Produtos</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportList}><Icon name="download" size={16} />Exportar</Button>
          <Button variant={tab === 'list' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('list'); resetForm(); }}><Icon name="grid-3x3" size={16} />{tab === 'list' ? 'Lista' : 'Ver Lista'}</Button>
          <Button variant={tab === 'create' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />{editingId ? 'Editar' : 'Novo Produto'}</Button>
        </div>
      </div>
      {tab === 'list' ? (
        <>
          <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
            <div className="relative max-w-sm flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-secondary)] pointer-events-none"><Icon name="search" size={16} /></span>
              <input className="shad-input pl-9" placeholder="Buscar por nome ou código..." value={search} onChange={e => { setSearch(e.target.value.toLowerCase()); setPage(1); clearSelection(); }} aria-label="Buscar produtos" />
            </div>
          </div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-[var(--accent-light)] border border-[var(--accent)] rounded-lg">
              <span className="text-sm font-medium text-[var(--accent)]">{selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}</span>
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={handleBulkDelete} className="text-xs px-3 py-1.5 rounded bg-[var(--danger)] text-white hover:opacity-90 transition-colors"><Icon name="alert" size={14} /> Excluir selecionados</button>
                <button type="button" onClick={clearSelection} className="text-xs px-2 py-1.5 rounded text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">Limpar</button>
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <EmptyState icon={<Icon name="grid-3x3" size={24} />} title="Nenhum produto encontrado" desc="Tente ajustar sua busca ou crie um novo produto."
              action={<Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />Novo Produto</Button>}
            />
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg)]">
                    <th className="w-10 px-4 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" className="accent-[var(--accent)] cursor-pointer" /></th>
                    {['Código', 'Nome', 'Categoria', 'Volumetria', 'Criado em', 'Ações'].map(h => {
                      const ks = { Código:'code', Nome:'name', Categoria:'category', Volumetria:'vol', 'Criado em':'created' };
                      const k = ks[h];
                      return (<th scope="col" key={h} onClick={k ? () => toggle(k) : undefined} className={`text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider ${k ? 'cursor-pointer hover:text-[var(--fg)] select-none' : ''}`}>{h}{k ? indicator(k) : ''}</th>);
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(p => (
                    <tr key={p.id} className={`border-t border-[var(--border)] hover:bg-[var(--bg)] transition-colors ${selected.has(p.id) ? 'bg-[var(--accent-light)]' : ''}`}>
                      <td className="px-4 py-2.5"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label={`Selecionar ${p.name}`} className="accent-[var(--accent)] cursor-pointer" /></td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[var(--accent)]">
                        <button type="button" onClick={() => setDrawerItem(p)} className="hover:text-[var(--fg)] transition-colors">{p.code}</button>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{p.name}</td>
                      <td className="px-4 py-2.5 text-[var(--fg-secondary)]">{p.category}</td>
                      <td className="px-4 py-2.5 font-nums">{p.vol} {p.unit}</td>
                      <td className="px-4 py-2.5 text-xs text-[var(--fg-secondary)]">{p.created}</td>
                      <td className="px-4 py-2.5">
                        <button type="button" onClick={() => setDrawerItem(p)} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors">Detalhes</button>
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
          <h3 className="text-base font-semibold mb-4">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
          <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Código *</label>
              <Input placeholder="Ex: SHP-400-001" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Nome do produto *</label>
              <Input placeholder="Ex: Shampoo Nutritivo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Categoria</label>
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Selecione</option>{categories.map(o => <option key={o}>{o}</option>)}</Select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Volumetria *</label>
              <Input type="number" placeholder="400" value={form.vol} onChange={e => setForm({ ...form, vol: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Unidade</label>
              <Select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}><option>ml</option><option>g</option></Select>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={handleSave}><Icon name="plus" size={16} />{editingId ? 'Salvar Alterações' : 'Criar Produto'}</Button>
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
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0"><Icon name="grid-3x3" size={18} /></div>
                <h3 className="text-sm font-semibold truncate">{drawerItem.name}</h3>
              </div>
              <button type="button" onClick={() => setDrawerItem(null)} aria-label="Fechar" className="p-1.5 rounded hover:bg-[var(--bg)] text-[var(--fg-secondary)] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] mb-2">Informações</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[['Código', drawerItem.code], ['Categoria', drawerItem.category],
                    ['Volumetria', `${drawerItem.vol} ${drawerItem.unit}`], ['Criado em', drawerItem.created],
                  ].map(([label, value]) => (
                    <div key={label}><div className="text-xs text-[var(--fg-secondary)]">{label}</div><div className="font-medium truncate">{value || '—'}</div></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-[var(--border)] shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { const p = drawerItem; setDrawerItem(null); startEdit(p); }}>Editar</Button>
              <button type="button" onClick={() => { if (confirm(`Excluir ${drawerItem.name}?`)) { deleteProduct(drawerItem.id); logAction('delete', 'Produto', `${drawerItem.name} excluído`); toast('Produto excluído com sucesso!'); setDrawerItem(null); } }}
                className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--danger-muted)] text-[var(--danger)] hover:opacity-80 transition-colors">Excluir</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
