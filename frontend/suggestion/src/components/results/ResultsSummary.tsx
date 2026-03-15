import { useState, useMemo } from 'react'
import { Link2, Check, Calendar } from 'lucide-react'
import type { FormResultsData, ChoiceFieldResult, ResultOption } from '../../types/results'
import { isChoiceFieldResult } from '../../types/results'
import { Card } from '../ui'

function isNumericScaleOptions(options: ResultOption[]): boolean {
  if (options.length === 0) return false
  return options.every((o) => {
    const n = parseInt(o.option.trim(), 10)
    return !Number.isNaN(n) && n >= 1 && n <= 10
  })
}

function overallSentiment(byField: FormResultsData['byField']): { emoji: string; label: string } | null {
  const scaleFields = Object.values(byField).filter(
    (f): f is ChoiceFieldResult =>
      (f.type === 'scale' || f.type === 'scale_1_10') && isChoiceFieldResult(f) && isNumericScaleOptions(f.options),
  )
  if (scaleFields.length === 0) return null

  let totalWeightedSum = 0
  let totalCount = 0
  for (const field of scaleFields) {
    for (const opt of field.options) {
      const n = parseInt(opt.option.trim(), 10)
      if (!Number.isNaN(n)) {
        totalWeightedSum += n * opt.count
        totalCount += opt.count
      }
    }
  }
  if (totalCount === 0) return null
  const avg = totalWeightedSum / totalCount
  if (avg <= 3) return { emoji: '😡', label: 'Very negative' }
  if (avg <= 5) return { emoji: '😕', label: 'Negative' }
  if (avg <= 7) return { emoji: '😐', label: 'Neutral' }
  if (avg <= 9) return { emoji: '🙂', label: 'Positive' }
  return { emoji: '😄', label: 'Very positive' }
}

function topChoice(byField: FormResultsData['byField']): { label: string; option: string; percentage: number } | null {
  const choiceFields = Object.values(byField).filter(
    (f): f is ChoiceFieldResult =>
      (f.type === 'radio' || f.type === 'checkbox') && isChoiceFieldResult(f),
  )
  if (choiceFields.length === 0) return null
  let best: { label: string; option: string; percentage: number } | null = null
  for (const field of choiceFields) {
    for (const opt of field.options) {
      if (!best || opt.count > 0 && opt.percentage > best.percentage) {
        best = { label: field.label, option: opt.option, percentage: opt.percentage }
      }
    }
  }
  return best
}

function activitySummary(responsesOverTime: Array<{ date: string; count: number }> = []): {
  today: number
  thisWeek: number
  bars: number[]
} {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const weekAgo = new Date(now.getTime() - 6 * 86_400_000).toISOString().slice(0, 10)

  let today = 0
  let thisWeek = 0
  for (const item of responsesOverTime) {
    if (item.date === todayStr) today = item.count
    if (item.date >= weekAgo) thisWeek += item.count
  }

  const last7 = responsesOverTime.filter((d) => d.date >= weekAgo).sort((a, b) => a.date.localeCompare(b.date))
  const max = Math.max(...last7.map((d) => d.count), 1)
  const bars = last7.map((d) => Math.round((d.count / max) * 100))

  return { today, thisWeek, bars }
}

type DateRangePreset = 'all' | 'today' | 'last_1_week' | 'last_4_weeks' | 'custom'

function getPresetDates(preset: DateRangePreset): { from: string; to: string } {
  const to = new Date()
  const toStr = to.toISOString().slice(0, 10)
  if (preset === 'all') return { from: '', to: '' }
  if (preset === 'today') return { from: toStr, to: toStr }
  const from = new Date(to)
  if (preset === 'last_1_week') {
    from.setDate(from.getDate() - 6)
    return { from: from.toISOString().slice(0, 10), to: toStr }
  }
  if (preset === 'last_4_weeks') {
    from.setDate(from.getDate() - 27)
    return { from: from.toISOString().slice(0, 10), to: toStr }
  }
  return { from: '', to: '' }
}

