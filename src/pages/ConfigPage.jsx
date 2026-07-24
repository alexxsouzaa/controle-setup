import { useState, useContext, useMemo } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Select } from '../components/Select';

const SECTIONS = [
  { key: 'toolingCategories', label: 'Ferramentais (global)', desc: 'Categorias de peças usadas como ferramentais. Pode ser sobrescrito por UO.', placeholder: 'Ex: Bico de Envase' },
  { key: 'formatTypes', label: 'Tipos de Formato (global)', desc: 'Tipos de formato disponíveis. Pode ser sobrescrito por UO.', placeholder: 'Ex: Frasco cilíndrico' },
  { key: 'productCategories', label: 'Categorias de Produto', desc: 'Categorias para classificar produtos.', placeholder: 'Ex: Shampoo' },
];

const UO_KEYS = [
  { key: 'toolingCategories', label: 'Ferramentais', placeholder: 'Ex: Bico de Envase' },
  { key: 'formatTypes', label: 'Tipos de Formato', placeholder: 'Ex: Frasco cilíndrico' },
];

function ListEditor({ values, onAdd, onRemove, placeholder, inputVal, onInput, itemKey }) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--accent-light)] border border-[var(--accent)] text-xs font-medium">
            {v}
            <button type="button" onClick={() => onRemove(v)} className="text-[var(--fg-secondary)] hover:text-[var(--danger)] ml-0.5">&times;</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder={placeholder} value={inputVal} onChange={e => onInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onAdd(); }} />
        <Button variant="secondary" size="sm" onClick={onAdd} className="shrink-0">Adicionar</Button>
      </div>
    </>
  );
}

