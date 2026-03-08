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
    ? 'border-b border-slate-200 py-4 first:pt-0 dark:border-slate-700'
    : 'rounded-xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800/50'

  return (
    <div className={wrapperClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          {description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-3">{meta}</div> : null}
      {children}
    </div>
  )
}
