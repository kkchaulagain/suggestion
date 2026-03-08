import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Eye, Plus, QrCode, RefreshCw } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Accordion, Button, Card, ErrorMessage } from '../../../components/ui'
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

function toSentenceCase(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function formatFieldLabel(field: FeedbackField) {
  const base = `${field.label} - ${toSentenceCase(field.type)}`
  const required = field.required ? ' (Required)' : ''
  const options = field.options && field.options.length > 0 ? ` [Options: ${field.options.join(', ')}]` : ''

  return `${base}${required}${options}`
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
    <Card>
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

      <div className="mt-4 space-y-4">
        {savedForms.map((form) => {
          const questionCount = form.fields.length
          const requiredCount = form.fields.filter((field) => field.required).length

          return (
            <FormCard
              key={form._id}
              title={form.title}
              subtitle={`${questionCount} ${questionCount === 1 ? 'question' : 'questions'} - ${requiredCount} required`}
              description={form.description || 'No description added yet.'}
              actions={
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-0 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs dark:bg-slate-700"
                    onClick={() => navigate(`/dashboard/submissions?formId=${encodeURIComponent(form._id)}`)}
                  >
                    <Eye className="h-4 w-4" />
                    View Responses
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="min-h-0 rounded-md px-2.5 py-1.5 text-xs"
                    onClick={() => void handleGenerateQr(form._id)}
                  >
                    <QrCode className="h-4 w-4" />
                    Generate QR
                  </Button>
                </>
              }
            >
              <Accordion
                className="mt-3"
                defaultOpenId={`${form._id}-overview`}
                items={[
                  {
                    id: `${form._id}-overview`,
                    title: 'Overview',
                    content: (
                      <p>
                        Use this form to collect visitor details quickly and keep responses organized in one place.
                      </p>
                    ),
                  },
                  {
                    id: `${form._id}-questions`,
                    title: 'Questions included',
                    content:
                      form.fields.length > 0 ? (
                        <ul className="list-inside list-disc space-y-1">
                          {form.fields.map((field) => (
                            <li key={`${form._id}-${field.name}`}>{formatFieldLabel(field)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No questions have been added yet.</p>
                      ),
                  },
                  {
                    id: `${form._id}-sharing`,
                    title: 'Sharing and follow-up',
                    content: (
                      <p>Generate a QR to share this form instantly, then use View Responses to track submissions.</p>
                    ),
                  },
                ]}
              />
              {qrByFormId[form._id] ? (
                <QRDisplay
                  imageDataUrl={qrByFormId[form._id].qrCodeDataUrl}
                  formUrl={qrByFormId[form._id].formUrl}
                  title={form.title}
                />
              ) : null}
            </FormCard>
          )
        })}
      </div>

      {error ? <ErrorMessage message={error} className="mt-4" /> : null}
    </Card>
  )
}
