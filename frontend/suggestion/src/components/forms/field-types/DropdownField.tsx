import type { ReactNode } from 'react'
import FieldWrapper from './FieldWrapper'

export interface DropdownFieldProps {
  id: string
  name: string
  label: ReactNode
  value: string
  options: string[]
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function DropdownField({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  error,
}: DropdownFieldProps) {
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}
