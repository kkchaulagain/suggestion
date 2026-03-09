import type { ReactNode } from 'react'
import { Textarea } from '../../ui'
import FieldWrapper from './FieldWrapper'

export interface BigTextFieldProps {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  required?: boolean
  error?: string
}

export default function BigTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  required = false,
  error,
}: BigTextFieldProps) {
  return (
    <FieldWrapper id={id} label={label}>
      <Textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        error={error}
      />
    </FieldWrapper>
  )
}
