import { sidebarItems } from '../pages/business-dashboard/types/navigation'

describe('navigation', () => {
  it('exports sidebarItems with Forms, Submissions, Businesses', () => {
    expect(sidebarItems).toHaveLength(3)
    expect(sidebarItems[0]).toEqual({ label: 'Forms', path: '/dashboard/forms' })
    expect(sidebarItems[1]).toEqual({ label: 'Submissions', path: '/dashboard/submissions' })
    expect(sidebarItems[2]).toEqual({ label: 'Businesses', path: '/dashboard/businesses' })
  })
})
