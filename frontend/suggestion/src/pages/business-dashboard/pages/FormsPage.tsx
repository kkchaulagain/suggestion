import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Eye, Plus, QrCode, RefreshCw } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Button, Card, Tag, ErrorMessage } from '../../../components/ui'
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
            <Button type="button" variant="secondary" size="sm" onClick={() => void loadForms()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={() => navigate('/dashboard/forms/create')}>
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
        {savedForms.map((form) => (
          <FormCard
            key={form._id}
            title={form.title}
            subtitle={`Business ID: ${form.businessId}`}
            description={form.description}
            actions={
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/dashboard/submissions?formId=${encodeURIComponent(form._id)}`)}
                >
                  <Eye className="h-4 w-4" />
                  View Responses
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={() => void handleGenerateQr(form._id)}>
                  <QrCode className="h-4 w-4" />
                  Generate QR
                </Button>
              </>
            }
          >
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fields</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.fields.map((field) => (
                <Tag key={`${form._id}-${field.name}`}>
                  {field.label} ({field.type})
                  {field.options && field.options.length > 0 ? `: ${field.options.join(', ')}` : ''}
                </Tag>
              ))}
            </div>
            {qrByFormId[form._id] ? (
              <QRDisplay
                imageDataUrl={qrByFormId[form._id].qrCodeDataUrl}
                formUrl={qrByFormId[form._id].formUrl}
                title={form.title}
              />
            ) : null}
          </FormCard>
        ))}
      </div>

      {error ? <ErrorMessage message={error} className="mt-4" /> : null}
    </Card>
  )
}
