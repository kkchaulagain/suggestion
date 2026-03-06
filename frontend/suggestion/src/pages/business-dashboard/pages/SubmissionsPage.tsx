import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Eye, Filter, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi, feedbackFormSubmissionsApi } from '../../../utils/apipath'
import { Button, Card, Input, Select, ErrorMessage, Modal } from '../../../components/ui'
import { DataTable } from '../../../components/layout'

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

  return (
    <Card>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Submissions</h3>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Select
          id="filter-form"
          label="Form"
          value={formId}
          onChange={setFormId}
          options={forms.map((f) => ({ value: f._id, label: f.title }))}
          placeholder="All forms"
        />
        <Input
          id="filter-dateFrom"
          label="From"
          type="date"
          value={dateFrom}
          onChange={setDateFrom}
        />
        <Input
          id="filter-dateTo"
          label="To"
          type="date"
          value={dateTo}
          onChange={setDateTo}
        />
        <Button type="button" variant="primary" size="md" onClick={handleApplyFilters}>
          <Filter className="h-4 w-4" />
          Apply
        </Button>
      </div>

      {error ? <ErrorMessage message={error} className="mt-3" /> : null}

      <DataTable<Submission>
        columns={[
          {
            key: 'formTitle',
            header: 'Form',
            render: (row) => row.formTitle || row.formId,
          },
          {
            key: 'submittedAt',
            header: 'Submitted at',
            render: (row) => formatSubmittedAt(row.submittedAt),
          },
          {
            key: '_id',
            header: 'Actions',
            render: (row) => (
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
        ]}
        rows={submissions}
        emptyMessage="No submissions found."
        loading={loading}
        loadingMessage="Loading submissions..."
        page={page}
        totalPages={totalPages}
        totalItems={total}
        onPageChange={setPage}
      />

      {viewSubmission ? (
        <ResponseDetailModal submission={viewSubmission} onClose={() => setViewSubmission(null)} />
      ) : null}
    </Card>
  )
}
