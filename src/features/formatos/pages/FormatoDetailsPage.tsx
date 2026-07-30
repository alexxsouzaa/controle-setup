// @ts-nocheck
import { useParams, useNavigate } from 'react-router-dom';
import { useFormatos, useDeleteFormato, useLogAction } from '../../../queries';
import { useFlows } from '../../../queries/useFlows';
import { useMachines } from '../../../queries';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import { Icon } from '../../../components/Icon';
import { ImagePreview } from '../../../components/ImagePreview';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { TriangleAlertIcon } from 'lucide-react';
import { Separator } from '../../../components/ui/separator';
import { useMemo, useState } from 'react';

export function FormatoDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: formatos = [] } = useFormatos();
  const { data: flows = [] } = useFlows();
  const { data: machines = [] } = useMachines();
  const { mutate: deleteFormato } = useDeleteFormato();
  const { mutate: logAction } = useLogAction();
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const formato = formatos.find((f: { id: string }) => f.id === id);
  const machine = machines.find((m: { id: string }) => m.id === formato?.machineId);

  const relatedFlows = useMemo(() =>
    flows.filter((f: { formatId?: string; machineId?: string }) => f.formatId === id || f.machineId === formato?.machineId).slice(0, 8),
    [flows, id, formato]
  );

  const flowCount = useMemo(() =>
    flows.filter((f: { formatId?: string; machineId?: string }) => f.formatId === id || f.machineId === formato?.machineId).length,
    [flows, id, formato]
  );

  if (!formato) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--danger-muted)] flex items-center justify-center mb-4">
          <Icon name="alert" size={24} />
        </div>
        <p className="text-sm text-[var(--fg-secondary)] mb-4">Formato não encontrado.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/formatos')}>Voltar para lista</Button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteFormato(formato.id);
    logAction({ type: 'delete', entity: 'Formato', detail: `${formato.name} excluído` });
    toast('Formato excluído com sucesso!');
    navigate('/formatos');
  };

  return (
    <div className="mt-8 px-6 pb-16 space-y-6">
      <button type="button" onClick={() => navigate('/formatos')}
        className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Voltar para formatos
      </button>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-[8px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
            <Icon name="grid-3x3" size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[18px] font-semibold text-[var(--fg)]">{formato.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">{formato.uo || '—'}</span>
                  <span className="text-[11px] text-[var(--fg-muted)]">Criado por {formato.createdBy || '-'}</span>
                  <span className="text-[11px] text-[var(--fg-muted)]">·</span>
                  <span className="text-[11px] text-[var(--fg-muted)]">{formato.createdAt}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] mr-0.5">Tipo</span>
                  <Badge>{formato.formatType || formato.tipo || '—'}</Badge>
                  {formato.volume && <Badge>{formato.volume} {formato.volumeUnit || 'ml'}</Badge>}
                  {formato.category && <Badge>{formato.category}</Badge>}
                  {formato.diameter && <Badge>Ø{formato.diameter}mm</Badge>}
                </div>
                {machine && <div className="mt-2"><span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Máquina</span><p className="text-[12px] text-[var(--fg-secondary)] mt-0.5">{machine.name}</p></div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="primary" size="sm" onClick={() => navigate('/formatos')}>
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
                      <AlertDialogTitle>Excluir {formato.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-center">
                        Esta ação não pode ser desfeita. Todos os dados do formato serão permanentemente removidos.
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
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-5">
          <h2 className="text-[13px] font-semibold text-[var(--fg)] flex items-center gap-2 mb-6">
            <Icon name="box" size={16} />Peças do Formato
          </h2>
          <div className="space-y-0">
            {(formato.pieces || []).length > 0 ? (formato.pieces || []).map((p, i) => {
              const isAlt = (p as unknown as Record<string, unknown>).isAlternative as boolean;
              return (
                <div key={p.pieceId}>
                  {i > 0 && <Separator className="my-2" />}
                  <dl className="flex items-center justify-between">
                    <dt className="text-[13px] text-[var(--fg)] flex items-center gap-2">
                      {p.pieceName}
                      {isAlt ? <Badge variant="warning">Alternativa</Badge> : <Badge variant="success">Principal</Badge>}
                    </dt>
                    <dd className="flex items-center gap-2">
                      <span className="text-[12px] text-[var(--fg-muted)]">{p.pieceCategory || (p as unknown as Record<string, unknown>).group as string || '—'}</span>
                      <span className="text-[11px] font-mono text-[var(--fg-muted)]">{p.pieceCode}</span>
                    </dd>
                  </dl>
                </div>
              );
            }) : (
              <span className="text-[12px] text-[var(--fg-muted)]">Nenhuma peça configurada.</span>
            )}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-[var(--fg)] flex items-center gap-2">
              <Icon name="file" size={16} />Fluxos Relacionados
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
                        {f.ver} · {f.updatedAt || f.createdAt}
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
              <p className="text-[12px] text-[var(--fg-muted)]">Nenhum fluxo relacionado</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/novo-fluxo')}>
                <Icon name="plus" size={12} />Criar fluxo
              </Button>
            </div>
          )}
        </div>
      </div>

      {previewImage && <ImagePreview src={previewImage} alt="Foto da peça" onClose={() => setPreviewImage(null)} />}
    </div>
  );
}
