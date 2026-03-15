/**
 * Marketing template for the form-builder platform landing page.
 * Value prop: Create forms → Share (link + QR code) → Collect responses.
 * Audience: Anyone — individuals and businesses.
 */
import { FileText, Share2, BarChart3, QrCode, Users, Store } from 'lucide-react'

export const marketingHero = {
  badge: 'No code required',
  headline: 'Create forms. Share a link or QR code. Get responses in one place.',
  subheadline:
    'Whether you run a business, host events, or just need to collect feedback — build forms in minutes, share via link or printable QR code, and view all responses in your dashboard.',
  primaryCta: { label: 'Get started free', href: '/signup' },
  secondaryCta: { label: 'Log in', href: '/login' },
}

export const marketingStats = [
  { value: '10k+', label: 'Forms created' },
  { value: '1M+', label: 'Responses collected' },
  { value: '99.9%', label: 'Uptime' },
]

export const marketingHowItWorks = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Create your form',
    description:
      'Add questions, choose field types (text, choice, rating, and more), and set your branding. No coding needed.',
  },
  {
    icon: <Share2 className="h-6 w-6" />,
    title: 'Share link or QR code',
    description:
      'Every form gets a unique link. Generate a QR code to print or display — perfect for in-store kiosks, events, or flyers.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Collect and use responses',
    description:
      'View submissions in your dashboard. Filter, export to CSV, and use the data where it matters.',
  },
]

export const marketingUseCases = [
  {
    icon: <Store className="h-6 w-6" />,
    title: 'Businesses',
    description: 'Customer feedback, NPS, support surveys, and satisfaction forms.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Events & outreach',
    description: 'Registrations, sign-ups, and on-the-spot feedback via QR at booths or venues.',
  },
  {
    icon: <QrCode className="h-6 w-6" />,
    title: 'QR-first workflows',
    description: 'Print QR codes for menus, posters, or tables so people can open and submit in one tap.',
  },
]

export const marketingTestimonials = [
  {
    quote:
      'We needed a simple way to get feedback at our pop-up. We put the QR code on the counter and got hundreds of responses in a week.',
    name: 'Priya M.',
    role: 'Small business owner',
  },
  {
    quote:
      'The QR code feature is a game-changer. We use it at events and in our store — no more typing long URLs.',
    name: 'Alex Chen',
    role: 'Operations Lead',
  },
  {
    quote:
      'Clean dashboard, easy to share forms with our team. We use it for surveys and feedback. Exactly what we needed.',
    name: 'Sam Williams',
    role: 'Customer Success, TechCo',
  },
]

export const marketingPricing = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Up to 3 forms',
      '100 submissions/month',
      'Shareable link & QR code',
      'Basic analytics',
    ],
    cta: { label: 'Get started', href: '/signup' },
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    features: [
      'Unlimited forms',
      'Unlimited submissions',
      'Custom branding',
      'Advanced analytics',
      'Priority support',
    ],
    cta: { label: 'Start free trial', href: '/signup' },
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'Everything in Pro',
      'SSO & API access',
      'Dedicated success manager',
      'SLA guarantee',
    ],
    cta: { label: 'Contact sales', href: '/login' },
    highlighted: false,
  },
]

export const marketingFaq = [
  {
    question: 'How do I create my first form?',
    answer:
      'Sign up, then go to Forms in your dashboard. Click "Create form" and add your questions. You can use text, multiple choice, ratings, and more. When you’re done, share the link or download the QR code.',
  },
  {
    question: 'Can I share my form with a QR code?',
    answer:
      'Yes. Every form has a unique link and a downloadable QR code. Print it or display it on a screen so people can open the form with their phone camera — no typing required.',
  },
  {
    question: 'Who can use this — only businesses?',
    answer:
      'Anyone. Individuals, teams, and businesses use it for feedback, surveys, event sign-ups, and more. No coding or design skills needed.',
  },
  {
    question: 'Where are submissions stored?',
    answer:
      'Submissions are stored securely in your dashboard. You can view, filter, and export them as CSV. We keep your data private and do not share it with third parties.',
  },
  {
    question: 'Can I use my own branding?',
    answer:
      'Yes. On Pro and Enterprise plans you can set your logo, colors, and domain so forms match your brand.',
  },
]

export const marketingCtaFinal = {
  text: 'Create your first form in minutes. Share the link or QR code and start collecting responses.',
  ctaLabel: 'Sign up free',
  ctaHref: '/signup',
  secondaryCta: { label: 'Contact sales', href: '/login' },
}

export type MarketingTemplateConfig = {
  hero: typeof marketingHero
  stats: typeof marketingStats
  howItWorks: typeof marketingHowItWorks
  useCases: typeof marketingUseCases
  testimonials: typeof marketingTestimonials
  pricing: typeof marketingPricing
  faq: typeof marketingFaq
  ctaFinal: typeof marketingCtaFinal
}

export const marketingTemplateConfig: MarketingTemplateConfig = {
  hero: marketingHero,
  stats: marketingStats,
  howItWorks: marketingHowItWorks,
  useCases: marketingUseCases,
  testimonials: marketingTestimonials,
  pricing: marketingPricing,
  faq: marketingFaq,
  ctaFinal: marketingCtaFinal,
}
