export interface SkeletonProps {
  className?: string
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-stone-200 dark:bg-stone-700 ${className}`}
      aria-hidden
    />
  )
}
