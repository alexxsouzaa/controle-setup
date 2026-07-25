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
  { id: 'notificacoes', label: 'Notificações', icon: 'bell' },
];

const FIELDS = [
  { key: 'toolingCategories', label: 'Ferramentais', desc: 'Categorias de peças usadas como ferramentais.', placeholder: 'Ex: Bico de Envase' },
  { key: 'formatTypes', label: 'Tipos de Formato', desc: 'Tipos de formato disponíveis.', placeholder: 'Ex: Frasco cilíndrico' },
  { key: 'productCategories', label: 'Categorias', desc: 'Categorias de produto disponíveis.', placeholder: 'Ex: Shampoo' },
  { key: 'lines', label: 'Linhas', desc: 'Linhas de produção disponíveis.', placeholder: 'Ex: Linha 01' },
];

function TagInput({ values, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState('');
  return (
    <div>
      <div className="flex flex-wrap gap-1 min-h-[24px] mb-2">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] text-[12px] text-[var(--fg)]">
            {v}
            <button type="button" onClick={() => onRemove(v)} className="text-[var(--fg-muted)] hover:text-[var(--danger)] leading-none text-[14px]">&times;</button>
          </span>
        ))}
        {values.length === 0 && <span className="text-[12px] text-[var(--fg-muted)]">Nenhum item.</span>}
      </div>
      <div className="flex gap-2">
        <Input placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const v = input.trim(); if (v && !values.includes(v)) { onAdd(v); setInput(''); } } }} className="min-h-[36px] text-[13px]" />
        <Button variant="secondary" size="sm" onClick={() => { const v = input.trim(); if (v && !values.includes(v)) { onAdd(v); setInput(''); } }} disabled={!input.trim()} className="h-[36px] shrink-0">Adicionar</Button>
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
      uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])],
      productCategories: [...(cfg.productCategories || [])], lines: [...(cfg.lines || [])],
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
    if (!confirm(`Remover UO "${uoConfigs[idx].uo}"?`)) return;
    setUoList(prev => prev.filter(u => u !== uoConfigs[idx].uo));
    setUoConfigs(prev => prev.filter((_, i) => i !== idx));
    if (uoEdit >= idx) setUoEdit(uoEdit === idx ? null : uoEdit - 1);
  };

  const handleSave = () => {
    const uoCfg = {};
    uoConfigs.forEach(u => { uoCfg[u.uo] = { toolingCategories: u.toolingCategories, formatTypes: u.formatTypes, productCategories: u.productCategories, lines: u.lines }; });
    updateConfig({ uoConfigs: uoCfg });
    logAction('update', 'Configuração', 'Configurações salvas');
    const saved = document.getElementById('saved-toast');
    if (saved) { saved.classList.add('visible'); setTimeout(() => saved.classList.remove('visible'), 2000); }
    toast('Configurações salvas com sucesso!');
  };

  return (
    <div className="p-0 h-full flex flex-col">
      <div className="flex-1 flex min-h-0">
        <nav className="w-[200px] flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border)] p-4 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setUoEdit(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all text-left mb-0.5 ${
                tab === t.id ? 'bg-[var(--surface-hover)] text-[var(--fg)] font-semibold' : 'text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
              }`}>
              <Icon name={t.icon} size={16} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto py-6 px-8" id="settings-content">
          {tab === 'geral' && (
            <div className="max-w-[620px] flex flex-col gap-8">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--fg)] pb-2 border-b border-[var(--border)]">Geral</h2>
                <p className="text-[13px] text-[var(--fg-secondary)] mt-3">Preferências básicas da plataforma.</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
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

          {tab === 'uos' && (
            <div className="max-w-[720px] flex flex-col gap-8">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--fg)] pb-2 border-b border-[var(--border)]">Unidades Organizacionais</h2>
                <p className="text-[13px] text-[var(--fg-secondary)] mt-3">Gerencie UOs e configure suas variáveis.</p>
              </div>

              <div className="flex gap-2">
                <Input placeholder="Nova UO..." value={newUoName} onChange={e => setNewUoName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addUo(); }} className="min-h-[36px] text-[13px] flex-1" />
                <Button variant="primary" size="sm" onClick={addUo} disabled={!newUoName.trim()} className="h-[36px]">Adicionar</Button>
              </div>
              {allMachineUos.filter(u => !uoList.includes(u)).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {allMachineUos.filter(u => !uoList.includes(u)).map(u => (
                    <button key={u} type="button" onClick={() => setNewUoName(u)} className="px-2 py-0.5 rounded-[3px] border border-[var(--border)] text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">{u}</button>
                  ))}
                </div>
              )}

              <div className="flex gap-6 items-start">
                <div className="w-[220px] flex-shrink-0 space-y-0.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] px-1 pb-2">UOs</div>
                  {uoConfigs.map((uo, i) => (
                    <button key={uo.uo} onClick={() => setUoEdit(i)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-[13px] text-left transition-all ${
                        uoEdit === i ? 'bg-[var(--surface-hover)] text-[var(--fg)] font-semibold' : 'text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                      }`}>
                      <span className="w-5 h-5 rounded-[4px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold text-[var(--fg-secondary)] flex-shrink-0">{uo.uo.charAt(0).toUpperCase()}</span>
                      <span className="truncate">{uo.uo}</span>
                    </button>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  {!activeUo ? (
                    <div className="text-center py-12 text-[13px] text-[var(--fg-muted)]">Selecione uma UO ao lado para configurar suas variáveis.</div>
                  ) : (
                    <div className="flex flex-col gap-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[16px] font-semibold text-[var(--fg)]">{activeUo.uo}</h3>
                          <p className="text-[13px] text-[var(--fg-secondary)] mt-1">Variáveis desta Unidade Organizacional.</p>
                        </div>
                        <button type="button" onClick={() => removeUo(uoEdit)} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--danger)] transition-colors">Remover</button>
                      </div>
                      {FIELDS.map((field, fi) => (
                        <div key={field.key}>
                          {fi > 0 && <hr className="border-[var(--border)] mb-6" />}
                          <div className="flex flex-col gap-2">
                            <div>
                              <label className="text-[13px] font-medium text-[var(--fg)] block">{field.label}</label>
                              <p className="text-[12px] text-[var(--fg-muted)] mt-1">{field.desc}</p>
                            </div>
                            <TagInput values={activeUo[field.key] || []} onAdd={v => setUoValue(field.key, [...(activeUo[field.key] || []), v])} onRemove={v => setUoValue(field.key, (activeUo[field.key] || []).filter(x => x !== v))} placeholder={field.placeholder} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'sistema' && (
            <div className="max-w-[620px] flex flex-col gap-8">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--fg)] pb-2 border-b border-[var(--border)]">Sistema</h2>
                <p className="text-[13px] text-[var(--fg-secondary)] mt-3">Informações e ações do sistema.</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="text-[13px] font-medium text-[var(--fg)]">Versão do sistema</div>
                  <div className="text-[12px] text-[var(--fg-muted)]">Controle de Setup v2.0</div>
                </div>
                <hr className="border-[var(--border)]" />
                <div className="flex flex-col gap-3">
                  <div className="text-[13px] font-medium text-[var(--fg)]">Gerenciar dados</div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => window.location.href = '/exportar'} className="px-3 py-1.5 rounded-[6px] border border-[var(--border)] text-[13px] font-medium text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)] hover:border-[var(--fg-muted)] transition-all">Exportar dados</button>
                    <button type="button" onClick={() => {
                      if (confirm('Resetar todos os dados? Esta ação não pode ser desfeita.')) {
                        if (confirm('Confirma a exclusão total dos dados do sistema?')) {
                          localStorage.setItem('controle-setup-data', JSON.stringify({ machines: [], products: [], pieces: [], flows: [], formatos: [], history: [] }));
                          localStorage.removeItem('cs-theme');
                          window.location.href = window.location.pathname + '?reset=' + Date.now();
                        }
                      }
                    }} className="px-3 py-1.5 rounded-[6px] border border-[var(--danger)] text-[13px] font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-all">Resetar dados</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'aparencia' && (
            <div className="max-w-[620px] flex flex-col gap-8">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--fg)] pb-2 border-b border-[var(--border)]">Aparência</h2>
                <p className="text-[13px] text-[var(--fg-secondary)] mt-3">Personalize a aparência do sistema.</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
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
            <div className="max-w-[620px] flex flex-col gap-8">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--fg)] pb-2 border-b border-[var(--border)]">Notificações</h2>
                <p className="text-[13px] text-[var(--fg-secondary)] mt-3">Preferências de notificações do sistema.</p>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Notificações por email', desc: 'Receber notificações por email' },
                  { label: 'Notificações no sistema', desc: 'Exibir notificações na interface' },
                  { label: 'Alertas sonoros', desc: 'Reproduzir som ao receber notificações' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-[var(--fg)]">{item.label}</div>
                      <div className="text-[12px] text-[var(--fg-muted)]">{item.desc}</div>
                    </div>
                    <label className="relative w-[40px] h-[22px] cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="absolute inset-0 rounded-[11px] bg-[var(--border)] peer-checked:bg-[var(--fg)] transition-colors" />
                      <div className="absolute top-[3px] left-[3px] w-[16px] h-[16px] rounded-full bg-[var(--bg)] peer-checked:translate-x-[18px] peer-checked:bg-[var(--surface)] transition-all" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-[var(--border)] shrink-0">
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
