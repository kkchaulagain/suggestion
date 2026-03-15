import type { ResultOption } from '../../types/results'

export const EMOJI_SCALE_MAP: Record<string, { emoji: string; label: string }> = {
  '2': { emoji: '😡', label: 'Very bad' },
  '4': { emoji: '😕', label: 'Bad' },
  '6': { emoji: '😐', label: 'Neutral' },
  '8': { emoji: '🙂', label: 'Good' },
  '10': { emoji: '😄', label: 'Excellent' },
}

export const EMOJI_ORDER = ['2', '4', '6', '8', '10'] as const

/** Map numeric scale value (1–10) to emoji bucket key (2,4,6,8,10). Aligns with sentimentLabel (9 = Good). */
export function scaleValueToBucket(value: number): string {
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
  return options.every((o) => o.option.trim() in EMOJI_SCALE_MAP)
}
