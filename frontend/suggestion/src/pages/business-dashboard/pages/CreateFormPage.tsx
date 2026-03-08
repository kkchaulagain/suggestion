import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, ListChecks, Pencil, Plus, Send, Text, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { FormFieldRenderer } from '../../../components/forms'
import type { FormFieldConfig } from '../../../components/forms'
import { Button, Card, ErrorMessage, Input, Select, Textarea } from '../../../components/ui'
import { EmptyState } from '../../../components/layout'

type FeedbackFieldType = 'checkbox' | 'radio' | 'short_text' | 'long_text' | 'big_text' | 'image_upload'

interface FeedbackField {
  clientId?: string
  name: string
  label: string
  type: FeedbackFieldType
  required: boolean
  placeholder?: string
  options?: string[]
}

interface FeedbackFormResponse {
  feedbackForm: {
    title: string
    description?: string
    fields: FeedbackField[]
  }
}

const OPTION_TYPES: FeedbackFieldType[] = ['checkbox', 'radio']

const fieldTypeOptions: Array<{ value: FeedbackFieldType; label: string }> = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'big_text', label: 'Paragraph' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'image_upload', label: 'Image Upload' },
]

const defaultFields: FeedbackField[] = [
  { clientId: 'default-subject', name: 'subject', label: 'subject', type: 'short_text', required: true, placeholder: '' },
  { clientId: 'default-description', name: 'description', label: 'description', type: 'big_text', required: false, placeholder: '' },
  { clientId: 'default-attachment', name: 'attachment', label: 'attachment', type: 'image_upload', required: false, placeholder: '' },
]

function makeClientId() {
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function toFieldName(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!normalized) return ''
  return /^[a-z]/.test(normalized) ? normalized : `field_${normalized}`
}

function makeDefaultLabel(type: FeedbackFieldType, count: number): string {
  const labels: Record<FeedbackFieldType, string> = {
    short_text: 'Short answer',
    long_text: 'Single line text',
    big_text: 'Paragraph',
    checkbox: 'Checkbox group',
    radio: 'Single choice',
    image_upload: 'Attachment',
  }

  return `${labels[type]} ${count}`
}

function createField(type: FeedbackFieldType, count: number): FeedbackField {
  const label = makeDefaultLabel(type, count)
  return {
    clientId: makeClientId(),
    name: toFieldName(label),
    label,
    type,
    required: false,
    placeholder: '',
    options: OPTION_TYPES.includes(type) ? ['Option 1'] : undefined,
  }
}

function getPreviewValue(field: FeedbackField): string | string[] | File | undefined {
  if (field.type === 'checkbox') return []
  return ''
}

function normalizeLoadedFields(fields: FeedbackField[] | undefined): FeedbackField[] {
  return fields?.length
    ? fields.map((field, index) => ({
        ...field,
        clientId: field.clientId || `loaded-${index}-${field.name}`,
      }))
    : defaultFields
}

