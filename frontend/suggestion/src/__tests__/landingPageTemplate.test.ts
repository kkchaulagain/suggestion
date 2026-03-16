import { LANDING_PAGE_SECTIONS } from '../pages/landing/landingPageTemplate'
import type { MarketingTemplateConfig } from '../pages/landing/landingMarketingTemplate'

const validConfigKeys: (keyof MarketingTemplateConfig)[] = [
  'hero',
  'stats',
  'howItWorks',
  'useCases',
  'testimonials',
  'pricing',
  'faq',
  'ctaFinal',
]

describe('landingPageTemplate', () => {
  describe('LANDING_PAGE_SECTIONS', () => {
    it('is an array of length 8', () => {
      expect(LANDING_PAGE_SECTIONS).toHaveLength(8)
    })

    it('each section has type and configKey', () => {
      LANDING_PAGE_SECTIONS.forEach((section, i) => {
        expect(section).toHaveProperty('type')
        expect(section).toHaveProperty('configKey')
        expect(validConfigKeys).toContain(section.configKey)
      })
    })

    it('first section is hero with configKey hero', () => {
      expect(LANDING_PAGE_SECTIONS[0].type).toBe('hero')
      expect(LANDING_PAGE_SECTIONS[0].configKey).toBe('hero')
    })

    it('has section with id pricing', () => {
      const pricing = LANDING_PAGE_SECTIONS.find((s) => s.id === 'pricing')
      expect(pricing).toBeDefined()
      expect(pricing?.type).toBe('pricing')
      expect(pricing?.configKey).toBe('pricing')
    })

    it('has section with variant banner', () => {
      const cta = LANDING_PAGE_SECTIONS.find((s) => s.variant === 'banner')
      expect(cta).toBeDefined()
      expect(cta?.type).toBe('cta')
      expect(cta?.configKey).toBe('ctaFinal')
    })
  })
})
