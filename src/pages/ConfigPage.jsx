import { useState, useContext, useMemo } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';

const TABS = [
  { id: 'geral', label: 'Geral', icon: 'settings' },
  { id: 'uos', label: 'UOs', icon: 'grid-3x3' },
  { id: 'sistema', label: 'Sistema', icon: 'box' },
  { id: 'aparencia', label: 'Aparência', icon: 'sun' },
  { id: 'notificacoes', label: 'Notificações', icon: 'clock' },
];

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
      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] text-[12px] text-[var(--fg)]">
            {v}
            <button type="button" onClick={() => onRemove(v)} className="text-[var(--fg-muted)] hover:text-[var(--danger)] leading-none text-[14px]">&times;</button>
          </span>
        ))}
        {values.length === 0 && <span className="text-[12px] text-[var(--fg-muted)]">Nenhum item.</span>}
      </div>
      <div className="flex gap-1.5">
        <Input placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} className="min-h-[32px] text-[12px]" />
        <Button variant="secondary" size="sm" onClick={handleAdd} disabled={!input.trim()} className="h-[32px]">Adicionar</Button>
      </div>
    </div>
  );
}

export function ConfigPage() {
  const { config, updateConfig, logAction, machines } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const [tab, setTab] = useState('geral');

  const [uoList, setUoList] = useState(() => Object.keys(config.uoConfigs || {}));
  const [uoConfigs, setUoConfigs] = useState(() => {
    const saved = config.uoConfigs || {};
    return Object.entries(saved).map(([uo, cfg]) => ({
      uo, toolingCategories: [...(cfg.toolingCategories || [])],
      formatTypes: [...(cfg.formatTypes || [])],
      productCategories: [...(cfg.productCategories || [])],
      lines: [...(cfg.lines || [])],
    }));
  });
  const [uoEdit, setUoEdit] = useState(null);
  const [newUoName, setNewUoName] = useState('');

  const allMachineUos = useMemo(() => [...new Set(machines.map(m => m.uo).filter(Boolean))].sort(), [machines]);

  const activeUo = uoEdit !== null ? uoConfigs[uoEdit] : null;
  const setUoValue = (key, values) => setUoConfigs(prev => prev.map((u, i) => i === uoEdit ? { ...u, [key]: values } : u));

  const addUo = () => {
    const name = newUoName.trim();
    if (!name) return;
    if (uoList.includes(name)) { toast(`UO "${name}" já existe.`, 'warning'); return; }
    setUoList(prev => [...prev, name]);
    setUoConfigs(prev => [...prev, { uo: name, toolingCategories: [], formatTypes: [], productCategories: [], lines: [] }]);
    setUoEdit(uoConfigs.length);
    setNewUoName('');
  };

  const removeUo = (idx) => {
    const uo = uoConfigs[idx];
    if (!uo) return;
    if (!confirm(`Remover UO "${uo.uo}"?`)) return;
    setUoList(prev => prev.filter(u => u !== uo.uo));
    setUoConfigs(prev => prev.filter((_, i) => i !== idx));
    if (uoEdit === idx) setUoEdit(null);
    else if (uoEdit > idx) setUoEdit(prev => prev - 1);
  };

  const handleSave = () => {
    const uoCfg = {};
    uoConfigs.forEach(u => {
      uoCfg[u.uo] = {};
      if (u.toolingCategories.length > 0) uoCfg[u.uo].toolingCategories = u.toolingCategories;
      if (u.formatTypes.length > 0) uoCfg[u.uo].formatTypes = u.formatTypes;
      if (u.productCategories.length > 0) uoCfg[u.uo].productCategories = u.productCategories;
      if (u.lines.length > 0) uoCfg[u.uo].lines = u.lines;
    });
    updateConfig({ uoConfigs: uoCfg });
    logAction('update', 'Configuração', 'Configurações salvas');
    toast('Configurações salvas com sucesso!');
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-1 flex gap-0 min-h-0 rounded-[8px] border border-[var(--border)] overflow-hidden">
        <div className="w-[180px] flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border)] p-3 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setUoEdit(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all text-left mb-0.5 ${
                tab === t.id ? 'bg-[var(--surface-hover)] text-[var(--fg)] font-semibold' : 'text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
              }`}>
              <Icon name={t.icon} size={16} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'geral' && (
            <div className="max-w-lg">
              <div className="text-[16px] font-semibold text-[var(--fg)] mb-1">Geral</div>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-5">Configurações gerais do sistema.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[var(--fg)]">Tema escuro</div>
                    <div className="text-[12px] text-[var(--fg-muted)]">Alternar entre tema claro e escuro</div>
                  </div>
                  <label className="relative w-[40px] h-[22px] cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="absolute inset-0 rounded-[11px] bg-[var(--border)] peer-checked:bg-[var(--fg)] transition-colors" />
                    <div className="absolute top-[3px] left-[3px] w-[16px] h-[16px] rounded-full bg-[var(--bg)] peer-checked:translate-x-[18px] peer-checked:bg-[var(--surface)] transition-all" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {tab === 'uos' && (
            <div className="max-w-2xl">
              <div className="text-[16px] font-semibold text-[var(--fg)] mb-1">Unidades Organizacionais</div>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-5">Gerencie UOs e suas variáveis.</p>

              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <Input placeholder="Nova UO..." value={newUoName} onChange={e => setNewUoName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addUo(); }} className="min-h-[34px] text-[13px]" />
                </div>
                <Button variant="primary" size="sm" onClick={addUo} disabled={!newUoName.trim()}>Adicionar</Button>
              </div>
              {allMachineUos.filter(u => !uoList.includes(u)).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {allMachineUos.filter(u => !uoList.includes(u)).map(u => (
                    <button key={u} type="button" onClick={() => setNewUoName(u)}
                      className="px-2 py-0.5 rounded-[3px] border border-[var(--border)] text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">{u}</button>
                  ))}
                </div>
              )}

              <div className="flex gap-4 items-start">
                <div className="w-[220px] flex-shrink-0 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)] mb-2 px-1">UOs</div>
                  {uoConfigs.map((uo, i) => (
                    <button key={uo.uo} onClick={() => setUoEdit(i)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-[13px] text-left transition-all ${
                        uoEdit === i ? 'bg-[var(--surface-hover)] text-[var(--fg)] font-semibold' : 'text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                      }`}>
                      <div className="w-5 h-5 rounded-[4px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold text-[var(--fg-secondary)] flex-shrink-0">{uo.uo.charAt(0).toUpperCase()}</div>
                      <span className="truncate">{uo.uo}</span>
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  {!activeUo ? (
                    <div className="text-center py-10 text-[13px] text-[var(--fg-muted)]">Selecione uma UO ao lado para configurar.</div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[14px] font-semibold text-[var(--fg)]">{activeUo.uo}</div>
                          <div className="text-[12px] text-[var(--fg-secondary)]">Variáveis desta Unidade Organizacional.</div>
                        </div>
                        <button type="button" onClick={() => removeUo(uoEdit)} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--danger)] transition-colors">Remover</button>
                      </div>
                      <div className="h-px bg-[var(--border)]" />
                      {[
                        { key: 'toolingCategories', label: 'Ferramentais', desc: 'Categorias de peças usadas como ferramentais.', placeholder: 'Ex: Bico de Envase' },
                        { key: 'formatTypes', label: 'Tipos de Formato', desc: 'Tipos de formato disponíveis.', placeholder: 'Ex: Frasco cilíndrico' },
                        { key: 'productCategories', label: 'Categorias', desc: 'Categorias de produto disponíveis.', placeholder: 'Ex: Shampoo' },
                        { key: 'lines', label: 'Linhas', desc: 'Linhas de produção disponíveis.', placeholder: 'Ex: Linha 01' },
                      ].map((field, fi) => (
                        <div key={field.key}>
                          {fi > 0 && <div className="h-px bg-[var(--border)] my-5" />}
                          <div>
                            <label className="text-[13px] font-medium text-[var(--fg)] mb-1 block">{field.label}</label>
                            <p className="text-[12px] text-[var(--fg-secondary)] mb-3">{field.desc}</p>
                          </div>
                          <TagInput values={activeUo[field.key] || []} onAdd={v => setUoValue(field.key, [...(activeUo[field.key] || []), v])} onRemove={v => setUoValue(field.key, (activeUo[field.key] || []).filter(x => x !== v))} placeholder={field.placeholder} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'sistema' && (
            <div className="max-w-lg">
              <div className="text-[16px] font-semibold text-[var(--fg)] mb-1">Sistema</div>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-5">Informações e ações do sistema.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[var(--fg)]">Versão do sistema</div>
                    <div className="text-[12px] text-[var(--fg-muted)]">Controle de Setup v2.0</div>
                  </div>
                </div>
                <div className="h-px bg-[var(--border)]" />
                <div>
                  <div className="text-[13px] font-medium text-[var(--fg)] mb-2">Gerenciar dados</div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      const blob = new Blob([JSON.stringify({ machines: [], products: [], pieces: [], flows: [], formatos: [], history: [] }, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast('Backup exportado com sucesso!');
                    }}>Exportar backup</Button>
                    <button type="button" onClick={() => {
                      if (confirm('Resetar todos os dados?')) {
                        if (confirm('Confirma a exclusão total?')) {
                          updateConfig({ uoConfigs: {} });
                          localStorage.setItem('controle-setup-data', JSON.stringify({ machines: [], products: [], pieces: [], flows: [], formatos: [], history: [] }));
                          localStorage.removeItem('cs-theme');
                          window.location.href = window.location.pathname + '?reset=' + Date.now();
                        }
                      }
                    }} className="px-3 py-1.5 rounded-[6px] border border-[var(--danger)] text-[12px] font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors">Resetar dados</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'aparencia' && (
            <div className="max-w-lg">
              <div className="text-[16px] font-semibold text-[var(--fg)] mb-1">Aparência</div>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-5">Personalize a aparência do sistema.</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[var(--fg)]">Tema escuro</div>
                    <div className="text-[12px] text-[var(--fg-muted)]">Alternar entre tema claro e escuro</div>
                  </div>
                  <label className="relative w-[40px] h-[22px] cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="absolute inset-0 rounded-[11px] bg-[var(--border)] peer-checked:bg-[var(--fg)] transition-colors" />
                    <div className="absolute top-[3px] left-[3px] w-[16px] h-[16px] rounded-full bg-[var(--bg)] peer-checked:translate-x-[18px] peer-checked:bg-[var(--surface)] transition-all" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {tab === 'notificacoes' && (
            <div className="max-w-lg">
              <div className="text-[16px] font-semibold text-[var(--fg)] mb-1">Notificações</div>
              <p className="text-[12px] text-[var(--fg-secondary)] mb-5">Preferências de notificações do sistema.</p>
              {[
                { label: 'Notificações por email', desc: 'Receber notificações por email' },
                { label: 'Notificações no sistema', desc: 'Exibir notificações na interface' },
                { label: 'Alertas sonoros', desc: 'Reproduzir som ao receber notificações' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-4 py-1">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[var(--fg)]">{item.label}</div>
                    <div className="text-[12px] text-[var(--fg-muted)]">{item.desc}</div>
                  </div>
                  <label className="relative w-[40px] h-[22px] cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="absolute inset-0 rounded-[11px] bg-[var(--border)] peer-checked:bg-[var(--fg)] transition-colors" />
                    <div className="absolute top-[3px] left-[3px] w-[16px] h-[16px] rounded-full bg-[var(--bg)] peer-checked:translate-x-[18px] peer-checked:bg-[var(--surface)] transition-all" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 mt-auto border-t border-[var(--border)]">
        <span className="text-[12px] text-[var(--fg-muted)] mr-auto">
          {uoConfigs.reduce((acc, u) => acc + u.toolingCategories.length + u.formatTypes.length + u.productCategories.length + u.lines.length, 0)} itens configurados
        </span>
        <Button variant="ghost" size="sm" onClick={() => {
          const saved = config.uoConfigs || {};
          setUoList(Object.keys(saved));
          setUoConfigs(Object.entries(saved).map(([uo, cfg]) => ({
            uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])],
            productCategories: [...(cfg.productCategories || [])], lines: [...(cfg.lines || [])],
          })));
          toast('Alterações descartadas.');
        }}>Descartar</Button>
        <Button variant="primary" onClick={handleSave}><Icon name="check-circle" size={15} />Salvar alterações</Button>
      </div>
    </div>
  );
}
