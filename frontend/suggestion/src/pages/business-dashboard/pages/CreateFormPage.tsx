import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Button, Card, Input, Select, Tag, ErrorMessage, Textarea } from '../../../components/ui'

type FeedbackFieldType = 'checkbox' | 'radio' | 'short_text' | 'long_text' | 'big_text' | 'image_upload'

interface FeedbackField {
  name: string
  label: string
  type: FeedbackFieldType
  required: boolean
  placeholder?: string
  options?: string[]
}

interface FormTemplate {
  id: string
  label: string
  title: string
  description: string
  fields: FeedbackField[]
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

const formTemplates: FormTemplate[] = [
  {
    id: 'feedback_form',
    label: 'Feedback Form',
    title: 'Feedback form',
    description: 'test',
    fields: [
      { name: 'subject', label: 'subject', type: 'short_text', required: true },
      { name: 'description', label: 'description', type: 'short_text', required: false },
      { name: 'attachment', label: 'attachment', type: 'image_upload', required: false },
    ],
  },
]

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
  const [editingFieldName, setEditingFieldName] = useState<string | null>(null)
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
    setFieldOptions((previous) => [...previous, trimmed])
    setOptionInput('')
    setError('')
  }

  const handleRemoveOption = (option: string) => {
    setFieldOptions((previous) => previous.filter((candidate) => candidate !== option))
  }

  const handleFieldTypeChange = (value: FeedbackFieldType) => {
    setFieldType(value)
    if (!OPTION_TYPES.includes(value)) {
      setFieldOptions([])
      setOptionInput('')
    }
  }

  const resetFieldEditor = () => {
    setFieldLabel('')
    setFieldName('')
    setFieldType('short_text')
    setFieldRequired(false)
    setFieldPlaceholder('')
    setFieldOptions([])
    setOptionInput('')
    setEditingFieldName(null)
  }

  const handleAddOrUpdateField = () => {
    const sanitizedName = toFieldName(fieldName || fieldLabel)
    if (!fieldLabel.trim() || !sanitizedName) {
      setError('Field label and valid field name are required.')
      return
    }

    if (isOptionType && fieldOptions.length === 0) {
      setError('Add at least one option for checkbox / radio fields.')
      return
    }

    const exists = fields.some(
      (field) =>
        field.name.toLowerCase() === sanitizedName.toLowerCase() &&
        field.name.toLowerCase() !== (editingFieldName || '').toLowerCase(),
    )
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

    if (editingFieldName) {
      setFields((previous) =>
        previous.map((field) => (field.name === editingFieldName ? nextField : field)),
      )
    } else {
      setFields((previous) => [...previous, nextField])
    }

    resetFieldEditor()
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
      await axios.post(
        feedbackFormsApi,
        { title: title.trim(), description: description.trim(), fields },
        authHeaders,
      )
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
    if (editingFieldName === fieldName) {
      resetFieldEditor()
    }
  }

  const handleEditField = (field: FeedbackField) => {
    setFieldLabel(field.label)
    setFieldName(field.name)
    setFieldType(field.type)
    setFieldRequired(field.required)
    setFieldPlaceholder(field.placeholder || '')
    setFieldOptions(field.options ? [...field.options] : [])
    setOptionInput('')
    setEditingFieldName(field.name)
    setError('')
  }

  const handleApplyTemplate = (template: FormTemplate) => {
    setTitle(template.title)
    setDescription(template.description)
    setFields(
      template.fields.map((field) => ({
        ...field,
        options: field.options ? [...field.options] : undefined,
      })),
    )
    resetFieldEditor()
    setError('')
  }

  return (
    <section className="grid gap-5 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create Form</h3>
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/dashboard/forms')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Form List
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Prebuilt Templates</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {formTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleApplyTemplate(template)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Use {template.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Only the feedback template from your shared design is available.
            </p>
          </div>

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

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {editingFieldName ? 'Edit Input Field' : 'Add Input Field'}
          </p>
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
            <Select
              id="field-type"
              label="Type"
              value={fieldType}
              onChange={(value) => handleFieldTypeChange(value as FeedbackFieldType)}
              options={fieldTypeOptions}
            />

            {isOptionType ? (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Options</p>
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
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                {fieldOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fieldOptions.map((opt) => (
                      <Tag
                        key={opt}
                        variant="emerald"
                        onRemove={() => handleRemoveOption(opt)}
                        removeLabel={`Remove option ${opt}`}
                      >
                        {opt}
                      </Tag>
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
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={fieldRequired}
                onChange={(event) => setFieldRequired(event.target.checked)}
              />
              Required field
            </label>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleAddOrUpdateField}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              {editingFieldName ? 'Update Field' : 'Add Field'}
            </Button>
            {editingFieldName ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={resetFieldEditor}
                className="w-full"
              >
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </div>

        {error ? <ErrorMessage message={error} className="mt-3" /> : null}

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h4 className="text-sm font-semibold text-slate-800">Template Layout</h4>
          {fields.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Choose a template or add fields manually.</p>
          ) : (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-2xl font-semibold text-slate-900">{title.trim() || 'Feedback form'}</p>
              <p className="mt-1 text-sm text-slate-600">{description.trim() || 'Form description'}</p>

              <div className="mt-5 space-y-4">
                {fields.map((field) => (
                  <div key={field.name} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {field.label}
                          {field.required ? <span className="ml-1 text-rose-600">*</span> : null}
                        </p>
                        <p className="text-xs text-slate-500">
                          {field.name} ({field.type})
                        </p>
                        {field.placeholder ? (
                          <p className="mt-1 text-xs text-slate-500">Placeholder: {field.placeholder}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditField(field)}
                          className="text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Edit
                        </Button>
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
                    </div>

                    {field.type === 'short_text' || field.type === 'long_text' ? (
                      <input
                        type="text"
                        disabled
                        placeholder={field.placeholder || ''}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    ) : null}

                    {field.type === 'big_text' ? (
                      <textarea
                        rows={3}
                        disabled
                        placeholder={field.placeholder || ''}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    ) : null}

                    {field.type === 'image_upload' ? (
                      <input
                        type="file"
                        disabled
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    ) : null}

                    {field.type === 'checkbox' && field.options ? (
                      <div className="space-y-1">
                        {field.options.map((option) => (
                          <label key={`${field.name}-${option}`} className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" disabled />
                            {option}
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {field.type === 'radio' && field.options ? (
                      <div className="space-y-1">
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
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={submitting}
          onClick={() => void handleCreateForm()}
          className="mt-4 w-full"
        >
          <Check className="h-4 w-4" />
          {submitting ? 'Saving...' : 'Save Form'}
        </Button>
      </Card>

      <Card className="xl:col-span-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live Form Preview</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Preview is inside create form page as requested.</p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{title.trim() || 'Untitled Form'}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description.trim() || 'Form description will appear here.'}</p>

          {fields.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Add fields to preview your form.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {fields.map((field) => (
                <div key={`preview-${field.name}`} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {field.label}
                      {field.required ? <span className="ml-1 text-rose-600 dark:text-rose-400">*</span> : null}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(field.name)}
                      className="text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/40"
                    >
                      <Trash2 className="h-4 w-4" />
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
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  ) : null}
                  {field.type === 'image_upload' ? (
                    <div className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">Upload image</div>
                  ) : null}
                  {field.type === 'checkbox' && field.options ? (
                    <div className="mt-2 space-y-1.5">
                      {field.options.map((option) => (
                        <label key={`${field.name}-${option}`} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input type="checkbox" disabled />
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : null}
                  {field.type === 'radio' && field.options ? (
                    <div className="mt-2 space-y-1.5">
                      {field.options.map((option) => (
                        <label key={`${field.name}-${option}`} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
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
