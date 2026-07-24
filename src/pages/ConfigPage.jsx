import { useState, useContext, useMemo } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';

function TagInput({ values, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState('');
  const handleAdd = () => {
    const val = input.trim();
    if (!val) return;
    if (values.includes(val)) return;
    onAdd(val);
    setInput('');
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 min-h-[26px]">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] text-[12px] text-[var(--fg)]">
            {v}
            <button type="button" onClick={() => onRemove(v)} className="text-[var(--fg-muted)] hover:text-[var(--danger)] leading-none text-[14px]">&times;</button>
          </span>
        ))}
        {values.length === 0 && <span className="text-[12px] text-[var(--fg-muted)]">Nenhum item cadastrado.</span>}
      </div>
      <div className="flex gap-1.5">
        <Input placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} className="min-h-[34px] text-[13px]" />
        <Button variant="secondary" size="sm" onClick={handleAdd} disabled={!input.trim()} className="h-[34px]">Adicionar</Button>
      </div>
    </div>
  );
}

export function ConfigPage() {
  const { config, updateConfig, logAction, machines } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);

  const initial = useMemo(() => {
    const saved = config.uoConfigs || {};
    return Object.entries(saved).map(([uo, cfg]) => ({ uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])] }));
  }, []);

  const [uoConfigs, setUoConfigs] = useState(() => initial.map(c => ({ ...c, toolingCategories: [...c.toolingCategories], formatTypes: [...c.formatTypes] })));
  const [activeTab, setActiveTab] = useState(0);
  const [newUoName, setNewUoName] = useState('');

  const allUos = useMemo(() => [...new Set(machines.map(m => m.uo).filter(Boolean))].sort(), [machines]);

  const active = uoConfigs[activeTab];

  const setUoValue = (key, values) => {
    setUoConfigs(prev => prev.map((u, i) => i === activeTab ? { ...u, [key]: values } : u));
  };

  const addUo = () => {
    const name = newUoName.trim();
    if (!name) return;
    if (uoConfigs.some(u => u.uo === name)) { toast(`UO "${name}" já existe.`, 'warning'); return; }
    setUoConfigs(prev => [...prev, { uo: name, toolingCategories: [], formatTypes: [] }]);
    setActiveTab(uoConfigs.length);
    setNewUoName('');
  };

  const removeUo = (idx) => {
    if (uoConfigs[idx].toolingCategories.length > 0 || uoConfigs[idx].formatTypes.length > 0) {
      if (!confirm(`Remover configurações da UO "${uoConfigs[idx].uo}"?`)) return;
    }
    setUoConfigs(prev => prev.filter((_, i) => i !== idx));
    if (activeTab >= idx && activeTab > 0) setActiveTab(prev => prev - 1);
  };

  const handleSave = () => {
    const uoCfg = {};
    uoConfigs.forEach(u => {
      if (u.toolingCategories.length > 0 || u.formatTypes.length > 0) {
        uoCfg[u.uo] = {};
        if (u.toolingCategories.length > 0) uoCfg[u.uo].toolingCategories = u.toolingCategories;
        if (u.formatTypes.length > 0) uoCfg[u.uo].formatTypes = u.formatTypes;
      }
    });
    updateConfig({ uoConfigs: uoCfg });
    logAction('update', 'Configuração', 'Configurações por UO atualizadas');
    toast('Configurações salvas com sucesso!');
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-5">
        <h1 className="text-[20px] font-semibold text-[var(--fg)]">Opções</h1>
        <p className="text-[13px] text-[var(--fg-secondary)] mt-0.5">Configure ferramentais e tipos de formato por Unidade Organizacional.</p>
      </div>

      <div className="flex-1 flex gap-0 min-h-0 rounded-[8px] border border-[var(--border)] overflow-hidden">
        <div className="w-[200px] flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border)] overflow-y-auto p-4">
          <div className="space-y-0.5">
            {uoConfigs.map((uo, i) => (
              <button key={uo.uo} onClick={() => setActiveTab(i)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all text-left ${
                  i === activeTab ? 'bg-[var(--surface-hover)] text-[var(--fg)] font-semibold' : 'text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                }`}>
                <div className="w-5 h-5 rounded-[4px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold text-[var(--fg-secondary)] flex-shrink-0">
                  {uo.uo.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{uo.uo}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
            <Input placeholder="Nova UO..." value={newUoName} onChange={e => setNewUoName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addUo(); }} className="min-h-[32px] text-[12px]" />
            {allUos.filter(u => !uoConfigs.some(c => c.uo === u)).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {allUos.filter(u => !uoConfigs.some(c => c.uo === u)).map(u => (
                  <button key={u} type="button" onClick={() => { setNewUoName(u); }}
                    className="px-1.5 py-0.5 rounded-[3px] border border-[var(--border)] bg-[var(--surface)] text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--fg-muted)] transition-colors">
                    {u}
                  </button>
                ))}
              </div>
            )}
            <Button variant="primary" size="sm" onClick={addUo} disabled={!newUoName.trim()} className="w-full">Adicionar UO</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!active ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4"><Icon name="settings" size={22} /></div>
              <p className="text-[15px] font-medium text-[var(--fg)] mb-1">Nenhuma UO configurada</p>
              <p className="text-[13px] text-[var(--fg-secondary)] max-w-xs">Adicione uma UO no painel à esquerda para personalizar ferramentais e tipos de formato.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-[16px] font-semibold text-[var(--fg)]">{active.uo}</h2>
                  <p className="text-[12px] text-[var(--fg-secondary)]">Configurações específicas para esta Unidade Organizacional.</p>
                </div>
                <button type="button" onClick={() => removeUo(activeTab)} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--danger)] transition-colors">Remover UO</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[13px] font-medium text-[var(--fg)] mb-1 block">Ferramentais</label>
                  <p className="text-[12px] text-[var(--fg-secondary)] mb-3">Categorias de peças usadas como ferramentais para esta UO.</p>
                  <TagInput values={active.toolingCategories || []} onAdd={v => setUoValue('toolingCategories', [...(active.toolingCategories || []), v])} onRemove={v => setUoValue('toolingCategories', (active.toolingCategories || []).filter(x => x !== v))} placeholder="Ex: Bico de Envase" />
                </div>

                <div className="h-px bg-[var(--border)]" />

                <div>
                  <label className="text-[13px] font-medium text-[var(--fg)] mb-1 block">Tipos de Formato</label>
                  <p className="text-[12px] text-[var(--fg-secondary)] mb-3">Tipos de formato disponíveis para esta UO.</p>
                  <TagInput values={active.formatTypes || []} onAdd={v => setUoValue('formatTypes', [...(active.formatTypes || []), v])} onRemove={v => setUoValue('formatTypes', (active.formatTypes || []).filter(x => x !== v))} placeholder="Ex: Frasco cilíndrico" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 mt-auto border-t border-[var(--border)]">
        <span className="text-[12px] text-[var(--fg-muted)] mr-auto">
          {uoConfigs.reduce((acc, u) => acc + u.toolingCategories.length + u.formatTypes.length, 0)} itens configurados · {uoConfigs.length} UO{uoConfigs.length !== 1 ? 's' : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={() => { setUoConfigs(initial.map(c => ({ ...c, toolingCategories: [...c.toolingCategories], formatTypes: [...c.formatTypes] }))); toast('Alterações descartadas.'); }}>Descartar</Button>
        <Button variant="primary" onClick={handleSave}><Icon name="check-circle" size={15} />Salvar alterações</Button>
      </div>
    </div>
  );
}
