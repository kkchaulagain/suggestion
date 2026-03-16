import { Link } from 'react-router-dom'
import { Button, ThemeToggle } from '../ui'

export interface SiteHeaderNavItem {
  label: string
  href: string
}

export interface SiteHeaderProps {
  /** Link for logo/brand. Defaults to "/". */
  logoHref?: string
  /** Brand text shown next to or instead of logo. */
  brandName?: string
  /** Show Log in and Get started buttons. Default true. */
  showAuthButtons?: boolean
  /** Optional nav links (e.g. Product, Pricing, About). */
  navItems?: SiteHeaderNavItem[]
  className?: string
}

const DEFAULT_BRAND = 'Suggestion'

export default function SiteHeader({
  logoHref = '/',
  brandName = DEFAULT_BRAND,
  showAuthButtons = true,
  navItems = [],
  className = '',
}: SiteHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-20 flex items-center justify-between border-b border-stone-200/80 bg-stone-50 px-4 py-4 dark:border-stone-700/80 dark:bg-stone-950 sm:px-6 ${className}`.trim()}
      role="banner"
    >
      <Link
        to={logoHref}
        className="shrink-0 text-lg font-semibold text-stone-900 hover:text-stone-700 dark:text-stone-100 dark:hover:text-stone-300"
      >
        {brandName}
      </Link>
      {navItems.length > 0 ? (
        <nav className="hidden flex-1 items-center justify-center gap-6 sm:flex" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : (
        <div className="flex-1" aria-hidden />
      )}
      <div className="flex shrink-0 items-center gap-2">
        {showAuthButtons ? (
          <>
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Get started
              </Button>
            </Link>
          </>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  )
}
