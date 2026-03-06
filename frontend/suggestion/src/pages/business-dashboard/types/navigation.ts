import type { LucideIcon } from 'lucide-react'
import { FileText, Inbox, Building2, UserCircle } from 'lucide-react'

export interface SidebarItem {
  label: string
  path: string
  icon: LucideIcon
}

/** Sidebar items for business dashboard. */
export const sidebarItems: SidebarItem[] = [
  { label: 'Forms', path: '/dashboard/forms', icon: FileText },
  { label: 'Submissions', path: '/dashboard/submissions', icon: Inbox },
  { label: 'Businesses', path: '/dashboard/businesses', icon: Building2 },
  { label: 'Profile', path: '/dashboard/profile', icon: UserCircle },
]
