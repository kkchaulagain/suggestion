import type { ReactNode } from 'react'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

export interface DataTableColumn<T = object> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
}

export interface DataTableProps<T = object> {
  columns: DataTableColumn<T>[]
  rows: T[]
  emptyMessage?: string
  loading?: boolean
  loadingMessage?: string
  /** Optional pagination; when set, table shows Pagination below */
  page?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  /** Optional class for the table wrapper (e.g. card styling) */
  wrapperClassName?: string
}

export default function DataTable<T extends object>({
  columns,
  rows,
  emptyMessage = 'No data.',
  loading = false,
  loadingMessage = 'Loading...',
  page,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  wrapperClassName,
}: DataTableProps<T>) {
  if (loading) {
    return <EmptyState type="loading" message={loadingMessage} />
  }

  if (rows.length === 0) {
    return <EmptyState type="empty" message={emptyMessage} />
  }

  const getCellValue = (row: T, key: keyof T | string): ReactNode => {
    const value = (row as Record<string, unknown>)[key as string]
    if (value === undefined || value === null) return '—'
    if (typeof value === 'object') return String(value)
    return String(value)
  }

  return (
    <>
      <div className={wrapperClassName ? `overflow-x-auto ${wrapperClassName}` : 'mt-4 overflow-x-auto'}>
        <table className="w-full min-w-[400px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-50/80 text-left dark:border-slate-700 dark:bg-slate-800/40">
              {columns.map((col) => (
                <th key={String(col.key)} className="py-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-slate-700/50 dark:hover:bg-slate-800/30"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="py-3.5 pr-4 text-slate-700 dark:text-slate-200">
                    {col.render ? col.render(row) : getCellValue(row, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPageChange && page != null && totalPages > 0 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={onPageChange}
        />
      ) : null}
    </>
  )
}
