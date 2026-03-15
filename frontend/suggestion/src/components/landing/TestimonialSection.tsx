import type { TestimonialCardProps } from './TestimonialCard'
import SectionHeading from './SectionHeading'
import TestimonialCard from './TestimonialCard'

export interface TestimonialSectionProps {
  testimonials: TestimonialCardProps[]
  /** Section title. */
  heading?: string
  /** Section subtitle. */
  subheading?: string
  /** Grid of cards or single featured. Default grid. */
  layout?: 'grid' | 'single'
}

export default function TestimonialSection({
  testimonials,
  heading,
  subheading,
  layout = 'grid',
}: TestimonialSectionProps) {
  if (testimonials.length === 0) return null
  return (
    <div className="space-y-8">
      {(heading || subheading) ? (
        <SectionHeading title={heading ?? ''} subtitle={subheading} align="center" />
      ) : null}
      {layout === 'single' ? (
        <div className="mx-auto max-w-2xl">
          <TestimonialCard {...testimonials[0]} />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>
      )}
    </div>
  )
}
