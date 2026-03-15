import {
  marketingHero,
  marketingStats,
  marketingHowItWorks,
  marketingUseCases,
  marketingTestimonials,
  marketingPricing,
  marketingFaq,
  marketingCtaFinal,
  marketingTemplateConfig,
  type MarketingTemplateConfig,
} from '../pages/landing/landingMarketingTemplate'

describe('landingMarketingTemplate', () => {
  test('marketingHero has expected shape', () => {
    expect(marketingHero.badge).toBe('No code required')
    expect(marketingHero.headline).toContain('Create forms')
    expect(marketingHero.primaryCta).toEqual({ label: 'Get started free', href: '/signup' })
    expect(marketingHero.secondaryCta).toEqual({ label: 'Log in', href: '/login' })
  })

  test('marketingStats has three items', () => {
    expect(marketingStats).toHaveLength(3)
    expect(marketingStats[0]).toEqual({ value: '10k+', label: 'Forms created' })
  })

  test('marketingHowItWorks has three steps with icons', () => {
    expect(marketingHowItWorks).toHaveLength(3)
    expect(marketingHowItWorks[0].title).toBe('Create your form')
    expect(marketingHowItWorks[1].title).toBe('Share link or QR code')
    expect(marketingHowItWorks[2].title).toBe('Collect and use responses')
  })

  test('marketingUseCases has three items', () => {
    expect(marketingUseCases).toHaveLength(3)
    expect(marketingUseCases.map((u) => u.title)).toEqual([
      'Businesses',
      'Events & outreach',
      'QR-first workflows',
    ])
  })

  test('marketingTestimonials has three items', () => {
    expect(marketingTestimonials).toHaveLength(3)
    expect(marketingTestimonials[0].name).toBe('Priya M.')
  })

  test('marketingPricing has Free, Pro, Enterprise', () => {
    expect(marketingPricing).toHaveLength(3)
    expect(marketingPricing[0].name).toBe('Free')
    expect(marketingPricing[1].name).toBe('Pro')
    expect(marketingPricing[1].highlighted).toBe(true)
    expect(marketingPricing[2].name).toBe('Enterprise')
  })

  test('marketingFaq has five questions', () => {
    expect(marketingFaq).toHaveLength(5)
    expect(marketingFaq[0].question).toContain('first form')
  })

  test('marketingCtaFinal has text and ctas', () => {
    expect(marketingCtaFinal.ctaLabel).toBe('Sign up free')
    expect(marketingCtaFinal.ctaHref).toBe('/signup')
    expect(marketingCtaFinal.secondaryCta).toEqual({ label: 'Contact sales', href: '/login' })
  })

  test('marketingTemplateConfig aggregates all sections', () => {
    const config: MarketingTemplateConfig = marketingTemplateConfig
    expect(config.hero).toBe(marketingHero)
    expect(config.stats).toBe(marketingStats)
    expect(config.howItWorks).toBe(marketingHowItWorks)
    expect(config.useCases).toBe(marketingUseCases)
    expect(config.testimonials).toBe(marketingTestimonials)
    expect(config.pricing).toBe(marketingPricing)
    expect(config.faq).toBe(marketingFaq)
    expect(config.ctaFinal).toBe(marketingCtaFinal)
  })
})
