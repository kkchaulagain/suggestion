import type { ReactNode } from 'react'
import { Input } from '../../ui'
import FieldWrapper from './FieldWrapper'

export interface NumberFieldProps {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  min?: number
  max?: number
}

export default function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
}: NumberFieldProps) {
  return (
    <FieldWrapper id={id} label={label}>
      <Input
        id={id}
        type="number"
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
