import SiteFooter from '../../../components/layout/SiteFooter'
import type { SiteFooterLink } from '../../../components/layout/SiteFooter'

interface CmsPublicFooterProps {
  links: SiteFooterLink[]
}

export default function CmsPublicFooter({ links }: CmsPublicFooterProps) {
  return (
    <SiteFooter
      links={links}
      siteName="Your Site"
      tagline=""
    />
  )
}
