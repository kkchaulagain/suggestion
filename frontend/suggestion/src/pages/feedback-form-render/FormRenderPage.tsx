import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Home, Send, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { feedbackFormsApi, uploadApi } from '../../utils/apipath'
import type { FeedbackFormConfig, FeedbackFormField, FormStep } from './types'
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

function getInitialValues(fields: FeedbackFormField[]): FormValues {
  const initial: FormValues = {}
  for (const field of fields) {
    if (field.type === 'checkbox') {
      initial[field.name] = []
    } else if (field.type === 'scale' || field.type === 'scale_1_10') {
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

function getStepsWithFields(
  steps: FormStep[] | undefined,
  fields: FeedbackFormField[]
): { step: FormStep; fields: FeedbackFormField[] }[] {
  if (!steps || steps.length === 0) {
    return [{ step: { id: '__default', title: '', description: undefined, order: 0 }, fields }]
  }
  const sorted = [...steps].sort((a, b) => a.order - b.order)
  const stepIds = new Set(sorted.map((s) => s.id))

  const byStep = new Map<string, FeedbackFormField[]>()
  for (const step of sorted) {
    byStep.set(
      step.id,
      fields
        .filter((f) => f.stepId === step.id)
        .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0)),
    )
  }

  const unassigned = fields.filter((f) => !f.stepId || !stepIds.has(f.stepId))
  if (unassigned.length > 0) {
    unassigned.forEach((f, i) => {
      const step = sorted[i % sorted.length]
      const list = byStep.get(step.id) ?? []
      list.push(f)
      byStep.set(step.id, list)
    })
  }

  const hasEmptyStep = [...byStep.values()].some((list) => list.length === 0)
  const hasOverloadedStep = sorted.length > 1 && [...byStep.values()].some((list) => list.length > 1)
  if (sorted.length > 1 && hasEmptyStep && hasOverloadedStep) {
    const allAssigned = sorted.flatMap((step) => byStep.get(step.id) ?? [])
    byStep.clear()
    sorted.forEach((step) => byStep.set(step.id, []))
    allAssigned.forEach((f, i) => {
      const step = sorted[i % sorted.length]
      const list = byStep.get(step.id) ?? []
      list.push(f)
      byStep.set(step.id, list)
    })
  }

  return sorted.map((step) => ({
    step,
    fields: byStep.get(step.id) ?? [],
  }))
}

import FormRenderFooter from './FormRenderFooter'

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
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const stepsWithFields = useMemo(
    () => (config ? getStepsWithFields(config.steps, config.fields) : []),
    [config]
  )
  const isMultistep = stepsWithFields.length > 1
  const totalSteps = stepsWithFields.length
  const currentStepData = stepsWithFields[currentStepIndex]

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

  const handleNext = useCallback(() => {
    if (!currentStepData) return
    const errors = validateRequiredForFields(currentStepData.fields, values)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setCurrentStepIndex((i) => Math.min(i + 1, totalSteps - 1))
  }, [currentStepData, values, totalSteps])

  const handleBack = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(i - 1, 0))
    setFieldErrors({})
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!config || !formId) return

      const allFields = isMultistep
        ? stepsWithFields.flatMap((s) => s.fields)
        : config.fields
      const errors = validateRequiredForFields(allFields, values)
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
    [config, formId, values, isMultistep, stepsWithFields]
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
    const isPollOrSurvey = config?.kind === 'poll' || config?.kind === 'survey'
    return (
      <div className="relative">
        <div className="absolute right-0 top-0 p-2">
          <ThemeToggle />
        </div>
        <Card padding="lg" className="rounded-xl text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Thank you</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {isPollOrSurvey ? 'Thanks for voting!' : 'Your response has been recorded.'}
          </p>
          {formId && config?.showResultsPublic ? (
            <div className="mt-4">
              <Link
                to={`/feedback-forms/${formId}/results`}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                data-testid="see-results-link"
              >
                See results
              </Link>
            </div>
          ) : null}
        </Card>
        <FormRenderFooter />
      </div>
    )
  }

  const fieldsToRender = isMultistep && currentStepData
    ? currentStepData.fields
    : config.fields
  const isLastStep = currentStepIndex === totalSteps - 1

  return (
    <div className="min-h-[40vh] w-full max-w-full overflow-x-hidden px-0 py-2 sm:py-4">
      <div
        className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] dark:border-stone-700/80 dark:bg-stone-900 dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.2),0_8px_24px_-8px_rgba(0,0,0,0.4)] sm:p-10"
        style={{ paddingTop: '2.5rem' }}
      >
        <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
        <div className="min-w-0 pr-10 sm:pr-12">
          <h1 className="break-words text-2xl font-light tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
            {config.title}
          </h1>
          {config.description ? (
            <p className="mt-2 break-words text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              {config.description}
            </p>
          ) : null}

        {isMultistep && currentStepData ? (
          <div
            className="mt-8 min-w-0"
            aria-label={`Step ${currentStepIndex + 1} of ${totalSteps}`}
          >
            <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Step {currentStepIndex + 1} of {totalSteps}
            </p>
            <div className="flex min-w-0 items-start justify-between gap-2">
              {stepsWithFields.map(({ step }, i) => {
                const isCompleted = i < currentStepIndex
                const isCurrent = i === currentStepIndex
                return (
                  <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center last:flex-none">
                    <div className="flex w-full items-center">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-200 ${
                          isCompleted
                            ? 'border-2 border-stone-300 bg-stone-50 text-stone-500 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-400'
                            : isCurrent
                              ? 'border-2 border-stone-900 bg-stone-900 text-white ring-2 ring-stone-900/20 ring-offset-2 ring-offset-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900 dark:ring-stone-100/20 dark:ring-offset-stone-900'
                              : 'border-2 border-stone-200 bg-stone-100 text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-500'
                        }`}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      {i < stepsWithFields.length - 1 ? (
                        <div
                          className={`ml-1.5 mr-1.5 h-0.5 flex-1 min-w-0 rounded-full transition-colors sm:ml-2 sm:mr-2 ${
                            isCompleted ? 'bg-stone-300 dark:bg-stone-600' : 'bg-stone-200 dark:bg-stone-700'
                          }`}
                          aria-hidden
                        />
                      ) : null}
                    </div>
                    <span
                      className={`mt-2 max-w-[4.5rem] truncate text-center text-[11px] font-medium sm:max-w-[5rem] ${
                        isCurrent
                          ? 'text-stone-900 dark:text-stone-100'
                          : isCompleted
                            ? 'text-stone-500 dark:text-stone-400'
                            : 'text-stone-400 dark:text-stone-500'
                      }`}
                      title={step.title || `Step ${i + 1}`}
                    >
                      {step.title || `Step ${i + 1}`}
                    </span>
                  </div>
                )
              })}
            </div>
            {currentStepData.step.description ? (
              <p className="mt-4 break-words text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                {currentStepData.step.description}
              </p>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
          <div className="space-y-6 min-w-0">
            {fieldsToRender.map((field) => (
              <FormFieldRenderer
                key={field.name}
                field={field as FormFieldConfig}
                value={values[field.name]}
                onChange={updateValue}
                error={fieldErrors[field.name]}
              />
            ))}
          </div>

          {submitError && Object.keys(fieldErrors).length === 0 ? (
            <ErrorMessage message={submitError} />
          ) : null}

          {isMultistep ? (
            <div className="relative z-0 flex min-h-[44px] w-full max-w-full flex-shrink-0 flex-col gap-3 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {currentStepIndex > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full min-h-[48px] touch-manipulation rounded-xl border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 sm:min-h-[44px] sm:w-auto sm:min-w-[100px]"
                  onClick={(e) => {
                    e.preventDefault()
                    handleBack()
                  }}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  Back
                </Button>
              ) : (
                <span className="hidden sm:inline sm:flex-1" aria-hidden />
              )}
              {isLastStep ? (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  className="w-full min-h-[48px] touch-manipulation rounded-xl bg-stone-900 font-medium text-white shadow-none transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 sm:min-h-[44px] sm:w-auto sm:min-w-[120px]"
                >
                  <Send className="h-4 w-4 shrink-0" />
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full min-h-[48px] touch-manipulation rounded-xl bg-stone-900 font-medium text-white shadow-none transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 sm:min-h-[44px] sm:w-auto sm:min-w-[100px]"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleNext()
                  }}
                >
                  Next
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Button>
              )}
            </div>
          ) : (
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting}
                className="w-full min-h-[48px] touch-manipulation rounded-xl bg-stone-900 font-medium text-white shadow-none transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 sm:min-h-[44px]"
              >
                <Send className="h-4 w-4 shrink-0" />
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          )}
        </form>
        </div>
      </div>
      <FormRenderFooter />
    </div>
  )
}
