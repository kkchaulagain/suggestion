import type { InputHTMLAttributes, ReactNode } from 'react'
import Label from './Label'
import ErrorMessage from './ErrorMessage'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  id: string
  label?: ReactNode
  type?: 'text' | 'email' | 'password' | 'number' | 'date'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
}

const baseInputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30'
const errorInputClasses =
  'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-500/30'

export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  ...rest
}: InputProps) {
  const inputClasses = error
    ? `${baseInputClasses} ${errorInputClasses} ${className}`.trim()
    : `${baseInputClasses} ${className}`.trim()

  return (
    <div className="space-y-1">
      {label ? (
        <Label htmlFor={id} size="md" required={required}>
          {label}
        </Label>
      ) : null}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <ErrorMessage message={error} size="sm" className="mt-0.5" />
      ) : null}
    </div>
  )
}
