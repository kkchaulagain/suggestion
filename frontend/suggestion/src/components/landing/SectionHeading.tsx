export interface SectionHeadingProps {
  title: string
  /** Optional subtitle below the title. */
  subtitle?: string
  /** Text alignment. Default center for landing sections. */
  align?: 'left' | 'center'
}

export default function SectionHeading({ title, subtitle, align = 'center' }: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center' : 'text-left'
  return (
    <div className={alignClass}>
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-2xl text-base text-stone-600 dark:text-stone-400 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
