import type { ReactNode } from 'react'
import FieldWrapper from './FieldWrapper'

export interface RadioFieldProps {
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

export default function RadioField({
  id,
  name,
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  error,
}: RadioFieldProps) {
  const str = value ?? ''
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={`${name}-${option}`}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={str === option}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              required={required}
              className="border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:focus:ring-emerald-500"
            />
            {option}
          </label>
        ))}
      </div>
    </FieldWrapper>
  )
}
