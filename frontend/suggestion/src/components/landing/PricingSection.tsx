import type { PricingCardProps } from './PricingCard'
import PricingCard from './PricingCard'
import SectionHeading from './SectionHeading'

export interface PricingSectionProps {
  plans: PricingCardProps[]
  heading?: string
  subheading?: string
}

export default function PricingSection({
  plans,
  heading,
  subheading,
}: PricingSectionProps) {
  if (plans.length === 0) return null
  return (
    <div className="space-y-10">
      {(heading || subheading) ? (
        <SectionHeading title={heading ?? ''} subtitle={subheading} align="center" />
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <PricingCard key={i} {...plan} />
        ))}
      </div>
    </div>
  )
}
