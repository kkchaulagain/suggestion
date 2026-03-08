import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
import FieldWrapper from './FieldWrapper'

export interface StarRatingFieldProps {
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

export default function StarRatingField({
  id,
  name,
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  error,
}: StarRatingFieldProps) {
  const selectedIndex = options.indexOf(value)
  const labelId = `${id}-label`

  return (
    <FieldWrapper id={id} label={label} error={error}>
      <>
        <div
          role="group"
          aria-labelledby={labelId}
          aria-required={required}
          className="flex items-center gap-1"
        >
          {options.map((option, index) => {
            const isSelected = selectedIndex === index
            const isFilled = selectedIndex >= index
            return (
              <button
                key={`${name}-${option}`}
                id={index === 0 ? id : undefined}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange(option)
                  }
                }}
                className="touch-manipulation rounded p-1 transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50"
                aria-pressed={isSelected}
                aria-label={`${index + 1} star${index !== 0 ? 's' : ''}`}
                title={option}
              >
                <Star
                  className={`h-8 w-8 sm:h-9 sm:w-9 ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 dark:fill-amber-400 dark:text-amber-400'
                        : 'fill-transparent text-slate-300 dark:text-slate-500'
                    }`}
                  strokeWidth={1.5}
                aria-hidden
              />
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