export default function CreateFormPage() {
  const navigate = useNavigate()
  const { formId } = useParams<{ formId: string }>()
  const isEditMode = Boolean(formId)

  const [title, setTitle] = useState('Feedback form')
  const [description, setDescription] = useState('test')
  const [fields, setFields] = useState<FeedbackField[]>(defaultFields)
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { getAuthHeaders } = useAuth()

  useEffect(() => {
    if (!isEditMode || !formId) return

    let active = true

    const loadForm = async () => {
      try {
        setLoading(true)
        setError('')
        const { data } = await axios.get<FeedbackFormResponse>(`${feedbackFormsApi}/${formId}`, {
          withCredentials: true,
          headers: getAuthHeaders(),
        })
        if (!active) return
        setTitle(data.feedbackForm.title || 'Feedback form')
        setDescription(data.feedbackForm.description || '')
        setFields(normalizeLoadedFields(data.feedbackForm.fields))
        setEditingFieldIndex(null)
      } catch (err: unknown) {
        if (!active) return
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        setError(msg || 'Failed to load form.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadForm()

    return () => {
      active = false
    }
  }, [formId, isEditMode])

  const updateField = (index: number, updater: (field: FeedbackField) => FeedbackField) => {
    setFields((current) => current.map((field, fieldIndex) => (fieldIndex === index ? updater(field) : field)))
  }

  const handleFieldLabelChange = (index: number, value: string) => {
    updateField(index, (field) => {
      const autoName = toFieldName(field.label)
      const nextName = field.name === autoName ? toFieldName(value) : field.name
      return { ...field, label: value, name: nextName }
    })
    setError('')
  }

  const handleFieldNameChange = (index: number, value: string) => {
    updateField(index, (field) => ({ ...field, name: toFieldName(value) }))
    setError('')
  }

  const handleFieldTypeChange = (index: number, type: FeedbackFieldType) => {
    updateField(index, (field) => ({
      ...field,
      type,
      options: OPTION_TYPES.includes(type) ? (field.options?.length ? field.options : ['Option 1']) : undefined,
    }))
    setError('')
  }

  const handleFieldPlaceholderChange = (index: number, value: string) => {
    updateField(index, (field) => ({ ...field, placeholder: value }))
  }

  const handleFieldRequiredChange = (index: number, required: boolean) => {
    updateField(index, (field) => ({ ...field, required }))
  }

  const handleAddField = (type: FeedbackFieldType) => {
    setFields((current) => {
      const next = [...current, createField(type, current.length + 1)]
      setEditingFieldIndex(next.length - 1)
      return next
    })
    setError('')
  }

  const handleRemoveField = (index: number) => {
    setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index))
    setEditingFieldIndex((current) => {
      if (current === null) return null
      if (current === index) return null
      return current > index ? current - 1 : current
    })
    setError('')
  }

  const handleAddOption = (index: number) => {
    updateField(index, (field) => ({
      ...field,
      options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`],
    }))
  }

  const handleOptionChange = (fieldIndex: number, optionIndex: number, value: string) => {
    updateField(fieldIndex, (field) => ({
      ...field,
      options: (field.options ?? []).map((option, currentIndex) => (currentIndex === optionIndex ? value : option)),
    }))
  }

  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    updateField(fieldIndex, (field) => ({
      ...field,
      options: (field.options ?? []).filter((_, currentIndex) => currentIndex !== optionIndex),
    }))
  }

  const validateFields = () => {
    if (!title.trim()) return 'Form title is required.'

    const seenNames = new Set<string>()

    for (const field of fields) {
      const normalizedName = toFieldName(field.name || field.label)
      if (!field.label.trim() || !normalizedName) {
        return 'Each field needs a label and valid field name.'
      }

      if (seenNames.has(normalizedName.toLowerCase())) {
        return 'Field name must be unique inside the form.'
      }
      seenNames.add(normalizedName.toLowerCase())

      if (OPTION_TYPES.includes(field.type)) {
        const validOptions = (field.options ?? []).map((option) => option.trim()).filter(Boolean)
        if (validOptions.length === 0) {
          return 'Checkbox and radio fields need at least one option.'
        }
      }
    }

    return ''
  }

  const handleSaveForm = async () => {
    const validationError = validateFields()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      fields: fields.map((field) => ({
        name: toFieldName(field.name || field.label),
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        placeholder: field.placeholder?.trim() || undefined,
        options: OPTION_TYPES.includes(field.type)
          ? (field.options ?? []).map((option) => option.trim()).filter(Boolean)
          : undefined,
      })),
    }

    try {
      setSubmitting(true)
      setError('')
      if (isEditMode && formId) {
        await axios.put(`${feedbackFormsApi}/${formId}`, payload, {
          withCredentials: true,
          headers: getAuthHeaders(),
        })
      } else {
        await axios.post(feedbackFormsApi, payload, {
          withCredentials: true,
          headers: getAuthHeaders(),
        })
      }
      navigate('/dashboard/forms')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || `Failed to ${isEditMode ? 'update' : 'save'} form.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <EmptyState type="loading" message="Loading form..." />
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-4 flex justify-start">
        <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/dashboard/forms')}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="rounded-xl sm:p-8">
        <div className="space-y-4">
          <Input id="form-title" label="Form title" value={title} onChange={setTitle} placeholder="Feedback form" />
          <Textarea
            id="form-description"
            label="Form description"
            value={description}
            onChange={setDescription}
            placeholder="Briefly describe this form"
            rows={3}
          />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveForm()
          }}
          className="mt-6 space-y-5"
          noValidate
        >
          {fields.map((field, index) => {
            const isOptionType = OPTION_TYPES.includes(field.type)
            const isEditing = editingFieldIndex === index

            return (
              <div key={field.clientId} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="min-w-0">
                  <FormFieldRenderer
                    field={field as FormFieldConfig}
                    value={getPreviewValue(field)}
                    onChange={() => {}}
                    labelActions={
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingFieldIndex((current) => (current === index ? null : index))}
                          className="border-transparent"
                        >
                          <Pencil className="h-4 w-4" />
                          {isEditing ? 'Close' : 'Edit'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(index)}
                          className="!text-rose-600 hover:!bg-rose-50 dark:!text-rose-400 dark:hover:!bg-rose-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    }
                  />
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        id={`field-label-${index}`}
                        label="Label"
                        value={field.label}
                        onChange={(value) => handleFieldLabelChange(index, value)}
                        placeholder="Field label"
                      />
                      <Input
                        id={`field-name-${index}`}
                        label="Field name"
                        value={field.name}
                        onChange={(value) => handleFieldNameChange(index, value)}
                        placeholder="field_name"
                      />
                      <Select
                        id={`field-type-${index}`}
                        label="Type"
                        value={field.type}
                        onChange={(value) => handleFieldTypeChange(index, value as FeedbackFieldType)}
                        options={fieldTypeOptions}
                      />
                      <Input
                        id={`field-placeholder-${index}`}
                        label="Placeholder"
                        value={field.placeholder ?? ''}
                        onChange={(value) => handleFieldPlaceholderChange(index, value)}
                        placeholder="Optional helper text"
                      />
                    </div>

                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) => handleFieldRequiredChange(index, event.target.checked)}
                      />
                      Required field
                    </label>

                    {isOptionType ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/40">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Options</p>
                          <Button type="button" variant="secondary" size="sm" onClick={() => handleAddOption(index)}>
                            <Plus className="h-4 w-4" />
                            Add option
                          </Button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {(field.options ?? []).map((option, optionIndex) => (
                            <div key={`${field.name}-${optionIndex}`} className="flex items-center gap-2">
                              <Input
                                id={`field-option-${index}-${optionIndex}`}
                                value={option}
                                onChange={(value) => handleOptionChange(index, optionIndex, value)}
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveOption(index, optionIndex)}
                                aria-label={`Remove option ${optionIndex + 1}`}
                                className="!text-rose-600 hover:!bg-rose-50 dark:!text-rose-400 dark:hover:!bg-rose-950/40"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add field after fixed fields</p>
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Button type="button" variant="secondary" size="sm" onClick={() => handleAddField('short_text')}>
                <Text className="h-4 w-4" />
                Short text
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => handleAddField('big_text')}>
                <Text className="h-4 w-4" />
                Paragraph
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => handleAddField('checkbox')}>
                <ListChecks className="h-4 w-4" />
                Checkbox
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => handleAddField('radio')}>
                <ListChecks className="h-4 w-4" />
                Radio
              </Button>
            </div>
          </div>

          {error ? <ErrorMessage message={error} /> : null}

          <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
            <Send className="h-4 w-4" />
            {submitting ? (isEditMode ? 'Updating...' : 'Saving...') : isEditMode ? 'Update Form' : 'Save Form'}
          </Button>
        </form>
      </Card>
    </section>
  )
}
