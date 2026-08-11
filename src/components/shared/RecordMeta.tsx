import { Card } from '../Card';
import { Icon } from '../Icon';

function formatDate(value: string): string {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

interface RecordMetaProps {
  createdBy?: string;
  createdAt?: string;
}

export function RecordMeta({ createdBy, createdAt }: RecordMetaProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-secondary)]"><Icon name="clock" size={15} /></div>
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--fg)]">Informações do registro</h3>
          <p className="text-[11px] text-[var(--fg-secondary)]">Metadados de criação do registro.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Criado por</label>
          <div className="px-3 py-2 rounded-[6px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--fg-secondary)]">{createdBy || '—'}</div>
        </div>
        <div>
          <label className="text-[12px] font-medium text-[var(--fg)] mb-1 block">Data de criação</label>
          <div className="px-3 py-2 rounded-[6px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--fg-secondary)]">{formatDate(createdAt ?? '')}</div>
        </div>
      </div>
    </Card>
  );
}
