import type { ReactNode } from 'react'
import { Input } from '../../ui'
import FieldWrapper from './FieldWrapper'

export interface PhoneFieldProps {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function PhoneField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
}: PhoneFieldProps) {
  return (
    <FieldWrapper id={id} label={label}>
      <Input
        id={id}
        type="tel"
        value={value}
        onChange={onChange}
        placeholder={placeholder || '+1 (555) 000-0000'}
        required={required}
        disabled={disabled}
        error={error}
      />
    </FieldWrapper>
  )
}
