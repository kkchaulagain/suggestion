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

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface ChoiceQuestionResultsProps {
  fieldName: string
  data: ChoiceFieldResult
}

function buildAriaSummary(options: ResultOption[]): string {
  const parts = options.map((o) => `${o.option} ${o.percentage}%`)
  return `Bar chart: ${parts.join(', ')}`
}

export default function ChoiceQuestionResults({ fieldName, data }: ChoiceQuestionResultsProps) {
  const { label, options } = data
  const chartData = options.map((o) => ({ name: o.option, count: o.count, percentage: o.percentage }))
  const ariaSummary = buildAriaSummary(options)

  return (
    <Card className="rounded-xl p-4" padding="md">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{label}</h3>
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
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [value ?? 0, 'Count']} />
              <Bar dataKey="count" fill={CHART_COLORS[0]} name="Count" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full sm:w-1/2">
          <table className="w-full text-sm" data-testid={`results-table-${fieldName}`}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="py-2 text-left font-medium text-slate-700 dark:text-slate-300">
                  Option
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
