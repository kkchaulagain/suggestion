import { sidebarItems } from '../pages/business-dashboard/types/navigation'

describe('navigation', () => {
  it('exports sidebarItems with Forms, Submissions, Businesses, Profile and icons', () => {
    expect(sidebarItems).toHaveLength(4)
    expect(sidebarItems[0]).toMatchObject({ label: 'Forms', path: '/dashboard/forms' })
    expect(sidebarItems[1]).toMatchObject({ label: 'Submissions', path: '/dashboard/submissions' })
    expect(sidebarItems[2]).toMatchObject({ label: 'Businesses', path: '/dashboard/businesses' })
    expect(sidebarItems[3]).toMatchObject({ label: 'Profile', path: '/dashboard/profile' })
    sidebarItems.forEach((item) => {
      expect(item.icon).toBeDefined()
    })
  })
})
