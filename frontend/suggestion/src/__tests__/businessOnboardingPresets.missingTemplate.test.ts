/**
 * Tests getStarterBundle when page templates are missing (PAGE_TEMPLATES empty).
 * Covers the flatMap branch: if (!pageTemplate) return []
 */

jest.mock('../pages/business-dashboard/pages/pageTemplates', () => ({
  PAGE_TEMPLATES: [],
}))

import { getStarterBundle, type SiteArchetypeId } from '../pages/business-dashboard/pages/businessOnboardingPresets'

describe('getStarterBundle with missing page templates', () => {
  const archetypeIds: SiteArchetypeId[] = [
    'business_service',
    'selling_products',
    'appointment_booking',
    'event_or_campaign',
    'custom_start',
  ]

  it('returns empty pages array when no page templates exist', () => {
    archetypeIds.forEach((id) => {
      const bundle = getStarterBundle(id)
      expect(bundle.pages).toEqual([])
      expect(bundle.forms.length).toBeGreaterThanOrEqual(0)
    })
  })
})
