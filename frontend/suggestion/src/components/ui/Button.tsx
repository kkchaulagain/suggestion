import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 border-transparent',
  ghost:
    'border-transparent bg-transparent text-slate-700 hover:bg-slate-100',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs font-semibold rounded-lg',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-lg',
  lg: 'px-4 py-3 text-sm font-bold rounded-xl',
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed'
  const classes = [base, variantClasses[variant], sizeClasses[size], className].filter(Boolean).join(' ')

  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  )
}
