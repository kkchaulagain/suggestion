import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Copy, Eye, Pencil, Plus, QrCode, Trash2, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Button, ErrorMessage, Modal, Tag } from '../../../components/ui'
import { PageHeader, EmptyState, FormCard, QRDisplay } from '../../../components/layout'

interface FeedbackField {
  name: string
  label: string
  type: string
  required: boolean
  options?: string[]
}

export type FormKind = 'form' | 'poll' | 'survey'

interface FeedbackForm {
  _id: string
  title: string
  description?: string
  businessId: string
  fields: FeedbackField[]
  kind?: FormKind
}

interface QrPayload {
  qrCodeDataUrl: string
  formUrl: string
}

/** Human-readable summary for the "Questions included" line: just labels. */
function formatFieldsSummary(fields: FeedbackField[]): string {
  return fields.map((f) => f.label || f.name).join(', ')
}

function kindLabel(kind: FormKind | undefined): string {
  switch (kind) {
    case 'poll':
      return 'Poll'
    case 'survey':
      return 'Survey'
    default:
      return 'Form'
  }
}

export default function FormsPage() {
  const navigate = useNavigate()
  const [savedForms, setSavedForms] = useState<FeedbackForm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrByFormId, setQrByFormId] = useState<Record<string, QrPayload>>({})
  const [shareModalFormId, setShareModalFormId] = useState<string | null>(null)
  const [deleteModalFormId, setDeleteModalFormId] = useState<string | null>(null)
  const [generatingFormId, setGeneratingFormId] = useState<string | null>(null)
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null)
  const [kindFilter, setKindFilter] = useState<FormKind | ''>('')
  const { getAuthHeaders } = useAuth()

  const filteredForms = useMemo(() => {
    if (!kindFilter) return savedForms
    return savedForms.filter((f) => (f.kind ?? 'form') === kindFilter)
  }, [savedForms, kindFilter])

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

  const handleGenerateQr = useCallback(
    async (formId: string) => {
      try {
        setError('')
        setGeneratingFormId(formId)
        const response = await axios.post<QrPayload>(`${feedbackFormsApi}/${formId}/qr`, {}, authHeaders)
        if (response?.data) {
          setQrByFormId((previous) => ({ ...previous, [formId]: response.data }))
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        setError(msg || 'Failed to generate QR.')
      } finally {
        setGeneratingFormId(null)
      }
    },
    [authHeaders],
  )

  const handleOpenShareModal = (formId: string) => {
    setShareModalFormId(formId)
    setError('')
  }

  const handleCopyLink = useCallback((url: string) => {
    void navigator.clipboard.writeText(url)
  }, [])

  const handleDeleteForm = useCallback(async () => {
    if (!deleteModalFormId) return

    try {
      setError('')
      setDeletingFormId(deleteModalFormId)
      await axios.delete(`${feedbackFormsApi}/${deleteModalFormId}`, authHeadersRef.current)
      setSavedForms((previous) => previous.filter((item) => item._id !== deleteModalFormId))
      setQrByFormId((previous) => {
        const next = { ...previous }
        delete next[deleteModalFormId]
        return next
      })
      setShareModalFormId((current) => (current === deleteModalFormId ? null : current))
      setDeleteModalFormId(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Failed to delete feedback form.')
    } finally {
      setDeletingFormId(null)
    }
  }, [deleteModalFormId])

  const shareForm = shareModalFormId ? savedForms.find((f) => f._id === shareModalFormId) : null
  const shareQrPayload = shareModalFormId ? qrByFormId[shareModalFormId] : null
  const deleteForm = deleteModalFormId ? savedForms.find((f) => f._id === deleteModalFormId) : null
  const isGeneratingShare = shareModalFormId !== null && generatingFormId === shareModalFormId

  useEffect(() => {
    if (!shareModalFormId || qrByFormId[shareModalFormId]) return
    void handleGenerateQr(shareModalFormId)
  }, [shareModalFormId, qrByFormId, handleGenerateQr])

  return (
    <section className="space-y-6" aria-label="Saved forms">
      <PageHeader
        title="Your Forms"
        actions={
          <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-h-0 rounded-md px-2.5 py-1.5 text-xs"
              onClick={() => navigate('/dashboard/forms/create')}
            >
              <Plus className="h-4 w-4" />
              Add Form
            </Button>
        }
      />

      {savedForms.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400">Filter:</span>
          <button
            type="button"
            onClick={() => setKindFilter('')}
            className={`rounded px-2 py-1 text-xs font-medium ${!kindFilter ? 'bg-slate-200 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-700'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('form')}
            className={`rounded px-2 py-1 text-xs font-medium ${kindFilter === 'form' ? 'bg-slate-200 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-700'}`}
          >
            Form
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('poll')}
            className={`rounded px-2 py-1 text-xs font-medium ${kindFilter === 'poll' ? 'bg-slate-200 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-700'}`}
          >
            Poll
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('survey')}
            className={`rounded px-2 py-1 text-xs font-medium ${kindFilter === 'survey' ? 'bg-slate-200 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-700'}`}
          >
            Survey
          </button>
        </div>
      ) : null}

      {loading ? (
        <EmptyState type="loading" message="Hold on, we're fetching your forms." />
      ) : savedForms.length === 0 ? (
        <EmptyState
          type="empty"
          message="You don't have any forms yet. Tap Add Form above to create one and start collecting responses."
        />
      ) : filteredForms.length === 0 ? (
        <EmptyState type="empty" message="No forms match the selected filter." />
      ) : null}

      <div className={filteredForms.length > 0 ? 'space-y-0' : undefined}>
        {filteredForms.map((form) => {
          const questionCount = form.fields.length
          const requiredCount = form.fields.filter((field) => field.required).length
          const kind = form.kind ?? 'form'

          return (
            <FormCard
              key={form._id}
              variant="flat"
              title={form.title}
              subtitle={
                <span className="flex items-center gap-2">
                  <span data-testid={`form-kind-badge-${form._id}`}>
                    <Tag className="text-xs">{kindLabel(kind)}</Tag>
                  </span>
                  <span>{`${questionCount} ${questionCount === 1 ? 'question' : 'questions'} - ${requiredCount} required`}</span>
                </span>
              }
              description={form.description || undefined}
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
                Share the form via QR or link, then use Responses to track submissions.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-700"
                  onClick={() => navigate(`/dashboard/forms/${form._id}/edit`)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-700"
                  onClick={() => navigate(`/dashboard/submissions?formId=${encodeURIComponent(form._id)}`)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Responses
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-700"
                  onClick={() => navigate(`/dashboard/submissions?formId=${encodeURIComponent(form._id)}&tab=results`)}
                >
                  Results
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-0 rounded border-slate-200 px-2 py-1 text-xs font-medium dark:border-slate-600"
                  onClick={() => handleOpenShareModal(form._id)}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Share
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="!text-red-600 hover:!text-red-600 dark:!text-red-400 dark:hover:!text-red-400"
                  onClick={() => setDeleteModalFormId(form._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </FormCard>
          )
        })}
      </div>

      {error ? <ErrorMessage message={error} className="mt-4" /> : null}

      <Modal
        isOpen={shareModalFormId !== null}
        onClose={() => {
          setShareModalFormId(null)
          setError('')
        }}
        title={shareForm ? `Share: ${shareForm.title}` : 'Share form'}
        size="md"
      >
        {isGeneratingShare ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">Generating QR code…</p>
        ) : shareQrPayload ? (
          <div className="space-y-4">
            <QRDisplay
              imageDataUrl={shareQrPayload.qrCodeDataUrl}
              formUrl={shareQrPayload.formUrl}
              title={shareForm?.title}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => handleCopyLink(shareQrPayload.formUrl)}
            >
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
          </div>
        ) : shareModalFormId && error ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        ) : null}
      </Modal>

      <Modal
        isOpen={deleteModalFormId !== null}
        onClose={() => {
          if (!deletingFormId) {
            setDeleteModalFormId(null)
            setError('')
          }
        }}
        title="Delete form"
        size="sm"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Delete <span className="font-semibold">{deleteForm?.title}</span>? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={deletingFormId !== null}
            onClick={() => {
              setDeleteModalFormId(null)
              setError('')
            }}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="!text-red-600 hover:!text-red-600 dark:!text-red-400 dark:hover:!text-red-400"
            disabled={deletingFormId !== null}
            onClick={() => void handleDeleteForm()}
          >
            <Trash2 className="h-4 w-4" />
            {deletingFormId !== null ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </section>
  )
}
