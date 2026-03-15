import type { ReactNode } from 'react'
import {
  ShortTextField,
  BigTextField,
  CheckboxField,
  RadioField,
  StarRatingField,
  ImageUploadField,
  NameField,
  EmailField,
  Scale1To10Field,
  ScaleChipsField,
  PhoneField,
  DateField,
  TimeField,
  NumberField,
  UrlField,
  DropdownField,
} from './field-types'
import { isStarRatingOptions } from './formFieldUtils'

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'url'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'scale'
  | 'rating'
  | 'image'
  // Legacy types kept for backward compat during migration
  | 'short_text'
  | 'long_text'
  | 'big_text'
  | 'image_upload'
  | 'name'
  | 'scale_1_10'

export interface FormFieldConfig {
  name: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  allowAnonymous?: boolean
  stepId?: string
  stepOrder?: number
  /** Scale field: label at low end (e.g. "Mostly disagree") */
  scaleMinLabel?: string
  /** Scale field: label at high end (e.g. "Mostly agree") */
  scaleMaxLabel?: string
}

export type FormKind = 'form' | 'poll' | 'survey'
export type FormVariant = 'default' | 'sheet'

export interface FormFieldRendererProps {
  field: FormFieldConfig
  value: string | string[] | File | undefined
  onChange: (name: string, value: string | string[] | File | undefined) => void
  disabled?: boolean
  error?: string
  labelActions?: ReactNode
  /** When 'sheet', question label is emphasized (hero). */
  formVariant?: FormVariant
  /** When 'poll' or 'survey', scale fields can render as emoji chips. */
  formKind?: FormKind
}

export default function FormFieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
  error,
  labelActions,
  formVariant = 'default',
  formKind,
}: FormFieldRendererProps) {
  const id = `field-${field.name}`
  const isHeroLabel = formVariant === 'sheet'
  const labelNode = (
    <span className={isHeroLabel ? 'text-lg font-semibold text-stone-900 dark:text-stone-50 sm:text-xl' : undefined}>
      <span className="inline-flex flex-wrap items-center gap-3">
        <span className="inline-flex min-w-0 items-center gap-1">
          <span className="truncate">{field.label}</span>
          {field.required ? <span className="text-rose-600 dark:text-rose-400" aria-hidden>*</span> : null}
        </span>
        {labelActions ? <span className="inline-flex shrink-0 items-center">{labelActions}</span> : null}
      </span>
    </span>
  )

  const handleChange = (v: string | string[] | File | undefined) => onChange(field.name, v)

  const t = field.type

  if (t === 'text' || t === 'short_text' || t === 'long_text') {
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

  if (t === 'textarea' || t === 'big_text') {
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

  if (t === 'email') {
    return (
      <EmailField
        id={id}
        label={labelNode}
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => handleChange(v)}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (t === 'phone') {
    return (
      <PhoneField
        id={id}
        label={labelNode}
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => handleChange(v)}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (t === 'number') {
    return (
      <NumberField
        id={id}
        label={labelNode}
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => handleChange(v)}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (t === 'date') {
    return (
      <DateField
        id={id}
        label={labelNode}
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => handleChange(v)}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (t === 'time') {
    return (
      <TimeField
        id={id}
        label={labelNode}
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => handleChange(v)}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (t === 'url') {
    return (
      <UrlField
        id={id}
        label={labelNode}
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => handleChange(v)}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (t === 'checkbox' && field.options?.length) {
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

  if (t === 'dropdown' && field.options?.length) {
    return (
      <DropdownField
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

  if (t === 'scale' || t === 'scale_1_10') {
    const useChips = (formKind === 'poll' || formKind === 'survey')
    const scaleValue = typeof value === 'string' ? value : ''
    const chipsValue = useChips && scaleValue && !['2', '4', '6', '8', '10'].includes(scaleValue)
      ? '6'
      : scaleValue
    if (useChips) {
      return (
        <ScaleChipsField
          id={id}
          name={field.name}
          label={labelNode}
          value={chipsValue}
          onChange={(v) => handleChange(v)}
          disabled={disabled}
          required={field.required}
          error={error}
        />
      )
    }
    return (
      <Scale1To10Field
        id={id}
        name={field.name}
        label={labelNode}
        value={scaleValue}
        onChange={(v) => handleChange(v)}
        disabled={disabled}
        required={field.required}
        error={error}
      />
    )
  }

  if (t === 'rating' && field.options?.length) {
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

  if (t === 'radio' && field.options?.length && isStarRatingOptions(field.options)) {
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

  if (t === 'radio' && field.options?.length) {
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

  if (t === 'image' || t === 'image_upload') {
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

  if (t === 'name') {
    return (
      <NameField
        id={id}
        label={labelNode}
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => handleChange(v)}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.required}
        isAnonymous={field.allowAnonymous}
        error={error}
      />
    )
  }

  return null
}
