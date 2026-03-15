import type { ReactNode } from 'react'
import { Input } from '../../ui'
import FieldWrapper from './FieldWrapper'

export interface TimeFieldProps {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function TimeField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
}: TimeFieldProps) {
  return (
    <FieldWrapper id={id} label={label}>
      <Input
        id={id}
        type="time"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        error={error}
      />
    </FieldWrapper>
  )
}
