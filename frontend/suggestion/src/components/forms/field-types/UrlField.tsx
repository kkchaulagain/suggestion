import type { ReactNode } from 'react'
import { Input } from '../../ui'
import FieldWrapper from './FieldWrapper'

export interface UrlFieldProps {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function UrlField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
}: UrlFieldProps) {
  return (
    <FieldWrapper id={id} label={label}>
      <Input
        id={id}
        type="url"
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'https://'}
        required={required}
        disabled={disabled}
        error={error}
      />
    </FieldWrapper>
  )
}
