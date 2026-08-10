import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { useUnits, useAddUnit, useUpdateUnit, useLogAction } from '../../../queries';
import { useAppStore } from '../../../stores/appStore';
import { unitSchema, type UnitFormData } from '../schemas/unit.schema';
import { Unit } from '../../../types';

const EMPTY: UnitFormData = { code: '', name: '', status: 'active', description: '' };

export function NewUnitPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { data: units = [] } = useUnits();
  const { mutate: addUnit } = useAddUnit();
  const { mutate: updateUnit } = useUpdateUnit();
  const { mutate: logAction } = useLogAction();
  const currentUser = useAppStore(s => s.currentUser);
  const { toast } = useToast();

  const [form, setForm] = useState<UnitFormData>(EMPTY);
  const [saved, setSaved] = useState<boolean>(false);
  const [confirmDiscard, setConfirmDiscard] = useState<boolean>(false);

  const isEdit = !!editId;

  useEffect(() => {
    if (isEdit) {
      const u = units.find((un: Unit) => un.id === editId);
      if (u) setForm({ code: u.code, name: u.name, status: u.status, description: u.description ?? '' });
    }
  }, [editId, isEdit, units]);

  const handleSave = () => {
    const parsed = unitSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Preencha os campos obrigatórios.';
      toast(msg, 'warning');
      return;
    }
    const exists = units.some((u: Unit) => u.code.toLowerCase() === form.code.toLowerCase() && u.id !== editId);
    if (exists) { toast('Já existe uma UO com este código.', 'warning'); return; }
    const createdAt = new Date().toISOString().slice(0, 10);
    if (isEdit && editId) {
      updateUnit({ id: editId, updates: { ...form, description: form.description || undefined } });
      logAction({ type: 'update', entity: 'UO', detail: `${form.name} (${form.code}) atualizada` });
      toast('UO atualizada com sucesso!');
    } else {
      addUnit({ ...form, description: form.description || undefined, createdAt, createdBy: currentUser });
      logAction({ type: 'create', entity: 'UO', detail: `${form.name} (${form.code}) cadastrada` });
      toast('UO cadastrada com sucesso!');
    }
    setSaved(true);
  };

  const handleBack = () => {
    if (form.code || form.name || form.description) setConfirmDiscard(true);
    else navigate('/unidades');
  };

  const input = (key: keyof UnitFormData, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="p-6 pb-16">
      {saved ? (
        <Card>
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
              <Icon name="check-circle" size={28} />
            </div>
            <h3 className="text-lg font-semibold mb-1">{isEdit ? 'UO atualizada!' : 'UO criada!'}</h3>
            <p className="text-[14px] font-medium text-[var(--accent-fg)] mt-1 mb-1">{form.name}</p>
            <p className="text-[12px] text-[var(--fg-secondary)] mb-6">A unidade organizacional está disponível.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" size="sm" onClick={() => navigate('/unidades')}><Icon name="box" size={14} />Ver UOs</Button>
              <Button variant="secondary" size="sm" onClick={() => { setSaved(false); setForm(EMPTY); }}><Icon name="plus" size={14} />Criar nova UO</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          <button type="button" onClick={handleBack} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">← Voltar para UOs</button>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="grid-3x3" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">{isEdit ? 'Editar UO' : 'Nova UO'}</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Informações da unidade organizacional.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Código *</label>
                <Input placeholder="Ex: ENV" value={form.code} onChange={(e) => input('code', e.target.value)} />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Nome *</label>
                <Input placeholder="Ex: Envase" value={form.name} onChange={(e) => input('name', e.target.value)} />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Status</label>
                <select className="shad-select w-full py-2 text-[12px]" value={form.status} onChange={(e) => input('status', e.target.value as UnitFormData['status'])}>
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Descrição</label>
                <Input placeholder="Opcional" value={form.description ?? ''} onChange={(e) => input('description', e.target.value)} />
              </div>
            </div>
          </Card>
          <div className="flex items-center justify-end gap-3 pb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/unidades')}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!form.code || !form.name}>{isEdit ? 'Salvar' : 'Criar UO'}</Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Descartar alterações?"
        description="Os dados informados serão perdidos."
        confirmLabel="Descartar"
        onConfirm={() => navigate('/unidades')}
      />
    </div>
  );
}
