import type { ReactNode, TextareaHTMLAttributes } from 'react'
import Label from './Label'
import ErrorMessage from './ErrorMessage'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  id: string
  label?: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  error?: string
  disabled?: boolean
  required?: boolean
}

const baseClasses =
  'w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 resize-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30'
const errorClasses =
  '!border-red-400 focus:!border-red-500 focus:ring-2 focus:ring-red-200 dark:!border-red-500 dark:focus:!border-red-500 dark:focus:ring-red-500/30'

export default function Textarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  error,
  disabled = false,
  required = false,
  className = '',
  ...rest
}: TextareaProps) {
  const textareaClasses = error
    ? `${baseClasses} ${errorClasses} ${className}`.trim()
    : `${baseClasses} ${className}`.trim()

  return (
    <div className="space-y-1">
      {label ? (
        <Label htmlFor={id} size="md" required={required}>
          {label}
        </Label>
      ) : null}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className={textareaClasses}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <ErrorMessage message={error} size="sm" className="mt-0.5" />
      ) : null}
    </div>
  )
}
