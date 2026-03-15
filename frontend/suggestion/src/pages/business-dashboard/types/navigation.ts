import type { LucideIcon } from 'lucide-react'
import { FileText, Inbox, Building2, UserCircle, Users } from 'lucide-react'

export interface SidebarItem {
  label: string
  path: string
  icon: LucideIcon
  /** If set, only users with one of these roles see this item. Omit = visible to all roles that get this dashboard. */
  requiredRoles?: string[]
}

/** Roles that can access the business dashboard (forms, submissions, businesses). */
export const DASHBOARD_ROLES = ['admin', 'business', 'governmentservices', 'user'] as const

/** Sidebar items for business dashboard. Each item is shown only to roles in its requiredRoles (or all dashboard roles if omitted). */
export const sidebarItems: SidebarItem[] = [
  { label: 'Forms', path: '/dashboard/forms', icon: FileText, requiredRoles: [...DASHBOARD_ROLES] },
  { label: 'Submissions', path: '/dashboard/submissions', icon: Inbox, requiredRoles: [...DASHBOARD_ROLES] },
  { label: 'Businesses', path: '/dashboard/businesses', icon: Building2, requiredRoles: ['admin'] },
  { label: 'Users', path: '/dashboard/users', icon: Users, requiredRoles: ['admin'] },
  { label: 'Profile', path: '/dashboard/profile', icon: UserCircle, requiredRoles: [...DASHBOARD_ROLES] },
]