export function ConfigPage() {
  const { config, updateConfig, logAction, machines } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);

  const [items, setItems] = useState(() => SECTIONS.map(s => ({ key: s.key, values: [...(config[s.key] || [])] })));
  const [inputs, setInputs] = useState({});
  const [uoInputs, setUoInputs] = useState({});
  const [uoConfigs, setUoConfigs] = useState(() => {
    const saved = config.uoConfigs || {};
    return Object.entries(saved).map(([uo, cfg]) => ({ uo, toolingCategories: [...(cfg.toolingCategories || [])], formatTypes: [...(cfg.formatTypes || [])] }));
  });
  const [newUoName, setNewUoName] = useState('');

  const allUos = useMemo(() => [...new Set(machines.map(m => m.uo).filter(Boolean))].sort(), [machines]);

  const getGlobal = (key) => items.find(i => i.key === key)?.values || [];
  const setGlobal = (key, values) => setItems(prev => prev.map(i => i.key === key ? { ...i, values } : i));

  const addGlobal = (key) => {
    const val = (inputs[key] || '').trim();
    if (!val) return;
    const current = getGlobal(key);
    if (current.includes(val)) { toast(`"${val}" já existe.`, 'warning'); return; }
    setGlobal(key, [...current, val]);
    setInputs(prev => ({ ...prev, [key]: '' }));
  };

  const removeGlobal = (key, val) => setGlobal(key, getGlobal(key).filter(v => v !== val));

  const getUoConfig = (uo) => uoConfigs.find(u => u.uo === uo);
  const getUoValues = (uo, key) => getUoConfig(uo)?.[key] || [];
  const setUoValues = (uo, key, values) => setUoConfigs(prev => prev.map(u => u.uo === uo ? { ...u, [key]: values } : u));

  const addUoItem = (uo, key) => {
    const val = (uoInputs[`${uo}_${key}`] || '').trim();
    if (!val) return;
    const current = getUoValues(uo, key);
    if (current.includes(val)) { toast(`"${val}" já existe.`, 'warning'); return; }
    setUoValues(uo, key, [...current, val]);
    setUoInputs(prev => ({ ...prev, [`${uo}_${key}`]: '' }));
  };

  const removeUoItem = (uo, key, val) => setUoValues(uo, key, getUoValues(uo, key).filter(v => v !== val));

  const addUoConfig = () => {
    const name = newUoName.trim();
    if (!name) return;
    if (uoConfigs.some(u => u.uo === name)) { toast(`UO "${name}" já configurada.`, 'warning'); return; }
    setUoConfigs(prev => [...prev, { uo: name, toolingCategories: [], formatTypes: [] }]);
    setNewUoName('');
  };

  const removeUoConfig = (uo) => setUoConfigs(prev => prev.filter(u => u.uo !== uo));

  const handleSave = () => {
    const updated = {};
    items.forEach(i => { updated[i.key] = i.values; });
    const uoCfg = {};
    uoConfigs.forEach(u => {
      if (u.toolingCategories.length > 0 || u.formatTypes.length > 0) {
        uoCfg[u.uo] = {};
        if (u.toolingCategories.length > 0) uoCfg[u.uo].toolingCategories = u.toolingCategories;
        if (u.formatTypes.length > 0) uoCfg[u.uo].formatTypes = u.formatTypes;
      }
    });
    updated.uoConfigs = uoCfg;
    updateConfig(updated);
    logAction('update', 'Configuração', 'Configurações atualizadas');
    toast('Configurações salvas com sucesso!');
  };

  const hasChanges = true;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Opções</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">Gerencie as listas de constantes do sistema. É possível definir valores globais ou específicos por UO.</p>
        </div>
        <Button variant="primary" onClick={handleSave}>
          <Icon name="check-circle" size={16} />Salvar alterações
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="settings" size={16} /></div>
            <div>
              <h3 className="text-sm font-semibold">Padrão Global</h3>
              <p className="text-xs text-[var(--fg-secondary)]">Valores usados quando não houver configuração específica por UO.</p>
            </div>
          </div>
          {SECTIONS.map(s => (
            <div key={s.key} className="mb-4 last:mb-0">
              <label className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-2 block">{s.label}</label>
              <p className="text-[11px] text-[var(--fg-muted)] mb-2">{s.desc}</p>
              <ListEditor
                values={getGlobal(s.key)} onAdd={() => addGlobal(s.key)} onRemove={(v) => removeGlobal(s.key, v)}
                placeholder={s.placeholder} inputVal={inputs[s.key] || ''} onInput={(v) => setInputs(prev => ({ ...prev, [s.key]: v }))} itemKey={s.key}
              />
            </div>
          ))}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="grid-3x3" size={16} /></div>
            <div>
              <h3 className="text-sm font-semibold">Configurações por UO</h3>
              <p className="text-xs text-[var(--fg-secondary)]">Crie configurações personalizadas de ferramentais e formatos para cada UO.</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Select value={newUoName} onChange={e => setNewUoName(e.target.value)}>
              <option value="">Selecione uma UO ou digite...</option>
              {allUos.filter(u => !uoConfigs.some(c => c.uo === u)).map(u => <option key={u}>{u}</option>)}
            </Select>
            <Button variant="secondary" size="sm" onClick={addUoConfig} disabled={!newUoName.trim()} className="shrink-0">Adicionar UO</Button>
          </div>

          {uoConfigs.length === 0 && (
            <p className="text-sm text-[var(--fg-muted)] text-center py-4">Nenhuma configuração por UO. Adicione uma UO para personalizar.</p>
          )}

          {uoConfigs.map(uo => (
            <div key={uo.uo} className="mb-4 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">{uo.uo}</span>
                <button type="button" onClick={() => removeUoConfig(uo.uo)} className="text-xs text-[var(--danger)] hover:underline">Remover</button>
              </div>
              {UO_KEYS.map(k => (
                <div key={k.key} className="mb-3 last:mb-0">
                  <label className="text-xs font-medium text-[var(--fg-secondary)] mb-1 block">{k.label}</label>
                  <ListEditor
                    values={uo[k.key]} onAdd={() => addUoItem(uo.uo, k.key)}
                    onRemove={(v) => removeUoItem(uo.uo, k.key, v)}
                    placeholder={k.placeholder}
                    inputVal={uoInputs[`${uo.uo}_${k.key}`] || ''}
                    onInput={(v) => setUoInputs(prev => ({ ...prev, [`${uo.uo}_${k.key}`]: v }))}
                    itemKey={`${uo.uo}_${k.key}`}
                  />
                </div>
              ))}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
