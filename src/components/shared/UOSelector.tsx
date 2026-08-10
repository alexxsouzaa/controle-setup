import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useUnits } from '../../queries/useUnits';
import { useUoStore } from '../../stores/uoStore';

export function UOSelector() {
  const { data: units = [] } = useUnits();
  const activeUnitId = useUoStore((s) => s.activeUnitId);
  const setActiveUnit = useUoStore((s) => s.setActiveUnit);

  const active = units.find((u) => u.id === activeUnitId) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="shad-select py-1.5 text-[12px] max-w-[200px] flex items-center gap-2 text-left"
            aria-label="Selecionar UO ativa"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="flex-1 truncate">
              {active ? active.name : 'Todas as UOs'}
            </span>
            <ChevronDown className="size-3.5 shrink-0" />
          </button>
        }
      />
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => setActiveUnit(null)}
            className={!active ? 'bg-[var(--accent-muted)]' : ''}
          >
            Todas as UOs
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {units.map((u) => (
            <DropdownMenuItem
              key={u.id}
              onClick={() => setActiveUnit(u)}
              className={u.id === activeUnitId ? 'bg-[var(--accent-muted)]' : ''}
            >
              <span className="font-mono text-[11px] text-[var(--fg-muted)] mr-1.5">{u.code}</span>
              {u.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
