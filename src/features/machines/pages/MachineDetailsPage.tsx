// @ts-nocheck
import { useParams, useNavigate } from 'react-router-dom';
import { useMachines, useDeleteMachine, useLogAction } from '../../../queries';
import { useToast } from '../../../contexts/ToastContext';
import { useAppStore } from '../../../stores/appStore';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { Icon } from '../../../components/Icon';
import { ImagePreview } from '../../../components/ImagePreview';
import { useState } from 'react';

const getLines = (m: { lines?: string[]; line?: string }) => m.lines || (m.line ? [m.line] : []);

export function MachineDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: machines = [] } = useMachines();
  const { mutate: deleteMachine } = useDeleteMachine();
  const { mutate: logAction } = useLogAction();
  const { toast } = useToast();
  const currentUser = useAppStore(s => s.currentUser);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const machine = machines.find((m: any) => m.id === id);

  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--danger-muted)] flex items-center justify-center mb-4">
          <Icon name="alert" size={24} />
        </div>
        <p className="text-sm text-[var(--fg-secondary)] mb-4">Máquina não encontrada.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/maquinas')}>Voltar para lista</Button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`Excluir ${machine.name}?`)) {
      deleteMachine(machine.id);
      logAction({ type: 'delete', entity: 'Máquina', detail: `${machine.name} excluída` });
      toast('Máquina excluída com sucesso!');
      navigate('/maquinas');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/maquinas')}
        className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Voltar para máquinas
      </button>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--border)]">
          {machine.image ? (
            <button type="button" onClick={() => setPreviewImage(machine.image)} className="shrink-0 cursor-pointer">
              <img src={machine.image} alt={machine.name} className="w-12 h-12 rounded-[6px] object-cover border border-[var(--border)]" />
            </button>
          ) : (
            <div className="w-12 h-12 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
              <Icon name="box" size={22} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[16px] font-semibold text-[var(--fg)]">{machine.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{machine.uo}</span>
              <span className="text-[11px] text-[var(--fg-muted)]">Criado por {machine.createdBy || '-'}</span>
            </div>
          </div>
        </div>

        {/* Image preview */}
        {machine.image && (
          <div className="flex justify-center px-6 py-4 border-b border-[var(--border-subtle)]">
            <button type="button" onClick={() => setPreviewImage(machine.image)} className="cursor-pointer">
              <img src={machine.image} alt={machine.name} className="w-40 h-40 rounded-[8px] object-cover border border-[var(--border)]" />
            </button>
          </div>
        )}

        {/* Details */}
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">UO</div>
              <div className="text-[13px] font-medium text-[var(--fg)] mt-0.5">{machine.uo || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Criado por</div>
              <div className="text-[13px] text-[var(--fg)] mt-0.5">{machine.createdBy || '—'}</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mb-2">Linhas</div>
            <div className="flex flex-wrap gap-1.5">
              {getLines(machine).map((l: string) => <Badge key={l}>{l}</Badge>)}
              {getLines(machine).length === 0 && <span className="text-[12px] text-[var(--fg-muted)]">—</span>}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mb-2">Ferramentais</div>
            <div className="flex flex-wrap gap-1.5">
              {(machine.toolingCategories || []).map((c: string) => <Badge key={c}>{c}</Badge>)}
              {(!machine.toolingCategories || machine.toolingCategories.length === 0) && <span className="text-[12px] text-[var(--fg-muted)]">Nenhum</span>}
            </div>
          </div>

          {machine.notes && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mb-1">Observações</div>
              <p className="text-[13px] text-[var(--fg)]">{machine.notes}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/maquinas')}>
              <Icon name="arrow-right" size={14} />Voltar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/maquinas')}>
              <Icon name="edit" size={14} />Editar
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-[4px] border border-[var(--danger)] text-[11px] font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors">
              Excluir
            </button>
          </div>
        </div>
      </div>

      {previewImage && <ImagePreview src={previewImage} alt="Foto da máquina" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
