import type { ReactNode } from 'react'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

const variantClasses: Record<AlertVariant, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100',
  error:
    'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100',
}

export interface AlertProps {
  children: ReactNode
  variant?: AlertVariant
  title?: string
  className?: string
}

export default function Alert({
  children,
  variant = 'info',
  title,
  className = '',
}: AlertProps) {
  const base = 'rounded-xl border px-4 py-3'
  const classes = [base, variantClasses[variant], className].filter(Boolean).join(' ')
  return (
    <div className={classes} role="alert">
      {title ? (
        <p className="mb-1 font-semibold">{title}</p>
      ) : null}
      <div className="text-sm [&_p]:mt-0 [&_p:last-child]:mb-0">{children}</div>
    </div>
  )
}
