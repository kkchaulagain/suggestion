import { Link } from 'react-router-dom'
import { Button } from '../ui'

export interface PricingCardProps {
  name: string
  price: string
  /** e.g. "per month", "per year" */
  period?: string
  features: string[]
  cta: { label: string; href: string }
  /** Show "Popular" badge and accent border. */
  highlighted?: boolean
}

export default function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 ${
        highlighted
          ? 'border-emerald-500 bg-emerald-50/30 dark:border-emerald-500 dark:bg-emerald-950/20'
          : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800/50'
      }`}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white dark:bg-emerald-500">
          Popular
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-stone-900 dark:text-stone-100">{price}</span>
        {period ? (
          <span className="text-stone-600 dark:text-stone-400">{period}</span>
        ) : null}
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
            <span className="mt-0.5 text-emerald-600 dark:text-emerald-400" aria-hidden>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link to={cta.href}>
          <Button
            variant={highlighted ? 'primary' : 'secondary'}
            size="lg"
            className="w-full"
          >
            {cta.label}
          </Button>
        </Link>
      </div>
    </div>
  )
}
