import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { feedbackFormsApi, uploadApi } from '../../utils/apipath'
import type { FeedbackFormConfig, FeedbackFormField } from './types'
import { Button, Card, Input, Label, ErrorMessage } from '../../components/ui'

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await axios.post<{ url: string }>(uploadApi, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

type FormValues = Record<string, string | string[] | File | undefined>

function getInitialValues(fields: FeedbackFormField[]): FormValues {
  const initial: FormValues = {}
  for (const field of fields) {
    if (field.type === 'checkbox') {
      initial[field.name] = []
    } else {
      initial[field.name] = ''
    }
  }
  return initial
}

function validateRequired(
  fields: FeedbackFormField[],
  values: FormValues
): string | null {
  for (const field of fields) {
    if (!field.required) continue
    const v = values[field.name]
    if (field.type === 'checkbox') {
      const arr = Array.isArray(v) ? v : []
      if (arr.length === 0) return `${field.label} is required.`
    } else {
      if (v === undefined || v === '' || (typeof v === 'string' && !v.trim())) {
        return `${field.label} is required.`
      }
    }
  }
  return null
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
    } else if (field.type === 'image_upload') {
      payload[field.name] = typeof v === 'string' ? v : ''
    } else {
      payload[field.name] = typeof v === 'string' ? v : (v !== undefined && v !== null ? String(v) : '')
    }
  }
  return payload
}

export default function FormRenderPage() {
  const { formId } = useParams<{ formId: string }>()
  const [config, setConfig] = useState<FeedbackFormConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<FormValues>({})
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
      const status = axios.isAxiosError(err) ? err.response?.status : (err as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 400) {
        setError(msg || 'Form not found.')
      } else {
        setError(msg || 'Failed to load form.')
      }
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
    setSubmitError(null)
  }, [])

  const handleCheckboxChange = useCallback(
    (fieldName: string, optionValue: string, checked: boolean) => {
      setValues((prev) => {
        const current = prev[fieldName]
        const arr = Array.isArray(current) ? [...current] : []
        if (checked) {
          return { ...prev, [fieldName]: [...arr, optionValue] }
        }
        return { ...prev, [fieldName]: arr.filter((o) => o !== optionValue) }
      })
      setSubmitError(null)
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!config || !formId) return
      const requiredError = validateRequired(config.fields, values)
      if (requiredError) {
        setSubmitError(requiredError)
        return
      }
      setSubmitError(null)
      setSubmitting(true)
      try {
        const resolvedValues = { ...values }
        for (const field of config.fields) {
          if (field.type === 'image_upload') {
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-600">Loading form...</p>
      </div>
    )
  }

  if (error || !config) {
    return (
      <Card className="rounded-xl">
        <h1 className="text-lg font-semibold text-slate-900">Form not found</h1>
        <p className="mt-2 text-sm text-slate-600">{error ?? 'Invalid or missing form link.'}</p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Go to home
        </Link>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card padding="lg" className="rounded-xl text-center">
        <h2 className="text-xl font-semibold text-slate-900">Thank you</h2>
        <p className="mt-2 text-slate-600">Your response has been recorded.</p>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl sm:p-8">
      <h1 className="text-xl font-bold text-slate-900">{config.title}</h1>
      {config.description ? (
        <p className="mt-2 text-sm text-slate-600">{config.description}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {config.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={`field-${field.name}`} size="md" required={field.required} className="text-slate-800">
              {field.label}
            </Label>

            {field.type === 'short_text' || field.type === 'long_text' ? (
              <Input
                id={`field-${field.name}`}
                value={(values[field.name] as string) ?? ''}
                onChange={(v) => updateValue(field.name, v)}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : null}

            {field.type === 'big_text' ? (
              <textarea
                id={`field-${field.name}`}
                name={field.name}
                value={(values[field.name] as string) ?? ''}
                onChange={(e) => updateValue(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                required={field.required}
              />
            ) : null}

            {field.type === 'checkbox' && field.options?.length ? (
              <div className="space-y-2">
                {field.options.map((option) => (
                  <label
                    key={`${field.name}-${option}`}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={(values[field.name] as string[] | undefined)?.includes(option) ?? false}
                      onChange={(e) =>
                        handleCheckboxChange(field.name, option, e.target.checked)
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : null}

            {field.type === 'radio' && field.options?.length ? (
              <div className="space-y-2">
                {field.options.map((option) => (
                  <label
                    key={`${field.name}-${option}`}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={option}
                      checked={(values[field.name] as string | undefined) === option}
                      onChange={(e) => updateValue(field.name, e.target.value)}
                      className="border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      required={field.required}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : null}

            {field.type === 'image_upload' ? (
              <input
                id={`field-${field.name}`}
                type="file"
                name={field.name}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  updateValue(field.name, file)
                }}
                className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700"
              />
            ) : null}
          </div>
        ))}

        {submitError ? (
          <ErrorMessage message={submitError} />
        ) : null}

        <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Card>
  )
}
