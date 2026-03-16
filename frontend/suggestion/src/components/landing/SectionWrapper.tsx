import type { ReactNode } from 'react'

export type SectionBackground = 'default' | 'muted' | 'accent'

export interface SectionWrapperProps {
  children: ReactNode
  /** Optional id for anchor links (e.g. #pricing). */
  id?: string
  /** Optional extra class names for the wrapper. */
  className?: string
  /** Background style: default (transparent), muted (subtle gray), accent (brand tint). */
  background?: SectionBackground
}

const backgroundClasses: Record<SectionBackground, string> = {
  default: '',
  muted: 'bg-stone-100/80 dark:bg-stone-800/40',
  accent: 'bg-emerald-50/50 dark:bg-emerald-950/20',
}

export default function SectionWrapper({
  children,
  id,
  className = '',
  background = 'default',
}: SectionWrapperProps) {
  const base = 'mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20'
  const bg = backgroundClasses[background]
  const classes = [base, bg, className].filter(Boolean).join(' ')

  return (
    <section id={id} className={classes}>
      {children}
    </section>
  )
}
