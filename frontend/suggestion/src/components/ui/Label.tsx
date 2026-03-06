import type { LabelHTMLAttributes, ReactNode } from 'react'

export type LabelSize = 'sm' | 'md'

const sizeClasses: Record<LabelSize, string> = {
  sm: 'text-xs font-medium text-slate-600',
  md: 'text-sm font-medium text-slate-700',
}

export interface LabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children'> {
  htmlFor: string
  children: ReactNode
  required?: boolean
  size?: LabelSize
}

export default function Label({
  htmlFor,
  children,
  required = false,
  size = 'md',
  className = '',
  ...rest
}: LabelProps) {
  const base = 'block'
  const classes = [base, sizeClasses[size], className].filter(Boolean).join(' ')

  return (
    <label htmlFor={htmlFor} className={classes} {...rest}>
      {children}
      {required ? <span className="ml-1 text-rose-600" aria-hidden>*</span> : null}
    </label>
  )
}
