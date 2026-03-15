import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui'

export interface HeroSectionCta {
  label: string
  href: string
}

export type HeroLayoutVariant = 'centered' | 'split' | 'splitReversed' | 'centeredWithMediaBelow'
export type HeroStyleVariant = 'default' | 'minimal'

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
  /** Layout: where copy and media sit. Defaults to centered when no media, split when media present. */
  variant?: HeroLayoutVariant
  /** Visual style. Dark mode is handled by the app theme; this only picks layout density (default vs minimal). */
  style?: HeroStyleVariant
}

export default function HeroSection({
  headline,
  subheadline,
  badge,
  primaryCta,
  secondaryCta,
  media,
  variant: variantProp,
  style: styleProp = 'default',
}: HeroSectionProps) {
  const hasMedia = Boolean(media)
  const variant = variantProp ?? (hasMedia ? 'split' : 'centered')
  const style = styleProp === 'dark' ? 'default' : styleProp

  const isCentered = variant === 'centered' || variant === 'centeredWithMediaBelow'
  const isSplit = variant === 'split' || variant === 'splitReversed'
  const showMediaAside = hasMedia && isSplit
  const showMediaBelow = hasMedia && variant === 'centeredWithMediaBelow'

  const styleClasses = {
    default: {
      section: '',
      badge:
        'inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      heading: 'mt-4 text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl',
      subheadline: 'mx-auto mt-4 max-w-2xl text-lg text-stone-600 dark:text-stone-400 lg:mx-0',
      mediaWrap:
        'w-full max-w-lg rounded-xl border border-stone-200 bg-stone-50/50 dark:border-stone-700 dark:bg-stone-800/30',
    },
    minimal: {
      section: 'py-8',
      badge:
        'inline-block rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400',
      heading: 'mt-3 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl',
      subheadline: 'mx-auto mt-2 max-w-xl text-base text-stone-500 dark:text-stone-400 lg:mx-0',
      mediaWrap:
        'w-full max-w-md rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800/50',
    },
  }

  const s = styleClasses[style]

  const layoutSectionClass =
    showMediaAside && variant === 'splitReversed'
      ? 'flex flex-col gap-10 lg:flex-row-reverse lg:items-center lg:gap-12'
      : showMediaAside
        ? 'flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-12'
        : showMediaBelow
          ? 'flex flex-col gap-10'
          : ''

  const textAlignClass = isCentered ? 'text-center' : 'text-center lg:text-left'
  const textBlockClass = showMediaAside ? 'flex-1' : ''
  const ctaJustifyClass = isCentered ? 'justify-center' : 'justify-center lg:justify-start'
  const mediaOrderClass = variant === 'splitReversed' ? 'flex-1 flex justify-center lg:justify-start' : 'flex-1 flex justify-center lg:justify-end'

  return (
    <section className={`${layoutSectionClass} ${s.section}`.trim()}>
      <div className={`${textBlockClass} ${textAlignClass}`.trim()}>
        {badge ? <span className={s.badge}>{badge}</span> : null}
        <h1 className={s.heading}>{headline}</h1>
        <p className={s.subheadline}>{subheadline}</p>
        {(primaryCta || secondaryCta) ? (
          <div className={`mt-8 flex flex-wrap items-center gap-3 ${ctaJustifyClass}`.trim()}>
            {primaryCta ? (
              <Link to={primaryCta.href}>
                <Button
                  variant="primary"
                  size={style === 'minimal' ? 'md' : 'lg'}
                >
                  {primaryCta.label}
                </Button>
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link to={secondaryCta.href}>
                <Button
                  variant="secondary"
                  size={style === 'minimal' ? 'md' : 'lg'}
                >
                  {secondaryCta.label}
                </Button>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
      {showMediaAside ? (
        <div className={mediaOrderClass}>
          <div className={s.mediaWrap}>{media}</div>
        </div>
      ) : null}
      {showMediaBelow && media ? (
        <div className="flex justify-center">
          <div className={`w-full max-w-4xl ${s.mediaWrap}`}>{media}</div>
        </div>
      ) : null}
    </section>
  )
}
