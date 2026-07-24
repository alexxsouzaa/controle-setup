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

  const [uoList, setUoList] = useState(() => Object.keys(config.uoConfigs || {}));
  const [uoConfigs, setUoConfigs] = useState(() => {
    const saved = config.uoConfigs || {};
    return Object.entries(saved).map(([uo, cfg]) => ({ uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])] }));
  });
  const [activeTab, setActiveTab] = useState(-1);
  const [newUoName, setNewUoName] = useState('');

  const allMachineUos = useMemo(() => [...new Set(machines.map(m => m.uo).filter(Boolean))].sort(), [machines]);

  const active = activeTab >= 0 ? uoConfigs[activeTab] : null;

  const setUoValue = (key, values) => {
    setUoConfigs(prev => prev.map((u, i) => i === activeTab ? { ...u, [key]: values } : u));
  };

  const addUo = () => {
    const name = newUoName.trim();
    if (!name) return;
    if (uoList.includes(name)) { toast(`UO "${name}" já existe.`, 'warning'); return; }
    setUoList(prev => [...prev, name]);
    setUoConfigs(prev => [...prev, { uo: name, toolingCategories: [], formatTypes: [] }]);
    setActiveTab(uoConfigs.length);
    setNewUoName('');
  };

  const removeUo = (idx) => {
    const uo = uoConfigs[idx];
    if (!uo) return;
    if (!confirm(`Remover UO "${uo.uo}"${uo.toolingCategories.length > 0 || uo.formatTypes.length > 0 ? ' e suas configurações' : ''}?`)) return;
    setUoList(prev => prev.filter(u => u !== uo.uo));
    setUoConfigs(prev => prev.filter((_, i) => i !== idx));
    if (activeTab >= idx && activeTab > 0) setActiveTab(prev => prev - 1);
    if (activeTab === idx) setActiveTab(-1);
    if (uoConfigs.length <= 1) setActiveTab(-1);
  };

  const handleSave = () => {
    const uoCfg = {};
    uoConfigs.forEach(u => {
      uoCfg[u.uo] = {};
      if (u.toolingCategories.length > 0) uoCfg[u.uo].toolingCategories = u.toolingCategories;
      if (u.formatTypes.length > 0) uoCfg[u.uo].formatTypes = u.formatTypes;
    });
    updateConfig({ uoConfigs: uoCfg });
    logAction('update', 'Configuração', 'Configurações por UO atualizadas');
    toast('Configurações salvas com sucesso!');
  };

  const section = activeTab === -1 ? 'uos' : 'variaveis';

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-1 flex gap-0 min-h-0 rounded-[8px] border border-[var(--border)] overflow-hidden">
        <div className="w-[200px] flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border)] overflow-y-auto p-4">
          <button onClick={() => setActiveTab(-1)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all text-left mb-1 ${
              activeTab === -1 ? 'bg-[var(--surface-hover)] text-[var(--fg)] font-semibold' : 'text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
            }`}>
            <Icon name="settings" size={16} />
            <span>UOs</span>
          </button>
          <div className="h-px bg-[var(--border)] my-2" />
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
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {section === 'uos' ? (
            <div className="max-w-lg mx-auto space-y-6">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--fg)] mb-1">Unidades Organizacionais</h2>
                <p className="text-[12px] text-[var(--fg-secondary)] mb-4">Cadastre ou remova UOs. As variáveis de cada UO são configuradas separadamente.</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input placeholder="Nome da nova UO..." value={newUoName} onChange={e => setNewUoName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addUo(); }} />
                  </div>
                  <Button variant="primary" size="sm" onClick={addUo} disabled={!newUoName.trim()}>Adicionar</Button>
                </div>
                {allMachineUos.filter(u => !uoList.includes(u)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[11px] text-[var(--fg-muted)] leading-[22px]">Sugestões das máquinas:</span>
                    {allMachineUos.filter(u => !uoList.includes(u)).map(u => (
                      <button key={u} type="button" onClick={() => { setNewUoName(u); }}
                        className="px-2 py-0.5 rounded-[3px] border border-[var(--border)] text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--fg-muted)] transition-colors">
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {uoList.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-10 h-10 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3"><Icon name="settings" size={20} /></div>
                    <p className="text-[14px] font-medium text-[var(--fg)] mb-1">Nenhuma UO cadastrada</p>
                    <p className="text-[12px] text-[var(--fg-secondary)]">Adicione UOs acima para começar a configurar.</p>
                  </div>
                ) : (
                  uoList.map((uo, i) => {
                    const cfg = uoConfigs.find(c => c.uo === uo);
                    const totalItems = (cfg?.toolingCategories.length || 0) + (cfg?.formatTypes.length || 0);
                    return (
                      <div key={uo} className="flex items-center justify-between px-4 py-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface)]">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold text-[var(--fg-secondary)]">
                            {uo.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-[var(--fg)]">{uo}</div>
                            <div className="text-[11px] text-[var(--fg-muted)]">{totalItems} variáve{totalItems !== 1 ? 'is' : 'l'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setActiveTab(i); }}>Configurar</Button>
                          <button type="button" onClick={() => removeUo(i)} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--danger)] transition-colors">Excluir</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : active ? (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-[16px] font-semibold text-[var(--fg)]">{active.uo}</h2>
                  <p className="text-[12px] text-[var(--fg-secondary)]">Configurações específicas para esta Unidade Organizacional.</p>
                </div>
                <button type="button" onClick={() => removeUo(activeTab)} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--danger)] transition-colors">Remover UO</button>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[var(--fg)] mb-1 block">Ferramentais</label>
                <p className="text-[12px] text-[var(--fg-secondary)] mb-3">Categorias de peças usadas como ferramentais.</p>
                <TagInput values={active.toolingCategories || []} onAdd={v => setUoValue('toolingCategories', [...(active.toolingCategories || []), v])} onRemove={v => setUoValue('toolingCategories', (active.toolingCategories || []).filter(x => x !== v))} placeholder="Ex: Bico de Envase" />
              </div>

              <div className="h-px bg-[var(--border)]" />

              <div>
                <label className="text-[13px] font-medium text-[var(--fg)] mb-1 block">Tipos de Formato</label>
                <p className="text-[12px] text-[var(--fg-secondary)] mb-3">Tipos de formato disponíveis.</p>
                <TagInput values={active.formatTypes || []} onAdd={v => setUoValue('formatTypes', [...(active.formatTypes || []), v])} onRemove={v => setUoValue('formatTypes', (active.formatTypes || []).filter(x => x !== v))} placeholder="Ex: Frasco cilíndrico" />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 mt-auto border-t border-[var(--border)]">
        <span className="text-[12px] text-[var(--fg-muted)] mr-auto">
          {uoConfigs.reduce((acc, u) => acc + u.toolingCategories.length + u.formatTypes.length, 0)} itens · {uoList.length} UO{uoList.length !== 1 ? 's' : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={() => {
          const saved = config.uoConfigs || {};
          setUoList(Object.keys(saved));
          setUoConfigs(Object.entries(saved).map(([uo, cfg]) => ({ uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])] })));
          setActiveTab(-1);
          toast('Alterações descartadas.');
        }}>Descartar</Button>
        <Button variant="primary" onClick={handleSave}><Icon name="check-circle" size={15} />Salvar alterações</Button>
      </div>
    </div>
  );
}
