import { useId, useMemo, useState } from 'react'

import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchIcon } from "lucide-react"
import { cn } from '@/lib/utils'

interface ProductItem {
  id: string;
  product: string;
  productImage: string;
  fallback: string;
  price: number;
  availability: string;
  rating: number;
}

interface ColumnMeta {
  filterVariant?: 'range' | 'select' | 'text';
}

const columns = [
  {
    id: 'select',
    header: ({ table }: { table: ReturnType<typeof useReactTable<ProductItem>> }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all' />
    ),
    cell: ({ row }: { row: { getIsSelected: () => boolean; toggleSelected: (value: boolean) => void } }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean | 'indeterminate') => row.toggleSelected(!!value)}
        aria-label='Select row' />
    ),
    meta: {} as ColumnMeta,
  },
  {
    header: 'Product',
    accessorKey: 'product',
    cell: ({ row }: { row: { original: ProductItem; getValue: (key: string) => string } }) => (
      <div className='flex items-center gap-3'>
        <Avatar className='rounded-sm'>
          <AvatarImage src={row.original.productImage} alt={row.original.fallback} />
          <AvatarFallback className='text-xs'>{row.original.fallback}</AvatarFallback>
        </Avatar>
        <div className='font-medium'>{row.getValue('product')}</div>
      </div>
    ),
    meta: {} as ColumnMeta,
  },
  {
    header: 'Price',
    accessorKey: 'price',
    cell: ({ row }: { row: { getValue: (key: string) => number } }) => <div>${row.getValue('price')}</div>,
    enableSorting: false,
    meta: {
      filterVariant: 'range'
    } as ColumnMeta,
  },
  {
    header: 'Availability',
    accessorKey: 'availability',
    cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
      const status = row.getValue('availability') as string;

      const styleMap: Record<string, string> = {
        'In Stock':
          'bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5',
        'Out of Stock':
          'bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive',
        Limited:
          'bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5'
      };
      const styles = styleMap[status as keyof typeof styleMap] || '';
      return <span className={cn(styles, 'px-2 py-1 rounded-md text-xs font-medium')}>{status}</span>;
    },
    enableSorting: false,
    meta: {
      filterVariant: 'select'
    } as ColumnMeta,
  },
  {
    header: 'Rating',
    accessorKey: 'rating',
    cell: ({ row }: { row: { getValue: (key: string) => number } }) => <div>{row.getValue('rating')}</div>,
    meta: {
      filterVariant: 'range'
    } as ColumnMeta,
  }
]

const items: ProductItem[] = [
  {
    id: '1',
    product: 'Black Chair',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-1.png',
    fallback: 'BC',
    price: 159,
    availability: 'In Stock',
    rating: 3.9
  },
  {
    id: '2',
    product: 'Nike Jordan',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-2.png',
    fallback: 'NJ',
    price: 599,
    availability: 'Limited',
    rating: 4.4
  },
  {
    id: '3',
    product: 'OnePlus 7 Pro',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-3.png',
    fallback: 'O7P',
    price: 1299,
    availability: 'Out of Stock',
    rating: 3.5
  },
  {
    id: '4',
    product: 'Nintendo Switch',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-4.png',
    fallback: 'NS',
    price: 499,
    availability: 'In Stock',
    rating: 4.9
  },
  {
    id: '5',
    product: 'Apple magic mouse',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-5.png',
    fallback: 'AMM',
    price: 970,
    availability: 'Limited',
    rating: 4.1
  },
  {
    id: '6',
    product: 'Apple watch',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-6.png',
    fallback: 'AW',
    price: 1500,
    availability: 'Limited',
    rating: 3.1
  },
  {
    id: '7',
    product: 'Casio G-Shock',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-8.png',
    fallback: 'CGS',
    price: 194,
    availability: 'Out of Stock',
    rating: 1.5
  },
  {
    id: '8',
    product: 'RayBan Sunglasses',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-10.png',
    fallback: 'RBS',
    price: 199,
    availability: 'Out of Stock',
    rating: 2.4
  }
]

