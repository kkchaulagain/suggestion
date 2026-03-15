import type { ReactNode } from 'react'
import FieldWrapper from './FieldWrapper'

const SCALE_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

export interface Scale1To10FieldProps {
  id: string
  name: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function Scale1To10Field({
  id,
  name,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
}: Scale1To10FieldProps) {
  const labelId = `${id}-label`

  return (
    <FieldWrapper id={id} label={label} error={error}>
      <>
        <div
          role="group"
          aria-labelledby={labelId}
          aria-required={required}
          className="flex flex-wrap gap-2"
        >
          {SCALE_OPTIONS.map((option) => {
            const isSelected = value === option
            return (
              <button
                key={`${name}-${option}`}
                id={option === '1' ? id : undefined}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange(option)
                  }
                }}
                className={`min-w-[2.25rem] rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700'
                }`}
                aria-pressed={isSelected}
                aria-label={`${option} out of 10`}
              >
                {option}
              </button>
            )
          })}
        </div>
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          tabIndex={-1}
          aria-hidden
          onChange={() => {}}
        />
      </>
    </FieldWrapper>
  )
}
