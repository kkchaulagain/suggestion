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
import {
  marketingHero,
  marketingStats,
  marketingHowItWorks,
  marketingUseCases,
  marketingTestimonials,
  marketingPricing,
  marketingFaq,
  marketingCtaFinal,
} from './landingMarketingTemplate'

const heroMediaPlaceholder = (
  <div className="aspect-video flex items-center justify-center rounded-lg bg-stone-200/50 p-8 text-stone-500 dark:bg-stone-600/30 dark:text-stone-400">
    <span className="text-sm">Create → Share link or QR → Collect responses</span>
  </div>
)

export default function LandingPage() {
  return (
    <PublicLayout mainClassName="pb-0">
      <SectionWrapper className="pt-12 sm:pt-20">
        <HeroSection
          headline={marketingHero.headline}
          subheadline={marketingHero.subheadline}
          badge={marketingHero.badge}
          variant="split"
          style="default"
          primaryCta={marketingHero.primaryCta}
          secondaryCta={marketingHero.secondaryCta}
          media={heroMediaPlaceholder}
        />
      </SectionWrapper>

      <SectionWrapper background="muted">
        <StatsBar stats={marketingStats} />
      </SectionWrapper>

      <SectionWrapper id="how-it-works">
        <FeatureGrid
          items={marketingHowItWorks}
          columns={3}
          heading="How it works"
          subheading="Create your form, share the link or QR code, and collect responses in your dashboard."
        />
      </SectionWrapper>

      <SectionWrapper background="muted" id="use-cases">
        <FeatureGrid
          items={marketingUseCases}
          columns={3}
          heading="Perfect for"
          subheading="From small feedback forms to events and in-person QR campaigns."
        />
      </SectionWrapper>

      <SectionWrapper id="testimonials">
        <TestimonialSection
          testimonials={marketingTestimonials}
          heading="Loved by individuals and teams"
          subheading="See how people use forms and QR codes in the real world."
          layout="grid"
        />
      </SectionWrapper>

      <SectionWrapper background="muted" id="pricing">
        <PricingSection
          plans={marketingPricing}
          heading="Simple pricing"
          subheading="Start free. Upgrade when you need more forms or submissions."
        />
      </SectionWrapper>

      <SectionWrapper id="faq">
        <FAQSection
          items={marketingFaq}
          heading="Frequently asked questions"
          subheading="Quick answers about forms, sharing, and QR codes."
        />
      </SectionWrapper>

      <SectionWrapper className="pb-24 sm:pb-32" background="muted">
        <CTASection
          text={marketingCtaFinal.text}
          ctaLabel={marketingCtaFinal.ctaLabel}
          ctaHref={marketingCtaFinal.ctaHref}
          secondaryCta={marketingCtaFinal.secondaryCta}
          variant="banner"
        />
      </SectionWrapper>
    </PublicLayout>
  )
}
