import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Eye, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi, feedbackFormSubmissionsApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage, Modal } from '../../../components/ui'
import { DataTable, EmptyState, Pagination } from '../../../components/layout'
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
            const display =
              field.type === 'checkbox' && Array.isArray(value)
                ? value.length ? value.join(', ') : '—'
                : typeof value === 'string'
                  ? value || '—'
                  : '—'
            return (
              <div key={field.name}>
                <dt className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</dt>
                <dd className="mt-0.5 text-sm text-slate-900 dark:text-slate-200">{display}</dd>
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

export default function SubmissionsPage() {
  const [searchParams] = useSearchParams()
  const formIdFromUrl = searchParams.get('formId') ?? ''

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
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null)
  const { getAuthHeaders } = useAuth()

  // When URL formId changes (e.g. navigating from Saved Forms), sync filter and applied state
  useEffect(() => {
    if (formIdFromUrl) {
      setFormId(formIdFromUrl)
      setFormIdApplied(formIdFromUrl)
      setPage(1)
    }
  }, [formIdFromUrl])

  const authHeaders = useMemo(
    () => ({
      withCredentials: true as const,
      headers: getAuthHeaders(),
    }),
    [getAuthHeaders],
  )
  const authHeadersRef = useRef(authHeaders)
  authHeadersRef.current = authHeaders

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
  }, [page, pageSize, formIdApplied, dateFromApplied, dateToApplied])

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
    setPage(1)
  }, [formId, dateFrom, dateTo])

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
          variant="secondary"
          size="sm"
          onClick={() => setViewSubmission(row)}
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
      ),
    },
  ]

  return (
    <Card>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Submissions</h3>

      <div className="mt-4">
        <SubmissionsFilter
          forms={forms}
          formId={formId}
          onFormIdChange={setFormId}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
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
          <div className="md:hidden mt-4 space-y-3">
            {submissions.map((row) => (
              <div
                key={row._id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {row.formTitle || row.formId}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatSubmittedAt(row.submittedAt)}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full min-h-[44px] justify-center"
                  onClick={() => setViewSubmission(row)}
                >
                  <Eye className="h-4 w-4" />
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
    </Card>
  )
}
