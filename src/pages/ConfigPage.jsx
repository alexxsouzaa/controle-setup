import { useState, useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { ToastContext } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';

const SECTIONS = [
  { key: 'toolingCategories', label: 'Ferramentais', desc: 'Categorias de peças usadas como ferramentais das máquinas.', placeholder: 'Ex: Bico de Envase' },
  { key: 'formatTypes', label: 'Tipos de Formato', desc: 'Tipos de formato disponíveis para produtos.', placeholder: 'Ex: Frasco cilíndrico' },
  { key: 'productCategories', label: 'Categorias de Produto', desc: 'Categorias disponíveis para classificar produtos.', placeholder: 'Ex: Shampoo' },
];

export function ConfigPage() {
  const { config, updateConfig, logAction } = useContext(AppDataContext);
  const { toast } = useContext(ToastContext);
  const [items, setItems] = useState(() => SECTIONS.map(s => ({ key: s.key, values: [...(config[s.key] || [])] })));
  const [inputs, setInputs] = useState({});

  const getValues = (key) => items.find(i => i.key === key)?.values || [];
  const setValues = (key, values) => setItems(prev => prev.map(i => i.key === key ? { ...i, values } : i));

  const addItem = (key) => {
    const val = (inputs[key] || '').trim();
    if (!val) return;
    const current = getValues(key);
    if (current.includes(val)) { toast(`"${val}" já existe.`, 'warning'); return; }
    setValues(key, [...current, val]);
    setInputs(prev => ({ ...prev, [key]: '' }));
  };

  const removeItem = (key, val) => {
    setValues(key, getValues(key).filter(v => v !== val));
  };

  const handleSave = () => {
    const updated = {};
    items.forEach(i => { updated[i.key] = i.values; });
    updateConfig(updated);
    logAction('update', 'Configuração', 'Listas de constantes atualizadas');
    toast('Configurações salvas com sucesso!');
  };

  const hasChanges = items.some(i => {
    const orig = config[i.key] || [];
    if (orig.length !== i.values.length) return true;
    return orig.some((v, idx) => v !== i.values[idx]);
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Opções</h2>
          <p className="text-sm text-[var(--fg-secondary)] mt-0.5">Gerencie as listas de constantes utilizadas no sistema.</p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={!hasChanges}>
          <Icon name="check-circle" size={16} />Salvar alterações
        </Button>
      </div>

      <div className="space-y-6">
        {SECTIONS.map(s => (
          <Card key={s.key}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="settings" size={16} /></div>
              <div>
                <h3 className="text-sm font-semibold">{s.label}</h3>
                <p className="text-xs text-[var(--fg-secondary)]">{s.desc}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {getValues(s.key).map(v => (
                <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--accent-light)] border border-[var(--accent)] text-xs font-medium">
                  {v}
                  <button type="button" onClick={() => removeItem(s.key, v)} className="text-[var(--fg-secondary)] hover:text-[var(--danger)] ml-0.5">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder={s.placeholder} value={inputs[s.key] || ''} onChange={e => setInputs(prev => ({ ...prev, [s.key]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addItem(s.key); }} />
              <Button variant="secondary" size="sm" onClick={() => addItem(s.key)} className="shrink-0">Adicionar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
