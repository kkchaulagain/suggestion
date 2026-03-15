import type { ReactNode } from 'react'

export interface FormCardProps {
  title: string
  subtitle?: ReactNode
  description?: string
  meta?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  /** "card" = rounded bordered box (default). "flat" = list row with bottom border, less visual weight. */
  variant?: 'card' | 'flat'
}

export default function FormCard({
  title,
  subtitle,
  description,
  meta,
  actions,
  children,
  variant = 'card',
}: FormCardProps) {
  const isFlat = variant === 'flat'
  const wrapperClass = isFlat
    ? 'border-b border-stone-200/80 py-5 first:pt-0 dark:border-stone-700/80'
    : 'rounded-2xl border border-stone-200/80 bg-white p-5 transition-shadow transition-colors duration-200 hover:border-stone-300 hover:shadow-md dark:border-stone-700/80 dark:bg-stone-900 dark:hover:border-stone-600 dark:hover:shadow-lg dark:hover:shadow-black/20 sm:p-6'

  return (
    <div className={wrapperClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium tracking-tight text-stone-900 dark:text-stone-50">{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{subtitle}</p> : null}
          {description ? <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-3">{meta}</div> : null}
      {children}
    </div>
  )
}
