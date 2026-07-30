// @ts-nocheck
import * as React from 'react'
import { Button } from '@/components/Button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Icon } from '@/components/Icon'
import type { Piece } from '@/types'

interface PieceSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pieces: Piece[]
  selectedId?: string | null
  onSelect: (piece: Piece) => void
  title?: string
}

export function PieceSelector({ open, onOpenChange, pieces, selectedId, onSelect, title = 'Selecionar peça' }: PieceSelectorProps) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, Piece[]>()
    pieces.forEach(p => {
      const cat = p.category || 'Sem categoria'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [pieces])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Buscar peça por nome ou código..." />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Icon name="box" size={24} className="text-[var(--fg-muted)]" />
              <p className="text-sm text-[var(--fg-muted)]">Nenhuma peça encontrada</p>
            </div>
          </CommandEmpty>
          {grouped.map(([category, catPieces]) => (
            <CommandGroup key={category} heading={category}>
              {catPieces.map(piece => {
                const isSelected = piece.id === selectedId
                return (
                  <CommandItem
                    key={piece.id}
                    value={`${piece.name} ${piece.code} ${category}`}
                    onSelect={() => { onSelect(piece); onOpenChange(false) }}
                    className="gap-3 py-2.5"
                  >
                    {piece.image ? (
                      <img
                        src={piece.image}
                        alt={piece.name}
                        className="w-9 h-9 rounded-[4px] object-cover border border-[var(--border)] shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
                        <Icon name="box" size={16} />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{piece.name}</span>
                      <span className="text-[11px] text-[var(--fg-secondary)]">
                        <span className="font-mono">{piece.code}</span>
                        <span className="ml-1.5">Est: {piece.stock} {piece.unit || 'un'}</span>
                      </span>
                    </div>
                    <div className="ml-auto shrink-0" data-slot="command-shortcut">
                      <Button size="sm" variant={isSelected ? 'ghost' : 'primary'} className="pointer-events-auto">
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </Button>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
