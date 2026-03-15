import type { ReactNode } from 'react'
import { Input } from '../../ui'
import FieldWrapper from './FieldWrapper'

export interface DateFieldProps {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function DateField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
}: DateFieldProps) {
  return (
    <FieldWrapper id={id} label={label}>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        error={error}
      />
    </FieldWrapper>
  )
}
