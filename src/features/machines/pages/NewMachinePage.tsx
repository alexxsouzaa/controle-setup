// @ts-nocheck
import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { getToolingOptions } from '../../compatibility';
import { useMachines, useAddMachine, useUpdateMachine, useLogAction, useConfig } from '../../../queries';
import { useAppStore } from '../../../stores/appStore';
import { Machine, Config } from '../../../types';

const MAX_IMAGE_SIZE = 500 * 1024;

interface MachineForm {
  name: string;
  lines: string[];
  uo: string;
  image: string;
  createdBy: string;
  toolingCategories: string[];
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export function NewMachinePage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { data: machines = [] } = useMachines();
  const { mutate: addMachine } = useAddMachine();
  const { mutate: updateMachine } = useUpdateMachine();
  const { mutate: logAction } = useLogAction();
  const { data: config = {} as Config } = useConfig();
  const currentUser = useAppStore(s => s.currentUser);
  const { toast } = useToast();

  const [form, setForm] = useState<MachineForm>({ name: '', lines: [], uo: '', image: '', createdBy: currentUser, toolingCategories: [] });
  const [imageError, setImageError] = useState<string>('');
  const [lineDropdownOpen, setLineDropdownOpen] = useState<boolean>(false);
  const [lineSearch, setLineSearch] = useState<string>('');
  const [lineInput, setLineInput] = useState<string>('');
  const [toolingDropdownOpen, setToolingDropdownOpen] = useState<boolean>(false);
  const [toolingSearch, setToolingSearch] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState<boolean>(false);

  const editingId = editId || null;
  const isEdit = !!editId;

  useEffect(() => {
    if (isEdit) {
      const m = machines.find((mach: Machine) => mach.id === editId);
      if (m) {
        setForm({ name: m.name, lines: m.lines || (m.line ? [m.line] : []), uo: m.uo || '', image: m.image || '', createdBy: m.createdBy || currentUser, toolingCategories: m.toolingCategories || [] });
      }
    }
  }, [editId, isEdit, machines, currentUser]);

  const allLines = useMemo(() => {
    const lines = new Set<string>();
    machines.forEach((m: Machine) => {
      if (m.lines && Array.isArray(m.lines)) m.lines.forEach((l: string) => lines.add(l));
      else if (m.line) lines.add(m.line);
    });
    if (config?.uoConfigs) {
      Object.values(config.uoConfigs).forEach((uo: any) => {
        if (uo.lines) uo.lines.forEach((l: string) => lines.add(l));
      });
    }
    return [...lines].sort();
  }, [machines, config]);

  const allUos = useMemo(() => {
    const uos = new Set<string>();
    machines.forEach((m: Machine) => { if (m.uo) uos.add(m.uo); });
    if (config?.uoConfigs) Object.keys(config.uoConfigs).forEach(u => uos.add(u));
    return [...uos].sort();
  }, [machines, config]);

  const filteredLines = lineSearch ? allLines.filter((l: string) => l.toLowerCase().includes(lineSearch.toLowerCase())) : allLines;
  const toolingOptions = getToolingOptions(form.uo, config);
  const filteredTooling = toolingSearch ? toolingOptions.filter((c: string) => c.toLowerCase().includes(toolingSearch.toLowerCase())) : toolingOptions;

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
    if (editingId) {
      updateMachine({ id: editingId, updates: machineData });
      logAction({ type: 'update', entity: 'Máquina', detail: `${form.name} atualizada` });
      toast('Máquina atualizada com sucesso!');
    } else {
      addMachine(machineData);
      logAction({ type: 'create', entity: 'Máquina', detail: `${form.name} cadastrada` });
      toast('Máquina cadastrada com sucesso!');
    }
    setSaved(true);
  };

  const handleBack = () => {
    if (form.name || form.lines.length > 0 || form.uo || form.image) {
      if (confirm('Descartar alterações?')) navigate('/maquinas');
    } else {
      navigate('/maquinas');
    }
  };

  return (
    <div className="p-6 pb-16">
      {saved ? (
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
                <Icon name="check-circle" size={28} />
              </div>
              <h3 className="text-[16px] font-semibold mb-1">{editingId ? 'Máquina atualizada!' : 'Máquina criada!'}</h3>
              <p className="text-[14px] font-medium text-[var(--accent)] mt-1 mb-1">{form.name}</p>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-6">A máquina foi cadastrada e está disponível.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" size="sm" onClick={() => navigate('/maquinas')}><Icon name="box" size={14} />Ver máquinas</Button>
                <Button variant="secondary" size="sm" onClick={() => { setSaved(false); setForm(prev => ({ ...prev, name: '', lines: [], uo: '', image: '', toolingCategories: [] })); }}><Icon name="plus" size={14} />Criar nova máquina</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
      <div className="max-w-2xl mx-auto space-y-5">
        <button type="button" onClick={handleBack} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">← Voltar para máquinas</button>

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
          <Button variant="ghost" size="sm" onClick={() => navigate('/maquinas')}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!form.name || !form.uo || form.lines.length === 0}>{editingId ? 'Salvar' : 'Criar Máquina'}</Button>
        </div>
      </div>
      )}
    </div>
  );
}
