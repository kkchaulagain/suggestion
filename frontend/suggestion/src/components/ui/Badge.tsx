import type { ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'danger'

const variantClasses: Record<BadgeVariant, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  neutral:
    'border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300',
  danger:
    'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({
  children,
  variant = 'success',
  className = '',
}: BadgeProps) {
  const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium'
  const classes = [base, variantClasses[variant], className].filter(Boolean).join(' ')
  return <span className={classes}>{children}</span>
}
