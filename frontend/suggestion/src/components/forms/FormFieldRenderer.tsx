import type { ChangeEvent, ReactNode } from 'react'
import { Input, Label, Textarea, ErrorMessage } from '../ui'

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

  if (field.type === 'short_text' || field.type === 'long_text') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} size="md" className="inline-flex items-center">
          {labelNode}
        </Label>
        <Input
          id={id}
          type="text"
          value={(value as string) ?? ''}
          onChange={(v) => onChange(field.name, v)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={disabled}
          error={error}
        />
      </div>
    )
  }

  if (field.type === 'big_text') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} size="md" className="inline-flex items-center">
          {labelNode}
        </Label>
        <Textarea
          id={id}
          value={(value as string) ?? ''}
          onChange={(v) => onChange(field.name, v)}
          placeholder={field.placeholder}
          rows={4}
          required={field.required}
          disabled={disabled}
          error={error}
        />
      </div>
    )
  }

  if (field.type === 'checkbox' && field.options?.length) {
    const arr = (Array.isArray(value) ? value : []) as string[]
    return (
      <div className="space-y-2">
        <Label htmlFor={id} size="md" className="inline-flex items-center text-slate-800 dark:text-slate-200">
          {labelNode}
        </Label>
        <div className="space-y-2">
          {field.options.map((option) => (
            <label
              key={`${field.name}-${option}`}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
            >
              <input
                type="checkbox"
                name={field.name}
                checked={arr.includes(option)}
                onChange={(e) => {
                  const checked = e.target.checked
                  if (checked) {
                    onChange(field.name, [...arr, option])
                  } else {
                    onChange(field.name, arr.filter((o) => o !== option))
                  }
                }}
                disabled={disabled}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:focus:ring-emerald-500"
              />
              {option}
            </label>
          ))}
        </div>
        {error ? <ErrorMessage message={error} size="sm" /> : null}
      </div>
    )
  }

  if (field.type === 'radio' && field.options?.length) {
    const str = typeof value === 'string' ? value : ''
    return (
      <div className="space-y-2">
        <Label htmlFor={id} size="md" className="inline-flex items-center text-slate-800 dark:text-slate-200">
          {labelNode}
        </Label>
        <div className="space-y-2">
          {field.options.map((option) => (
            <label
              key={`${field.name}-${option}`}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
            >
              <input
                type="radio"
                name={field.name}
                value={option}
                checked={str === option}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={disabled}
                required={field.required}
                className="border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:focus:ring-emerald-500"
              />
              {option}
            </label>
          ))}
        </div>
        {error ? <ErrorMessage message={error} size="sm" /> : null}
      </div>
    )
  }

  if (field.type === 'image_upload') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} size="md" className="inline-flex items-center text-slate-800 dark:text-slate-200">
          {labelNode}
        </Label>
        <input
          id={id}
          type="file"
          name={field.name}
          accept="image/*"
          disabled={disabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            onChange(field.name, file)
          }}
          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 dark:text-slate-300 dark:file:bg-emerald-900/40 dark:file:text-emerald-300"
        />
        {error ? <ErrorMessage message={error} size="sm" /> : null}
      </div>
    )
  }

  return null
}
