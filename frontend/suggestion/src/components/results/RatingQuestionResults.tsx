import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { ChoiceFieldResult, ResultOption } from '../../types/results'
import { Card } from '../ui'

/** Parse star count from option label (e.g. "★★★★ 4 Stars" -> 4). Falls back to counting ★ characters. */
function starCount(option: string): number {
  const match = option.match(/(\d+)\s*stars?/i)
  if (match) return Math.min(5, Math.max(1, parseInt(match[1], 10)))
  const stars = option.match(/★/g)?.length ?? 0
  return Math.min(5, Math.max(0, stars))
}

function computeAverageStars(options: ResultOption[]): number | null {
  const total = options.reduce((sum, o) => sum + o.count, 0)
  if (total === 0) return null
  const sum = options.reduce((acc, o) => acc + starCount(o.option) * o.count, 0)
  return Math.round((sum / total) * 10) / 10
}

function renderStars(value: number): ReactNode {
  const full = Math.min(5, Math.max(0, Math.floor(value)))
  const empty = 5 - full
  return (
    <span className="inline-flex items-center" aria-hidden>
      {Array.from({ length: full }, (_, i) => (
        <Star key={`f-${i}`} className="h-5 w-5 fill-amber-400 text-amber-400" strokeWidth={1.5} />
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <Star key={`e-${i}`} className="h-5 w-5 text-slate-300 dark:text-slate-500" strokeWidth={1.5} />
      ))}
    </span>
  )
}

function buildAriaSummary(options: ResultOption[], average: number | null): string {
  const parts = options.map((o) => `${o.option} ${o.percentage}%`)
  const avgText = average != null ? `Average rating: ${average} out of 5. ` : ''
  return `Star rating: ${avgText}${parts.join(', ')}`
}

interface RatingQuestionResultsProps {
  fieldName: string
  data: ChoiceFieldResult
}

export default function RatingQuestionResults({ fieldName, data }: RatingQuestionResultsProps) {
  const { label, options } = data
  const average = computeAverageStars(options)
  const chartData = options.map((o) => ({ name: o.option, count: o.count, percentage: o.percentage }))
  const ariaSummary = buildAriaSummary(options, average)

  return (
    <Card className="rounded-xl p-4" padding="md">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{label}</h3>
      {average != null && (
        <div className="mt-2 flex items-center gap-2" aria-live="polite">
          {renderStars(average)}
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {average}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">out of 5 average</span>
        </div>
      )}
      <div className="mt-3 flex flex-col gap-4 sm:flex-row">
        <div
          className="min-h-[200px] w-full sm:w-1/2"
          role="img"
          aria-label={ariaSummary}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
            >
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [value ?? 0, 'Count']} />
              <Bar dataKey="count" fill="#f59e0b" name="Count" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full sm:w-1/2">
          <table className="w-full text-sm" data-testid={`results-table-${fieldName}`}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="py-2 text-left font-medium text-slate-700 dark:text-slate-300">
                  Rating
                </th>
                <th className="py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                  Count
                </th>
                <th className="py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {options.map((row) => (
                <tr
                  key={row.option}
                  className="border-b border-slate-100 dark:border-slate-700"
                >
                  <td className="py-1.5 text-slate-900 dark:text-slate-100">{row.option}</td>
                  <td className="py-1.5 text-right text-slate-700 dark:text-slate-300">
                    {row.count}
                  </td>
                  <td className="py-1.5 text-right text-slate-700 dark:text-slate-300">
                    {row.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}
