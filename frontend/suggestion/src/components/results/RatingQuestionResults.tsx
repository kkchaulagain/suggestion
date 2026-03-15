import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
import type { ChoiceFieldResult, ResultOption } from '../../types/results'
import { Card } from '../ui'

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
        <Star key={`e-${i}`} className="h-5 w-5 text-stone-300 dark:text-stone-600" strokeWidth={1.5} />
      ))}
    </span>
  )
}

interface RatingQuestionResultsProps {
  fieldName: string
  data: ChoiceFieldResult
}

export default function RatingQuestionResults({ fieldName, data }: RatingQuestionResultsProps) {
  const { label, options } = data
  const average = computeAverageStars(options)
  const totalVotes = options.reduce((s, o) => s + o.count, 0)
  const maxCount = Math.max(...options.map((o) => o.count), 1)
  const sorted = [...options].sort((a, b) => starCount(b.option) - starCount(a.option))

  return (
    <Card className="rounded-2xl border-stone-200/80 p-5 dark:border-stone-700/60" padding="md">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{label}</h3>
        <span className="shrink-0 text-xs tabular-nums text-stone-400 dark:text-stone-500">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      {average != null && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 dark:bg-stone-800/60" aria-live="polite">
          {renderStars(average)}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">Average</p>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
              <span>{average}</span>
              <span className="ml-1.5 text-sm font-normal text-stone-500 dark:text-stone-400">out of 5</span>
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2.5" data-testid={`results-table-${fieldName}`}>
        {sorted.map((opt) => {
          const stars = starCount(opt.option)
          const widthPct = maxCount > 0 ? (opt.count / maxCount) * 100 : 0
          return (
            <div key={opt.option} className="flex items-center gap-3">
              <span className="flex w-24 shrink-0 items-center gap-0.5" aria-hidden>
                {Array.from({ length: stars }, (_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={1.5} />
                ))}
              </span>
              <div className="min-w-0 flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-out dark:bg-amber-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-stone-500 dark:text-stone-400">
                {opt.count} · {opt.percentage}%
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
