import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { Send } from 'lucide-react'
import { feedbackFormsApi, uploadApi } from '../../utils/apipath'
import type { FeedbackFormConfig, FeedbackFormField } from './types'
import { Button, Card, ErrorMessage } from '../../components/ui'
import { FormFieldRenderer } from '../../components/forms'
import type { FormFieldConfig } from '../../components/forms'

type FormValues = Record<string, string | string[] | File | undefined>

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await axios.post<{ url: string }>(uploadApi, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

function getInitialValues(fields: FeedbackFormField[]): FormValues {
  const initial: FormValues = {}
  for (const field of fields) {
    if (field.type === 'checkbox') {
      initial[field.name] = []
    } else if (field.type === 'scale' || field.type === 'scale_1_10' || field.type === 'scale_emoji') {
      initial[field.name] = '6'
    } else {
      initial[field.name] = ''
    }
  }
  return initial
}

function validateRequiredForFields(
  fields: FeedbackFormField[],
  values: FormValues
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    if (!field.required) continue
    const v = values[field.name]
    if (field.type === 'checkbox') {
      const arr = Array.isArray(v) ? v : []
      if (arr.length === 0) errors[field.name] = `${field.label} is required.`
    } else {
      if (v === undefined || v === '' || (typeof v === 'string' && !v.trim())) {
        errors[field.name] = `${field.label} is required.`
      }
    }
  }
  return errors
}

function buildSubmitPayload(
  fields: FeedbackFormField[],
  values: FormValues
): Record<string, string | string[]> {
  const payload: Record<string, string | string[]> = {}
  for (const field of fields) {
    const v = values[field.name]
    if (field.type === 'checkbox') {
      payload[field.name] = Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
    } else if (field.type === 'image_upload' || field.type === 'image') {
      payload[field.name] = typeof v === 'string' ? v : ''
    } else {
      payload[field.name] = typeof v === 'string' ? v : (v !== undefined && v !== null ? String(v) : '')
    }
  }
  return payload
}

interface EmbeddedFormBlockProps {
  formId: string
}

export default function EmbeddedFormBlock({ formId }: EmbeddedFormBlockProps) {
  const [config, setConfig] = useState<FeedbackFormConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<FormValues>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadForm = useCallback(async () => {
    if (!formId) {
      setError('Missing form ID')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const { data } = await axios.get<{ feedbackForm: FeedbackFormConfig }>(
        `${feedbackFormsApi}/${formId}`
      )
      setConfig(data.feedbackForm)
      setValues(getInitialValues(data.feedbackForm.fields))
    } catch (err) {
      const msg =
        (axios.isAxiosError(err) ? err.response?.data?.error : null) ??
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Form not found.')
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    void loadForm()
  }, [loadForm])

  const updateValue = useCallback((name: string, value: string | string[] | File | undefined) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
    setSubmitError(null)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!config || !formId) return

      const errors = validateRequiredForFields(config.fields, values)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setSubmitError(null)
        return
      }
      setFieldErrors({})
      setSubmitError(null)
      setSubmitting(true)
      try {
        const resolvedValues = { ...values }
        for (const field of config.fields) {
          if (field.type === 'image_upload' || field.type === 'image') {
            const v = values[field.name]
            if (v instanceof File) {
              resolvedValues[field.name] = await uploadImage(v)
            }
          }
        }
        const payload = buildSubmitPayload(config.fields, resolvedValues)
        await axios.post(`${feedbackFormsApi}/${formId}/submit`, payload)
        setSubmitted(true)
      } catch (err) {
        const msg = axios.isAxiosError(err)
          ? (err.response?.data?.error as string | undefined)
          : (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        setSubmitError(msg ?? 'Failed to submit. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [config, formId, values]
  )

  if (loading) {
    return (
      <Card className="rounded-xl p-6">
        <p className="text-sm text-stone-500 dark:text-stone-400">Loading form…</p>
      </Card>
    )
  }

  if (error || !config) {
    return (
      <Card className="rounded-xl p-6">
        <p className="text-sm text-stone-600 dark:text-stone-400">{error ?? 'Form not found.'}</p>
      </Card>
    )
  }

  if (submitted) {
    const headline = config.thankYouHeadline || 'Response recorded'
    const message = config.thankYouMessage || 'Thanks for your feedback.'
    return (
      <Card className="rounded-xl p-6 text-center">
        <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{headline}</p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{message}</p>
      </Card>
    )
  }

  const formKind = config.kind ?? 'form'
  const submitLabel = formKind === 'poll' ? 'Cast Vote' : formKind === 'survey' ? 'Submit Vote' : 'Submit'

  return (
    <Card className="rounded-xl p-6">
      {config.title ? (
        <h3 className="mb-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
          {config.title}
        </h3>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-6">
          {config.fields.map((field) => (
            <FormFieldRenderer
              key={field.name}
              field={field as FormFieldConfig}
              value={values[field.name]}
              onChange={updateValue}
              error={fieldErrors[field.name]}
              formKind={formKind}
              formVariant="sheet"
            />
          ))}
        </div>
        {submitError ? <ErrorMessage message={submitError} /> : null}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={submitting}
          className="w-full min-h-[44px] rounded-xl"
        >
          <Send className="h-4 w-4 shrink-0" />
          {submitting ? 'Submitting…' : submitLabel}
        </Button>
      </form>
    </Card>
  )
}
