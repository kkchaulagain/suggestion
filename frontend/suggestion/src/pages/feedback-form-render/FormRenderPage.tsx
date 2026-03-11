import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Home, Send } from 'lucide-react'
import { feedbackFormsApi, uploadApi } from '../../utils/apipath'
import type { FeedbackFormConfig, FeedbackFormField } from './types'
import { Button, Card, ErrorMessage, ThemeToggle } from '../../components/ui'
import { EmptyState } from '../../components/layout'
import { FormFieldRenderer } from '../../components/forms'
import type { FormFieldConfig } from '../../components/forms'

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await axios.post<{ url: string }>(uploadApi, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

type FormValues = Record<string, string | string[] | File | undefined>

function isNameIdentityField(field: FeedbackFormField): boolean {
  return field.type === 'name' || field.name.trim().toLowerCase() === 'name'
}

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
  values: FormValues,
  isAnonymous: boolean
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    if (!field.required) continue
    if (isNameIdentityField(field) && isAnonymous) continue
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
  values: FormValues,
  isAnonymous: boolean
): Record<string, string | string[]> {
  const payload: Record<string, string | string[]> = {}
  for (const field of fields) {
    if (isNameIdentityField(field) && isAnonymous) {
      payload[field.name] = ''
      continue
    }
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

const currentYear = new Date().getFullYear()

function FormRenderFooter() {
  return (
    <footer className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400" role="contentinfo">
      © {currentYear} Suggestion Platform
    </footer>
  )
}

export default function FormRenderPage() {
  const { formId } = useParams<{ formId: string }>()
  const [config, setConfig] = useState<FeedbackFormConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<FormValues>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)

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
      const errors = validateRequired(config.fields, values, isAnonymous)
      const hasErrors = Object.keys(errors).length > 0
      if (hasErrors) {
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
          if (field.type === 'image_upload') {
            const v = values[field.name]
            if (v instanceof File) {
              resolvedValues[field.name] = await uploadImage(v)
            }
          }
        }
        const payload = buildSubmitPayload(config.fields, resolvedValues,isAnonymous)
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
    [config, formId, values, isAnonymous]
  )

  if (loading) {
    return (
      <div className="relative flex min-h-[40vh] flex-col items-center justify-center">
        <div className="absolute right-0 top-0 p-2">
          <ThemeToggle />
        </div>
        <EmptyState type="loading" message="Loading form..." />
        <FormRenderFooter />
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 p-2">
          <ThemeToggle />
        </div>
        <Card className="rounded-xl">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Form not found</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error ?? 'Invalid or missing form link.'}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <Home className="h-4 w-4" />
            Go to home
          </Link>
        </Card>
        <FormRenderFooter />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 p-2">
          <ThemeToggle />
        </div>
        <Card padding="lg" className="rounded-xl text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Thank you</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Your response has been recorded.</p>
        </Card>
        <FormRenderFooter />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 p-2">
        <ThemeToggle />
      </div>
      <Card className="rounded-xl sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{config.title}</h1>
      {config.description ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{config.description}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {config.fields.map((field) => (
          <FormFieldRenderer
            key={field.name}
            field={field as FormFieldConfig}
            value={values[field.name]}
            onChange={updateValue}
            error={fieldErrors[field.name]}
            isAnonymous={isAnonymous}
            onAnonymousChange={setIsAnonymous}
          />
        ))}

        {submitError && Object.keys(fieldErrors).length === 0 ? (
          <ErrorMessage message={submitError} />
        ) : null}
      
        <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
          <Send className="h-4 w-4" />
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
        
      
      </form>
      </Card>
      <FormRenderFooter />
    </div>
  )
}
