import { useMemo, useState } from 'react'
import axios from 'axios'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { Button, ErrorMessage, Input, Textarea, Select } from '../../../components/ui'
import {
  BUSINESS_CREATE_STEPS,
  getInitialCreateValues,
  validateStep,
  valuesToCreatePayload,
} from '../config/businessCreateConfig'
import { businessesListApi } from '../../../utils/apipath'

export interface BusinessCreateWizardProps {
  authConfig: { withCredentials: boolean; headers: Record<string, string> }
  onCancel: () => void
  onSuccess: () => void
}

export default function BusinessCreateWizard({
  authConfig,
  onCancel,
  onSuccess,
}: BusinessCreateWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [values, setValues] = useState(() => getInitialCreateValues())
  const [stepError, setStepError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isReview = stepIndex >= BUSINESS_CREATE_STEPS.length
  const step = BUSINESS_CREATE_STEPS[stepIndex]

  const setField = (name: string, v: string) => {
    setValues((prev) => ({ ...prev, [name]: v }))
    setStepError(null)
  }

  const handleNext = () => {
    const err = validateStep(stepIndex, values)
    if (err) {
      setStepError(err)
      return
    }
    setStepError(null)
    if (stepIndex < BUSINESS_CREATE_STEPS.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      const finalErr = validateStep(BUSINESS_CREATE_STEPS.length - 1, values)
      if (finalErr) {
        setStepError(finalErr)
        return
      }
      setStepIndex(BUSINESS_CREATE_STEPS.length)
    }
  }

  const handleBack = () => {
    setStepError(null)
    setSubmitError('')
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1)
    } else {
      onCancel()
    }
  }

  const payload = useMemo(() => valuesToCreatePayload(values), [values])

  const handleSubmit = async () => {
    setSubmitError('')
    if (!payload.businessname || !payload.description) {
      setSubmitError('Name and description are required.')
      return
    }
    setSubmitting(true)
    try {
      await axios.post(`${businessesListApi}`, payload, authConfig)
      onSuccess()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSubmitError(msg || 'Could not create business.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6" data-testid="business-create-wizard">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add business</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isReview
              ? 'Review and create'
              : `Step ${stepIndex + 1} of ${BUSINESS_CREATE_STEPS.length}: ${step?.title}`}
          </p>
        </div>
        <div className="flex gap-2">
          {BUSINESS_CREATE_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-2 w-8 rounded-full ${
                i === stepIndex || (isReview && i === BUSINESS_CREATE_STEPS.length - 1)
                  ? 'bg-emerald-600 dark:bg-emerald-500'
                  : i < stepIndex
                    ? 'bg-emerald-300 dark:bg-emerald-800'
                    : 'bg-slate-200 dark:bg-slate-700'
              }`}
              aria-hidden
            />
          ))}
        </div>
      </div>

      {!isReview && step ? (
        <div className="space-y-4">
          {step.description ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
          ) : null}
          {step.fields.map((f) => {
            const val = values[f.name] ?? ''
            if (f.type === 'textarea') {
              return (
                <Textarea
                  key={f.name}
                  id={`create-${f.name}`}
                  label={f.label}
                  value={val}
                  onChange={(v) => setField(f.name, v)}
                  placeholder={f.placeholder}
                  required={f.required}
                  rows={4}
                />
              )
            }
            if (f.type === 'select' && f.options) {
              return (
                <Select
                  key={f.name}
                  id={`create-${f.name}`}
                  label={f.label}
                  value={val || f.options[0]?.value || ''}
                  onChange={(v) => setField(f.name, v)}
                  options={f.options}
                  required={f.required}
                />
              )
            }
            const inputType =
              f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : f.type === 'url' ? 'url' : 'text'
            return (
              <Input
                key={f.name}
                id={`create-${f.name}`}
                label={f.label}
                type={inputType}
                value={val}
                onChange={(v) => setField(f.name, v)}
                placeholder={f.placeholder}
                required={f.required}
              />
            )
          })}
          {stepError ? <ErrorMessage message={stepError} /> : null}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/50">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-700 dark:text-slate-300">Name</dt>
              <dd className="text-slate-600 dark:text-slate-400">{payload.businessname}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700 dark:text-slate-300">Type</dt>
              <dd className="text-slate-600 dark:text-slate-400">{payload.type}</dd>
            </div>
            {payload.location ? (
              <div>
                <dt className="font-semibold text-slate-700 dark:text-slate-300">Location</dt>
                <dd className="text-slate-600 dark:text-slate-400">{payload.location}</dd>
              </div>
            ) : null}
            {payload.pancardNumber ? (
              <div>
                <dt className="font-semibold text-slate-700 dark:text-slate-300">PAN / tax ID</dt>
                <dd className="text-slate-600 dark:text-slate-400">{payload.pancardNumber}</dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="font-semibold text-slate-700 dark:text-slate-300">Description</dt>
              <dd className="whitespace-pre-wrap text-slate-600 dark:text-slate-400">{payload.description}</dd>
            </div>
            {payload.customFields?.length ? (
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-700 dark:text-slate-300">Extra</dt>
                <dd className="text-slate-600 dark:text-slate-400">
                  {payload.customFields.map((c) => (
                    <div key={c.key}>
                      {c.key}: {String(c.value)}
                    </div>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
          {submitError ? <ErrorMessage message={submitError} className="mt-4" /> : null}
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          data-testid={stepIndex === 0 ? 'wizard-cancel' : 'wizard-back'}
          onClick={handleBack}
          aria-label={stepIndex === 0 ? 'Cancel add business' : 'Back'}
        >
          <ArrowLeft className="h-4 w-4" />
          {stepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>
        {!isReview ? (
          <Button type="button" variant="primary" size="sm" onClick={handleNext}>
            {stepIndex === BUSINESS_CREATE_STEPS.length - 1 ? 'Review' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setStepIndex(BUSINESS_CREATE_STEPS.length - 1)}>
              <X className="h-4 w-4" />
              Edit
            </Button>
            <Button type="button" variant="primary" size="sm" disabled={submitting} onClick={() => void handleSubmit()}>
              <Check className="h-4 w-4" />
              {submitting ? 'Creating…' : 'Create business'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
