import type { ReactNode } from 'react'

/** Standard 1–10 agreement scale labels (Likert-style). */
export const SCALE_VALUE_LABELS: Record<number, string> = {
  1: 'Strongly disagree',
  2: 'Disagree',
  3: 'Somewhat disagree',
  4: 'Slightly disagree',
  5: 'Neutral',
  6: 'Slightly agree',
  7: 'Somewhat agree',
  8: 'Agree',
  9: 'Strongly agree',
  10: 'Completely agree',
}

export interface Scale1To10FieldProps {
  id: string
  name: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  error?: string
}
