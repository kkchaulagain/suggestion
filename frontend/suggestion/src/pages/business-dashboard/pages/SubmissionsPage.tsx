import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi, feedbackFormSubmissionsApi } from '../../../utils/apipath'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{submission.formTitle || 'Response'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">{formatSubmittedAt(submission.submittedAt)}</p>
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
                <dt className="text-sm font-medium text-slate-700">{field.label}</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{display}</dd>
              </div>
            )
          })}
        </dl>
      </div>
    </div>
  )
}

export default function SubmissionsPage() {
  const [forms, setForms] = useState<FeedbackForm[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [formId, setFormId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [formIdApplied, setFormIdApplied] = useState('')
  const [dateFromApplied, setDateFromApplied] = useState('')
  const [dateToApplied, setDateToApplied] = useState('')
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null)
  const { getAuthHeaders } = useAuth()

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
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Submissions</h3>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="filter-form" className="block text-xs font-medium text-slate-600">
            Form
          </label>
          <select
            id="filter-form"
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="">All forms</option>
            {forms.map((f) => (
              <option key={f._id} value={f._id}>
                {f.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-dateFrom" className="block text-xs font-medium text-slate-600">
            From
          </label>
          <input
            id="filter-dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="filter-dateTo" className="block text-xs font-medium text-slate-600">
            To
          </label>
          <input
            id="filter-dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <button
          type="button"
          onClick={handleApplyFilters}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Apply
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No submissions found.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[400px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 pr-4 font-semibold text-slate-700">Form</th>
                  <th className="py-2 pr-4 font-semibold text-slate-700">Submitted at</th>
                  <th className="py-2 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s._id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-900">{s.formTitle || s.formId}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatSubmittedAt(s.submittedAt)}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => setViewSubmission(s)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrev}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!hasNext}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {viewSubmission ? (
        <ResponseDetailModal submission={viewSubmission} onClose={() => setViewSubmission(null)} />
      ) : null}
    </section>
  )
}
