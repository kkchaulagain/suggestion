import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui'

export interface HeroSectionCta {
  label: string
  href: string
}

export interface HeroSectionProps {
  headline: string
  subheadline: string
  /** Optional badge above headline (e.g. "New: Poll support"). */
  badge?: string
  /** Optional primary CTA. */
  primaryCta?: HeroSectionCta
  /** Optional secondary CTA. */
  secondaryCta?: HeroSectionCta
  /** Optional right-side visual: image URL, screenshot, or custom ReactNode. */
  media?: ReactNode
}

export default function HeroSection({
  headline,
  subheadline,
  badge,
  primaryCta,
  secondaryCta,
  media,
}: HeroSectionProps) {
  const hasMedia = Boolean(media)
  return (
    <section className={hasMedia ? 'flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-12' : ''}>
      <div className={hasMedia ? 'flex-1 text-center lg:text-left' : 'text-center'}>
        {badge ? (
          <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {badge}
          </span>
        ) : null}
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
          {headline}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600 dark:text-stone-400 lg:mx-0">
          {subheadline}
        </p>
        {(primaryCta || secondaryCta) ? (
          <div className={`mt-8 flex flex-wrap items-center justify-center gap-3 ${hasMedia ? 'lg:justify-start' : ''}`}>
            {primaryCta ? (
              <Link to={primaryCta.href}>
                <Button variant="primary" size="lg">
                  {primaryCta.label}
                </Button>
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link to={secondaryCta.href}>
                <Button variant="secondary" size="lg">
                  {secondaryCta.label}
                </Button>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
      {media ? (
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-stone-50/50 dark:border-stone-700 dark:bg-stone-800/30">
            {media}
          </div>
        </div>
      ) : null}
    </section>
  )
}
