import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export type TagVariant = 'default' | 'emerald' | 'stone'

const variantClasses: Record<TagVariant, string> = {
  default: 'rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  emerald: 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  stone: 'rounded-lg border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs font-medium text-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400',
}

export interface TagProps {
  children: ReactNode
  onRemove?: () => void
  variant?: TagVariant
  className?: string
  /** Accessible label for the remove button when onRemove is set */
  removeLabel?: string
}

export default function Tag({
  children,
  onRemove,
  variant = 'default',
  className = '',
  removeLabel = 'Remove',
}: TagProps) {
  const base = 'inline-flex items-center gap-1'
  const classes = [base, variantClasses[variant], className].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="ml-0.5 rounded p-0.5 font-medium text-emerald-600 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:text-emerald-400 dark:hover:text-rose-400"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      ) : null}
    </span>
  )
}
