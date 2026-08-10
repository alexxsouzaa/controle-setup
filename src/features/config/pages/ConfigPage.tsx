import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../contexts/ToastContext';
import { ThemeContext } from '../../../contexts/ThemeContext';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import { useMachines, useProducts, usePieces, useUnits } from '../../../queries';
import { useConfig, useUpdateConfig } from '../../../queries';
import { useLogAction } from '../../../queries';
import { useSeedDemo, useMigrateLegacy, useAssignOrphaned } from '../../../queries';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { PageHeader } from '../../../components/shared/PageHeader';
import { EmptyState, Loading } from '../../../components/shared/EmptyState';
import { UoConfig } from '../../../types';
import { fsClearAll } from '../../../lib/api/firestore';
import type { SeedReport } from '../../../lib/seed';
import type { MigrationReport, OrphanReport } from '../../../lib/migrate';

const TABS = [
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

const NOTIF_OPTIONS = [
  { id: 'email', label: 'Notificações por email', desc: 'Receber notificações por email' },
  { id: 'sistema', label: 'Notificações no sistema', desc: 'Exibir notificações na interface' },
  { id: 'sonoro', label: 'Alertas sonoros', desc: 'Reproduzir som ao receber notificações' },
];
const DEFAULT_NOTIF: Record<string, boolean> = { email: true, sistema: true, sonoro: false };
const NOTIF_KEY = 'setflow-notifications';
const RESET_COLLECTIONS = ['machines', 'products', 'pieces', 'flows', 'formatos', 'history', 'config'];

interface UoConfigItem {
  uo: string;
  toolingCategories: string[];
  formatTypes: string[];
  productCategories: string[];
  lines: string[];
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative w-[40px] h-[22px] shrink-0 cursor-pointer"
    >
      <span className={`absolute inset-0 rounded-[11px] transition-colors ${checked ? 'bg-[var(--fg)]' : 'bg-[var(--border)]'}`} />
      <span className={`absolute top-[3px] left-[3px] w-[16px] h-[16px] rounded-full bg-[var(--bg)] transition-all ${checked ? 'translate-x-[18px]' : ''}`} />
    </button>
  );
}

function TagInput({ values, onAdd, onRemove, placeholder, label }: {
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [input, setInput] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);

  const addAll = (source: string) => {
    const parts = source.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const fresh = parts.filter(p => !values.includes(p));
    if (fresh.length > 0) {
      fresh.forEach(onAdd);
      setInput('');
      setNotice(null);
    } else {
      setInput('');
      setNotice('Item já adicionado.');
      window.setTimeout(() => setNotice(null), 1600);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 min-h-[24px] mb-2">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] text-[12px] text-[var(--fg)]">
            {v}
            <button type="button" aria-label={`Remover ${v}`} onClick={() => onRemove(v)} className="text-[var(--fg-muted)] hover:text-[var(--danger)] leading-none text-[14px]">&times;</button>
          </span>
        ))}
        {values.length === 0 && <span className="text-[12px] text-[var(--fg-muted)]">Nenhum item.</span>}
      </div>
      <div className="flex gap-2">
        <Input
          aria-label={label}
          placeholder={placeholder}
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); addAll(input); } }}
          onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => { const t = e.clipboardData.getData('text'); if (/[,\n]/.test(t)) { e.preventDefault(); addAll(t); } }}
          className="min-h-[36px] text-[13px]"
        />
        <Button variant="secondary" size="sm" onClick={() => addAll(input)} disabled={!input.trim()} className="h-[36px] shrink-0">Adicionar</Button>
      </div>
      {notice && <p className="text-[11px] text-[var(--danger)] mt-1">{notice}</p>}
    </div>
  );
}

