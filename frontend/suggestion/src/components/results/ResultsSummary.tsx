import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { FormResultsData } from '../../types/results'
import { Card } from '../ui'

interface ResultsSummaryProps {
  data: FormResultsData
  dateFrom?: string
  dateTo?: string
  onDateFromChange?: (value: string) => void
  onDateToChange?: (value: string) => void
  showDateFilter?: boolean
}

export default function ResultsSummary({
  data,
  showDateFilter = false,
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
}: ResultsSummaryProps) {
  const { formTitle, totalResponses, responsesOverTime = [] } = data

  return (
    <div className="space-y-4">
      <Card className="rounded-xl p-4" padding="md">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formTitle}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {totalResponses}
          </span>{' '}
          {totalResponses === 1 ? 'response' : 'responses'} total
        </p>
        {showDateFilter && onDateFromChange && onDateToChange && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-slate-600 dark:text-slate-400">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </div>
        )}
      </Card>
      {responsesOverTime.length > 0 && (
        <Card className="rounded-xl p-4" padding="md">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Responses over time
          </h3>
          <div className="mt-3 h-48 w-full" role="img" aria-label="Line chart: responses per day">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responsesOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Responses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  )
}
