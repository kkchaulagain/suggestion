import type { ReactNode } from 'react'
import { Input } from '../../ui'
import FieldWrapper from './FieldWrapper'

export interface ShortTextFieldProps {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function ShortTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
}: ShortTextFieldProps) {
  return (
    <FieldWrapper id={id} label={label}>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={error}
      />
    </FieldWrapper>
  )
}