function inferPreset(dateFrom: string, dateTo: string): DateRangePreset {
  if (!dateFrom && !dateTo) return 'all'
  const { from: tFrom, to: tTo } = getPresetDates('today')
  if (dateFrom === tFrom && dateTo === tTo) return 'today'
  const { from: w1From, to: w1To } = getPresetDates('last_1_week')
  if (dateFrom === w1From && dateTo === w1To) return 'last_1_week'
  const { from: w4From, to: w4To } = getPresetDates('last_4_weeks')
  if (dateFrom === w4From && dateTo === w4To) return 'last_4_weeks'
  return 'custom'
}

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
  const { formTitle, totalResponses, responsesOverTime = [], byField } = data
  const sentiment = overallSentiment(byField)
  const top = topChoice(byField)
  const activity = activitySummary(responsesOverTime)
  const [copied, setCopied] = useState(false)

  const inferredPreset = useMemo(() => inferPreset(dateFrom ?? '', dateTo ?? ''), [dateFrom, dateTo])
  const [showCustom, setShowCustom] = useState(false)
  const activePreset: DateRangePreset = showCustom || inferredPreset === 'custom' ? 'custom' : inferredPreset

  const handlePreset = (next: DateRangePreset) => {
    if (next === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    const { from, to } = getPresetDates(next)
    onDateFromChange?.(from)
    onDateToChange?.(to)
  }

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      {/* Hero snapshot */}
      <Card className="rounded-2xl border-stone-200/80 p-6 dark:border-stone-700/60" padding="md">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100" data-testid="results-title">
              {formTitle}
            </h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{totalResponses}</span>{' '}
              {totalResponses === 1 ? 'person responded' : 'people responded'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
            data-testid="copy-link-btn"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        {(sentiment || top) && (
          <div className="mt-5 flex flex-wrap gap-3">
            {sentiment && (
              <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-2.5 dark:bg-stone-800/60" data-testid="scale-summary-badge">
                <span className="text-2xl" aria-hidden>{sentiment.emoji}</span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">Scale average</p>
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{sentiment.label}</p>
                </div>
              </div>
            )}
            {top && (
              <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-2.5 dark:bg-stone-800/60" data-testid="top-choice-badge">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-200 text-sm font-bold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                  #1
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">Top choice</p>
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{top.option} ({top.percentage}%)</p>
                </div>
              </div>
            )}
          </div>
        )}

        {showDateFilter && onDateFromChange && onDateToChange && (
          <div className="mt-4 space-y-3 border-t border-stone-100 pt-4 dark:border-stone-800">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">Date range</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all' as const, label: 'All time' },
                { key: 'today' as const, label: 'Today' },
                { key: 'last_1_week' as const, label: 'Last 7 days' },
                { key: 'last_4_weeks' as const, label: 'Last 4 weeks' },
                { key: 'custom' as const, label: 'Custom' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePreset(key)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition dark:border-stone-600 ${
                    activePreset === key
                      ? 'border-stone-400 bg-stone-100 text-stone-900 dark:border-stone-500 dark:bg-stone-800 dark:text-stone-100'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                  }`}
                  data-testid={key === 'custom' ? 'date-filter-custom' : `date-filter-${key}`}
                >
                  {key === 'custom' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {label}
                    </span>
                  ) : (
                    label
                  )}
                </button>
              ))}
            </div>
            {activePreset === 'custom' && (
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 pt-1">
                <span className="text-sm text-stone-500 dark:text-stone-400">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="w-full min-w-[10rem] max-w-[12rem] rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                  data-testid="date-filter-from"
                  aria-label="From date"
                />
                <span className="text-sm text-stone-500 dark:text-stone-400">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="w-full min-w-[10rem] max-w-[12rem] rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                  data-testid="date-filter-to"
                  aria-label="To date"
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Activity sparkline */}
      {responsesOverTime.length > 0 && (
        <Card className="rounded-2xl border-stone-200/80 p-5 dark:border-stone-700/60" padding="md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Activity</h3>
          <div className="mt-3 flex items-end gap-4">
            <div>
              <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{activity.today}</span>
              <span className="ml-1.5 text-sm text-stone-500 dark:text-stone-400">today</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{activity.thisWeek}</span>
              <span className="ml-1.5 text-sm text-stone-500 dark:text-stone-400">this week</span>
            </div>
            {activity.bars.length > 1 && (
              <div className="ml-auto flex items-end gap-0.5" aria-hidden role="img" aria-label="Activity sparkline">
                {activity.bars.map((h, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-sm bg-stone-300 dark:bg-stone-600"
                    style={{ height: `${Math.max(h, 4)}%`, maxHeight: '32px', minHeight: '2px' }}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
