import SiteHeader from '../../../components/layout/SiteHeader'
import type { SiteHeaderNavItem } from '../../../components/layout/SiteHeader'

interface CmsPublicHeaderProps {
  navItems: SiteHeaderNavItem[]
}

export default function CmsPublicHeader({ navItems }: CmsPublicHeaderProps) {
  return (
    <SiteHeader
      brandName="Your Site"
      showAuthButtons={false}
      navItems={navItems}
    />
  )
}
