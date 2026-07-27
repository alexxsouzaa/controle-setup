import React, { useState, useContext, useMemo } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { AppData, Config, UoConfig } from '../types';

const TABS = [
  { id: 'geral', label: 'Geral', icon: 'settings' },
  { id: 'uos', label: 'UOs', icon: 'grid-3x3' },
  { id: 'sistema', label: 'Sistema', icon: 'box' },
  { id: 'aparencia', label: 'Aparência', icon: 'sun' },
  { id: 'notificacoes', label: 'Notificações', icon: 'clock' },
] as const;

const FIELDS: { key: string; label: string; desc: string; placeholder: string }[] = [
  { key: 'toolingCategories', label: 'Ferramentais', desc: 'Categorias de peças usadas como ferramentais.', placeholder: 'Ex: Bico de Envase' },
  { key: 'formatTypes', label: 'Tipos de Formato', desc: 'Tipos de formato disponíveis.', placeholder: 'Ex: Frasco cilíndrico' },
  { key: 'productCategories', label: 'Categorias', desc: 'Categorias de produto disponíveis.', placeholder: 'Ex: Shampoo' },
  { key: 'lines', label: 'Linhas', desc: 'Linhas de produção disponíveis.', placeholder: 'Ex: Linha 01' },
];

interface UoConfigItem {
  uo: string;
  toolingCategories: string[];
  formatTypes: string[];
  productCategories: string[];
  lines: string[];
}

function TagInput({ values, onAdd, onRemove, placeholder }: {
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState<string>('');

  const handleAdd = () => {
    const v = input.trim();
    if (v && !values.includes(v)) { onAdd(v); setInput(''); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { handleAdd(); }
  };

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
        <Input placeholder={placeholder} value={input} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)} onKeyDown={handleKeyDown} className="min-h-[36px] text-[13px]" />
        <Button variant="secondary" size="sm" onClick={handleAdd} disabled={!input.trim()} className="h-[36px] shrink-0">Adicionar</Button>
      </div>
    </div>
  );
}

