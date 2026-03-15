import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { feedbackFormsApi } from '../../utils/apipath'
import type { FormResultsData } from '../../types/results'
import { isChoiceFieldResult } from '../../types/results'
import { ErrorMessage } from '../ui'
import { EmptyState } from '../layout'
import ChoiceQuestionResults from './ChoiceQuestionResults'
import TextQuestionResults from './TextQuestionResults'
import ResultsSummary from './ResultsSummary'

const CHOICE_TYPES = ['radio', 'checkbox']
const TEXT_TYPES = ['short_text', 'long_text', 'big_text', 'name', 'image_upload']

interface FormResultsViewProps {
  formId: string
  /** Optional auth headers for dashboard (owner) view */
  authHeaders?: { withCredentials?: boolean; headers?: Record<string, string> }
  showDateFilter?: boolean
  /** Optional title override (e.g. when used in dashboard with form context) */
  titleOverride?: string
}

export default function FormResultsView({
  formId,
  authHeaders,
  showDateFilter = false,
  titleOverride,
}: FormResultsViewProps) {
  const [data, setData] = useState<FormResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchResults = useCallback(async () => {
    if (!formId) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      const url = `${feedbackFormsApi}/${formId}/results${params.toString() ? `?${params.toString()}` : ''}`
      const res = await axios.get<FormResultsData>(url, authHeaders ?? {})
      setData(res.data)
    } catch {
      setError('Failed to load results.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [formId, dateFrom, dateTo, authHeaders])

  useEffect(() => {
    void fetchResults()
  }, [fetchResults])

  if (loading) {
    return (
      <div className="py-8" data-testid="results-loading">
        <EmptyState type="loading" message="Loading results…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8" data-testid="results-error">
        <ErrorMessage message={error} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-8" data-testid="results-empty">
        <EmptyState type="empty" message="No results available." />
      </div>
    )
  }

  const displayData = titleOverride ? { ...data, formTitle: titleOverride } : data

  if (data.totalResponses === 0 && Object.keys(data.byField).length === 0) {
    return (
      <div className="space-y-4 py-4" data-testid="results-summary">
        <ResultsSummary
          data={displayData}
          showDateFilter={showDateFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
        />
        <EmptyState type="empty" message="No responses yet." />
      </div>
    )
  }

  const fieldEntries = Object.entries(data.byField ?? {})

  return (
    <div className="space-y-6 py-4" data-testid="form-results-view">
      <ResultsSummary
        data={displayData}
        showDateFilter={showDateFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />
      <div className="space-y-4">
        {fieldEntries.map(([fieldName, fieldData]) => {
          if (CHOICE_TYPES.includes(fieldData.type) && isChoiceFieldResult(fieldData)) {
            return (
              <ChoiceQuestionResults
                key={fieldName}
                fieldName={fieldName}
                data={fieldData}
              />
            )
          }
          if (TEXT_TYPES.includes(fieldData.type)) {
            return (
              <TextQuestionResults
                key={fieldName}
                fieldName={fieldName}
                data={fieldData as import('../../types/results').TextFieldResult}
              />
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
