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
    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
      <p className="text-sm text-slate-600">
        Page {page} of {totalPages} ({totalItems} total)
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={!hasPrev}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={!hasNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
