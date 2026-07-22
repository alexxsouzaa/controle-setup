import { useState, useContext } from 'react';
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

const uos = ['Bisnagas', 'Potes', 'Refil'];
const machineTypes = ['Enchedora de Bisnagas', 'Enchedora com Selagem a Quente', 'Enchedora de Pequeno Porte', 'Enchedora de Alta Velocidade', 'Enchedora de Potes', 'Dosadora de Potes', 'Enchedora de Refil', 'Rotuladora', 'Encaixotadora', 'Paletizadora'];

export function MaquinasPage() {
  const { machines, addMachine, deleteMachine, updateMachine, logAction } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const { sorted, toggle, indicator } = useSortable(machines, 'name');
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [uoFilter, setUoFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [drawerItem, setDrawerItem] = useState(null);
  const [form, setForm] = useState({ name: '', line: '', uo: '', type: '', outils: '', createdBy: '' });

  const resetForm = () => { setForm({ name: '', line: '', uo: '', type: '', outils: '', createdBy: '' }); setEditingId(null); };

  const handleSave = () => {
    if (!form.name || !form.line || !form.uo || !form.type || !form.outils) return;
    if (editingId) {
      updateMachine(editingId, { ...form, outils: Number(form.outils) });
    } else {
      addMachine({ ...form, outils: Number(form.outils) });
    }
    logAction(editingId ? 'update' : 'create', 'Máquina', editingId ? `${form.name} atualizada` : `${form.name} cadastrada`);
    toast(editingId ? 'Máquina atualizada com sucesso!' : 'Máquina cadastrada com sucesso!');
    resetForm();
    setTab('list');
  };

  const startEdit = (m) => {
    setForm({ name: m.name, line: m.line, uo: m.uo, type: m.type, outils: String(m.outils), createdBy: m.createdBy || '' });
    setEditingId(m.id);
    setTab('create');
  };

  const filtered = sorted.filter(m => (!search || m.name.toLowerCase().includes(search) || m.line.toLowerCase().includes(search)) && (!uoFilter || m.uo === uoFilter));

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
              <input className="shad-input pl-9" placeholder="Buscar por nome ou linha..." value={search} onChange={e => setSearch(e.target.value.toLowerCase())} aria-label="Buscar máquinas" />
            </div>
            <Select value={uoFilter} onChange={e => setUoFilter(e.target.value)}>
              <option value="">Todas as UOs</option>
              {uos.map(u => <option key={u} value={u}>{u}</option>)}
            </Select>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={<Icon name="box" size={24} />} title="Nenhuma máquina encontrada" desc="Tente ajustar os filtros de busca."
              action={<Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={16} />Nova Máquina</Button>}
            />
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg)]">
                    {['Nome', 'Linha', 'UO', 'Ferramentais', 'Última Atualização', 'Criado em', 'Criado por', 'Ações'].map(h => {
                      const ks = { Nome:'name', Linha:'line', UO:'uo', Ferramentais:'outils', 'Última Atualização':'updatedAt', 'Criado em':'createdAt', 'Criado por':'createdBy' };
                      const k = ks[h];
                      return (<th scope="col" key={h} onClick={k ? () => toggle(k) : undefined} className={`text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider ${k ? 'cursor-pointer hover:text-[var(--fg)] select-none' : ''}`}>{h}{k ? indicator(k) : ''}</th>);
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id} className="border-t border-[var(--border)] hover:bg-[var(--bg)]">
                      <td className="px-4 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="box" size={16} /></div>
                          <button type="button" onClick={() => setDrawerItem(m)} className="font-medium text-left hover:text-[var(--accent)] transition-colors">{m.name}</button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[var(--fg-secondary)]">{m.line}</td>
                      <td className="px-4 py-2.5"><Badge>{m.uo}</Badge></td>
                      <td className="px-4 py-2.5 font-nums">{m.outils} grupos</td>
                      <td className="px-4 py-2.5 text-xs text-[var(--fg-secondary)]">{m.updatedAt}</td>
                      <td className="px-4 py-2.5 text-xs text-[var(--fg-secondary)]">{m.createdAt}</td>
                      <td className="px-4 py-2.5 text-xs">{m.createdBy}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setDrawerItem(m)} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--accent)] transition-colors">Detalhes</button>
                          <button type="button" onClick={() => startEdit(m)} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--accent)] transition-colors">Editar</button>
                          <button type="button" onClick={() => { if (confirm(`Excluir ${m.name}?`)) { deleteMachine(m.id); logAction('delete', 'Máquina', `${m.name} excluída`); toast('Máquina excluída com sucesso!'); } }} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg)] text-[var(--fg-secondary)] hover:text-[var(--danger)] transition-colors">Excluir</button>
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
          <h3 className="text-base font-semibold mb-4">{editingId ? 'Editar Máquina' : 'Nova Máquina'}</h3>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Nome da máquina *</label><Input placeholder="Ex: Norden C14" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Linha *</label><Input placeholder="Ex: C14" value={form.line} onChange={e => setForm({ ...form, line: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-3 grid-cols-1 gap-4 mt-4">
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">UO *</label><Select value={form.uo} onChange={e => setForm({ ...form, uo: e.target.value })}><option value="">Selecione</option>{uos.map(u => <option key={u}>{u}</option>)}</Select></div>
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Tipo *</label><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="">Selecione</option>{machineTypes.map(o => <option key={o}>{o}</option>)}</Select></div>
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Ferramentais *</label><Input type="number" placeholder="6" value={form.outils} onChange={e => setForm({ ...form, outils: e.target.value })} /></div>
          </div>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4 mt-4">
            <div><label className="text-xs font-medium text-[var(--fg)] mb-1 block">Criado por</label><Input placeholder="Ex: Carlos Silva" value={form.createdBy} onChange={e => setForm({ ...form, createdBy: e.target.value })} /></div>
            <div />
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
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shrink-0"><Icon name="box" size={18} /></div>
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
                  {[
                    ['Linha', drawerItem.line], ['UO', drawerItem.uo], ['Tipo', drawerItem.type],
                    ['Ferramentais', `${drawerItem.outils} grupos`],
                    ['Última Atualização', drawerItem.updatedAt], ['Criado em', drawerItem.createdAt],
                    ['Criado por', drawerItem.createdBy],
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
              <Button variant="ghost" size="sm" onClick={() => { const m = drawerItem; setDrawerItem(null); startEdit(m); }}>Editar</Button>
              <button type="button" onClick={() => { if (confirm(`Excluir ${drawerItem.name}?`)) { deleteMachine(drawerItem.id); logAction('delete', 'Máquina', `${drawerItem.name} excluída`); toast('Máquina excluída com sucesso!'); setDrawerItem(null); } }}
                className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--danger-muted)] text-[var(--danger)] hover:opacity-80 transition-colors">Excluir</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
