export interface TestimonialCardProps {
  quote: string
  name: string
  /** Role or company, e.g. "CTO, Acme Inc" */
  role?: string
  avatarUrl?: string
}

export default function TestimonialCard({ quote, name, role, avatarUrl }: TestimonialCardProps) {
  return (
    <blockquote className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-800/50">
      <p className="text-stone-700 dark:text-stone-300">&ldquo;{quote}&rdquo;</p>
      <footer className="mt-4 flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <cite className="not-italic font-semibold text-stone-900 dark:text-stone-100">
            {name}
          </cite>
          {role ? (
            <p className="text-sm text-stone-600 dark:text-stone-400">{role}</p>
          ) : null}
        </div>
      </footer>
    </blockquote>
  )
}
