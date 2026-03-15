import type { ChoiceFieldResult, ResultOption } from '../../types/results'
import { Card } from '../ui'

export const EMOJI_SCALE_MAP: Record<string, { emoji: string; label: string }> = {
  '2': { emoji: '😡', label: 'Very bad' },
  '4': { emoji: '😕', label: 'Bad' },
  '6': { emoji: '😐', label: 'Neutral' },
  '8': { emoji: '🙂', label: 'Good' },
  '10': { emoji: '😄', label: 'Excellent' },
}

const EMOJI_MAP = EMOJI_SCALE_MAP
const EMOJI_ORDER = ['2', '4', '6', '8', '10']

/** Map numeric scale value (1–10) to emoji bucket key (2,4,6,8,10). Aligns with sentimentLabel (9 = Good). */
function scaleValueToBucket(value: number): string {
  if (value <= 2) return '2'
  if (value <= 4) return '4'
  if (value <= 6) return '6'
  if (value <= 9) return '8'
  return '10'
}

/** Returns emoji + label for emoji-scale value ("2"|"4"|"6"|"8"|"10"), or null. */
export function getEmojiScaleDisplay(value: string): { emoji: string; label: string } | null {
  const key = String(value).trim()
  if (key in EMOJI_SCALE_MAP) return EMOJI_SCALE_MAP[key]
  const num = parseInt(key, 10)
  if (Number.isNaN(num) || num < 1 || num > 10) return null
  return EMOJI_SCALE_MAP[scaleValueToBucket(num)]
}

export function isEmojiScaleData(options: ResultOption[]): boolean {
  if (options.length === 0) return false
  return options.every((o) => o.option.trim() in EMOJI_MAP)
}

function sentimentLabel(avg: number): string {
  if (avg <= 3) return 'Very bad'
  if (avg <= 5) return 'Bad'
  if (avg <= 7) return 'Neutral'
  if (avg <= 9) return 'Good'
  return 'Excellent'
}

function sentimentEmoji(avg: number): string {
  if (avg <= 3) return '😡'
  if (avg <= 5) return '😕'
  if (avg <= 7) return '😐'
  if (avg <= 9) return '🙂'
  return '😄'
}

function computeAverage(options: ResultOption[]): number | null {
  const total = options.reduce((sum, o) => sum + o.count, 0)
  if (total === 0) return null
  const sum = options.reduce((acc, o) => {
    const num = parseInt(o.option.trim(), 10)
    return Number.isNaN(num) ? acc : acc + num * o.count
  }, 0)
  return Math.round((sum / total) * 10) / 10
}

interface EmojiScaleResultsProps {
  fieldName: string
  data: ChoiceFieldResult
}

export default function EmojiScaleResults({ fieldName, data }: EmojiScaleResultsProps) {
  const { label, options } = data
  const average = computeAverage(options)
  const totalVotes = options.reduce((s, o) => s + o.count, 0)

  const bucketCounts: Record<string, number> = { '2': 0, '4': 0, '6': 0, '8': 0, '10': 0 }
  for (const o of options) {
    const num = parseInt(o.option.trim(), 10)
    if (!Number.isNaN(num) && num >= 1 && num <= 10) {
      const bucket = scaleValueToBucket(num)
      bucketCounts[bucket] = (bucketCounts[bucket] ?? 0) + o.count
    }
  }
  const orderedOptions = EMOJI_ORDER.map((key) => ({
    key,
    emoji: EMOJI_MAP[key].emoji,
    label: EMOJI_MAP[key].label,
    count: bucketCounts[key] ?? 0,
    percentage: totalVotes > 0 ? Math.round((100 * (bucketCounts[key] ?? 0)) / totalVotes) : 0,
  }))

  const maxCount = Math.max(...orderedOptions.map((o) => o.count), 1)

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
          <span className="text-4xl" aria-hidden>{sentimentEmoji(average)}</span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">Average</p>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {sentimentLabel(average)}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {average} · {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2.5" data-testid={`emoji-results-${fieldName}`}>
        {orderedOptions.map((opt) => {
          const widthPct = maxCount > 0 ? (opt.count / maxCount) * 100 : 0
          const isTop = opt.count === maxCount && opt.count > 0
          return (
            <div key={opt.key} className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition ${
                  isTop ? 'bg-stone-200 dark:bg-stone-700' : 'bg-stone-100 dark:bg-stone-800'
                }`}
                title={opt.label}
              >
                {opt.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline justify-between text-sm">
                  <span className={`font-medium ${isTop ? 'text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}>
                    {opt.label}
                  </span>
                  <span className="tabular-nums text-stone-500 dark:text-stone-400">
                    {opt.count} ({opt.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isTop ? 'bg-stone-600 dark:bg-stone-400' : 'bg-stone-300 dark:bg-stone-600'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
