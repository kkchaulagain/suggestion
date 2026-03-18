import {
  BUSINESS_DETAIL_SECTIONS,
  isSectionEnabled,
} from '../pages/business-dashboard/pages/businessDetailPageConfig'

describe('businessDetailPageConfig', () => {
  test('BUSINESS_DETAIL_SECTIONS defines ordered sections', () => {
    expect(BUSINESS_DETAIL_SECTIONS.length).toBeGreaterThanOrEqual(6)
    expect(BUSINESS_DETAIL_SECTIONS.map((s) => s.id)).toContain('overview')
  })

  test('isSectionEnabled matches section flags', () => {
    expect(isSectionEnabled('overview')).toBe(true)
    expect(isSectionEnabled('timeline')).toBe(true)
  })
})
