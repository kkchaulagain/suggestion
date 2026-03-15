import { Skeleton } from '../ui'

export default function FormCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-stone-200/80 bg-white p-5 dark:border-stone-700/80 dark:bg-stone-900 sm:p-6"
      aria-hidden
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-12 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-3 w-full max-w-md" />
      </div>
      <div className="mt-2">
        <Skeleton className="h-3 w-full max-w-xs" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-14 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>
    </div>
  )
}
