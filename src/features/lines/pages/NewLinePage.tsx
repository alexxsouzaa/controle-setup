import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { RecordMeta } from '../../../components/shared/RecordMeta';
import { useLines, useUnits, useMachines, useAddLine, useUpdateLine, useLogAction } from '../../../queries';
import { useAppStore } from '../../../stores/appStore';
import { useUoStore } from '../../../stores/uoStore';
import { lineSchema, type LineFormData } from '../schemas/line.schema';
import { Line } from '../../../types';

const EMPTY: LineFormData = { name: '', unitId: '', machineIds: [], status: 'active', notes: '' };

export function NewLinePage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { data: lines = [] } = useLines();
  const { data: units = [] } = useUnits();
  const { data: machines = [] } = useMachines();
  const { mutate: addLine } = useAddLine();
  const { mutate: updateLine } = useUpdateLine();
  const { mutate: logAction } = useLogAction();
  const currentUser = useAppStore(s => s.currentUser);
  const activeUnitId = useUoStore(s => s.activeUnitId);
  const { toast } = useToast();

  const [form, setForm] = useState<LineFormData>(EMPTY);
  const [saved, setSaved] = useState<boolean>(false);
  const [confirmDiscard, setConfirmDiscard] = useState<boolean>(false);

  const isEdit = !!editId;

  useEffect(() => {
    if (isEdit) {
      const l = lines.find((ln: Line) => ln.id === editId);
      if (l) setForm({ name: l.name, unitId: l.unitId, machineIds: l.machineIds ?? [], status: l.status, notes: l.notes ?? '' });
    } else if (!form.unitId && activeUnitId) {
      setForm(prev => ({ ...prev, unitId: activeUnitId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, isEdit, lines]);

  const availableMachines = useMemo(() => {
    if (!form.unitId) return [];
    return machines.filter((m) => m.unitId === form.unitId || m.scope === 'global' || !m.unitId);
  }, [machines, form.unitId]);

  const toggleMachine = (id: string) => setForm(prev => ({
    ...prev,
    machineIds: prev.machineIds.includes(id) ? prev.machineIds.filter((x) => x !== id) : [...prev.machineIds, id],
  }));

  const handleSave = () => {
    const parsed = lineSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Preencha os campos obrigatórios.';
      toast(msg, 'warning');
      return;
    }
    const exists = lines.some((l: Line) => l.name.toLowerCase() === form.name.trim().toLowerCase() && l.unitId === form.unitId && l.id !== editId);
    if (exists) { toast('Já existe uma linha com este nome nesta UO.', 'warning'); return; }
    const createdAt = new Date().toISOString().slice(0, 10);
    const payload = { ...form, notes: form.notes || undefined };
    if (isEdit && editId) {
      updateLine({ id: editId, updates: payload });
      logAction({ type: 'update', entity: 'Linha', detail: `${form.name} atualizada` });
      toast('Linha atualizada com sucesso!');
    } else {
      addLine({ ...payload, createdAt, createdBy: currentUser });
      logAction({ type: 'create', entity: 'Linha', detail: `${form.name} cadastrada` });
      toast('Linha cadastrada com sucesso!');
    }
    setSaved(true);
  };

  const handleBack = () => {
    if (form.name || form.notes) setConfirmDiscard(true);
    else navigate('/linhas');
  };

  return (
    <div className="p-6 pb-16">
      {saved ? (
        <Card>
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-[var(--success-muted)] flex items-center justify-center mx-auto mb-4">
              <Icon name="check-circle" size={28} />
            </div>
            <h3 className="text-lg font-semibold mb-1">{isEdit ? 'Linha atualizada!' : 'Linha criada!'}</h3>
            <p className="text-[14px] font-medium text-[var(--accent-fg)] mt-1 mb-1">{form.name}</p>
            <p className="text-[12px] text-[var(--fg-secondary)] mb-6">A linha de produção está disponível.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" size="sm" onClick={() => navigate('/linhas')}><Icon name="box" size={14} />Ver linhas</Button>
              <Button variant="secondary" size="sm" onClick={() => { setSaved(false); setForm(EMPTY); }}><Icon name="plus" size={14} />Criar nova linha</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          <button type="button" onClick={handleBack} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">← Voltar para linhas</button>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="box" size={15} /></div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)]">{isEdit ? 'Editar Linha' : 'Nova Linha'}</h3>
                <p className="text-[11px] text-[var(--fg-secondary)]">Informações básicas da linha.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Nome *</label>
                <Input placeholder="Ex: Linha 01" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">UO *</label>
                <select className="shad-select w-full py-2 text-[12px]" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
                  <option value="">Selecione</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Status</label>
                <select className="shad-select w-full py-2 text-[12px]" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LineFormData['status'] })}>
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Máquinas associadas</label>
                {availableMachines.length === 0 ? (
                  <p className="text-[12px] text-[var(--fg-muted)]">Selecione uma UO para listar as máquinas disponíveis.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableMachines.map((m) => (
                      <button key={m.id} type="button" onClick={() => toggleMachine(m.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-[12px] transition-colors ${form.machineIds.includes(m.id) ? 'border-[var(--fg)] bg-[var(--accent-muted)] text-[var(--fg)]' : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-secondary)] hover:border-[var(--fg-muted)]'}`}>
                        <span className={`w-2 h-2 rounded-full ${form.machineIds.includes(m.id) ? 'bg-[var(--fg)]' : 'bg-[var(--fg-muted)]'}`} />
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Observações</label>
                <Input placeholder="Opcional" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          </Card>
          <RecordMeta
            createdBy={isEdit ? lines.find((l: Line) => l.id === editId)?.createdBy : currentUser}
            createdAt={isEdit ? lines.find((l: Line) => l.id === editId)?.createdAt : new Date().toISOString().slice(0, 10)}
          />
          <div className="flex items-center justify-end gap-3 pb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/linhas')}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!form.name || !form.unitId}>{isEdit ? 'Salvar' : 'Criar Linha'}</Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Descartar alterações?"
        description="Os dados informados serão perdidos."
        confirmLabel="Descartar"
        onConfirm={() => navigate('/linhas')}
      />
    </div>
  );
}
