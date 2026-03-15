import type { ButtonHTMLAttributes } from 'react'

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Optional label (e.g. for accessibility when used without visible label) */
  'aria-label'?: string
}

export default function Switch({
  id,
  checked,
  onChange,
  className = '',
  disabled,
  'aria-label': ariaLabel,
  ...rest
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? 'bg-emerald-600 dark:bg-emerald-500'
          : 'bg-stone-200 dark:bg-stone-700'
      } ${className}`}
      {...rest}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
        aria-hidden
      />
    </button>
  )
}
