// @ts-nocheck
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Column, ColumnDef, ColumnFiltersState, SortingState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchIcon } from 'lucide-react'

const getLines = (m) => m.lines || (m.line ? [m.line] : [])

export function MachinesDataTable({ machines, selectionMode, selected, onToggleSelect, onToggleSelectAll, allSelected, onEdit }) {
  const navigate = useNavigate()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<any>[] = useMemo(() => [
    ...(selectionMode
      ? [{
          id: 'select',
          header: () => (
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              className="accent-[var(--fg)] cursor-pointer"
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={selected.has(row.original.id)}
              onChange={() => onToggleSelect(row.original.id)}
              className="accent-[var(--fg)] cursor-pointer"
            />
          ),
        }]
      : []),
    {
      header: 'Máquina',
      accessorKey: 'name',
      cell: ({ row }) => (
        <button type="button" onClick={() => navigate('/maquinas/' + row.original.id)} className="text-left w-full">
          <div className="font-medium truncate max-w-[360px]">{row.original.name}</div>
          <div className="text-[12px] font-mono text-muted-foreground">{getLines(row.original).slice(0, 3).join(' · ')}{getLines(row.original).length > 3 ? ` · +${getLines(row.original).length - 3}` : ''}</div>
        </button>
      ),
    },
    {
      header: 'UO',
      accessorKey: 'uo',
      cell: ({ row }) => <Badge variant="secondary">{row.original.uo}</Badge>,
      meta: { filterVariant: 'select' },
    },
    {
      header: 'Criado em',
      accessorKey: 'createdAt',
      cell: ({ row }) => <span className="text-[12px] font-mono text-muted-foreground">{row.original.createdAt}</span>,
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5">
          <button type="button" onClick={() => navigate('/maquinas/' + row.original.id)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-accent transition-colors" aria-label="Detalhes">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button type="button" onClick={() => onEdit?.(row.original)} className="w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-accent transition-colors" aria-label="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      ),
    },
  ], [selectionMode, selected, allSelected, onToggleSelectAll, onToggleSelect, navigate, onEdit])

  const table = useReactTable({
    data: machines,
    columns,
    state: { sorting, columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
  })

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap gap-3 px-2 py-6">
        {table.getAllColumns().filter(c => c.getCanFilter() && c.id !== 'select' && c.id !== 'actions').map(column => (
          <div key={column.id} className='w-full sm:w-44'>
            <Filter column={column} />
          </div>
        ))}
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} className='bg-muted/50'>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} className='relative h-10 border-t select-none'>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-24 text-center text-muted-foreground'>
                Nenhum resultado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function Filter({ column }: { column: Column<any, unknown> }) {
  const columnFilterValue = column.getFilterValue()
  const { filterVariant } = column.columnDef.meta ?? {}
  const columnHeader = typeof column.columnDef.header === 'string' ? column.columnDef.header : ''

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === 'range') return []
    const values = Array.from(column.getFacetedUniqueValues().keys())
    const flattenedValues = values.reduce((acc, curr) => {
      if (Array.isArray(curr)) return [...acc, ...curr]
      return [...acc, curr]
    }, [])
    return Array.from(new Set(flattenedValues)).sort()
  }, [column.getFacetedUniqueValues(), filterVariant])

  if (filterVariant === 'range') {
    return (
      <div className='*:not-first:mt-2'>
        <Label>{columnHeader}</Label>
        <div className='flex'>
          <Input className='flex-1 rounded-r-none' value={(columnFilterValue as [number, number])?.[0] ?? ''} onChange={e => column.setFilterValue((old) => [e.target.value ? Number(e.target.value) : undefined, old?.[1]])} placeholder='Min' type='number' />
          <Input className='-ms-px flex-1 rounded-l-none' value={(columnFilterValue as [number, number])?.[1] ?? ''} onChange={e => column.setFilterValue((old) => [old?.[0], e.target.value ? Number(e.target.value) : undefined])} placeholder='Max' type='number' />
        </div>
      </div>
    )
  }

  if (filterVariant === 'select') {
    const selectItems = [
      { label: 'Todas', value: 'all' },
      ...sortedUniqueValues.map(value => ({ label: String(value), value: String(value) })),
    ]
    return (
      <div className='*:not-first:mt-2'>
        <Label>{columnHeader}</Label>
        <select
          className="shad-input w-full py-1.5 text-[12px]"
          value={columnFilterValue?.toString() ?? 'all'}
          onChange={e => column.setFilterValue(e.target.value === 'all' ? undefined : e.target.value)}>
          {selectItems.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
    )
  }

  return (
    <div className='*:not-first:mt-2'>
      <Label>{columnHeader}</Label>
      <div className='relative'>
        <Input className='peer pl-9' value={(columnFilterValue ?? '') as string} onChange={e => column.setFilterValue(e.target.value)} placeholder={`Buscar ${columnHeader.toLowerCase()}`} type='text' />
        <div className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
          <SearchIcon size={16} />
        </div>
      </div>
    </div>
  )
}
