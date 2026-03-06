import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Button, Card, Input, ErrorMessage, Textarea } from '../../../components/ui'

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

  const { getAuthHeaders } = useAuth()
  const isOptionType = OPTION_TYPES.includes(fieldType)

  const authHeaders = useMemo(
    () => ({
      withCredentials: true,
      headers: getAuthHeaders(),
    }),
    [getAuthHeaders],
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
      navigate('/dashboard/forms')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Failed to save form.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveField = (fieldName: string) => {
    setFields((previous) => previous.filter((candidate) => candidate.name !== fieldName))
  }

  return (
    <section className="grid gap-5 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Create Form</h3>
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/dashboard/forms')}>
            Back to Form List
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <Input
            id="form-title"
            value={title}
            onChange={setTitle}
            placeholder="Form title"
          />
          <Textarea
            id="form-description"
            value={description}
            onChange={setDescription}
            placeholder="Form description"
            rows={3}
          />
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Add Input Field</p>
          <div className="mt-3 space-y-2">
            <Input
              id="field-label"
              value={fieldLabel}
              onChange={(v) => {
                setFieldLabel(v)
                setFieldName(toFieldName(v))
              }}
              placeholder="Field label"
            />
            <Input
              id="field-name"
              value={fieldName}
              onChange={(v) => setFieldName(toFieldName(v))}
              placeholder="field_name"
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
                  <div className="flex-1">
                    <Input
                      id="option-input"
                      value={optionInput}
                      onChange={setOptionInput}
                      placeholder="Type an option and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddOption()
                        }
                      }}
                    />
                  </div>
                  <Button type="button" variant="primary" size="sm" onClick={handleAddOption}>
                    Add
                  </Button>
                </div>
                {fieldOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fieldOptions.map((opt) => (
                      <span key={opt} className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-800">
                        {opt}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(opt)}
                          aria-label={`Remove option ${opt}`}
                          className="!p-0.5 min-w-0 text-emerald-600 hover:text-rose-600"
                        >
                          x
                        </Button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <Input
              id="field-placeholder"
              value={fieldPlaceholder}
              onChange={setFieldPlaceholder}
              placeholder="Placeholder (optional)"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={fieldRequired}
                onChange={(event) => setFieldRequired(event.target.checked)}
              />
              Required field
            </label>
            <Button type="button" variant="primary" size="md" onClick={handleAddField} className="w-full">
              Add Field
            </Button>
          </div>
        </div>

        {error ? <ErrorMessage message={error} className="mt-3" /> : null}

        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={submitting}
          onClick={() => void handleCreateForm()}
          className="mt-4 w-full"
        >
          {submitting ? 'Saving...' : 'Save Form'}
        </Button>
      </Card>

      <Card className="xl:col-span-2">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(field.name)}
                      className="text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Remove
                    </Button>
                  </div>
                  {field.type === 'big_text' ? (
                    <Textarea
                      id={`preview-${field.name}`}
                      value=""
                      onChange={() => {}}
                      placeholder={field.placeholder || 'Long answer...'}
                      rows={4}
                      disabled
                      className="mt-2"
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
      </Card>
    </section>
  )
}
