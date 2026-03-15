import { FileText, Share2, BarChart3 } from 'lucide-react'
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

const heroMediaPlaceholder = (
  <div className="aspect-video flex items-center justify-center rounded-lg bg-stone-200/50 p-8 text-stone-500 dark:bg-stone-600/30 dark:text-stone-400">
    <span className="text-sm">Dashboard preview</span>
  </div>
)

const stats = [
  { value: '500+', label: 'Businesses' },
  { value: '10k+', label: 'Submissions' },
  { value: '99.9%', label: 'Uptime' },
]

const featureItems = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Create a form',
    description: 'Build feedback forms, polls, or surveys with your own questions and branding.',
  },
  {
    icon: <Share2 className="h-6 w-6" />,
    title: 'Share the link',
    description: 'Share a link or download a QR code so customers can open and fill your form anywhere.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'View submissions',
    description: 'See all responses in your dashboard. Filter, export, and use the data you need.',
  },
]

const testimonials = [
  {
    quote: 'We switched to this platform and saw a 40% increase in response rates. Simple and effective.',
    name: 'Jane Smith',
    role: 'Product Manager, Acme Inc',
  },
  {
    quote: 'The QR code feature is a game-changer for our in-store feedback kiosks.',
    name: 'Alex Chen',
    role: 'Operations Lead',
  },
  {
    quote: 'Clean dashboard, easy to share forms with our team. Exactly what we needed.',
    name: 'Sam Williams',
    role: 'Customer Success, TechCo',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Up to 3 forms', '100 submissions/month', 'Basic analytics', 'Email support'],
    cta: { label: 'Get started', href: '/signup' },
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    features: ['Unlimited forms', 'Unlimited submissions', 'Advanced analytics', 'Custom branding', 'Priority support'],
    cta: { label: 'Start free trial', href: '/signup' },
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Everything in Pro', 'SSO & API access', 'Dedicated success manager', 'SLA guarantee'],
    cta: { label: 'Contact sales', href: '/login' },
    highlighted: false,
  },
]

const faqItems = [
  { question: 'How do I create my first form?', answer: 'Sign up, then go to Forms in your dashboard. Click "Create form" and add your questions. You can choose from text, multiple choice, ratings, and more.' },
  { question: 'Can I use my own branding?', answer: 'Yes. On Pro and Enterprise plans you can set your logo, colors, and domain so forms match your brand.' },
  { question: 'Where are submissions stored?', answer: 'Submissions are stored securely in your dashboard. You can view, filter, and export them as CSV. We keep your data private and do not share it with third parties.' },
  { question: 'Do you support QR codes?', answer: 'Yes. Every form has a unique link and a downloadable QR code so you can print or display it for in-person feedback.' },
  { question: 'What happens when I hit the submission limit?', answer: 'On the Free plan, new submissions are paused until the next month or until you upgrade. We\'ll notify you before you reach the limit.' },
]

export default function LandingPage() {
  return (
    <PublicLayout mainClassName="pb-0">
      <SectionWrapper className="pt-12 sm:pt-20">
        <HeroSection
          headline="Collect feedback and suggestions from your customers"
          subheadline="Create forms, share a link or QR code, and get responses in one place. Simple, fast, and built for businesses."
          badge="New: Poll support"
          variant="split"
          style="default"
          primaryCta={{ label: 'Get started', href: '/signup' }}
          secondaryCta={{ label: 'Log in', href: '/login' }}
          media={heroMediaPlaceholder}
        />
      </SectionWrapper>

      <SectionWrapper background="muted">
        <StatsBar stats={stats} />
      </SectionWrapper>

      <SectionWrapper id="how-it-works">
        <FeatureGrid
          items={featureItems}
          columns={3}
          heading="How it works"
          subheading="Three steps to start collecting feedback."
        />
      </SectionWrapper>

      <SectionWrapper background="muted" id="testimonials">
        <TestimonialSection
          testimonials={testimonials}
          heading="Loved by teams"
          subheading="See what our customers say."
          layout="grid"
        />
      </SectionWrapper>

      <SectionWrapper id="pricing">
        <PricingSection
          plans={pricingPlans}
          heading="Simple pricing"
          subheading="Start free, upgrade when you need more."
        />
      </SectionWrapper>

      <SectionWrapper background="muted" id="faq">
        <FAQSection
          items={faqItems}
          heading="Frequently asked questions"
          subheading="Quick answers to common questions."
        />
      </SectionWrapper>

      <SectionWrapper className="pb-24 sm:pb-32">
        <CTASection
          text="Ready to start collecting feedback? Join thousands of businesses today."
          ctaLabel="Sign up free"
          ctaHref="/signup"
          secondaryCta={{ label: 'Contact sales', href: '/login' }}
          variant="banner"
        />
      </SectionWrapper>
    </PublicLayout>
  )
}
