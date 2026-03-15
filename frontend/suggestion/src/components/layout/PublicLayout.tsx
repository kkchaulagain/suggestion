import type { ReactNode } from 'react'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'
import type { SiteHeaderProps } from './SiteHeader'
import type { SiteFooterProps } from './SiteFooter'

export interface PublicLayoutProps {
  children: ReactNode
  /** Optional overrides for SiteHeader. */
  headerProps?: Partial<SiteHeaderProps>
  /** Optional overrides for SiteFooter (e.g. footerLinks). */
  footerProps?: Partial<SiteFooterProps>
  /** Optional className for the main content wrapper. */
  mainClassName?: string
}

export default function PublicLayout({
  children,
  headerProps = {},
  footerProps = {},
  mainClassName = '',
}: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <SiteHeader {...headerProps} />
      <main className={`flex-1 ${mainClassName}`.trim()}>
        {children}
      </main>
      <SiteFooter {...footerProps} />
    </div>
  )
}
