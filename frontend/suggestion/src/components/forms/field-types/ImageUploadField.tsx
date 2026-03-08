import type { ChangeEvent, ReactNode } from 'react'
import FieldWrapper from './FieldWrapper'

export interface ImageUploadFieldProps {
  id: string
  name: string
  label: ReactNode
  onChange: (value: File | undefined) => void
  disabled?: boolean
  error?: string
}

export default function ImageUploadField({
  id,
  name,
  label,
  onChange,
  disabled = false,
  error,
}: ImageUploadFieldProps) {
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <input
        id={id}
        type="file"
        name={name}
        accept="image/*"
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          onChange(file)
        }}
        className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 dark:text-slate-300 dark:file:bg-emerald-900/40 dark:file:text-emerald-300"
      />
    </FieldWrapper>
  )
}
