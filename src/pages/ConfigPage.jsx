import { useState, useContext, useMemo } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';

const UO_KEYS = [
  { key: 'toolingCategories', label: 'Ferramentais', placeholder: 'Ex: Bico de Envase' },
  { key: 'formatTypes', label: 'Tipos de Formato', placeholder: 'Ex: Frasco cilíndrico' },
];

function TagList({ values, onRemove, onAdd, placeholder, inputVal, onInput }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 min-h-[28px] mb-2">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] text-[11px] font-medium text-[var(--fg)]">
            {v}
            <button type="button" onClick={() => onRemove(v)} className="text-[var(--fg-muted)] hover:text-[var(--danger)] ml-0.5 leading-none">&times;</button>
          </span>
        ))}
        {values.length === 0 && <span className="text-[11px] text-[var(--fg-muted)] leading-[26px]">Nenhum — usa o padrão do sistema.</span>}
      </div>
      <div className="flex gap-1.5">
        <div className="flex-1">
          <Input placeholder={placeholder} value={inputVal} onChange={e => onInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onAdd(); }} />
        </div>
        <Button variant="secondary" size="sm" onClick={onAdd}>Adicionar</Button>
      </div>
    </div>
  );
}

export function ConfigPage() {
  const { config, updateConfig, logAction, machines } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);

  const [uoInputs, setUoInputs] = useState({});
  const [uoConfigs, setUoConfigs] = useState(() => {
    const saved = config.uoConfigs || {};
    return Object.entries(saved).map(([uo, cfg]) => ({ uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])] }));
  });
  const [newUoName, setNewUoName] = useState('');

  const allUos = useMemo(() => [...new Set(machines.map(m => m.uo).filter(Boolean))].sort(), [machines]);

  const getUoValues = (uo, key) => uoConfigs.find(u => u.uo === uo)?.[key] || [];
  const setUoValues = (uo, key, values) => setUoConfigs(prev => prev.map(u => u.uo === uo ? { ...u, [key]: values } : u));

  const addItem = (uo, key) => {
    const val = (uoInputs[`${uo}_${key}`] || '').trim();
    if (!val) return;
    const current = getUoValues(uo, key);
    if (current.includes(val)) { toast(`"${val}" já existe nesta UO.`, 'warning'); return; }
    setUoValues(uo, key, [...current, val]);
    setUoInputs(prev => ({ ...prev, [`${uo}_${key}`]: '' }));
  };

  const removeItem = (uo, key, val) => setUoValues(uo, key, getUoValues(uo, key).filter(v => v !== val));

  const addUo = () => {
    const name = newUoName.trim();
    if (!name) return;
    if (uoConfigs.some(u => u.uo === name)) { toast(`UO "${name}" já configurada.`, 'warning'); return; }
    setUoConfigs(prev => [...prev, { uo: name, toolingCategories: [], formatTypes: [] }]);
    setNewUoName('');
  };

  const removeUo = (uo) => setUoConfigs(prev => prev.filter(u => u.uo !== uo));

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
    <div className="p-6 max-w-3xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-[var(--fg)]">Opções</h1>
        <p className="text-[13px] text-[var(--fg-secondary)] mt-1">Configure ferramentais e tipos de formato específicos para cada Unidade Organizacional.</p>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <Select value={newUoName} onChange={e => setNewUoName(e.target.value)}>
            <option value="">Adicionar UO...</option>
            {allUos.filter(u => !uoConfigs.some(c => c.uo === u)).map(u => <option key={u}>{u}</option>)}
          </Select>
        </div>
        <Button variant="primary" size="sm" onClick={addUo} disabled={!newUoName.trim()}>Adicionar</Button>
      </div>

      {uoConfigs.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-[8px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4"><Icon name="settings" size={22} /></div>
            <p className="text-[15px] font-medium text-[var(--fg)] mb-1">Nenhuma UO configurada</p>
            <p className="text-[13px] text-[var(--fg-secondary)] max-w-sm mx-auto">Adicione uma Unidade Organizacional acima para personalizar os ferramentais e tipos de formato. Quando não configurado, o sistema usa os valores padrão.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {uoConfigs.map(uo => (
            <Card key={uo.uo}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[12px] font-semibold text-[var(--fg-secondary)] font-mono">
                    {uo.uo.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--fg)]">{uo.uo}</div>
                    <div className="text-[11px] text-[var(--fg-muted)]">
                      {uo.toolingCategories.length} ferramentais · {uo.formatTypes.length} formatos
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => removeUo(uo.uo)} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--danger)] transition-colors">Remover</button>
              </div>
              <div className="space-y-5">
                {UO_KEYS.map(k => (
                  <div key={k.key}>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-secondary)] mb-2 block">{k.label}</label>
                    <TagList
                      values={uo[k.key]} onRemove={(v) => removeItem(uo.uo, k.key, v)}
                      onAdd={() => addItem(uo.uo, k.key)} placeholder={k.placeholder}
                      inputVal={uoInputs[`${uo.uo}_${k.key}`] || ''}
                      onInput={(v) => setUoInputs(prev => ({ ...prev, [`${uo.uo}_${k.key}`]: v }))}
                    />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 ml-60 bg-[var(--bg)] border-t border-[var(--border)] px-6 py-3 flex items-center justify-end gap-3 z-10">
        <span className="text-[12px] text-[var(--fg-muted)] mr-auto">
          {uoConfigs.reduce((acc, uo) => acc + uo.toolingCategories.length + uo.formatTypes.length, 0)} itens configurados
        </span>
        <Button variant="ghost" size="sm" onClick={() => {
          setUoConfigs(Object.entries(config.uoConfigs || {}).map(([uo, cfg]) => ({ uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])] })));
          toast('Alterações descartadas.');
        }}>Descartar</Button>
        <Button variant="primary" onClick={handleSave}>
          <Icon name="check-circle" size={15} />Salvar alterações
        </Button>
      </div>
    </div>
  );
}
