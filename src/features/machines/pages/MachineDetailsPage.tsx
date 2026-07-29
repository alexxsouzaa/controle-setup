// @ts-nocheck
import { useParams, useNavigate } from 'react-router-dom';
import { useMachines, useDeleteMachine, useLogAction } from '../../../queries';
import { useFlows } from '../../../queries/useFlows';
import { useFormatos } from '../../../queries/useFormatos';
import { useToast } from '../../../contexts/ToastContext';
import { useAppStore } from '../../../stores/appStore';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { Icon } from '../../../components/Icon';
import { ImagePreview } from '../../../components/ImagePreview';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { TriangleAlertIcon } from 'lucide-react';
import { Separator } from '../../../components/ui/separator';
import { useMemo, useState } from 'react';

const getLines = (m) => m.lines || (m.line ? [m.line] : []);

export function MachineDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: machines = [] } = useMachines();
  const { data: flows = [] } = useFlows();
  const { data: formatos = [] } = useFormatos();
  const { mutate: deleteMachine } = useDeleteMachine();
  const { mutate: logAction } = useLogAction();
  const { toast } = useToast();
  const currentUser = useAppStore(s => s.currentUser);
  const [previewImage, setPreviewImage] = useState(null);

  const machine = machines.find((m) => m.id === id);

  const relatedFlows = useMemo(() =>
    flows.filter((f) => f.machineId === id || f.machine === machine?.name).slice(0, 8),
    [flows, id, machine]
  );

  const relatedFormatos = useMemo(() =>
    formatos.filter((f) => f.machineId === id).slice(0, 6),
    [formatos, id]
  );

  const flowCount = useMemo(() =>
    flows.filter((f) => f.machineId === id || f.machine === machine?.name).length,
    [flows, id, machine]
  );

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
    deleteMachine(machine.id);
    logAction({ type: 'delete', entity: 'Máquina', detail: `${machine.name} excluída` });
    toast('Máquina excluída com sucesso!');
    navigate('/maquinas');
  };

  return (
    <div className="mt-8 px-6 pb-16 space-y-6">
      {/* Back */}
      <button type="button" onClick={() => navigate('/maquinas')}
        className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Voltar para máquinas
      </button>

      {/* Header */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-6">
        <div className="flex items-start gap-4">
          {machine.image ? (
            <button type="button" onClick={() => setPreviewImage(machine.image)} className="shrink-0 cursor-pointer">
              <img src={machine.image} alt={machine.name} className="w-16 h-16 rounded-[8px] object-cover border border-[var(--border)]" />
            </button>
          ) : (
            <div className="w-16 h-16 rounded-[8px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
              <Icon name="box" size={28} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[18px] font-semibold text-[var(--fg)]">{machine.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{machine.uo}</span>
                  <span className="text-[11px] text-[var(--fg-muted)]">Criado por {machine.createdBy || '-'}</span>
                  <span className="text-[11px] text-[var(--fg-muted)]">·</span>
                  <span className="text-[11px] text-[var(--fg-muted)]">{machine.createdAt}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mr-0.5">Linhas</span>
                  {getLines(machine).map((l) => <Badge key={l}>{l}</Badge>)}
                  {getLines(machine).length === 0 && <span className="text-[12px] text-[var(--fg-muted)]">—</span>}
                </div>
                {machine.notes && <div className="mt-2"><span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Observações</span><p className="text-[12px] text-[var(--fg-secondary)] mt-0.5">{machine.notes}</p></div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="primary" size="sm" onClick={() => navigate('/maquinas/' + id + '/edit')}>
                  <Icon name="edit" size={14} />Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger render={
                    <button type="button"
                      className="px-3 py-1.5 rounded-[4px] border border-[var(--danger)] text-[11px] font-medium text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors">Excluir</button>
                  } />
                  <AlertDialogContent>
                    <AlertDialogHeader className="place-items-center! items-center">
                      <div className="bg-destructive/10 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                        <TriangleAlertIcon className="text-destructive size-6" />
                      </div>
                      <AlertDialogTitle>Excluir {machine.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-center">
                        Esta ação não pode ser desfeita. Todos os dados da máquina serão permanentemente removidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ferramentais */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-5">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] flex items-center gap-2 mb-3">
            <Icon name="settings" size={16} />Ferramentais
          </h2>
          <div className="space-y-0">
            {(machine.toolingCategories || []).map((c, i) => (
              <div key={c}>
                {i > 0 && <Separator className="my-2" />}
                <dl className="flex items-center justify-between">
                  <dt className="text-[13px] text-[var(--fg)]">{c}</dt>
                  <dd className="text-[12px] text-[var(--fg-muted)]">Ferramental</dd>
                </dl>
              </div>
            ))}
            {(!machine.toolingCategories || machine.toolingCategories.length === 0) && <span className="text-[12px] text-[var(--fg-muted)]">Nenhum ferramental configurado.</span>}
          </div>
        </div>

        {/* Related Flows */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-[var(--fg)] flex items-center gap-2">
              <Icon name="file" size={16} />Fluxos Recentes
            </h2>
            {flowCount > 8 && (
              <button type="button" onClick={() => navigate('/fluxos')}
                className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Ver todos</button>
            )}
          </div>
          {relatedFlows.length > 0 ? (
            <div className="space-y-2">
              {relatedFlows.map((f) => (
                <button key={f.id} type="button" onClick={() => navigate('/fluxos')}
                  className="w-full text-left p-3 rounded-[6px] hover:bg-[var(--surface-hover)] transition-colors border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-[var(--fg)] truncate">{f.name || f.product}</div>
                      <div className="text-[10px] text-[var(--fg-muted)] mt-0.5">
                        {f.ver} · {f.date}
                        <span className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          f.status === 'Concluído' ? 'bg-[var(--success-muted)] text-[var(--success)]' :
                          f.status === 'Em andamento' ? 'bg-[var(--warning-muted)] text-[var(--warning)]' :
                          'bg-[var(--danger-muted)] text-[var(--danger)]'
                        }`}>{f.status}</span>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--fg-muted)] shrink-0"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-muted)] flex items-center justify-center mb-2">
                <Icon name="file" size={16} />
              </div>
              <p className="text-[12px] text-[var(--fg-muted)]">Nenhum fluxo registrado</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/novo-fluxo')}>
                <Icon name="plus" size={12} />Criar fluxo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Compatible Formats */}
      {relatedFormatos.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-[var(--fg)] flex items-center gap-2">
              <Icon name="grid-3x3" size={16} />Formatos Vinculados
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedFormatos.map((f) => (
              <div key={f.id} className="p-3 rounded-[6px] border border-[var(--border-subtle)]">
                <div className="text-[12px] font-medium text-[var(--fg)]">{f.name || 'Sem nome'}</div>
                <div className="text-[10px] text-[var(--fg-muted)] mt-0.5">
                  {f.formatType || f.tipo} · {f.volume ? `${f.volume} ${f.volumeUnit || 'ml'}` : '—'}
                </div>
                {f.pieces && <div className="text-[10px] text-[var(--fg-muted)] mt-0.5">{f.pieces.length} peça{f.pieces.length !== 1 ? 's' : ''}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {previewImage && <ImagePreview src={previewImage} alt="Foto da máquina" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
