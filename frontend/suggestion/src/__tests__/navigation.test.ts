import { sidebarItems } from '../pages/business-dashboard/types/navigation'

describe('navigation', () => {
  it('exports sidebarItems with Forms, Pages, Submissions, Notifications, Businesses, Users, Profile and icons', () => {
    expect(sidebarItems).toHaveLength(7)
    expect(sidebarItems[0]).toMatchObject({ label: 'Forms', path: '/dashboard/forms' })
    expect(sidebarItems[1]).toMatchObject({ label: 'Pages', path: '/dashboard/pages' })
    expect(sidebarItems[2]).toMatchObject({ label: 'Submissions', path: '/dashboard/submissions' })
    expect(sidebarItems[3]).toMatchObject({ label: 'Notifications', path: '/dashboard/notifications', requiredRoles: ['business', 'admin'] })
    expect(sidebarItems[4]).toMatchObject({ label: 'Businesses', path: '/dashboard/businesses', requiredRoles: ['admin'] })
    expect(sidebarItems[5]).toMatchObject({ label: 'Users', path: '/dashboard/users', requiredRoles: ['admin'] })
    expect(sidebarItems[6]).toMatchObject({ label: 'Profile', path: '/dashboard/profile' })
    sidebarItems.forEach((item) => {
      expect(item.icon).toBeDefined()
    })
  })
})
