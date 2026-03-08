import type { ReactNode } from 'react'
import { Label, ErrorMessage } from '../../ui'

export interface FieldWrapperProps {
  id: string
  label: ReactNode
  error?: string
  children: ReactNode
}

export default function FieldWrapper({ id, label, error, children }: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <Label
        id={`${id}-label`}
        htmlFor={id}
        size="md"
        className="inline-flex items-center text-slate-800 dark:text-slate-200"
      >
        {label}
      </Label>
      {children}
      {error ? <ErrorMessage message={error} size="sm" /> : null}
    </div>
  )
}
