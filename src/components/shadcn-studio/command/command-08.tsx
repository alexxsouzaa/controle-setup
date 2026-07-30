import * as React from 'react'
import { Button } from '@/components/Button'
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
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const grouped = React.useMemo(() => {
    const map = new Map<string, Piece[]>()
    pieces.forEach(p => {
      const cat = p.category || 'Sem categoria'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [pieces])

  const filtered = React.useMemo(() => {
    if (!search) return grouped
    const q = search.toLowerCase()
    return grouped
      .map(([cat, catPieces]) => [
        cat,
        catPieces.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
      ] as [string, Piece[]])
      .filter(([, catPieces]) => catPieces.length > 0)
  }, [grouped, search])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-[var(--overlay)]" />
      <div
        role="dialog"
        aria-label={title}
        className="relative bg-[var(--surface)] border border-[var(--border)] rounded-[12px] shadow-xl w-full max-w-lg mx-4 z-10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 pb-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none">
              <Icon name="search" size={14} />
            </span>
            <input
              className="shad-input pl-8 py-1.5 text-[12px]"
              placeholder="Buscar peça por nome ou código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-3 py-2" style={{ minHeight: 160 }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Icon name="box" size={24} className="text-[var(--fg-muted)]" />
              <p className="text-sm text-[var(--fg-muted)] mt-2">Nenhuma peça encontrada</p>
            </div>
          ) : filtered.map(([category, catPieces]) => (
            <div key={category} className="mb-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)] px-2 py-1.5">
                {category}
              </div>
              <div className="space-y-1">
                {catPieces.map(piece => {
                  const isSelected = piece.id === selectedId
                  return (
                    <button
                      key={piece.id}
                      type="button"
                      onClick={() => { onSelect(piece); onOpenChange(false) }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[6px] border text-sm transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                          : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)]'
                      }`}
                    >
                      {piece.image ? (
                        <img src={piece.image} alt={piece.name} className="w-9 h-9 rounded-[4px] object-cover border border-[var(--border)] shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
                          <Icon name="box" size={16} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{piece.name}</div>
                        <div className="text-[11px] text-[var(--fg-secondary)]">
                          <span className="font-mono">{piece.code}</span>
                          <span className="ml-1.5">Est: {piece.stock} {piece.unit || 'un'}</span>
                        </div>
                      </div>
                      <Button size="sm" variant={isSelected ? 'ghost' : 'primary'} disabled={isSelected}>
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </Button>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 pt-2 border-t border-[var(--border)]">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">Fechar</Button>
        </div>
      </div>
    </div>
  )
}
