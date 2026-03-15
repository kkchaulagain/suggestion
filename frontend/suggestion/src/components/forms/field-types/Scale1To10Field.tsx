import FieldWrapper from './FieldWrapper'
import { SCALE_VALUE_LABELS, type Scale1To10FieldProps } from './Scale1To10Field.constants'

const MIN = 1
const MAX = 10
const DEFAULT_VALUE = 6

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
  const numericValue = value === '' ? null : Math.min(MAX, Math.max(MIN, parseInt(value, 10)))
  const sliderValue = numericValue ?? DEFAULT_VALUE
  const valueLabel = SCALE_VALUE_LABELS[sliderValue as keyof typeof SCALE_VALUE_LABELS] ?? ''
  const thumbPercent = ((sliderValue - MIN) / (MAX - MIN)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(String(v))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Home') {
      e.preventDefault()
      onChange(String(MIN))
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(String(MAX))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      const next = (numericValue ?? DEFAULT_VALUE) - 1
      if (next >= MIN) {
        e.preventDefault()
        onChange(String(next))
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      const next = (numericValue ?? DEFAULT_VALUE) + 1
      if (next <= MAX) {
        e.preventDefault()
        onChange(String(next))
      }
    }
  }

  return (
    <FieldWrapper id={id} label={label} error={error}>
      <>
        <div
          role="group"
          aria-labelledby={labelId}
          aria-required={required}
          className="w-full"
        >
          <div className="w-full">
            <div className="relative min-w-0 py-2 pt-6">
              <input
                type="range"
                id={id}
                name={name}
                min={MIN}
                max={MAX}
                step={1}
                value={sliderValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                required={required}
                aria-valuemin={MIN}
                aria-valuemax={MAX}
                aria-valuenow={sliderValue}
                aria-valuetext={value === '' ? 'Not selected' : valueLabel ? `${valueLabel} (${sliderValue} of 10)` : `${sliderValue} of 10`}
                className="scale-slider w-full h-10 cursor-pointer appearance-none bg-transparent touch-manipulation disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-stone-200 [&::-webkit-slider-runnable-track]:dark:bg-stone-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-800 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-105 [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-stone-200 [&::-moz-range-track]:dark:bg-stone-600 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-stone-800 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm"
              />
              <span
                className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-[11px] font-medium text-white transition-[left] duration-75 dark:bg-stone-200 dark:text-stone-900"
                style={{ left: `${thumbPercent}%` }}
                aria-hidden
              >
                {valueLabel || sliderValue}
              </span>
            </div>
          </div>
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
