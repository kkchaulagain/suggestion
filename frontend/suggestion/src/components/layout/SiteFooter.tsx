import { Link } from 'react-router-dom'
import { branding } from '../../pages/feedback-form-render/branding'

export interface SiteFooterLink {
  label: string
  href: string
}

export interface SiteFooterProps {
  /** Optional footer links (e.g. About, Privacy, Terms, Contact). */
  links?: SiteFooterLink[]
  /** Override site name from branding. */
  siteName?: string
  /** Override tagline from branding. */
  tagline?: string
  /** Override logo URL from branding. */
  logoUrl?: string
  className?: string
}

const currentYear = new Date().getFullYear()

export default function SiteFooter({
  links = [],
  siteName: siteNameOverride,
  tagline: taglineOverride,
  logoUrl: logoUrlOverride,
  className = '',
}: SiteFooterProps) {
  const siteName = siteNameOverride ?? branding.siteName
  const tagline = taglineOverride ?? branding.tagline
  const logoUrl = logoUrlOverride ?? branding.logoUrl

  return (
    <footer
      className={`mt-auto flex flex-col items-center justify-center gap-6 border-t border-stone-200/80 bg-stone-50 py-8 text-center dark:border-stone-700/80 dark:bg-stone-950 sm:py-10 ${className}`.trim()}
      role="contentinfo"
    >
      {links.length > 0 ? (
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer">
          {links.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col items-center gap-1.5">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-7 w-auto object-contain opacity-80 dark:opacity-90"
            width={112}
            height={28}
            loading="lazy"
          />
        ) : null}
        <p className="text-[11px] font-medium tracking-wide text-stone-400 dark:text-stone-500">
          © {currentYear} {siteName}
        </p>
        {tagline ? (
          <p className="text-[10px] tracking-wide text-stone-400/90 dark:text-stone-500/90">
            {tagline}
          </p>
        ) : null}
      </div>
    </footer>
  )
}
