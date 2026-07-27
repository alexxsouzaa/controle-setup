import { useState, useRef, useMemo } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { ImagePreview } from '../components/ImagePreview';
import { getToolingOptions } from '../utils/compatibility';
import { useMachines, useAddMachine, useUpdateMachine, useDeleteMachine, useDeleteMachines, useLogAction, useConfig } from '../queries';
import { useAppStore } from '../stores/appStore';
import { Machine, Config } from '../types';

const MAX_IMAGE_SIZE = 500 * 1024;

interface MachineForm {
  name: string;
  lines: string[];
  uo: string;
  image: string;
  createdBy: string;
  toolingCategories: string[];
}

interface StatCard {
  label: string;
  value: number;
  icon: string;
  variant: string;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export function MaquinasPage({ navigate }: { navigate: (path: string) => void }) {
  const { data: machines = [] } = useMachines();
  const { mutate: addMachine } = useAddMachine();
  const { mutate: updateMachine } = useUpdateMachine();
  const { mutate: deleteMachine } = useDeleteMachine();
  const { mutate: deleteMachines } = useDeleteMachines();
  const { mutate: logAction } = useLogAction();
  const { data: config = {} as Config } = useConfig();
  const currentUser = useAppStore(s => s.currentUser);
  const { toast } = useToast();
  const [tab, setTab] = useState<string>('list');
  const [search, setSearch] = useState<string>('');
  const [uoFilter, setUoFilter] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerItem, setDrawerItem] = useState<Machine | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [step, setStep] = useState<number>(1);
  const perPage = 10;
  const [form, setForm] = useState<MachineForm>({ name: '', lines: [], uo: '', image: '', createdBy: currentUser, toolingCategories: [] });
  const [imageError, setImageError] = useState<string>('');
  const [lineDropdownOpen, setLineDropdownOpen] = useState<boolean>(false);
  const [lineSearch, setLineSearch] = useState<string>('');
  const [lineInput, setLineInput] = useState<string>('');
  const [toolingDropdownOpen, setToolingDropdownOpen] = useState<boolean>(false);
  const [toolingSearch, setToolingSearch] = useState<string>('');
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedName, setSavedName] = useState<string>('');

  const allLines = useMemo(() => {
    const lines = new Set<string>();
    machines.forEach((m: Machine) => {
      if (m.lines && Array.isArray(m.lines)) m.lines.forEach((l: string) => lines.add(l));
      else if (m.line) lines.add(m.line);
    });
    return [...lines].sort();
  }, [machines]);

  const allUos = useMemo(() => [...new Set(machines.map((m: Machine) => m.uo).filter(Boolean))].sort() as string[], [machines]);

  const filteredLines = lineSearch ? allLines.filter((l: string) => l.toLowerCase().includes(lineSearch.toLowerCase())) : allLines;
  const toolingOptions = getToolingOptions(form.uo, config);
  const filteredTooling = toolingSearch ? toolingOptions.filter((c: string) => c.toLowerCase().includes(toolingSearch.toLowerCase())) : toolingOptions;

  const resetForm = () => {
    setForm({ name: '', lines: [], uo: '', image: '', createdBy: currentUser, toolingCategories: [] });
    setEditingId(null); setImageError(''); setStep(1); setLineSearch(''); setLineInput('');
  };

  const toggleLine = (line: string) => setForm(prev => ({ ...prev, lines: prev.lines.includes(line) ? prev.lines.filter((l: string) => l !== line) : [...prev.lines, line] }));
  const toggleTooling = (cat: string) => setForm(prev => ({ ...prev, toolingCategories: prev.toolingCategories.includes(cat) ? prev.toolingCategories.filter((c: string) => c !== cat) : [...prev.toolingCategories, cat] }));

  const addNewLine = () => {
    const val = lineInput.trim();
    if (!val) return;
    if (!form.lines.includes(val)) setForm(prev => ({ ...prev, lines: [...prev.lines, val] }));
    setLineInput('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (machines.some((m: Machine) => m.name.toLowerCase() === form.name.toLowerCase() && m.id !== editingId)) {
      toast('Já existe uma máquina com este nome.', 'warning'); return;
    }
    const createdAt = new Date().toISOString().slice(0, 10);
    const machineData = { ...form, createdAt, updatedAt: createdAt };
    if (editingId) { updateMachine({ id: editingId, updates: machineData }); logAction({ type: 'update', entity: 'Máquina', detail: `${form.name} atualizada` }); toast('Máquina atualizada com sucesso!'); }
    else { addMachine(machineData); logAction({ type: 'create', entity: 'Máquina', detail: `${form.name} cadastrada` }); toast('Máquina cadastrada com sucesso!'); }
    setSavedName(form.name);
    setStep(2);
  };

  const startEdit = (m: Machine) => {
    setForm({ name: m.name, lines: m.lines || (m.line ? [m.line] : []), uo: m.uo || '', image: m.image || '', createdBy: m.createdBy || currentUser, toolingCategories: m.toolingCategories || [] });
    setEditingId(m.id);
    setTab('create');
    setStep(1);
  };

  const filtered = machines.filter((m: Machine) =>
    (!search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.lines || (m.line ? [m.line] : [])).some((l: string) => l.toLowerCase().includes(search.toLowerCase()))) &&
    (!uoFilter || m.uo === uoFilter)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => { if (!selectionMode) setSelectionMode(true); setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleSelectAll = () => {
    if (!selectionMode && !allSelected) setSelectionMode(true);
    if (paged.every((s: Machine) => selected.has(s.id))) setSelected(new Set([...selected].filter(id => !paged.some((s: Machine) => s.id === id))));
    else setSelected(new Set([...selected, ...paged.map((s: Machine) => s.id)]));
  };
  const clearSelection = () => { setSelected(new Set()); setSelectionMode(false); };
  const selectedCount = selected.size;
  const allSelected = paged.length > 0 && paged.every((s: Machine) => selected.has(s.id));

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    if (!confirm(`Excluir ${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} selecionada${selectedCount !== 1 ? 's' : ''}?`)) return;
    deleteMachines(Array.from(selected));
    logAction({ type: 'delete', entity: 'Máquina', detail: `${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} em massa` });
    toast(`${selectedCount} máquina${selectedCount !== 1 ? 's' : ''} excluída${selectedCount !== 1 ? 's' : ''} com sucesso!`);
    clearSelection();
  };

  const getLines = (m: Machine) => m.lines || (m.line ? [m.line] : []);

  const UO_FILTERS: { id: string; label: string }[] = [{ id: '', label: 'Todas' }, ...allUos.map((u: string) => ({ id: u, label: u }))];

  return (
    <div className="p-6 pb-16">
      {tab === 'list' ? (
        <>
          <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-3 mb-5">
            {([
              { label: 'Total', value: machines.length, icon: 'box', variant: 'total' },
              { label: 'Com Foto', value: machines.filter((m: Machine) => m.image).length, icon: 'upload', variant: 'updated' },
              { label: 'Com Ferramentais', value: machines.filter((m: Machine) => (m.toolingCategories?.length ?? 0) > 0).length, icon: 'wrench', variant: 'outdated' },
              { label: 'UOs', value: allUos.length, icon: 'grid-3x3', variant: 'failed' },
            ] as StatCard[]).map(s => (
              <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-[6px] flex items-center justify-center shrink-0 ${
                  s.variant === 'total' ? 'bg-[var(--accent-muted)] text-[var(--fg-secondary)]' :
                  s.variant === 'updated' ? 'bg-[var(--success-muted)] text-[var(--success)]' :
                  s.variant === 'outdated' ? 'bg-[var(--warning-muted)] text-[var(--warning)]' :
                  'bg-[var(--danger-muted)] text-[var(--danger)]'
                }`}>
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
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none"><Icon name="search" size={14} /></span>
              <input className="shad-input pl-8 py-1.5 text-[12px]" placeholder="Buscar máquina ou linha..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value.toLowerCase()); setPage(1); clearSelection(); }} aria-label="Buscar máquinas" />
            </div>

            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
              {UO_FILTERS.map(f => (
                <button key={f.id} onClick={() => { setUoFilter(f.id); setPage(1); clearSelection(); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium border transition-all ${
                    uoFilter === f.id ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)]'
                  }`}>
                  {f.id && <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-muted)]" />}
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => { if (selectionMode) clearSelection(); else setSelectionMode(true); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium border transition-all ${
                  selectionMode ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'bg-[var(--surface)] text-[var(--fg-secondary)] border-[var(--border)] hover:border-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                {selectionMode ? 'Sair' : 'Selecionar'}
              </button>
              <Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={14} />Nova Máquina</Button>
            </div>
          </div>

          {selectionMode && selectedCount > 0 && (
            <div className="flex items-center gap-3 mb-4 px-4 py-2 rounded-[6px] border border-[var(--fg-muted)] bg-[var(--accent-muted)]">
              <span className="text-[12px] font-medium text-[var(--fg)]">{selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}</span>
              <button type="button" onClick={handleBulkDelete} className="ml-auto text-[11px] font-medium text-[var(--danger)] hover:underline">Excluir selecionadas</button>
              <button type="button" onClick={clearSelection} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]">Cancelar</button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--fg-muted)]"><Icon name="box" size={24} /></div>
              <p className="text-[15px] font-medium text-[var(--fg)] mb-1">{machines.length === 0 ? 'Nenhuma máquina cadastrada' : 'Nenhuma máquina encontrada'}</p>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-4">{machines.length === 0 ? 'Cadastre a primeira máquina para começar.' : 'Tente ajustar o filtro ou busca.'}</p>
              {machines.length === 0 && <Button variant="primary" size="sm" onClick={() => setTab('create')}><Icon name="plus" size={14} />Nova Máquina</Button>}
            </div>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] border-b border-[var(--border)]">
                    {selectionMode && (
                      <th className="w-10 px-3.5 py-2.5 text-center">
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-[var(--fg)] cursor-pointer" />
                      </th>
                    )}
                    <th className="px-3.5 py-2.5 text-left">Máquina</th>
                    <th className="px-3.5 py-2.5 text-left">UO</th>
                    <th className="px-3.5 py-2.5 text-left">Criado em</th>
                    <th className="w-24 px-3.5 py-2.5 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length ? paged.map((m: Machine) => (
                    <tr key={m.id}
                      className="hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border-subtle)]"
                      onClick={() => selectionMode && toggleSelect(m.id)}
                      style={{ cursor: selectionMode ? 'pointer' : undefined }}>
                      {selectionMode && (
                        <td className="px-3.5 py-2.5 text-center">
                          <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} className="accent-[var(--fg)] cursor-pointer" />
                        </td>
                      )}
                      <td className="px-3.5 py-2.5">
                        <button type="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDrawerItem(m); }} className="text-left w-full">
                          <div className="font-medium text-[var(--fg)] truncate max-w-[360px]">{m.name}</div>
                          <div className="text-[12px] font-mono text-[var(--fg-muted)]">{getLines(m).slice(0, 3).join(' · ')}{getLines(m).length > 3 ? ` · +${getLines(m).length - 3}` : ''}</div>
                        </button>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{m.uo}</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-[12px] font-mono text-[var(--fg-muted)]">{m.createdAt}</td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button type="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDrawerItem(m); }} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Detalhes">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button type="button" onClick={(e: React.MouseEvent) => { e.stopPropagation(); startEdit(m); }} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-[var(--surface-hover)] transition-colors" aria-label="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={selectionMode ? 5 : 4} className="px-4 py-8 text-center text-[13px] text-[var(--fg-muted)]">Nenhum resultado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
                  <span className="text-[12px] text-[var(--fg-muted)]">Mostrando {1 + (page - 1) * perPage}–{Math.min(page * perPage, filtered.length)} de {filtered.length}</span>
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
        ) : step === 2 ? (
        <div className="max-w-lg mx-auto">
          <Card>
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
                <Icon name="check-circle" size={28} />
              </div>
              <h3 className="text-[16px] font-semibold mb-1">{editingId ? 'Máquina atualizada!' : 'Máquina criada!'}</h3>
              <div className="text-[14px] font-medium text-[var(--accent)] mt-1 mb-1">{savedName}</div>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-6">A máquina foi cadastrada e está disponível.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" size="sm" onClick={() => { resetForm(); setTab('list'); }}><Icon name="box" size={14} />Ver máquinas</Button>
                <Button variant="secondary" size="sm" onClick={() => { resetForm(); setTab('create'); }}><Icon name="plus" size={14} />Criar nova máquina</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <button type="button" onClick={() => { if (form.name || form.lines.length > 0 || form.uo || form.image) { if (confirm('Descartar alterações?')) { resetForm(); setTab('list'); } } else { resetForm(); setTab('list'); } }} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">← Voltar</button>
          </div>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="box" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">{editingId ? 'Editar Máquina' : 'Nova Máquina'}</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Informações básicas da máquina.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Nome da máquina *</label>
                  <Input placeholder="Ex: Máquina de Envase 01" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">UO *</label>
                  <Select value={form.uo} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, uo: e.target.value })}>
                    <option value="">Selecione</option>
                    {allUos.map((u: string) => <option key={u}>{u}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Criado por</label>
                  <Input value={form.createdBy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, createdBy: e.target.value })} />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="settings" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">Linhas e Ferramentais</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Linhas de produção e categorias de peças compatíveis.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Linhas *</label>
                <div className="relative">
                  {form.lines.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {form.lines.map((l: string) => (
                        <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] text-[11px]">
                          {l}
                          <button type="button" onClick={() => setForm(prev => ({ ...prev, lines: prev.lines.filter((ln: string) => ln !== l) }))} className="text-[var(--fg-muted)] hover:text-[var(--danger)] leading-none">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => setLineDropdownOpen(!lineDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[12px] hover:border-[var(--fg-muted)] transition-colors">
                    <span className={form.lines.length === 0 ? 'text-[var(--fg-muted)]' : ''}>Selecionar linhas...</span>
                    <Icon name="arrow-right" size={12} className={`transition-transform ${lineDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
                  </button>
                  {lineDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-[6px] shadow-md">
                      <div className="p-2 border-b border-[var(--border)]">
                        <div className="flex gap-1">
                          <input className="shad-input flex-1 py-1 text-[11px]" placeholder="Buscar ou criar linha..." value={lineSearch || lineInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setLineSearch(e.target.value); setLineInput(e.target.value); }} />
                          {lineInput.trim() && !allLines.includes(lineInput.trim()) && (
                            <button type="button" onClick={() => { addNewLine(); setLineSearch(''); }} className="px-2 py-1 rounded text-[10px] bg-[var(--fg)] text-[var(--bg)] shrink-0">Criar</button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {filteredLines.map((l: string) => (
                          <button key={l} type="button" onClick={() => { toggleLine(l); setLineSearch(''); setLineInput(''); }}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 text-[12px] hover:bg-[var(--surface-hover)] transition-colors ${form.lines.includes(l) ? 'bg-[var(--accent-muted)]' : ''}`}>
                            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${form.lines.includes(l) ? 'bg-[var(--fg)] border-[var(--fg)]' : 'border-[var(--border)]'}`}>
                              {form.lines.includes(l) && <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                            </div>
                            <span>{l}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Ferramentais</label>
                <p className="text-[10px] text-[var(--fg-muted)] mb-1">Categorias de peças usadas por esta máquina.</p>
                <div className="relative">
                  {form.toolingCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {form.toolingCategories.map((c: string) => (
                        <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] text-[11px]">
                          {c}
                          <button type="button" onClick={() => toggleTooling(c)} className="text-[var(--fg-muted)] hover:text-[var(--danger)] leading-none">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => setToolingDropdownOpen(!toolingDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[12px] hover:border-[var(--fg-muted)] transition-colors">
                    <span className={form.toolingCategories.length === 0 ? 'text-[var(--fg-muted)]' : ''}>Selecionar ferramentais...</span>
                    <Icon name="arrow-right" size={12} className={`transition-transform ${toolingDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
                  </button>
                  {toolingDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-[6px] shadow-md">
                      <div className="p-2 border-b border-[var(--border)]">
                        <input className="shad-input w-full py-1 text-[11px]" placeholder="Buscar ferramental..." value={toolingSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToolingSearch(e.target.value)} />
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {filteredTooling.map((c: string) => (
                          <button key={c} type="button" onClick={() => { toggleTooling(c); }}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 text-[12px] hover:bg-[var(--surface-hover)] transition-colors ${form.toolingCategories.includes(c) ? 'bg-[var(--accent-muted)]' : ''}`}>
                            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${form.toolingCategories.includes(c) ? 'bg-[var(--fg)] border-[var(--fg)]' : 'border-[var(--border)]'}`}>
                              {form.toolingCategories.includes(c) && <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                            </div>
                            <span>{c}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!form.name || !form.uo || form.lines.length === 0}>{editingId ? 'Salvar' : 'Criar Máquina'}</Button>
          </div>
        </div>
      )}

      {drawerItem && (
        <>
          <div className="fixed inset-0 z-40 bg-[var(--overlay)]" onClick={() => setDrawerItem(null)} onKeyDown={(e: React.KeyboardEvent) => e.key === 'Escape' && setDrawerItem(null)} />
          <div role="dialog" aria-modal="true" aria-label={`Detalhes: ${drawerItem.name}`} style={{ width: 'min(420px, 90vw)' }}
            className="fixed top-0 right-0 bottom-0 z-50 bg-[var(--bg)] border-l border-[var(--border)] shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {drawerItem.image ? (
                  <img src={drawerItem.image} alt={drawerItem.name} className="w-8 h-8 rounded-[4px] object-cover border border-[var(--border)] shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0"><Icon name="box" size={16} /></div>
                )}
                <h3 className="text-[14px] font-semibold truncate">{drawerItem.name}</h3>
              </div>
              <button type="button" onClick={() => setDrawerItem(null)} aria-label="Fechar" className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--fg-secondary)] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {drawerItem.image && (
                <div className="flex justify-center">
                  <button type="button" onClick={() => setPreviewImage(drawerItem.image || null)} className="cursor-pointer">
                    <img src={drawerItem.image} alt={drawerItem.name} className="w-28 h-28 rounded-[8px] object-cover border border-[var(--border)]" />
                  </button>
                </div>
              )}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">UO</div>
                    <div className="text-[13px] font-medium text-[var(--fg)] mt-0.5">{drawerItem.uo || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Criado por</div>
                    <div className="text-[13px] text-[var(--fg)] mt-0.5">{drawerItem.createdBy || '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mb-1.5">Linhas</div>
                  <div className="flex flex-wrap gap-1">
                    {getLines(drawerItem).map((l: string) => <Badge key={l}>{l}</Badge>)}
                    {getLines(drawerItem).length === 0 && <span className="text-[12px] text-[var(--fg-muted)]">—</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mb-1.5">Ferramentais</div>
                  <div className="flex flex-wrap gap-1">
                    {(drawerItem.toolingCategories || []).map((c: string) => <Badge key={c}>{c}</Badge>)}
                    {(!drawerItem.toolingCategories || drawerItem.toolingCategories.length === 0) && <span className="text-[12px] text-[var(--fg-muted)]">Nenhum</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border)] shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { const m = drawerItem; setDrawerItem(null); startEdit(m); }}>Editar</Button>
              <button type="button" onClick={() => { if (confirm(`Excluir ${drawerItem.name}?`)) { deleteMachine(drawerItem.id); logAction({ type: 'delete', entity: 'Máquina', detail: `${drawerItem.name} excluída` }); toast('Máquina excluída com sucesso!'); setDrawerItem(null); } }}
                className="px-3 py-1.5 rounded-[4px] border border-[var(--danger)] text-[11px] font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors">Excluir</button>
            </div>
          </div>
        </>
      )}
      {previewImage && <ImagePreview src={previewImage} alt="Foto da máquina" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
