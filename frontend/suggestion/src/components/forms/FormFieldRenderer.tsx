import type { ReactNode } from 'react'
import {
  ShortTextField,
  BigTextField,
  CheckboxField,
  RadioField,
  StarRatingField,
  ImageUploadField,
} from './field-types'
import { isStarRatingOptions } from './formFieldUtils'

export type FormFieldType =
  | 'short_text'
  | 'long_text'
  | 'big_text'
  | 'checkbox'
  | 'radio'
  | 'image_upload'

export interface FormFieldConfig {
  name: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  options?: string[]
}

export interface FormFieldRendererProps {
  field: FormFieldConfig
  value: string | string[] | File | undefined
  onChange: (name: string, value: string | string[] | File | undefined) => void
  disabled?: boolean
  error?: string
  labelActions?: ReactNode
}

export default function FormFieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
  error,
  labelActions,
}: FormFieldRendererProps) {
  const id = `field-${field.name}`
  const labelNode = (
    <span className="inline-flex flex-wrap items-center gap-3">
      <span className="inline-flex min-w-0 items-center gap-1">
        <span className="truncate">{field.label}</span>
        {field.required ? <span className="text-rose-600 dark:text-rose-400" aria-hidden>*</span> : null}
      </span>
      {labelActions ? <span className="inline-flex shrink-0 items-center">{labelActions}</span> : null}
    </span>
  )

  const handleChange = (v: string | string[] | File | undefined) => onChange(field.name, v)

  if (field.type === 'short_text' || field.type === 'long_text') {
    return (
      <ShortTextField
        id={id}
        label={labelNode}
        value={(value as string) ?? ''}
        onChange={(v) => handleChange(v)}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (field.type === 'big_text') {
    return (
      <BigTextField
        id={id}
        label={labelNode}
        value={(value as string) ?? ''}
        onChange={(v) => handleChange(v)}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (field.type === 'checkbox' && field.options?.length) {
    return (
      <CheckboxField
        id={id}
        name={field.name}
        label={labelNode}
        value={(Array.isArray(value) ? value : []) as string[]}
        options={field.options}
        onChange={(v) => handleChange(v)}
        disabled={disabled}
        error={error}
      />
    )
  }

  if (field.type === 'radio' && field.options?.length && isStarRatingOptions(field.options)) {
    return (
      <StarRatingField
        id={id}
        name={field.name}
        label={labelNode}
        value={typeof value === 'string' ? value : ''}
        options={field.options}
        onChange={(v) => handleChange(v)}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (field.type === 'radio' && field.options?.length) {
    return (
      <RadioField
        id={id}
        name={field.name}
        label={labelNode}
        value={typeof value === 'string' ? value : ''}
        options={field.options}
        onChange={(v) => handleChange(v)}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (field.type === 'image_upload') {
    return (
      <ImageUploadField
        id={id}
        name={field.name}
        label={labelNode}
        onChange={(v) => handleChange(v)}
        disabled={disabled}
        error={error}
      />
    )
  }

  return null
}
