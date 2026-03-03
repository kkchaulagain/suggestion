import { sidebarItems } from '../pages/business-dashboard/types/navigation'

describe('navigation', () => {
  it('exports sidebarItems with Forms, Submissions, Profile', () => {
    expect(sidebarItems).toHaveLength(4)
    expect(sidebarItems[0]).toEqual({ label: 'Forms', path: '/dashboard/forms' })
    expect(sidebarItems[1]).toEqual({ label: 'Submissions', path: '/dashboard/submissions' })
    expect(sidebarItems[2]).toEqual({ label: 'Businesses', path: '/dashboard/businesses' })
    expect(sidebarItems[3]).toEqual({ label: 'Profile', path: '/dashboard/profile' })
  })
})
