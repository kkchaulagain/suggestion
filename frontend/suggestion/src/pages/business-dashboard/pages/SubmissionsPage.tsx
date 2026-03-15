import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Eye, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi, feedbackFormSubmissionsApi } from '../../../utils/apipath'
import { Button, ErrorMessage, Modal, Tag } from '../../../components/ui'
import { EmptyState, FormCard, PageHeader, Pagination } from '../../../components/layout'
import { FormResultsView, getEmojiScaleDisplay } from '../../../components/results'
import SubmissionsFilter from '../components/SubmissionsFilter'

interface FormSnapshotField {
  name: string
  label: string
  type: string
  options?: string[]
}

interface Submission {
  _id: string
  formId: string
  formTitle: string
  formSnapshot: FormSnapshotField[]
  responses: Record<string, string | string[]>
  submittedAt: string
}

interface FeedbackForm {
  _id: string
  title: string
}

function formatSubmittedAt(iso: string): string {
  try {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
  } catch {
    return iso
  }
}

/** Relative time for recency at a glance (e.g. "2h ago", "Yesterday"). */
function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const now = Date.now()
    const ms = now - d.getTime()
    const sec = Math.floor(ms / 1000)
    const min = Math.floor(ms / 60000)
    const hour = Math.floor(ms / 3600000)
    const day = Math.floor(ms / 86400000)
    if (sec < 60) return 'Just now'
    if (min < 60) return `${min}m ago`
    if (hour < 24) return `${hour}h ago`
    if (day === 1) return 'Yesterday'
    if (day < 7) return `${day} days ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

/** Picks one highlight answer for the card: choice (radio/select), scale/emoji, or first short text. */
function getKeyAnswer(submission: Submission): { label: string; value: string; isEmoji?: boolean } | null {
  const skipTypes = ['image', 'image_upload', 'file']
  for (const field of submission.formSnapshot) {
    if (skipTypes.includes(field.type)) continue
    const raw = submission.responses[field.name]
    if (raw == null) continue
    const label = field.label || field.name
    if (field.type === 'radio' || field.type === 'select' || (field.options && field.options.length > 0)) {
      const value = Array.isArray(raw) ? raw[0] : String(raw).trim()
      if (value) return { label, value, isEmoji: false }
    }
    if (field.type === 'scale' || field.type === 'scale_emoji' || field.type === 'scale_1_10') {
      const value = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0] : ''
      if (value) {
        const emojiDisplay = getEmojiScaleDisplay(value)
        if (emojiDisplay) return { label, value: `${emojiDisplay.emoji} ${emojiDisplay.label}`, isEmoji: true }
        return { label, value, isEmoji: false }
      }
    }
    const text = Array.isArray(raw) ? raw.join(', ') : String(raw).trim()
    if (text.length > 0 && !text.startsWith('http') && !text.startsWith('data:')) {
      const short = text.length > 60 ? `${text.slice(0, 60)}…` : text
      return { label, value: short, isEmoji: false }
    }
  }
  return null
}

/** Submitter name from a name-like field for "From: X" on the card. Prefers labels with "name" over "email". */
function getSubmitterDisplay(submission: Submission): string | undefined {
  const isNameField = (l: string) => /(^|\s)(your\s+)?name|full\s+name|submitter/i.test(l) && !/e-?mail/i.test(l)
  for (const field of submission.formSnapshot) {
    const label = field.label || field.name
    if (!isNameField(label)) continue
    const raw = submission.responses[field.name]
    if (raw == null) continue
    const text = Array.isArray(raw) ? raw[0] : String(raw).trim()
    if (text.length > 0 && text.length < 100 && !text.includes('@')) return text
  }
  return undefined
}

/** Whether submission is from the last 24h for "New" badge. */
function isRecent(iso: string, withinMs = 86400000): boolean {
  try {
    const d = new Date(iso)
    return !Number.isNaN(d.getTime()) && Date.now() - d.getTime() < withinMs
  } catch {
    return false
  }
}

/** Human-readable list of field labels for "Questions answered" line (like Forms "Questions included"). */
function formatSubmissionFieldsSummary(fields: FormSnapshotField[], maxItems = 5): string {
  const labels = fields.map((f) => f.label || f.name)
  if (labels.length <= maxItems) return labels.join(', ')
  return `${labels.slice(0, maxItems).join(', ')} +${labels.length - maxItems} more`
}

/** One-line preview from first short text response for card description. Skips images and long blobs. */
function getResponsePreview(submission: Submission, maxLen = 80): string | undefined {
  const skipTypes = ['image', 'image_upload', 'file']
  for (const field of submission.formSnapshot) {
    if (skipTypes.includes(field.type)) continue
    const value = submission.responses[field.name]
    if (value == null) continue
    const text = Array.isArray(value) ? value.join(', ') : String(value).trim()
    if (text.length === 0) continue
    if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:')) continue
    if (text.length > maxLen) return `${text.slice(0, maxLen)}…`
    return text
  }
  return undefined
}

function isImageUrl(value: string, fieldType: string): boolean {
  if (!value || typeof value !== 'string') return false
  const trimmed = value.trim()
  const lower = trimmed.toLowerCase()
  const isHttpOrData =
    lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:image/')
  if (!isHttpOrData) return false
  if (fieldType === 'image_upload' || fieldType === 'image') return true
  return (
    /\.(jpe?g|png|gif|webp)(\?|$)/i.test(lower) ||
    lower.includes('data:image/') ||
    /\/uploads\/|r2\.|cloudflare/i.test(lower)
  )
}

function ResponseDetailModal({
  submission,
  onClose,
}: {
  submission: Submission
  onClose: () => void
}) {
  return (
    <Modal isOpen onClose={onClose} title={submission.formTitle || 'Response'} size="lg">
      <div className="max-h-[70vh] overflow-auto">
        <p className="text-xs text-slate-500 dark:text-slate-400">{formatSubmittedAt(submission.submittedAt)}</p>
        <dl className="mt-4 space-y-3">
          {submission.formSnapshot.map((field) => {
            const value = submission.responses[field.name]
            const isCheckbox = field.type === 'checkbox' && Array.isArray(value)
            const emojiDisplay =
              typeof value === 'string' && (field.type === 'scale' || field.type === 'scale_emoji' || field.type === 'scale_1_10')
                ? getEmojiScaleDisplay(value)
                : null
            const displayText = emojiDisplay
              ? `${emojiDisplay.emoji} ${emojiDisplay.label}`
              : isCheckbox
                ? value.length ? value.join(', ') : '—'
                : typeof value === 'string'
                  ? value || '—'
                  : '—'
            const isImage =
              typeof value === 'string' &&
              value.trim() !== '' &&
              isImageUrl(value, field.type)
            const imageUrl = isImage ? (value as string).trim() : null

            return (
              <div key={field.name}>
                <dt className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</dt>
                <dd className="mt-0.5 text-sm text-slate-900 dark:text-slate-200">
                  {imageUrl ? (
                    <span className="block space-y-2">
                      <img
                        src={imageUrl}
                        alt={field.label}
                        className="max-h-64 w-auto max-w-full rounded-lg border border-slate-200 object-contain dark:border-slate-600"
                      />
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Open in new tab
                      </a>
                    </span>
                  ) : (
                    displayText
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
        <Button type="button" variant="secondary" size="md" onClick={onClose} className="mt-4">
          <X className="h-4 w-4" />
          Close
        </Button>
      </div>
    </Modal>
  )
}

type SubmissionsTab = 'responses' | 'results'

export default function SubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const formIdFromUrl = searchParams.get('formId') ?? ''
  const tabParam = searchParams.get('tab') ?? 'responses'
  const activeTab: SubmissionsTab = tabParam === 'results' ? 'results' : 'responses'

  const [forms, setForms] = useState<FeedbackForm[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [formId, setFormId] = useState(formIdFromUrl)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [formIdApplied, setFormIdApplied] = useState(formIdFromUrl)
  const [dateFromApplied, setDateFromApplied] = useState('')
  const [dateToApplied, setDateToApplied] = useState('')
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({})
  const [fieldFiltersApplied, setFieldFiltersApplied] = useState<Record<string, string>>({})
  const [selectedFormFields, setSelectedFormFields] = useState<FormSnapshotField[] | null>(null)
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null)
  const { getAuthHeaders } = useAuth()

  // When URL formId changes (e.g. navigating from Your Forms), sync filter and applied state
  useEffect(() => {
    if (formIdFromUrl) {
      setFormId(formIdFromUrl)
      setFormIdApplied(formIdFromUrl)
      setPage(1)
    }
  }, [formIdFromUrl])

  // When a form is selected in the filter, fetch its fields so we can show field-based filters
  useEffect(() => {
    if (!formId || !formId.trim()) {
      setSelectedFormFields(null)
      setFieldFilters({})
      return
    }
    let cancelled = false
    const headers = authHeadersRef.current
    axios
      .get<{ feedbackForm: { fields?: FormSnapshotField[] } }>(`${feedbackFormsApi}/${formId}`, headers)
      .then((res) => {
        if (!cancelled && res.data?.feedbackForm?.fields) {
          setSelectedFormFields(res.data.feedbackForm.fields)
        } else if (!cancelled) {
          setSelectedFormFields([])
        }
      })
      .catch(() => {
        if (!cancelled) setSelectedFormFields(null)
      })
    return () => {
      cancelled = true
    }
  }, [formId])

  const authHeaders = useMemo(
    () => ({
      withCredentials: true as const,
      headers: getAuthHeaders(),
    }),
    [getAuthHeaders],
  )
  const authHeadersRef = useRef(authHeaders)
  authHeadersRef.current = authHeaders

  const setTab = useCallback(
    (tab: SubmissionsTab) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tab)
        return next
      })
    },
    [setSearchParams],
  )
  const selectedForm = formIdApplied ? forms.find((f) => f._id === formIdApplied) : null

  const loadForms = useCallback(async () => {
    const headers = authHeadersRef.current
    try {
      const res = await axios.get<{ feedbackForms: FeedbackForm[] }>(feedbackFormsApi, headers)
      setForms(res.data.feedbackForms ?? [])
    } catch {
      setForms([])
    }
  }, [])

  const loadSubmissions = useCallback(async () => {
    const headers = authHeadersRef.current
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (formIdApplied) params.set('formId', formIdApplied)
      if (dateFromApplied) params.set('dateFrom', dateFromApplied)
      if (dateToApplied) params.set('dateTo', dateToApplied)
      Object.entries(fieldFiltersApplied).forEach(([name, value]) => {
        if (value.trim() !== '') params.set(`field_${name}`, value.trim())
      })
      const url = `${feedbackFormSubmissionsApi}?${params.toString()}`
      const res = await axios.get<{ submissions: Submission[]; total: number }>(url, headers)
      setSubmissions(res.data.submissions ?? [])
      setTotal(res.data.total ?? 0)
    } catch {
      setError('Failed to load submissions.')
      setSubmissions([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, formIdApplied, dateFromApplied, dateToApplied, fieldFiltersApplied])

  useEffect(() => {
    void loadForms()
  }, [loadForms])

  useEffect(() => {
    void loadSubmissions()
  }, [loadSubmissions])

  const handleApplyFilters = useCallback(() => {
    setFormIdApplied(formId)
    setDateFromApplied(dateFrom)
    setDateToApplied(dateTo)
    setFieldFiltersApplied({ ...fieldFilters })
    setPage(1)
  }, [formId, dateFrom, dateTo, fieldFilters])

  const handleFormIdChange = useCallback((value: string) => {
    setFormId(value)
    if (!value.trim()) {
      setFieldFilters({})
      setFieldFiltersApplied({})
    }
  }, [])

  const handleFieldFilterChange = useCallback((name: string, value: string) => {
    setFieldFilters((prev) => {
      const next = { ...prev }
      if (value.trim() === '') {
        delete next[name]
      } else {
        next[name] = value
      }
      return next
    })
  }, [])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)
  const summaryText =
    total === 0
      ? 'No submissions'
      : total <= pageSize
        ? `${total} submission${total === 1 ? '' : 's'}`
        : `Showing ${rangeStart}–${rangeEnd} of ${total} submissions`

  const showTabs = Boolean(formIdFromUrl && formIdFromUrl.trim())

  return (
    <section className="space-y-6" aria-label="Submissions">
      <PageHeader title="Submissions" />

      {showTabs ? (
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700" role="tablist">
          <button
            type="button"
            onClick={() => setTab('responses')}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${activeTab === 'responses' ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400' : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}
            aria-selected={activeTab === 'responses'}
            role="tab"
          >
            Responses
          </button>
          <button
            type="button"
            onClick={() => setTab('results')}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${activeTab === 'results' ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400' : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}
            aria-selected={activeTab === 'results'}
            role="tab"
          >
            Results
          </button>
        </div>
      ) : null}

      {activeTab === 'results' && formIdApplied ? (
        <FormResultsView
          formId={formIdApplied}
          authHeaders={authHeaders}
          showDateFilter
          titleOverride={selectedForm?.title}
        />
      ) : (
        <>
      <div>
        <SubmissionsFilter
          forms={forms}
          formId={formId}
          onFormIdChange={handleFormIdChange}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          selectedFormFields={selectedFormFields}
          fieldFilters={fieldFilters}
          onFieldFilterChange={handleFieldFilterChange}
          onApply={handleApplyFilters}
        />
      </div>

      {error ? <ErrorMessage message={error} className="mt-3" /> : null}

      {loading ? (
        <EmptyState type="loading" message="Loading submissions..." />
      ) : submissions.length === 0 ? (
        <EmptyState type="empty" message="No submissions found." />
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            {summaryText}
          </p>
          <div className="mt-4 space-y-5 pt-2">
            {submissions.map((row) => {
              const keyAnswer = getKeyAnswer(row)
              const submitter = getSubmitterDisplay(row)
              const recent = isRecent(row.submittedAt)
              return (
                <FormCard
                  key={row._id}
                    variant="card"
                    title={row.formTitle || row.formId}
                    subtitle={
                      <span className="flex flex-wrap items-center gap-2">
                        <Tag variant="stone">Response</Tag>
                        {recent ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            New
                          </span>
                        ) : null}
                        <span className="tabular-nums text-stone-500 dark:text-stone-400" title={formatSubmittedAt(row.submittedAt)}>
                          {formatRelativeTime(row.submittedAt)}
                        </span>
                        <span className="text-stone-400 dark:text-stone-500">·</span>
                        <span className="text-stone-500 dark:text-stone-400">
                          {row.formSnapshot.length} {row.formSnapshot.length === 1 ? 'question' : 'questions'} answered
                        </span>
                      </span>
                    }
                    description={getResponsePreview(row)}
                  >
                    {submitter ? (
                      <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300">
                        <span className="font-medium text-stone-700 dark:text-stone-200">From:</span> {submitter}
                      </p>
                    ) : null}
                    {keyAnswer && keyAnswer.value !== submitter ? (
                      <div className="mt-2 rounded-lg border border-stone-200/80 bg-stone-50/80 px-3 py-2 dark:border-stone-700/80 dark:bg-stone-800/40">
                        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{keyAnswer.label}</p>
                        <p className={`mt-0.5 text-sm font-medium ${keyAnswer.isEmoji ? 'text-base' : 'text-stone-800 dark:text-stone-100'}`}>
                          {keyAnswer.value}
                        </p>
                      </div>
                    ) : null}
                    {row.formSnapshot.length > 0 ? (
                      <p className="mt-2 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
                        <span className="font-medium text-stone-600 dark:text-stone-300">Questions answered:</span>{' '}
                        {formatSubmissionFieldsSummary(row.formSnapshot)}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">No responses recorded.</p>
                    )}
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      Tap View to see the full response.
                    </p>
                    <div
                      className="mt-5 -mx-5 -mb-5 flex flex-wrap items-center gap-2 rounded-b-2xl border-t border-stone-200/80 bg-stone-50/80 px-5 py-4 dark:border-stone-700/80 dark:bg-stone-800/40"
                      role="toolbar"
                      aria-label={`Actions for response to ${row.formTitle || row.formId}`}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="min-h-9 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 font-medium text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50 dark:hover:border-emerald-700"
                        onClick={() => setViewSubmission(row)}
                      >
                        <Eye className="h-4 w-4 shrink-0" />
                        View
                      </Button>
                    </div>
                  </FormCard>
              )
            })}
          </div>
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {viewSubmission ? (
        <ResponseDetailModal submission={viewSubmission} onClose={() => setViewSubmission(null)} />
      ) : null}
        </>
      )}
    </section>
  )
}
