import type { ReactNode } from 'react'
import FieldWrapper from './FieldWrapper'

const EMOJI_SCALE: { value: number; emoji: string; label: string }[] = [
  { value: 2, emoji: '😡', label: 'Very bad' },
  { value: 4, emoji: '😕', label: 'Bad' },
  { value: 6, emoji: '😐', label: 'Neutral' },
  { value: 8, emoji: '🙂', label: 'Good' },
  { value: 10, emoji: '😄', label: 'Excellent' },
]

export interface ScaleChipsFieldProps {
  id: string
  name: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function ScaleChipsField({
  id,
  name,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
}: ScaleChipsFieldProps) {
  const numericValue = value === '' ? null : parseInt(value, 10)
  const labelId = `${id}-label`

  return (
    <FieldWrapper id={id} label={label} error={error}>
      <div
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        role="group"
        aria-labelledby={labelId}
        aria-required={required}
      >
        {EMOJI_SCALE.map(({ value: v, emoji, label: optionLabel }) => {
          const isSelected = numericValue === v
          return (
            <button
              key={v}
              type="button"
              onClick={() => !disabled && onChange(String(v))}
              disabled={disabled}
              title={optionLabel}
              aria-pressed={isSelected}
              aria-label={optionLabel}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 disabled:opacity-50 sm:h-14 sm:w-14 sm:text-3xl ${
                isSelected
                  ? 'scale-[1.05] bg-stone-200 ring-2 ring-stone-400 ring-offset-2 dark:bg-stone-700 dark:ring-stone-500'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700'
              }`}
            >
              {emoji}
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
    </FieldWrapper>
  )
}
