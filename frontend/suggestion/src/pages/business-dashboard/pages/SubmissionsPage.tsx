import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Eye, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi, feedbackFormSubmissionsApi } from '../../../utils/apipath'
import { Button, ErrorMessage, Modal } from '../../../components/ui'
import { DataTable, EmptyState, PageHeader, Pagination } from '../../../components/layout'
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

  const tableColumns = [
    {
      key: 'formTitle' as const,
      header: 'Form',
      render: (row: Submission) => row.formTitle || row.formId,
    },
    {
      key: 'submittedAt' as const,
      header: 'Submitted at',
      render: (row: Submission) => formatSubmittedAt(row.submittedAt),
    },
    {
      key: '_id' as const,
      header: 'Actions',
      render: (row: Submission) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-700"
          onClick={() => setViewSubmission(row)}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ]

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
          <div className="md:hidden mt-4 space-y-0">
            {submissions.map((row) => (
              <div
                key={row._id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-4 first:pt-0 dark:border-slate-700"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {row.formTitle || row.formId}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatSubmittedAt(row.submittedAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-700 shrink-0"
                  onClick={() => setViewSubmission(row)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
              </div>
            ))}
          </div>
          <div className="hidden md:block">
            <DataTable<Submission>
              columns={tableColumns}
              rows={submissions}
              emptyMessage="No submissions found."
              loading={false}
              page={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
            />
          </div>
          <div className="md:hidden mt-4">
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
