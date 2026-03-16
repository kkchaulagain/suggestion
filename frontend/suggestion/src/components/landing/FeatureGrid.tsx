import type { ReactNode } from 'react'
import FeatureCard from './FeatureCard'
import SectionHeading from './SectionHeading'

export interface FeatureGridItem {
  icon: ReactNode
  title: string
  description: string
}

export interface FeatureGridProps {
  items: FeatureGridItem[]
  /** Number of columns on large screens. Default 3. */
  columns?: 2 | 3 | 4
  /** Optional section title above the grid. */
  heading?: string
  /** Optional subtitle. */
  subheading?: string
}

const columnClasses: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function FeatureGrid({
  items,
  columns = 3,
  heading,
  subheading,
}: FeatureGridProps) {
  if (items.length === 0) return null
  const gridClass = columnClasses[columns]
  return (
    <div className="space-y-10">
      {(heading || subheading) ? (
        <SectionHeading title={heading ?? ''} subtitle={subheading} align="center" />
      ) : null}
      <div className={`grid gap-8 ${gridClass}`}>
        {items.map((item, i) => (
          <FeatureCard
            key={i}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </div>
  )
}
