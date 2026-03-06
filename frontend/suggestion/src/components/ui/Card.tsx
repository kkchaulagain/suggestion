import type { ReactNode } from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export interface CardProps {
  children: ReactNode
  padding?: CardPadding
  className?: string
}

export default function Card({
  children,
  padding = 'md',
  className = '',
}: CardProps) {
  const base = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'
  const classes = [base, paddingClasses[padding], className].filter(Boolean).join(' ')

  return <div className={classes}>{children}</div>
}
