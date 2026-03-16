import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BarChart3, Copy, Eye, Pencil, Plus, QrCode, Trash2, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi } from '../../../utils/apipath'
import { Button, ErrorMessage, Modal, Tag } from '../../../components/ui'
import { PageHeader, EmptyState, FormCard, FormCardSkeleton, QRDisplay } from '../../../components/layout'

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
  showResultsPublic?: boolean
}

interface QrPayload {
  qrCodeDataUrl: string
  formUrl: string
}

/** Human-readable summary for the "Questions included" line: just labels. Optionally truncate. */
function formatFieldsSummary(fields: FeedbackField[], maxItems = 5): string {
  const labels = fields.map((f) => f.label || f.name)
  if (labels.length <= maxItems) return labels.join(', ')
  return `${labels.slice(0, maxItems).join(', ')} +${labels.length - maxItems} more`
}

/** Show description only if it looks like real content (not empty or placeholder). */
function getDisplayDescription(description: string | undefined): string | undefined {
  const t = (description ?? '').trim()
  if (t.length < 2) return undefined
  return t
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
    <section className="space-y-8" aria-label="Saved forms">
      <PageHeader
        title="Your Forms"
        actions={
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="min-h-9 rounded-xl border-0 bg-stone-900 px-4 font-medium text-white shadow-sm transition hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 dark:focus-visible:ring-stone-500"
            onClick={() => navigate('/dashboard/forms/create')}
          >
            <Plus className="h-4 w-4" />
            Add Form
          </Button>
        }
      />

      {savedForms.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 pt-1" role="group" aria-label="Filter by form type">
          <span className="text-[11px] font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">Filter</span>
          {(['', 'form', 'poll', 'survey'] as const).map((value) => {
            const isSelected = value === '' ? !kindFilter : kindFilter === value
            return (
              <button
                key={value || 'all'}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setKindFilter(value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 dark:focus-visible:ring-stone-500 ${
                  isSelected
                    ? 'border-2 border-stone-600 bg-stone-900 text-white shadow-sm dark:border-stone-400 dark:bg-stone-100 dark:text-stone-900'
                    : 'border-2 border-transparent bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                }`}
              >
                {value === '' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            )
          })}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-5 pt-2" aria-busy="true" aria-label="Loading forms">
          {[1, 2, 3].map((i) => (
            <FormCardSkeleton key={i} />
          ))}
        </div>
      ) : savedForms.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 py-8">
          <EmptyState
            type="empty"
            message="You don't have any forms yet. Tap Add Form above to create one and start collecting responses."
          />
          <Link
            to="/dashboard/onboarding"
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
          >
            Or run the setup wizard to create starter forms and pages
          </Link>
        </div>
      ) : filteredForms.length === 0 ? (
        <EmptyState type="empty" message="No forms match the selected filter." />
      ) : null}

      <div className={filteredForms.length > 0 ? 'space-y-5 pt-2' : undefined}>
        {filteredForms.map((form) => {
          const questionCount = form.fields.length
          const requiredCount = form.fields.filter((field) => field.required).length
          const kind = form.kind ?? 'form'

          return (
            <FormCard
              key={form._id}
              variant="card"
              title={form.title}
              subtitle={
                <span className="flex flex-wrap items-center gap-2">
                  <span data-testid={`form-kind-badge-${form._id}`}>
                    <Tag variant="stone">{kindLabel(kind)}</Tag>
                  </span>
                  <span
                    data-testid={`form-results-visibility-${form._id}`}
                    className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                      form.showResultsPublic
                        ? 'border border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300'
                        : 'border border-stone-200/80 bg-stone-50 text-stone-500 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-400'
                    }`}
                    title={form.showResultsPublic ? 'Respondents can view results after submitting' : 'Results are only visible to you'}
                  >
                    {form.showResultsPublic ? 'Results public' : 'Results private'}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400">{`${questionCount} ${questionCount === 1 ? 'question' : 'questions'} · ${requiredCount} required`}</span>
                </span>
              }
              description={getDisplayDescription(form.description) ?? undefined}
            >
              {form.fields.length > 0 ? (
                <p className="mt-2 line-clamp-2 text-xs text-stone-500 dark:text-stone-400" id={`${form._id}-questions`}>
                  <span className="font-medium text-stone-600 dark:text-stone-300">Questions included:</span>{' '}
                  {formatFieldsSummary(form.fields)}
                </p>
              ) : (
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">No questions added yet.</p>
              )}
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Share the form via QR or link, then use Responses to track submissions.
              </p>
              <div
                className="mt-5 -mx-5 -mb-5 flex flex-wrap items-center gap-2 rounded-b-2xl border-t border-stone-200/80 bg-stone-50/80 px-5 py-4 dark:border-stone-700/80 dark:bg-stone-800/40"
                role="toolbar"
                aria-label={`Actions for ${form.title}`}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-9 rounded-lg border-stone-300 bg-white px-3.5 font-medium text-stone-800 shadow-sm hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
                  onClick={() => navigate(`/dashboard/forms/${form._id}/edit`)}
                >
                  <Pencil className="h-4 w-4 shrink-0" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-9 rounded-lg border-stone-300 bg-white px-3.5 font-medium text-stone-800 shadow-sm hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
                  onClick={() => navigate(`/dashboard/submissions?formId=${encodeURIComponent(form._id)}`)}
                >
                  <Eye className="h-4 w-4 shrink-0" />
                  Responses
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-9 rounded-lg border-stone-300 bg-white px-3.5 font-medium text-stone-800 shadow-sm hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
                  onClick={() => navigate(`/dashboard/submissions?formId=${encodeURIComponent(form._id)}&tab=results`)}
                >
                  <BarChart3 className="h-4 w-4 shrink-0" />
                  Results
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-9 rounded-lg border-stone-300 bg-white px-3.5 font-medium text-stone-800 shadow-sm hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
                  onClick={() => handleOpenShareModal(form._id)}
                >
                  <QrCode className="h-4 w-4 shrink-0" />
                  Share
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-9 rounded-lg border-red-200 bg-red-50 px-3.5 font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                  onClick={() => setDeleteModalFormId(form._id)}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
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
          <p className="text-sm text-stone-600 dark:text-stone-400">Generating QR code…</p>
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
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Delete <span className="font-medium text-stone-900 dark:text-stone-100">{deleteForm?.title}</span>? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-xl border-stone-200 dark:border-stone-600"
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
            className="rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
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
