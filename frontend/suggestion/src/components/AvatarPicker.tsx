import type { ReactNode } from 'react'
import { AVATAR_PRESETS } from '../constants/avatars'
import { Button } from './ui'

export interface AvatarPickerProps {
  value: string | null
  onChange: (avatarId: string | null) => void
  label?: ReactNode
  'aria-label'?: string
}

const avatarBaseClass =
  'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900'

export default function AvatarPicker({
  value,
  onChange,
  label,
  'aria-label': ariaLabel = 'Choose your avatar',
}: AvatarPickerProps) {
  return (
    <div className="space-y-3">
      {label ? (
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
      ) : null}
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-3"
      >
        {AVATAR_PRESETS.map((preset) => {
          const Icon = preset.icon
          const isSelected = value === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={preset.label}
              title={preset.label}
              className={`${avatarBaseClass} ${
                isSelected
                  ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900'
                  : 'hover:opacity-90'
              }`}
              onClick={() => onChange(isSelected ? null : preset.id)}
            >
              <Icon className="h-6 w-6" />
            </button>
          )
        })}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange(null)}
        className="text-slate-600 dark:text-slate-400"
      >
        Skip for now
      </Button>
    </div>
  )
}
