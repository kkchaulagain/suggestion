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

interface ScaleQuestionResultsProps {
  fieldName: string
  data: ChoiceFieldResult
}

export default function ScaleQuestionResults({ fieldName, data }: ScaleQuestionResultsProps) {
  const { label, options } = data
  const average = computeAverage(options)
  const totalVotes = options.reduce((s, o) => s + o.count, 0)
  const maxCount = Math.max(...options.map((o) => o.count), 1)
  const sorted = [...options].sort((a, b) => {
    const na = parseInt(a.option.trim(), 10)
    const nb = parseInt(b.option.trim(), 10)
    return na - nb
  })

  return (
    <Card className="rounded-2xl border-stone-200/80 p-5 dark:border-stone-700/60" padding="md">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{label}</h3>
        <span className="shrink-0 text-xs tabular-nums text-stone-400 dark:text-stone-500">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      {average != null && (
        <div className="mt-3" aria-live="polite">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">Average</p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{average}</span>
            <span className="text-sm text-stone-500 dark:text-stone-400">out of 10</span>
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2" data-testid={`results-table-${fieldName}`}>
        {sorted.map((opt) => {
          const widthPct = maxCount > 0 ? (opt.count / maxCount) * 100 : 0
          return (
            <div key={opt.option} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums text-stone-600 dark:text-stone-400">
                {opt.option}
              </span>
              <div className="min-w-0 flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <div
                    className="h-full rounded-full bg-stone-500 transition-all duration-700 ease-out dark:bg-stone-400"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
              <span className="w-20 shrink-0 text-right text-xs tabular-nums text-stone-500 dark:text-stone-400">
                {opt.count} · {opt.percentage}%
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
