// @ts-nocheck
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'
import { cn } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

const getLines = (m) => m.lines || (m.line ? [m.line] : []);

export function MachinesDataTable({
  machines,
  selectionMode,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
}) {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);

  useEffect(() => { setPagination(prev => ({ ...prev, pageIndex: 0 })); }, [machines]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    ...(selectionMode
      ? [{
          id: 'select',
          header: () => (
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && selected.size > 0}
              onCheckedChange={onToggleSelectAll}
              aria-label='Select all'
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={selected.has(row.original.id)}
              onCheckedChange={() => onToggleSelect(row.original.id)}
              aria-label='Select row'
            />
          ),
          size: 28,
          enableSorting: false,
        }]
      : []),
    {
      header: 'Máquina',
      accessorKey: 'name',
      cell: ({ row }) => (
        <button type="button" onClick={() => navigate('/maquinas/' + row.original.id)} className="text-left w-full">
          <div className="font-medium truncate max-w-[360px]">{row.original.name}</div>
          <div className="text-[12px] font-mono text-muted-foreground">
            {getLines(row.original).slice(0, 3).join(' · ')}{getLines(row.original).length > 3 ? ` · +${getLines(row.original).length - 3}` : ''}
          </div>
        </button>
      ),
    },
    {
      header: 'UO',
      accessorKey: 'uo',
      cell: ({ row }) => <Badge variant="secondary">{row.original.uo}</Badge>,
    },
    {
      header: 'Criado em',
      accessorKey: 'createdAt',
      cell: ({ row }) => <span className="text-[12px] font-mono text-muted-foreground">{row.original.createdAt}</span>,
      sortingFn: 'text',
    },
  ], [selectionMode, selected, allSelected, onToggleSelectAll, onToggleSelect, navigate]);

  const table = useReactTable({
    data: machines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  });

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 5,
  });

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} style={{ width: `${header.getSize()}px` }} className="h-11">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={cn(
                          header.column.getCanSort() && 'flex h-full cursor-pointer items-center justify-between gap-2 select-none'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <span className="shrink-0 opacity-60 ml-1">↑</span>
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <span className="shrink-0 opacity-60 ml-1">↓</span>
                        ) : null}
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer"
                  onDoubleClick={() => { if (!selectionMode) navigate('/maquinas/' + row.original.id); }}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 max-sm:flex-col">
        <p className="text-muted-foreground flex-1 text-sm whitespace-nowrap" aria-live="polite">
          Página <span className="text-foreground">{table.getState().pagination.pageIndex + 1}</span> de{' '}
          <span className="text-foreground">{table.getPageCount()}</span>
        </p>

        <div className="grow">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon aria-hidden="true" />
                </Button>
              </PaginationItem>

              {showLeftEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {pages.map(page => {
                const isActive = page === table.getState().pagination.pageIndex + 1
                return (
                  <PaginationItem key={page}>
                    <Button
                      size="icon"
                      variant={isActive ? 'outline' : 'ghost'}
                      onClick={() => table.setPageIndex(page - 1)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                )
              })}

              {showRightEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