export function ConfigPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: machines = [] } = useMachines();
  const { data: products = [] } = useProducts();
  const { data: pieces = [] } = usePieces();
  const { data: units = [] } = useUnits();
  const { data: config, isLoading: configLoading, isError: configError, refetch: refetchConfig } = useConfig();
  const { mutate: updateConfig } = useUpdateConfig();
  const { mutate: logAction } = useLogAction();
  const { mutate: seedDemo } = useSeedDemo();
  const { mutate: migrateLegacy } = useMigrateLegacy();
  const { mutate: assignOrphaned } = useAssignOrphaned();
  const { toast } = useToast();
  const { theme, toggle } = useContext(ThemeContext);

  const [tab, setTab] = useState<string>('uos');
  const [uoConfigs, setUoConfigs] = useState<UoConfigItem[]>([]);
  const [dirty, setDirty] = useState(false);
  const [uoEdit, setUoEdit] = useState<string | null>(null);
  const [newUoName, setNewUoName] = useState<string>('');
  const [uoSearch, setUoSearch] = useState<string>('');
  const [confirmRemoveUo, setConfirmRemoveUo] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [confirmMigrate, setConfirmMigrate] = useState(false);
  const [confirmAssign, setConfirmAssign] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedReport | null>(null);
  const [migrateResult, setMigrateResult] = useState<MigrationReport | null>(null);
  const [assignResult, setAssignResult] = useState<OrphanReport | null>(null);
  const [assignUnitId, setAssignUnitId] = useState<string>('');
  const [assignProducts, setAssignProducts] = useState<boolean>(true);
  const [assignPieces, setAssignPieces] = useState<boolean>(true);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      return raw ? { ...DEFAULT_NOTIF, ...JSON.parse(raw) } : { ...DEFAULT_NOTIF };
    } catch { return { ...DEFAULT_NOTIF }; }
  });

  // Sincroniza o estado local com a configuração carregada (corrige dados vazios no primeiro render).
  useEffect(() => {
    if (configLoading) return;
    const saved = config?.uoConfigs || {};
    setUoConfigs(Object.entries(saved).map(([uo, cfg]: [string, UoConfig]) => ({
      uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])],
      productCategories: [...(cfg.productCategories || [])], lines: [...(cfg.lines || [])],
    })));
    setDirty(false);
  }, [config, configLoading]);

  const blocker = useBlocker(dirty);
  const leavingBlocked = blocker.state === 'blocked';

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const uoList = useMemo(() => uoConfigs.map(u => u.uo), [uoConfigs]);
  const allMachineUos = useMemo(() => [...new Set(machines.map(m => m.uo).filter(Boolean))].sort(), [machines]);
  const suggestedUos = useMemo(() => allMachineUos.filter(u => !uoList.includes(u)), [allMachineUos, uoList]);
  const filteredUos = useMemo(() => {
    const q = uoSearch.trim().toLowerCase();
    return q ? uoConfigs.filter(u => u.uo.toLowerCase().includes(q)) : uoConfigs;
  }, [uoConfigs, uoSearch]);
  const totalCount = uoConfigs.reduce((acc, u) => acc + u.toolingCategories.length + u.formatTypes.length + u.productCategories.length + u.lines.length, 0);

  const orphanedProducts = products.filter(p => !p.unitId && p.scope !== 'global').length;
  const orphanedPieces = pieces.filter(p => !p.unitId && p.scope !== 'global').length;
  const orphanTotal = orphanedProducts + orphanedPieces;

  const handleSeed = () => {
    setConfirmSeed(false);
    setSeedResult(null);
    seedDemo(undefined, {
      onSuccess: (r) => { setSeedResult(r); toast('Dados de exemplo carregados com sucesso!'); logAction({ type: 'seed', entity: 'Dados', detail: 'Dados de exemplo carregados' }); },
      onError: () => toast('Não foi possível carregar os dados de exemplo.', 'error'),
    });
  };

  const handleMigrate = () => {
    setConfirmMigrate(false);
    setMigrateResult(null);
    migrateLegacy(undefined, {
      onSuccess: (r) => { setMigrateResult(r); toast('Migração concluída com sucesso!'); logAction({ type: 'migrate', entity: 'Dados', detail: 'Migração de dados legados executada' }); },
      onError: () => toast('Não foi possível executar a migração.', 'error'),
    });
  };

  const handleAssign = () => {
    if (!assignUnitId) { toast('Selecione a UO de destino.', 'warning'); return; }
    setConfirmAssign(false);
    setAssignResult(null);
    assignOrphaned({ unitId: assignUnitId, options: { products: assignProducts, pieces: assignPieces } }, {
      onSuccess: (r) => { setAssignResult(r); toast('Recursos atribuídos com sucesso!'); logAction({ type: 'assign', entity: 'UO', detail: 'Recursos órfãos atribuídos em massa' }); },
      onError: () => toast('Não foi possível atribuir os recursos.', 'error'),
    });
  };

  const setUoValue = (key: string, values: string[]) => {
    setUoConfigs(prev => prev.map(u => u.uo === uoEdit ? { ...u, [key]: values } : u));
    setDirty(true);
  };

  const addUo = (name?: string) => {
    const value = (name ?? newUoName).trim();
    if (!value) return;
    if (uoList.includes(value)) { toast(`UO "${value}" já existe.`, 'warning'); return; }
    setUoConfigs(prev => [...prev, { uo: value, toolingCategories: [], formatTypes: [], productCategories: [], lines: [] }]);
    setUoEdit(value);
    setNewUoName('');
    setDirty(true);
  };

  const handleSave = () => {
    const uoCfg: Record<string, UoConfig> = {};
    uoConfigs.forEach(u => { uoCfg[u.uo] = { toolingCategories: u.toolingCategories, formatTypes: u.formatTypes, productCategories: u.productCategories, lines: u.lines }; });
    updateConfig({ uoConfigs: uoCfg }, {
      onSuccess: () => {
        logAction({ type: 'update', entity: 'Configuração', detail: 'Configurações salvas' });
        setDirty(false);
        toast('Configurações salvas com sucesso!');
      },
      onError: () => toast('Não foi possível salvar as configurações.', 'error'),
    });
  };

  const handleDiscard = () => {
    const saved = config?.uoConfigs || {};
    setUoConfigs(Object.entries(saved).map(([uo, cfg]: [string, UoConfig]) => ({
      uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])],
      productCategories: [...(cfg.productCategories || [])], lines: [...(cfg.lines || [])],
    })));
    setUoEdit(null);
    setDirty(false);
    toast('Alterações descartadas.');
  };

  const handleReset = async () => {
    try {
      await fsClearAll(RESET_COLLECTIONS);
      localStorage.removeItem('cs-theme');
      localStorage.removeItem(NOTIF_KEY);
      setNotifPrefs({ ...DEFAULT_NOTIF });
      await qc.invalidateQueries();
      setUoConfigs([]);
      setDirty(false);
      toast('Dados resetados com sucesso.');
    } catch {
      toast('Não foi possível resetar os dados.', 'error');
    }
  };

  const setNotif = (id: string, value: boolean) => {
    const next = { ...notifPrefs, [id]: value };
    setNotifPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  };

  const saveDisabled = configLoading || configError || !dirty;

  return (
    <div className="p-0 h-full flex flex-col">
      <div className="px-4 pt-6 pb-0 sm:px-6 lg:px-8">
        <PageHeader title="Configurações" description="Gerencie UOs, aparência e preferências do sistema." />
      </div>
      <div className="flex-1 flex min-h-0 flex-col lg:flex-row">
        <nav role="tablist" aria-label="Seções de configuração" className="w-full lg:w-[200px] flex-shrink-0 lg:bg-[var(--bg-secondary)] lg:border-r lg:border-[var(--border)] lg:p-4 overflow-x-auto lg:overflow-y-auto flex lg:flex-col gap-0.5 px-4 pt-3 lg:px-0 lg:pt-4 border-b lg:border-b-0 border-[var(--border)]">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                id={`cfg-tab-${t.id}`}
                aria-selected={active}
                aria-controls={`cfg-panel-${t.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => { setTab(t.id); setUoEdit(null); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all text-left mb-0.5 shrink-0 lg:w-full lg:mb-0.5 ${
                  active ? 'bg-[var(--surface-hover)] text-[var(--fg)] font-semibold' : 'text-[var(--fg-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
                }`}
              >
                <Icon name={t.icon} size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        <div role="tabpanel" id={`cfg-panel-${tab}`} aria-labelledby={`cfg-tab-${tab}`} className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
          {configLoading ? (
            <Loading />
          ) : configError ? (
            <EmptyState
              icon={<Icon name="alert" size={22} />}
              title="Erro ao carregar configurações"
              desc="Não foi possível carregar as configurações do sistema. Tente novamente."
              action={<Button variant="secondary" size="sm" onClick={() => refetchConfig()}>Tentar novamente</Button>}
            />
          ) : (
            <>
              {tab === 'uos' && (
                <div className="max-w-[620px] flex flex-col gap-6">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[var(--fg)] pb-2 border-b border-[var(--border)]">UOs</h2>
                    <p className="text-[13px] text-[var(--fg-secondary)] mt-3">Gerencie Unidades Organizacionais e suas variáveis.</p>
                  </div>

                  <div className="flex gap-2">
                    <Input placeholder="Nova UO..." value={newUoName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUoName(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') addUo(); }} className="min-h-[36px] text-[13px] flex-1" />
                    <Button variant="primary" size="sm" onClick={() => addUo()} disabled={!newUoName.trim()} className="h-[36px]">Adicionar</Button>
                  </div>
                  {suggestedUos.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[11px] text-[var(--fg-muted)] self-center">UOs das máquinas:</span>
                      {suggestedUos.map(u => (
                        <button key={u} type="button" onClick={() => addUo(u)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border border-[var(--border)] text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--fg-muted)] transition-colors"><Icon name="plus" size={11} />{u}</button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Input aria-label="Buscar UO" placeholder="Buscar UO..." value={uoSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUoSearch(e.target.value)} className="min-h-[32px] text-[12px] flex-1" />
                    <span className="text-[11px] text-[var(--fg-muted)] shrink-0">{filteredUos.length} de {uoConfigs.length}</span>
                  </div>

                  <div className="space-y-2">
                    {uoConfigs.length === 0 ? (
                      <p className="text-center py-8 text-[13px] text-[var(--fg-muted)]">Nenhuma UO cadastrada. Adicione uma UO acima.</p>
                    ) : filteredUos.length === 0 ? (
                      <p className="text-center py-8 text-[13px] text-[var(--fg-muted)]">Nenhuma UO encontrada para "{uoSearch}".</p>
                    ) : (
                      filteredUos.map(uo => {
                        const open = uoEdit === uo.uo;
                        const total = uo.toolingCategories.length + uo.formatTypes.length + uo.productCategories.length + uo.lines.length;
                        return (
                          <div key={uo.uo} className="border border-[var(--border)] rounded-[8px] bg-[var(--surface)]">
                            <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--surface-hover)] transition-colors rounded-[8px]">
                              <button type="button" onClick={() => setUoEdit(open ? null : uo.uo)} aria-expanded={open} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                <span className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[12px] font-semibold text-[var(--fg-secondary)] shrink-0">{uo.uo.charAt(0).toUpperCase()}</span>
                                <span className="flex-1 min-w-0">
                                  <span className="block text-[14px] font-semibold text-[var(--fg)]">{uo.uo}</span>
                                  <span className="block text-[11px] text-[var(--fg-muted)]">{total} variáve{total !== 1 ? 'is' : 'l'} configurada{total !== 1 ? 's' : ''}</span>
                                </span>
                              </button>
                              <div className="flex items-center gap-2 shrink-0">
                                <button type="button" onClick={() => setConfirmRemoveUo(uo.uo)} className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--danger)] transition-colors">Excluir</button>
                                <button type="button" aria-label={open ? `Recolher UO ${uo.uo}` : `Expandir UO ${uo.uo}`} onClick={() => setUoEdit(open ? null : uo.uo)} className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                                  <Icon name="arrow-right" size={14} className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
                                </button>
                              </div>
                            </div>
                            {open && (
                              <div className="px-5 pb-5 space-y-6 border-t border-[var(--border)] pt-5">
                                {FIELDS.map(field => {
                                  const values = (uo[field.key as keyof UoConfigItem] || []) as string[];
                                  return (
                                    <div key={field.key} className="flex flex-col gap-2">
                                      <div>
                                        <span className="text-[13px] font-medium text-[var(--fg)] block">{field.label}</span>
                                        <p className="text-[12px] text-[var(--fg-muted)] mt-1">{field.desc}</p>
                                      </div>
                                      <TagInput
                                        label={`${field.label} de ${uo.uo}`}
                                        values={values}
                                        onAdd={v => setUoValue(field.key, [...values, v])}
                                        onRemove={v => setUoValue(field.key, values.filter(x => x !== v))}
                                        placeholder={field.placeholder}
                                      />
                                    </div>
                                  );
                                })}
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
                      <div className="text-[12px] text-[var(--fg-muted)]">SetFlow v2.0</div>
                    </div>
                    <hr className="border-[var(--border)]" />
                    <div className="flex flex-col gap-3">
                      <div className="text-[13px] font-medium text-[var(--fg)]">Gerenciar dados</div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => navigate('/exportar')}>Exportar dados</Button>
                        <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>Resetar dados</Button>
                      </div>
                    </div>
                  </div>
                  <hr className="border-[var(--border)]" />
                  <div className="flex flex-col gap-3">
                    <div className="text-[13px] font-medium text-[var(--fg)]">Ferramentas de dados</div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setConfirmSeed(true)}>Carregar dados de exemplo</Button>
                      <Button variant="secondary" size="sm" onClick={() => setConfirmMigrate(true)}>Migrar dados legados</Button>
                    </div>
                    <p className="text-[12px] text-[var(--fg-muted)]">O seed cria UOs, linhas, máquinas, produtos, peças, formatos e fluxos de demonstração. A migração vincula os dados legados às UOs criadas.</p>
                    {seedResult && (
                      <div className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-3 text-[12px] text-[var(--fg-secondary)] space-y-1">
                        <div className="font-medium text-[var(--fg)]">Dados de exemplo carregados</div>
                        <div className="font-mono">UOs: {seedResult.units} · Linhas: {seedResult.lines} · Máquinas: {seedResult.machines}</div>
                        <div className="font-mono">Produtos: {seedResult.products} · Peças: {seedResult.pieces} · Formatos: {seedResult.formatos} · Fluxos: {seedResult.flows}</div>
                      </div>
                    )}
                    {migrateResult && (
                      <div className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-3 text-[12px] text-[var(--fg-secondary)] space-y-1">
                        <div className="font-medium text-[var(--fg)]">Migração concluída</div>
                        {migrateResult.unitsCreated.length > 0 && <div className="font-mono">UOs criadas: {migrateResult.unitsCreated.join(', ')}</div>}
                        <div className="font-mono">Máquinas atualizadas: {migrateResult.machinesUpdated} · Formatos: {migrateResult.formatosUpdated} · Fluxos: {migrateResult.flowsUpdated}</div>
                      </div>
                    )}
                  </div>
                  <hr className="border-[var(--border)]" />
                  <div className="flex flex-col gap-3">
                    <div className="text-[13px] font-medium text-[var(--fg)]">Atribuir recursos órfãos</div>
                    <div className="text-[12px] text-[var(--fg-muted)]">
                      {orphanTotal > 0
                        ? `${orphanedProducts} produto${orphanedProducts !== 1 ? 's' : ''} e ${orphanedPieces} peça${orphanedPieces !== 1 ? 's' : ''} ainda não possuem UO e ficam ocultos quando uma UO está selecionada.`
                        : 'Nenhum recurso órfão encontrado.'}
                    </div>
                    <div className="flex flex-col gap-2">
                      <select className="shad-select w-full text-[13px]" value={assignUnitId} onChange={(e) => setAssignUnitId(e.target.value)} aria-label="UO de destino">
                        <option value="">Selecione a UO de destino...</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                      <div className="flex gap-4 text-[12px] text-[var(--fg-secondary)]">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={assignProducts} onChange={(e) => setAssignProducts(e.target.checked)} /> Produtos</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={assignPieces} onChange={(e) => setAssignPieces(e.target.checked)} /> Peças</label>
                      </div>
                      <div>
                        <Button variant="secondary" size="sm" onClick={() => setConfirmAssign(true)} disabled={!assignUnitId || orphanTotal === 0 || (!assignProducts && !assignPieces)}>Atribuir à UO</Button>
                        {assignResult && (
                          <div className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-3 mt-2 text-[12px] text-[var(--fg-secondary)] font-mono">
                            Produtos atribuídos: {assignResult.productsAssigned} · Peças atribuídas: {assignResult.piecesAssigned}
                          </div>
                        )}
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
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-[var(--fg)]">Tema escuro</div>
                      <div className="text-[12px] text-[var(--fg-muted)]">Alternar entre tema claro e escuro</div>
                    </div>
                    <Switch checked={theme === 'dark'} onChange={toggle} label="Tema escuro" />
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
                    {NOTIF_OPTIONS.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-[13px] font-medium text-[var(--fg)]">{item.label}</div>
                          <div className="text-[12px] text-[var(--fg-muted)]">{item.desc}</div>
                        </div>
                        <Switch checked={!!notifPrefs[item.id]} onChange={() => setNotif(item.id, !notifPrefs[item.id])} label={item.label} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {tab === 'uos' && !configLoading && !configError && (
        <div className="sticky bottom-0 bg-[var(--bg)] flex items-center justify-end gap-3 px-4 sm:px-6 lg:px-8 py-4 border-t border-[var(--border)] shrink-0 flex-wrap">
          <span className="text-[12px] text-[var(--fg-muted)] mr-auto">
            {totalCount} itens configurados
            {dirty && <span className="text-[var(--danger)] font-medium ml-2">· alterações não salvas</span>}
          </span>
          <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={!dirty}>Descartar</Button>
          <Button variant="primary" onClick={handleSave} disabled={saveDisabled}><Icon name="check-circle" size={15} />Salvar alterações</Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemoveUo !== null}
        onOpenChange={(o) => { if (!o) setConfirmRemoveUo(null); }}
        title={confirmRemoveUo !== null ? `Remover UO "${confirmRemoveUo}"?` : 'Remover UO?'}
        description="Esta ação não pode ser desfeita."
        onConfirm={() => {
          if (confirmRemoveUo === null) return;
          setUoConfigs(prev => prev.filter(u => u.uo !== confirmRemoveUo));
          if (uoEdit === confirmRemoveUo) setUoEdit(null);
          setDirty(true);
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Resetar todos os dados?"
        description="Confirma a exclusão total dos dados do sistema (máquinas, produtos, peças, fluxos, formatos e configurações)? Esta ação não pode ser desfeita."
        confirmLabel="Resetar"
        onConfirm={handleReset}
      />
      <ConfirmDialog
        open={confirmSeed}
        onOpenChange={setConfirmSeed}
        title="Carregar dados de exemplo?"
        description="Serão criadas UOs, linhas, máquinas, produtos, peças, formatos e fluxos de demonstração. Registros que já existirem não serão duplicados."
        confirmLabel="Carregar"
        onConfirm={handleSeed}
      />
      <ConfirmDialog
        open={confirmMigrate}
        onOpenChange={setConfirmMigrate}
        title="Executar migração de dados legados?"
        description="Serão criadas UOs a partir das UOs legadas e atribuídos unitId às máquinas, formatos e fluxos correspondentes. Produtos e peças não são afetados aqui."
        confirmLabel="Migrar"
        onConfirm={handleMigrate}
      />
      <ConfirmDialog
        open={confirmAssign}
        onOpenChange={setConfirmAssign}
        title="Atribuir recursos órfãos à UO selecionada?"
        description="Produtos e peças sem UO passarão a pertencer à UO escolhida e ficarão visíveis no contexto dela."
        confirmLabel="Atribuir"
        onConfirm={handleAssign}
      />
      <ConfirmDialog
        open={leavingBlocked}
        onOpenChange={(o) => { if (!o) blocker.reset?.(); }}
        title="Descartar alterações?"
        description="Você tem alterações não salvas nas configurações de UOs. Deseja sair sem salvar?"
        confirmLabel="Sair sem salvar"
        onConfirm={() => blocker.proceed?.()}
      />
    </div>
  );
}
