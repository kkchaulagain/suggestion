import {
  getStarterBundle,
  SITE_ARCHETYPES,
  type OnboardingFormPayload,
  type OnboardingPagePayload,
  type SiteArchetypeId,
} from '../pages/business-dashboard/pages/businessOnboardingPresets'

describe('businessOnboardingPresets', () => {
  const archetypeIds: SiteArchetypeId[] = [
    'business_service',
    'selling_products',
    'appointment_booking',
    'event_or_campaign',
    'custom_start',
  ]

  describe('SITE_ARCHETYPES', () => {
    it('includes all bundle archetype ids', () => {
      expect(SITE_ARCHETYPES.map((a) => a.id)).toEqual(archetypeIds)
    })

    it('each archetype has id, label, description', () => {
      SITE_ARCHETYPES.forEach((arch) => {
        expect(arch).toMatchObject({
          id: expect.any(String),
          label: expect.any(String),
          description: expect.any(String),
        })
        expect(archetypeIds).toContain(arch.id)
      })
    })
  })

  describe('getStarterBundle', () => {
    it('returns forms and pages arrays for every archetype', () => {
      archetypeIds.forEach((id) => {
        const bundle = getStarterBundle(id)
        expect(bundle).toEqual({ forms: expect.any(Array), pages: expect.any(Array) })
        expect(Array.isArray(bundle.forms)).toBe(true)
        expect(Array.isArray(bundle.pages)).toBe(true)
      })
    })

    it('forms have OnboardingFormPayload shape', () => {
      archetypeIds.forEach((id) => {
        const { forms } = getStarterBundle(id)
        forms.forEach((form: OnboardingFormPayload) => {
          expect(form).toMatchObject({
            title: expect.any(String),
            fields: expect.any(Array),
          })
          expect(form.fields.length).toBeGreaterThanOrEqual(0)
        })
      })
    })

    it('pages have OnboardingPagePayload shape and no nulls', () => {
      archetypeIds.forEach((id) => {
        const { pages } = getStarterBundle(id)
        expect(pages.every((p): p is OnboardingPagePayload => p != null)).toBe(true)
        pages.forEach((page: OnboardingPagePayload) => {
          expect(page).toMatchObject({
            title: expect.any(String),
            blocks: expect.any(Array),
          })
          expect(typeof page.title).toBe('string')
          expect(Array.isArray(page.blocks)).toBe(true)
        })
      })
    })

    it('returns empty forms and pages for unknown archetype', () => {
      const bundle = getStarterBundle('unknown' as SiteArchetypeId)
      expect(bundle).toEqual({ forms: [], pages: [] })
    })
  })
})
