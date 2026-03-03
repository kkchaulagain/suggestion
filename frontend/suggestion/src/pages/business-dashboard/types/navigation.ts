export interface SidebarItem {
  label: string
  path: string
}

/** Sidebar items for business dashboard. */
export const sidebarItems: SidebarItem[] = [
  { label: 'Forms', path: '/dashboard/forms' },
  { label: 'Submissions', path: '/dashboard/submissions' },
  { label: 'Businesses', path: '/dashboard/businesses' },
]
