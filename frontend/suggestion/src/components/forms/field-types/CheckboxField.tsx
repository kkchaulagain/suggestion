import type { ReactNode } from 'react'
import FieldWrapper from './FieldWrapper'

export interface CheckboxFieldProps {
  id: string
  name: string
  label: ReactNode
  value: string[]
  options: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  error?: string
}

export default function CheckboxField({
  id,
  name,
  label,
  value,
  options,
  onChange,
  disabled = false,
  error,
}: CheckboxFieldProps) {
  const arr = value ?? []
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={`${name}-${option}`}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
          >
            <input
              type="checkbox"
              name={name}
              checked={arr.includes(option)}
              onChange={(e) => {
                const checked = e.target.checked
                if (checked) {
                  onChange([...arr, option])
                } else {
                  onChange(arr.filter((o) => o !== option))
                }
              }}
              disabled={disabled}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:focus:ring-emerald-500"
            />
            {option}
          </label>
        ))}
      </div>
    </FieldWrapper>
  )
}
