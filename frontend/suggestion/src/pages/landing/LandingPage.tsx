import { PublicLayout } from '../../components/layout'
import {
  HeroSection,
  FeatureGrid,
  StatsBar,
  TestimonialSection,
  PricingSection,
  FAQSection,
  CTASection,
  SectionWrapper,
} from '../../components/landing'
import type { MarketingTemplateConfig } from './landingMarketingTemplate'
import { marketingTemplateConfig } from './landingMarketingTemplate'
import { LANDING_PAGE_SECTIONS } from './landingPageTemplate'

type HeroContent = MarketingTemplateConfig['hero']
type StatsContent = MarketingTemplateConfig['stats']
type FeatureGridContent = MarketingTemplateConfig['howItWorks']
type TestimonialsContent = MarketingTemplateConfig['testimonials']
type PricingContent = MarketingTemplateConfig['pricing']
type FaqContent = MarketingTemplateConfig['faq']
type CtaFinalContent = MarketingTemplateConfig['ctaFinal']

const heroMediaPlaceholder = (
  <div className="aspect-video flex items-center justify-center rounded-lg bg-stone-200/50 p-8 text-stone-500 dark:bg-stone-600/30 dark:text-stone-400">
    <span className="text-sm">Create → Share link or QR → Collect responses</span>
  </div>
)

export default function LandingPage() {
  return (
    <PublicLayout mainClassName="pb-0">
      {LANDING_PAGE_SECTIONS.map((section, index) => {
        const content = marketingTemplateConfig[section.configKey]
        if (!content) return null

        return (
          <SectionWrapper
            key={section.id ?? section.type + index}
            id={section.id}
            className={section.className}
            background={section.background}
          >
            {section.type === 'hero' && (
              <HeroSection
                headline={(content as HeroContent).headline}
                subheadline={(content as HeroContent).subheadline}
                badge={(content as HeroContent).badge}
                variant="split"
                style="default"
                primaryCta={(content as HeroContent).primaryCta}
                secondaryCta={(content as HeroContent).secondaryCta}
                media={heroMediaPlaceholder}
              />
            )}
            {section.type === 'stats' && (
              <StatsBar stats={content as StatsContent} />
            )}
            {section.type === 'feature_grid' && (
              <FeatureGrid
                items={content as FeatureGridContent}
                columns={section.columns ?? 3}
                heading={section.heading ?? ''}
                subheading={section.subheading ?? ''}
              />
            )}
            {section.type === 'testimonials' && (
              <TestimonialSection
                testimonials={content as TestimonialsContent}
                heading={section.heading ?? ''}
                subheading={section.subheading ?? ''}
                layout={section.layout ?? 'grid'}
              />
            )}
            {section.type === 'pricing' && (
              <PricingSection
                plans={content as PricingContent}
                heading={section.heading ?? ''}
                subheading={section.subheading ?? ''}
              />
            )}
            {section.type === 'faq' && (
              <FAQSection
                items={content as FaqContent}
                heading={section.heading ?? ''}
                subheading={section.subheading ?? ''}
              />
            )}
            {section.type === 'cta' && (
              <CTASection
                text={(content as CtaFinalContent).text}
                ctaLabel={(content as CtaFinalContent).ctaLabel}
                ctaHref={(content as CtaFinalContent).ctaHref}
                secondaryCta={(content as CtaFinalContent).secondaryCta}
                variant={section.variant}
              />
            )}
          </SectionWrapper>
        )
      })}
    </PublicLayout>
  )
}