function Filter({
  column
}: {
  column: Column<ProductItem, unknown>;
}) {
  const id = useId()
  const columnFilterValue = column.getFilterValue() as [number | undefined, number | undefined] | string | undefined
  const { filterVariant = 'text' } = (column.columnDef.meta ?? {}) as ColumnMeta
  const columnHeader = typeof column.columnDef.header === 'string' ? column.columnDef.header : ''

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === 'range') return []

    const values = Array.from(column.getFacetedUniqueValues().keys())

    const flattenedValues = values.reduce((acc: unknown[], curr: unknown) => {
      if (Array.isArray(curr)) {
        return [...acc, ...curr]
      }

      return [...acc, curr]
    }, [])

    return Array.from(new Set(flattenedValues)).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.getFacetedUniqueValues(), filterVariant])

  if (filterVariant === 'range') {
    const rangeValue = columnFilterValue as [number | undefined, number | undefined] | undefined;
    return (
      <div className='*:not-first:mt-2'>
        <Label>{columnHeader}</Label>
        <div className='flex'>
          <Input
            id={`${id}-range-1`}
            className='flex-1 rounded-r-none [-moz-appearance:textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
            value={rangeValue?.[0] ?? ''}
            onChange={e =>
              column.setFilterValue((old: [number | undefined, number | undefined]) => [
                e.target.value ? Number(e.target.value) : undefined,
                old?.[1]
              ])
            }
            placeholder='Min'
            type='number'
            aria-label={`${columnHeader} min`} />
          <Input
            id={`${id}-range-2`}
            className='-ms-px flex-1 rounded-l-none [-moz-appearance:textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none'
            value={rangeValue?.[1] ?? ''}
            onChange={e =>
              column.setFilterValue((old: [number | undefined, number | undefined]) => [
                old?.[0],
                e.target.value ? Number(e.target.value) : undefined
              ])
            }
            placeholder='Max'
            type='number'
            aria-label={`${columnHeader} max`} />
        </div>
      </div>
    );
  }

  if (filterVariant === 'select') {
    const selectItems = [
      { label: 'All', value: 'all' },
      ...sortedUniqueValues.map(value => ({
        label: String(value),
        value: String(value)
      }))
    ]

    return (
      <div className='*:not-first:mt-2'>
        <Label htmlFor={`${id}-select`}>{columnHeader}</Label>
        <Select
          items={selectItems}
          value={(columnFilterValue as string)?.toString() ?? 'all'}
          onValueChange={(value) => {
            column.setFilterValue(value === 'all' ? undefined : value)
          }}>
          <SelectTrigger id={`${id}-select`} className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='p-1'>
            {selectItems.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className='*:not-first:mt-2'>
      <Label htmlFor={`${id}-input`}>{columnHeader}</Label>
      <div className='relative'>
        <Input
          id={`${id}-input`}
          className='peer pl-9'
          value={(columnFilterValue as string ?? '')}
          onChange={e => column.setFilterValue(e.target.value)}
          placeholder={`Search ${columnHeader.toLowerCase()}`}
          type='text' />
        <div
          className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
          <SearchIcon size={16} />
        </div>
      </div>
    </div>
  );
}

const DataTableWithColumnFilterDemo = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'price',
      desc: false
    }
  ])

  const table = useReactTable({
    data: items,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onSortingChange: setSorting,
    enableSortingRemoval: false
  })

  return (
    <div className='w-full'>
      <div className='rounded-md border'>
        <div className='flex flex-wrap gap-3 px-2 py-6'>
          <div className='w-full sm:w-44'>
            <Filter column={table.getColumn('product')!} />
          </div>
          <div className='w-full sm:w-36'>
            <Filter column={table.getColumn('price')!} />
          </div>
          <div className='w-full sm:w-44'>
            <Filter column={table.getColumn('availability')!} />
          </div>
          <div className='w-full sm:w-36'>
            <Filter column={table.getColumn('rating')!} />
          </div>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='bg-muted/50'>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id} className='relative h-10 border-t select-none'>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
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
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className='text-muted-foreground mt-4 text-center text-sm'>Data table with column filter</p>
    </div>
  );
}

export default DataTableWithColumnFilterDemo
