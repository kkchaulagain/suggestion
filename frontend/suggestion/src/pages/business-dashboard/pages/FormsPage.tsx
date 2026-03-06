import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage } from '../../../components/ui'

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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Saved Forms</h3>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void loadForms()}>
            Refresh
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => navigate('/dashboard/forms/create')}>
            Make Form
          </Button>
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500">Loading forms...</p> : null}
      {!loading && savedForms.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No forms saved for this business yet.</p>
      ) : null}

      <div className="mt-4 space-y-4">
        {savedForms.map((form) => (
          <div key={form._id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{form.title}</p>
                <p className="text-xs text-slate-500">Business ID: {form.businessId}</p>
                {form.description ? <p className="mt-1 text-sm text-slate-600">{form.description}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/dashboard/submissions?formId=${encodeURIComponent(form._id)}`)}
                >
                  View Responses
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={() => void handleGenerateQr(form._id)}>
                  Generate QR
                </Button>
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Fields</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.fields.map((field) => (
                <span key={`${form._id}-${field.name}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                  {field.label} ({field.type})
                  {field.options && field.options.length > 0 ? `: ${field.options.join(', ')}` : ''}
                </span>
              ))}
            </div>

            {qrByFormId[form._id] ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <img
                  src={qrByFormId[form._id].qrCodeDataUrl}
                  alt={`QR for ${form.title}`}
                  className="h-36 w-36 rounded border border-white bg-white"
                />
                <a
                  href={qrByFormId[form._id].formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all text-xs text-emerald-700 underline hover:text-emerald-800"
                >
                  {qrByFormId[form._id].formUrl}
                </a>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {error ? <ErrorMessage message={error} className="mt-4" /> : null}
    </Card>
  )
}
