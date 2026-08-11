import * as React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '../ui/dropdown-menu';
import { Icon } from '../Icon';

export interface MultiSelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  ariaLabel?: string;
  onCreate?: (value: string) => void;
  emptyMessage?: string;
}

export function MultiSelectDropdown({
  options,
  selected,
  onToggle,
  placeholder,
  searchPlaceholder,
  ariaLabel,
  onCreate,
  emptyMessage = 'Nenhum item encontrado.',
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>('');

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const canCreate = !!onCreate && search.trim().length > 0 && !options.some(o => o.label.toLowerCase() === search.trim().toLowerCase());

  const triggerLabel = selected.length === 0
    ? placeholder
    : `${selected.length} selecionado${selected.length !== 1 ? 's' : ''}`;

  return (
    <DropdownMenu open={open} onOpenChange={(next: boolean) => { setOpen(next); if (!next) setSearch(''); }}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[12px] hover:border-[var(--fg-muted)] transition-colors"
            aria-label={ariaLabel}
          >
            <span className={selected.length === 0 ? 'text-[var(--fg-muted)]' : ''}>{triggerLabel}</span>
            <Icon name="arrow-right" size={12} className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
          </button>
        }
      />
      <DropdownMenuContent className="p-1">
        <div className="p-1.5 border-b border-[var(--border-subtle)] mb-1">
          <div className="flex gap-1">
            <input
              className="shad-input flex-1 py-1 text-[11px]"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key.length === 1) e.stopPropagation(); }}
            />
            {canCreate && (
              <button
                type="button"
                onClick={() => { onCreate?.(search.trim()); setSearch(''); }}
                className="px-2 py-1 rounded text-[10px] bg-[var(--fg)] text-[var(--bg)] shrink-0"
              >
                Criar
              </button>
            )}
          </div>
        </div>
        <div className="max-h-40 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-[var(--fg-muted)]">{emptyMessage}</p>
          ) : (
            filtered.map(o => {
              const isSelected = selected.includes(o.value);
              return (
                <DropdownMenuItem
                  key={o.value}
                  closeOnClick={false}
                  onClick={() => onToggle(o.value)}
                  className={`w-full text-left gap-2 text-[12px] ${isSelected ? 'bg-[var(--accent-muted)]' : ''}`}
                >
                  <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-[var(--fg)] border-[var(--fg)]' : 'border-[var(--border)]'}`}>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    )}
                  </div>
                  <span className="truncate">{o.label}</span>
                  {o.hint && <span className="text-[10px] text-[var(--fg-muted)] ml-auto shrink-0">{o.hint}</span>}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
