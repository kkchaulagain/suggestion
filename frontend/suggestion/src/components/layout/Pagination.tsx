import { Button } from '../ui'

export interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 dark:border-slate-700 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600 dark:text-slate-400 order-2 sm:order-1">
        Page {page} of {totalPages} ({totalItems} total)
      </p>
      <div className="flex gap-2 order-1 sm:order-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="min-h-[44px] flex-1 sm:flex-initial"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={!hasPrev}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="min-h-[44px] flex-1 sm:flex-initial"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={!hasNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
