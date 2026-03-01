import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { feedbackFormsApi } from '../../../utils/apipath'

type FeedbackFieldType = 'checkbox' | 'radio' | 'short_text' | 'long_text' | 'big_text' | 'image_upload'

interface FeedbackField {
  name: string
  label: string
  type: FeedbackFieldType
  required: boolean
  placeholder?: string
  options?: string[]
}

const fieldTypeOptions: Array<{ value: FeedbackFieldType; label: string }> = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'big_text', label: 'Big Text' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'image_upload', label: 'Image Upload' },
]

const OPTION_TYPES: FeedbackFieldType[] = ['checkbox', 'radio']

function toFieldName(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!normalized) return ''
  return /^[a-z]/.test(normalized) ? normalized : `field_${normalized}`
}

export default function CreateFormPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FeedbackField[]>([])
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldName, setFieldName] = useState('')
  const [fieldType, setFieldType] = useState<FeedbackFieldType>('short_text')
  const [fieldRequired, setFieldRequired] = useState(false)
  const [fieldPlaceholder, setFieldPlaceholder] = useState('')
  const [fieldOptions, setFieldOptions] = useState<string[]>([])
  const [optionInput, setOptionInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')
  const isOptionType = OPTION_TYPES.includes(fieldType)

  const authHeaders = useMemo(
    () => ({
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
    [token],
  )

  const handleAddOption = () => {
    const trimmed = optionInput.trim()
    if (!trimmed) return
    if (fieldOptions.includes(trimmed)) {
      setError('Option already added.')
      return
    }
    setFieldOptions((prev) => [...prev, trimmed])
    setOptionInput('')
    setError('')
  }

  const handleRemoveOption = (option: string) => {
    setFieldOptions((prev) => prev.filter((o) => o !== option))
  }

  const handleFieldTypeChange = (value: FeedbackFieldType) => {
    setFieldType(value)
    if (!OPTION_TYPES.includes(value)) {
      setFieldOptions([])
      setOptionInput('')
    }
  }

  const handleAddField = () => {
    const sanitizedName = toFieldName(fieldName || fieldLabel)
    if (!fieldLabel.trim() || !sanitizedName) {
      setError('Field label and valid field name are required.')
      return
    }

    if (isOptionType && fieldOptions.length === 0) {
      setError('Add at least one option for checkbox / radio fields.')
      return
    }

    const exists = fields.some((field) => field.name.toLowerCase() === sanitizedName.toLowerCase())
    if (exists) {
      setError('Field name must be unique inside the form.')
      return
    }

    const nextField: FeedbackField = {
      name: sanitizedName,
      label: fieldLabel.trim(),
      type: fieldType,
      required: fieldRequired,
      placeholder: fieldPlaceholder.trim() || undefined,
      options: isOptionType ? [...fieldOptions] : undefined,
    }

    setFields((previous) => [...previous, nextField])
    setFieldLabel('')
    setFieldName('')
    setFieldType('short_text')
    setFieldRequired(false)
    setFieldPlaceholder('')
    setFieldOptions([])
    setOptionInput('')
    setError('')
  }

  const handleCreateForm = async () => {
    if (!title.trim()) {
      setError('Form title is required.')
      return
    }
    if (fields.length === 0) {
      setError('Add at least one input field.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await axios.post(feedbackFormsApi, { title: title.trim(), description: description.trim(), fields }, authHeaders)
      navigate('/business-dashboard/forms')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save form.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveField = (fieldName: string) => {
    setFields((previous) => previous.filter((candidate) => candidate.name !== fieldName))
  }

  return (
    <section className="grid gap-5 xl:grid-cols-5">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Create Form</h3>
          <button
            type="button"
            onClick={() => navigate('/business-dashboard/forms')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Back to Form List
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Form title"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Form description"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Add Input Field</p>
          <div className="mt-3 space-y-2">
            <input
              value={fieldLabel}
              onChange={(event) => {
                const labelValue = event.target.value
                setFieldLabel(labelValue)
                if (!fieldName) {
                  setFieldName(toFieldName(labelValue))
                }
              }}
              placeholder="Field label"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
            <input
              value={fieldName}
              onChange={(event) => setFieldName(toFieldName(event.target.value))}
              placeholder="field_name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
            <select
              value={fieldType}
              onChange={(event) => handleFieldTypeChange(event.target.value as FeedbackFieldType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              {fieldTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {isOptionType ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-700">Options</p>
                <div className="flex gap-2">
                  <input
                    value={optionInput}
                    onChange={(event) => setOptionInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleAddOption()
                      }
                    }}
                    placeholder="Type an option and press Enter"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>
                {fieldOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fieldOptions.map((opt) => (
                      <span key={opt} className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-800">
                        {opt}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt)}
                          className="ml-0.5 font-bold leading-none text-emerald-600 hover:text-rose-600"
                          aria-label={`Remove option ${opt}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <input
              value={fieldPlaceholder}
              onChange={(event) => setFieldPlaceholder(event.target.value)}
              placeholder="Placeholder (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={fieldRequired}
                onChange={(event) => setFieldRequired(event.target.checked)}
              />
              Required field
            </label>
            <button
              type="button"
              onClick={handleAddField}
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add Field
            </button>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleCreateForm()}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Save Form'}
        </button>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <h3 className="text-lg font-bold text-slate-900">Live Form Preview</h3>
        <p className="mt-1 text-sm text-slate-500">Preview is inside create form page as requested.</p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-base font-semibold text-slate-900">{title.trim() || 'Untitled Form'}</p>
          <p className="mt-1 text-sm text-slate-600">{description.trim() || 'Form description will appear here.'}</p>

          {fields.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Add fields to preview your form.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {fields.map((field) => (
                <div key={`preview-${field.name}`} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">
                      {field.label}
                      {field.required ? <span className="ml-1 text-rose-600">*</span> : null}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(field.name)}
                      className="text-xs font-semibold text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                  {field.type === 'big_text' ? (
                    <textarea
                      disabled
                      rows={4}
                      placeholder={field.placeholder || 'Long answer...'}
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  ) : null}
                  {field.type === 'short_text' || field.type === 'long_text' ? (
                    <input
                      disabled
                      type="text"
                      placeholder={field.placeholder || 'Your answer'}
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  ) : null}
                  {field.type === 'image_upload' ? (
                    <div className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500">Upload image</div>
                  ) : null}
                  {field.type === 'checkbox' && field.options ? (
                    <div className="mt-2 space-y-1.5">
                      {field.options.map((option) => (
                        <label key={`${field.name}-${option}`} className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" disabled />
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : null}
                  {field.type === 'radio' && field.options ? (
                    <div className="mt-2 space-y-1.5">
                      {field.options.map((option) => (
                        <label key={`${field.name}-${option}`} className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="radio" disabled />
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
    </section>
  )
}
