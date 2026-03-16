export interface StatItem {
  value: string
  label: string
}

export interface StatsBarProps {
  stats: StatItem[]
  /** Show vertical dividers between items. Default true. */
  showDividers?: boolean
}

export default function StatsBar({ stats, showDividers = true }: StatsBarProps) {
  if (stats.length === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`flex flex-col items-center ${showDividers && i > 0 ? 'border-l border-stone-200 pl-8 dark:border-stone-600 sm:pl-12' : ''}`}
        >
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
            {stat.value}
          </span>
          <span className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  )
}
