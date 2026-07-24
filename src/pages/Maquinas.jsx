import { useState, useContext, useRef, useMemo } from 'react';
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

const MAX_IMAGE_SIZE = 500 * 1024;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export function MaquinasPage({ navigate }) {
  const { machines, addMachine, deleteMachine, deleteMachines, updateMachine, logAction, getCurrentUser } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [uoFilter, setUoFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [drawerItem, setDrawerItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [step, setStep] = useState(1);
  const perPage = 15;
  const [form, setForm] = useState({ name: '', lines: [], uo: '', image: '', createdBy: getCurrentUser() });
  const [imageError, setImageError] = useState('');
  const [lineDropdownOpen, setLineDropdownOpen] = useState(false);
  const [lineSearch, setLineSearch] = useState('');
  const [lineInput, setLineInput] = useState('');
  const fileInputRef = useRef(null);
  const [savedName, setSavedName] = useState('');

  const allLines = useMemo(() => {
    const lines = new Set();
    machines.forEach(m => {
      if (m.lines && Array.isArray(m.lines)) m.lines.forEach(l => lines.add(l));
      else if (m.line) lines.add(m.line);
    });
    return [...lines].sort();
  }, [machines]);

  const allUos = useMemo(() => [...new Set(machines.map(m => m.uo).filter(Boolean))].sort(), [machines]);

  const filteredLines = lineSearch ? allLines.filter(l => l.toLowerCase().includes(lineSearch.toLowerCase())) : allLines;

  const resetForm = () => {
    setForm({ name: '', lines: [], uo: '', image: '', createdBy: getCurrentUser() });
    setEditingId(null); setImageError(''); setStep(1); setLineSearch(''); setLineInput('');
  };

  const toggleLine = (line) => {
    setForm(prev => ({
      ...prev,
      lines: prev.lines.includes(line) ? prev.lines.filter(l => l !== line) : [...prev.lines, line],
    }));
  };

  const addNewLine = () => {
    const val = lineInput.trim();
    if (!val) return;
    if (!form.lines.includes(val)) setForm(prev => ({ ...prev, lines: [...prev.lines, val] }));
    setLineInput('');
  };

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
    if (!form.name || !form.uo || form.lines.length === 0) { toast('Preencha todos os campos obrigatórios.', 'warning'); return; }
    if (machines.some(m => m.name.toLowerCase() === form.name.toLowerCase() && m.id !== editingId)) {
      toast('Já existe uma máquina com este nome.', 'warning'); return;
    }
    const createdAt = new Date().toISOString().slice(0, 10);
    const machineData = { ...form, createdAt, updatedAt: createdAt };
    if (editingId) {
      updateMachine(editingId, machineData);
      logAction('update', 'Máquina', `${form.name} atualizada`);
      toast('Máquina atualizada com sucesso!');
    } else {
      addMachine(machineData);
      logAction('create', 'Máquina', `${form.name} cadastrada`);
      toast('Máquina cadastrada com sucesso!');
    }
    setSavedName(form.name);
    setStep(2);
  };

  const startEdit = (m) => {
    setForm({ name: m.name, lines: m.lines || (m.line ? [m.line] : []), uo: m.uo || '', image: m.image || '', createdBy: m.createdBy || getCurrentUser() });
    setEditingId(m.id);
    setTab('create');
    setStep(1);
  };

  const filtered = machines.filter(m =>
    (!search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.lines || [m.line]).some(l => l.toLowerCase().includes(search.toLowerCase()))) &&
    (!uoFilter || m.uo === uoFilter)
  );
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

  const getLines = (m) => m.lines || (m.line ? [m.line] : []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Máquinas</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">{machines.length} máquina{machines.length !== 1 ? 's' : ''} cadastrada{machines.length !== 1 ? 's' : ''}.</p>
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
              {allUos.map(u => <option key={u} value={u}>{u}</option>)}
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
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--fg)] select-none" onClick={() => {}}>Nome</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Linhas</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">UO</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Criado em</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Criado por</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(m => (
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
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {getLines(m).map(l => <Badge key={l}>{l}</Badge>)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><Badge>{m.uo}</Badge></td>
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
      ) : step === 1 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{editingId ? 'Editar Máquina' : 'Nova Máquina'}</h2>
              <p className="text-sm text-[var(--fg-secondary)] mt-0.5">Cadastre uma nova máquina e associe as linhas de produção compatíveis.</p>
            </div>
          </div>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="box" size={16} /></div>
              <div>
                <h3 className="text-sm font-semibold">Identificação</h3>
                <p className="text-xs text-[var(--fg-secondary)]">Informações básicas para identificar a máquina.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Nome da máquina *</label>
                <Input placeholder="Ex: Máquina de Envase 01" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--fg)] mb-1 block">UO *</label>
                <Select value={form.uo} onChange={e => setForm({ ...form, uo: e.target.value })}>
                  <option value="">Selecione a UO</option>
                  {allUos.map(u => <option key={u}>{u}</option>)}
                </Select>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="settings" size={16} /></div>
              <div>
                <h3 className="text-sm font-semibold">Linhas compatíveis</h3>
                <p className="text-xs text-[var(--fg-secondary)]">Selecione as linhas de produção onde esta máquina atua.</p>
              </div>
            </div>
            {allLines.length === 0 && filteredLines.length === 0 && !lineInput ? (
              <div className="p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)] text-center">
                <p className="text-sm text-[var(--fg-secondary)] mb-2">Nenhuma linha cadastrada.</p>
                <p className="text-xs text-[var(--fg-muted)]">Digite o nome de uma linha abaixo para criar e associar.</p>
              </div>
            ) : null}
            <div className="relative">
              {form.lines.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {form.lines.map(l => (
                    <span key={l} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--accent-light)] border border-[var(--accent)] text-xs font-medium">
                      {l}
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, lines: prev.lines.filter(ln => ln !== l) }))} className="text-[var(--fg-secondary)] hover:text-[var(--danger)] ml-0.5">&times;</button>
                    </span>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setLineDropdownOpen(!lineDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm hover:border-[var(--accent)] transition-colors text-left">
                <span className={form.lines.length === 0 ? 'text-[var(--fg-muted)]' : 'font-medium'}>
                  {form.lines.length === 0 ? 'Selecionar linhas...' : `${form.lines.length} linha${form.lines.length !== 1 ? 's' : ''} selecionada${form.lines.length !== 1 ? 's' : ''}`}
                </span>
                <Icon name="arrow-right" size={14} className={`transition-transform ${lineDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
              </button>
              {lineDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg">
                  <div className="p-2 border-b border-[var(--border)]">
                    <div className="flex gap-2">
                      <input className="shad-input flex-1 py-1.5 text-xs" placeholder="Buscar ou criar linha..." value={lineSearch || lineInput} onChange={e => { setLineSearch(e.target.value); setLineInput(e.target.value); }} />
                      {lineInput.trim() && !allLines.includes(lineInput.trim()) && (
                        <button type="button" onClick={() => { addNewLine(); setLineSearch(''); }} className="px-2 py-1 rounded text-xs bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shrink-0">Criar</button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredLines.length === 0 && !lineInput.trim() && (
                      <div className="px-4 py-3 text-xs text-[var(--fg-muted)] text-center">Nenhuma linha disponível. Digite para criar uma nova.</div>
                    )}
                    {filteredLines.map(l => (
                      <button key={l} type="button" onClick={() => { toggleLine(l); setLineSearch(''); setLineInput(''); }}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-[var(--bg)] transition-colors ${form.lines.includes(l) ? 'bg-[var(--accent-light)]' : ''}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${form.lines.includes(l) ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'}`}>
                          {form.lines.includes(l) && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                        </div>
                        <span>{l}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="upload" size={16} /></div>
              <div>
                <h3 className="text-sm font-semibold">Foto da máquina</h3>
                <p className="text-xs text-[var(--fg-secondary)]">Opcional. Facilita a identificação visual da máquina.</p>
              </div>
            </div>
            {form.image ? (
              <div className="flex items-center gap-4">
                <img src={form.image} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-[var(--border)]" />
                <div className="space-y-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-[var(--accent)] hover:underline block">Trocar imagem</button>
                  <button type="button" onClick={() => { setForm(prev => ({ ...prev, image: '' })); setImageError(''); }} className="text-xs text-[var(--danger)] hover:underline block">Remover foto</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all w-full">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="upload" size={24} /></div>
                <div className="text-center">
                  <div className="text-sm font-medium text-[var(--fg)]">Adicionar foto</div>
                  <div className="text-xs text-[var(--fg-secondary)] mt-0.5">PNG, JPG, WEBP • Máx. {MAX_IMAGE_SIZE / 1024} KB</div>
                </div>
              </button>
            )}
            {imageError && <p className="text-xs text-[var(--danger)] mt-2">{imageError}</p>}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="clock" size={16} /></div>
              <div>
                <h3 className="text-sm font-semibold">Registro</h3>
                <p className="text-xs text-[var(--fg-secondary)]">Informações de criação geradas automaticamente.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Criado por</label>
                <Input value={form.createdBy} onChange={e => setForm({ ...form, createdBy: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--fg)] mb-1 block">Data de criação</label>
                <Input type="date" value={new Date().toISOString().slice(0, 10)} disabled className="opacity-70" />
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => { if (form.name || form.lines.length > 0 || form.uo || form.image) { if (confirm('Descartar cadastro?\n\nAs informações preenchidas serão perdidas.')) { resetForm(); setTab('list'); } } else { resetForm(); setTab('list'); } }}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={!form.name || !form.uo || form.lines.length === 0}><Icon name="plus" size={16} />{editingId ? 'Salvar Alterações' : 'Criar Máquina'}</Button>
          </div>
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
              <Icon name="check-circle" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-1">{editingId ? 'Máquina atualizada com sucesso!' : 'Máquina criada com sucesso!'}</h3>
            <div className="text-base font-medium text-[var(--accent)] mt-2 mb-1">{savedName}</div>
            <p className="text-sm text-[var(--fg-secondary)] mb-8 max-w-sm mx-auto">A máquina foi cadastrada e está disponível para utilização nos fluxos de setup.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={() => { navigate('/maquinas'); }}><Icon name="box" size={16} />Ver máquinas</Button>
              <Button variant="secondary" onClick={() => { resetForm(); setTab('create'); }}><Icon name="plus" size={16} />Criar nova máquina</Button>
            </div>
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
                  <div><div className="text-xs text-[var(--fg-secondary)]">UO</div><div className="font-medium">{drawerItem.uo || '—'}</div></div>
                  <div><div className="text-xs text-[var(--fg-secondary)]">Linhas</div><div className="flex flex-wrap gap-1 mt-1">{getLines(drawerItem).map(l => <Badge key={l}>{l}</Badge>)}</div></div>
                  <div><div className="text-xs text-[var(--fg-secondary)]">Criado por</div><div className="font-medium">{drawerItem.createdBy || '—'}</div></div>
                  <div><div className="text-xs text-[var(--fg-secondary)]">Criado em</div><div className="font-medium">{drawerItem.createdAt || '—'}</div></div>
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
