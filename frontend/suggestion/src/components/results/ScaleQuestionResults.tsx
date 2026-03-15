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

function computeAverage(options: ResultOption[]): number | null {
  const total = options.reduce((sum, o) => sum + o.count, 0)
  if (total === 0) return null
  const sum = options.reduce((acc, o) => {
    const num = parseInt(o.option.trim(), 10)
    return Number.isNaN(num) ? acc : acc + num * o.count
  }, 0)
  return Math.round((sum / total) * 10) / 10
}

function buildAriaSummary(options: ResultOption[], average: number | null): string {
  const parts = options.map((o) => `${o.option}: ${o.percentage}%`)
  const avgText = average != null ? `Average score: ${average} out of 10. ` : ''
  return `Scale 1-10: ${avgText}${parts.join(', ')}`
}

interface ScaleQuestionResultsProps {
  fieldName: string
  data: ChoiceFieldResult
}

export default function ScaleQuestionResults({ fieldName, data }: ScaleQuestionResultsProps) {
  const { label, options } = data
  const average = computeAverage(options)
  const chartData = options.map((o) => ({ name: o.option, count: o.count, percentage: o.percentage }))
  const ariaSummary = buildAriaSummary(options, average)

  return (
    <Card className="rounded-xl p-4" padding="md">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{label}</h3>
      {average != null && (
        <div className="mt-2 flex items-baseline gap-2" aria-live="polite">
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {average}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">out of 10 average</span>
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
              margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
            >
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={30} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [value ?? 0, 'Count']} />
              <Bar dataKey="count" fill="#10b981" name="Count" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full sm:w-1/2">
          <table className="w-full text-sm" data-testid={`results-table-${fieldName}`}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="py-2 text-left font-medium text-slate-700 dark:text-slate-300">
                  Score
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
