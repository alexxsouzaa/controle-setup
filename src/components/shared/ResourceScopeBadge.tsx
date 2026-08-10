import type { ResourceScope } from '../../features/units/types/unit.types';

interface ResourceScopeBadgeProps {
  scope?: ResourceScope;
  unitId?: string;
}

export function ResourceScopeBadge({ scope, unitId }: ResourceScopeBadgeProps) {
  if (scope === 'global') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium font-mono bg-[var(--accent-muted)] text-[var(--fg-secondary)]">
        GLOBAL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium font-mono bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--fg-secondary)]">
      UO{unitId ? <span className="text-[10px] opacity-70 truncate max-w-[80px]">{unitId}</span> : null}
    </span>
  );
}