export function ConfigPage() {
  const { config, updateConfig, logAction, machines } = useContext(AppDataContext) as AppData;
  const { toast } = useContext(ToastContext) as { toast: (msg: string, type?: string) => number };
  const [tab, setTab] = useState<string>('geral');

  const [uoList, setUoList] = useState<string[]>(() => Object.keys(config.uoConfigs || {}));
  const [uoConfigs, setUoConfigs] = useState<UoConfigItem[]>(() => {
    const saved = config.uoConfigs || {};
    return Object.entries(saved).map(([uo, cfg]: [string, UoConfig]) => ({
      uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])],
      productCategories: [...(cfg.productCategories || [])], lines: [...(cfg.lines || [])],
    }));
  });
  const [uoEdit, setUoEdit] = useState<number | null>(null);
  const [newUoName, setNewUoName] = useState<string>('');

  const allMachineUos = useMemo(() => [...new Set(machines.map(m => m.uo).filter(Boolean))].sort(), [machines]);
  const setUoValue = (key: string, values: string[]) => setUoConfigs(prev => prev.map((u, i) => i === uoEdit ? { ...u, [key]: values } : u));

  const addUo = () => {
    const name = newUoName.trim();
    if (!name) return;
    if (uoList.includes(name)) { toast(`UO "${name}" já existe.`, 'warning'); return; }
    setUoList(prev => [...prev, name]);
    setUoConfigs(prev => [...prev, { uo: name, toolingCategories: [], formatTypes: [], productCategories: [], lines: [] }]);
    setUoEdit(uoConfigs.length);
    setNewUoName('');
  };

  const removeUo = (idx: number) => {
    if (!confirm(`Remover UO "${uoConfigs[idx].uo}"?`)) return;
    setUoList(prev => prev.filter(u => u !== uoConfigs[idx].uo));
    setUoConfigs(prev => prev.filter((_, i) => i !== idx));
    if (uoEdit != null && uoEdit >= idx) setUoEdit(uoEdit === idx ? null : uoEdit - 1);
  };

  const handleSave = () => {
    const uoCfg: Record<string, UoConfig> = {};
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
            <div className="max-w-[620px] flex flex-col gap-8">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--fg)] pb-2 border-b border-[var(--border)]">UOs</h2>
                <p className="text-[13px] text-[var(--fg-secondary)] mt-3">Gerencie Unidades Organizacionais e suas variáveis.</p>
              </div>

              <div className="flex gap-2">
                <Input placeholder="Nova UO..." value={newUoName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUoName(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') addUo(); }} className="min-h-[36px] text-[13px] flex-1" />
                <Button variant="primary" size="sm" onClick={addUo} disabled={!newUoName.trim()} className="h-[36px]">Adicionar</Button>
              </div>
              {allMachineUos.filter(u => !uoList.includes(u)).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {allMachineUos.filter(u => !uoList.includes(u)).map(u => (
                    <button key={u} type="button" onClick={() => setNewUoName(u)} className="px-2 py-0.5 rounded-[3px] border border-[var(--border)] text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">{u}</button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {uoConfigs.length === 0 ? (
                  <p className="text-center py-8 text-[13px] text-[var(--fg-muted)]">Nenhuma UO cadastrada. Adicione uma UO acima.</p>
                ) : (
                  uoConfigs.map((uo, i) => {
                    const open = uoEdit === i;
                    const total = (uo.toolingCategories.length || 0) + (uo.formatTypes.length || 0) + (uo.productCategories.length || 0) + (uo.lines.length || 0);
                    return (
                      <div key={uo.uo} className="border border-[var(--border)] rounded-[8px] bg-[var(--surface)]">
                        <button type="button" onClick={() => setUoEdit(open ? null : i)}
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--surface-hover)] transition-colors rounded-[8px]">
                          <span className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[12px] font-semibold text-[var(--fg-secondary)] shrink-0">{uo.uo.charAt(0).toUpperCase()}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-[var(--fg)]">{uo.uo}</div>
                            <div className="text-[11px] text-[var(--fg-muted)]">{total} variáve{total !== 1 ? 'is' : 'l'} configurada{total !== 1 ? 's' : ''}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); removeUo(i); }} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--danger)] transition-colors">Excluir</button>
                            <Icon name="arrow-right" size={14} className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
                          </div>
                        </button>
                        {open && (
                          <div className="px-5 pb-5 space-y-6 border-t border-[var(--border)] pt-5">
                            {FIELDS.map(field => (
                              <div key={field.key} className="flex flex-col gap-2">
                                <div>
                                  <label className="text-[13px] font-medium text-[var(--fg)] block">{field.label}</label>
                                  <p className="text-[12px] text-[var(--fg-muted)] mt-1">{field.desc}</p>
                                </div>
                                <TagInput values={uo[field.key as keyof UoConfigItem] as string[] || []} onAdd={v => setUoValue(field.key, [...(uo[field.key as keyof UoConfigItem] as string[] || []), v])} onRemove={v => setUoValue(field.key, ((uo[field.key as keyof UoConfigItem] as string[] || []) as string[]).filter(x => x !== v))} placeholder={field.placeholder} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
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

      <div className="sticky bottom-0 bg-[var(--bg)] flex items-center justify-end gap-3 px-8 py-4 border-t border-[var(--border)] shrink-0">
        <span className="text-[12px] text-[var(--fg-muted)] mr-auto">
          {uoConfigs.reduce((acc, u) => acc + u.toolingCategories.length + u.formatTypes.length + u.productCategories.length + u.lines.length, 0)} itens configurados
        </span>
        <Button variant="ghost" size="sm" onClick={() => {
          const saved = config.uoConfigs || {};
          setUoList(Object.keys(saved));
          setUoConfigs(Object.entries(saved).map(([uo, cfg]: [string, UoConfig]) => ({
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
