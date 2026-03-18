import {
  getStarterBundle,
  getRequiredPageRoles,
  validatePageRoles,
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

    it('pages include role and slug from template structure', () => {
      archetypeIds.forEach((id) => {
        const { pages } = getStarterBundle(id)
        pages.forEach((page: OnboardingPagePayload) => {
          expect(page).toHaveProperty('role')
          expect(page).toHaveProperty('slug')
          expect(typeof page.role).toBe('string')
          expect(typeof page.slug).toBe('string')
        })
      })
    })

    it('returns empty forms and pages for unknown archetype', () => {
      const bundle = getStarterBundle('unknown' as SiteArchetypeId)
      expect(bundle).toEqual({ forms: [], pages: [] })
    })
  })

  describe('getRequiredPageRoles', () => {
    it('returns ordered page roles per archetype', () => {
      expect(getRequiredPageRoles('business_service')).toEqual(['contact', 'services'])
      expect(getRequiredPageRoles('selling_products')).toEqual(['home', 'products', 'contact'])
      expect(getRequiredPageRoles('custom_start')).toEqual(['contact'])
    })

    it('returns empty array for unknown archetype', () => {
      expect(getRequiredPageRoles('unknown' as SiteArchetypeId)).toEqual([])
    })
  })

  describe('validatePageRoles', () => {
    it('returns valid when all required roles are present', () => {
      expect(validatePageRoles('custom_start', [{ role: 'contact' }]).valid).toBe(true)
      expect(validatePageRoles('custom_start', [{ role: 'contact' }]).missing).toEqual([])
      expect(
        validatePageRoles('selling_products', [
          { role: 'home' },
          { role: 'products' },
          { role: 'contact' },
        ]).valid
      ).toBe(true)
    })

    it('returns invalid and lists missing roles when some are absent', () => {
      const result = validatePageRoles('selling_products', [{ role: 'home' }])
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('products')
      expect(result.missing).toContain('contact')
    })

    it('ignores pages without role', () => {
      const result = validatePageRoles('custom_start', [{ role: null }, {}])
      expect(result.valid).toBe(false)
      expect(result.missing).toEqual(['contact'])
    })
  })
})
