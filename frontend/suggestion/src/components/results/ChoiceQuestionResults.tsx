import type { ChoiceFieldResult, ResultOption } from '../../types/results'
import { getEmojiScaleDisplay } from './EmojiScaleResults'
import { Card } from '../ui'

function buildAriaSummary(options: ResultOption[]): string {
  const parts = options.map((o) => `${o.option} ${o.percentage}%`)
  return `Poll results: ${parts.join(', ')}`
}

interface ChoiceQuestionResultsProps {
  fieldName: string
  data: ChoiceFieldResult
}

export default function ChoiceQuestionResults({ fieldName, data }: ChoiceQuestionResultsProps) {
  const { label, options } = data
  const ariaSummary = buildAriaSummary(options)
  const maxCount = Math.max(...options.map((o) => o.count), 1)
  const totalVotes = options.reduce((s, o) => s + o.count, 0)
  const sorted = [...options].sort((a, b) => b.count - a.count)
  const winnerOption = sorted[0]?.option

  return (
    <Card className="rounded-2xl border-stone-200/80 p-5 dark:border-stone-700/60" padding="md">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">{label}</h3>
        <span className="shrink-0 text-xs tabular-nums text-stone-400 dark:text-stone-500">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <div className="mt-4 space-y-3" role="img" aria-label={ariaSummary} data-testid={`results-table-${fieldName}`}>
        {sorted.map((opt) => {
          const widthPct = maxCount > 0 ? (opt.count / maxCount) * 100 : 0
          const isWinner = opt.option === winnerOption && opt.count > 0
          const emojiDisplay = getEmojiScaleDisplay(opt.option)
          const optionLabel = emojiDisplay ? `${emojiDisplay.emoji} ${emojiDisplay.label}` : opt.option
          return (
            <div key={opt.option}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className={`font-medium ${isWinner ? 'text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'}`}>
                  {optionLabel}
                </span>
                <span className="tabular-nums text-stone-500 dark:text-stone-400">
                  {opt.count} {opt.count === 1 ? 'vote' : 'votes'} · {opt.percentage}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isWinner
                      ? 'bg-stone-700 dark:bg-stone-300'
                      : 'bg-stone-300 dark:bg-stone-600'
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
