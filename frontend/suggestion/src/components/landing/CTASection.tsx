import { Link } from 'react-router-dom'
import { Button } from '../ui'

export interface CTACta {
  label: string
  href: string
}

export interface CTASectionProps {
  text: string
  ctaLabel: string
  ctaHref: string
  /** Optional secondary CTA (e.g. "Contact sales"). */
  secondaryCta?: CTACta
  /** simple = compact; banner = full-width background, larger text. */
  variant?: 'simple' | 'banner'
}

export default function CTASection({
  text,
  ctaLabel,
  ctaHref,
  secondaryCta,
  variant = 'simple',
}: CTASectionProps) {
  const isBanner = variant === 'banner'
  return (
    <section
      className={
        isBanner
          ? 'rounded-2xl bg-emerald-600 px-6 py-12 text-center dark:bg-emerald-700 sm:px-10 sm:py-16'
          : 'mt-24 text-center sm:mt-32'
      }
    >
      <p
        className={
          isBanner
            ? 'text-lg font-medium text-white sm:text-xl'
            : 'text-stone-600 dark:text-stone-400'
        }
      >
        {text}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to={ctaHref}>
          <Button
            variant={isBanner ? 'secondary' : 'primary'}
            size="lg"
            className={isBanner ? 'bg-white text-emerald-700 hover:bg-stone-100 dark:bg-white dark:text-emerald-800 dark:hover:bg-stone-100' : ''}
          >
            {ctaLabel}
          </Button>
        </Link>
        {secondaryCta ? (
          <Link to={secondaryCta.href}>
            <Button
              variant={isBanner ? 'ghost' : 'secondary'}
              size="lg"
              className={isBanner ? 'text-white hover:bg-emerald-500/30 dark:text-white dark:hover:bg-emerald-600/30' : ''}
            >
              {secondaryCta.label}
            </Button>
          </Link>
        ) : null}
      </div>
    </section>
  )
}
