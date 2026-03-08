import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Eye, Plus, QrCode, RefreshCw } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Button, ErrorMessage } from '../../../components/ui'
import { PageHeader, EmptyState, FormCard, QRDisplay } from '../../../components/layout'

interface FeedbackField {
  name: string
  label: string
  type: string
  required: boolean
  options?: string[]
}

interface FeedbackForm {
  _id: string
  title: string
  description?: string
  businessId: string
  fields: FeedbackField[]
}

interface QrPayload {
  qrCodeDataUrl: string
  formUrl: string
}

/** Human-readable summary for the "Questions included" line: just labels. */
function formatFieldsSummary(fields: FeedbackField[]): string {
  return fields.map((f) => f.label || f.name).join(', ')
}

export default function FormsPage() {
  const navigate = useNavigate()
  const [savedForms, setSavedForms] = useState<FeedbackForm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrByFormId, setQrByFormId] = useState<Record<string, QrPayload>>({})
  const { getAuthHeaders } = useAuth()

  const authHeaders = useMemo(
    () => ({
      withCredentials: true,
      headers: getAuthHeaders(),
    }),
    [getAuthHeaders],
  )
  const authHeadersRef = useRef(authHeaders)
  authHeadersRef.current = authHeaders

  const loadForms = useCallback(async () => {
    const headers = authHeadersRef.current
    try {
      setLoading(true)
      setError('')
      const response = await axios.get<{ feedbackForms: FeedbackForm[] }>(feedbackFormsApi, headers)
      setSavedForms(response.data.feedbackForms ?? [])
    } catch {
      setError('Unable to load forms. Please check business login.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadForms()
  }, [loadForms])

  const handleGenerateQr = async (formId: string) => {
    try {
      setError('')
      const response = await axios.post<QrPayload>(`${feedbackFormsApi}/${formId}/qr`, {}, authHeaders)
      setQrByFormId((previous) => ({ ...previous, [formId]: response.data }))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Failed to generate QR.')
    }
  }

  return (
    <section className="space-y-6" aria-label="Saved forms">
      <PageHeader
        title="Saved Forms"
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-0 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs dark:bg-slate-700"
              onClick={() => void loadForms()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-h-0 rounded-md px-2.5 py-1.5 text-xs"
              onClick={() => navigate('/dashboard/forms/create')}
            >
              <Plus className="h-4 w-4" />
              Make Form
            </Button>
          </>
        }
      />

      {loading ? (
        <EmptyState type="loading" message="Loading forms..." />
      ) : savedForms.length === 0 ? (
        <EmptyState type="empty" message="No forms saved for this business yet." />
      ) : null}

      <div className={savedForms.length > 0 ? 'space-y-0' : undefined}>
        {savedForms.map((form) => {
          const questionCount = form.fields.length
          const requiredCount = form.fields.filter((field) => field.required).length

          return (
            <FormCard
              key={form._id}
              variant="flat"
              title={form.title}
              subtitle={`${questionCount} ${questionCount === 1 ? 'question' : 'questions'} - ${requiredCount} required`}
              description={form.description || undefined}
              actions={
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-700"
                    onClick={() => navigate(`/dashboard/submissions?formId=${encodeURIComponent(form._id)}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Responses
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="min-h-0 rounded border-slate-200 px-2 py-1 text-xs font-medium dark:border-slate-600"
                    onClick={() => void handleGenerateQr(form._id)}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Generate QR
                  </Button>
                </>
              }
            >
              {form.fields.length > 0 ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" id={`${form._id}-questions`}>
                  <span className="font-medium text-slate-600 dark:text-slate-300">Questions included:</span>{' '}
                  {formatFieldsSummary(form.fields)}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No questions added yet.</p>
              )}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Generate a QR to share, then use View Responses to track submissions.
              </p>
              {qrByFormId[form._id] ? (
                <div className="mt-3">
                  <QRDisplay
                    imageDataUrl={qrByFormId[form._id].qrCodeDataUrl}
                    formUrl={qrByFormId[form._id].formUrl}
                    title={form.title}
                  />
                </div>
              ) : null}
            </FormCard>
          )
        })}
      </div>

      {error ? <ErrorMessage message={error} className="mt-4" /> : null}
    </section>
  )
}
