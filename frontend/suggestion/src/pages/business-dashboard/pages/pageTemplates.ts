/**
 * Page (landing) template definitions for the create-page flow.
 * Same idea as form templates: choose a template or start from scratch.
 */

export type PageTemplateCategory = 'marketing' | 'simple' | 'feedback'

export type PageTemplateIconName =
  | 'Layout'
  | 'Megaphone'
  | 'FileText'
  | 'Sparkles'

/** Block without clientId — clientId is added when applying the template. */
export interface PageTemplateBlock {
  type:
    | 'heading'
    | 'paragraph'
    | 'form'
    | 'hero'
    | 'feature_card'
    | 'feature_grid'
    | 'image'
    | 'cta'
    | 'stats'
    | 'testimonials'
    | 'pricing'
    | 'faq'
  payload: Record<string, unknown>
}

export interface PageTemplate {
  id: string
  label: string
  description: string
  iconName: PageTemplateIconName
  category: PageTemplateCategory
  /** Default page title when user picks this template. */
  defaultTitle?: string
  blocks: PageTemplateBlock[]
}

const MARKETING: PageTemplateCategory = 'marketing'
const SIMPLE: PageTemplateCategory = 'simple'
const FEEDBACK: PageTemplateCategory = 'feedback'

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'landing-page',
    label: 'Landing page',
    description: 'Full app homepage: hero, stats, how it works, use cases, testimonials, pricing, FAQ, and CTA.',
    iconName: 'Layout',
    category: MARKETING,
    defaultTitle: 'Landing',
    blocks: [
      {
        type: 'hero',
        payload: {
          badge: 'No code required',
          headline: 'Create forms. Share a link or QR code. Get responses in one place.',
          subheadline:
            'Whether you run a business, host events, or just need to collect feedback — build forms in minutes, share via link or printable QR code, and view all responses in your dashboard.',
          variant: 'split',
          style: 'default',
          mediaType: 'icon',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'Get started free', href: '/signup' },
          secondaryCta: { label: 'Log in', href: '/login' },
        },
      },
      {
        type: 'stats',
        payload: {
          stats: [
            { value: '10k+', label: 'Forms created' },
            { value: '1M+', label: 'Responses collected' },
            { value: '99.9%', label: 'Uptime' },
          ],
          showDividers: true,
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'How it works', align: 'center' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 3,
          heading: 'How it works',
          subheading: '',
          items: [
            { icon: 'file-text', title: 'Create your form', description: 'Add questions, choose field types, and set your branding. No coding needed.' },
            { icon: 'share2', title: 'Share link or QR code', description: 'Every form gets a unique link. Generate a QR code to print or display.' },
            { icon: 'bar-chart3', title: 'Collect responses', description: 'View submissions in your dashboard. Filter, export to CSV, and use the data.' },
          ],
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'Perfect for', align: 'center' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 3,
          heading: 'Perfect for',
          subheading: '',
          items: [
            { icon: 'store', title: 'Businesses', description: 'Customer feedback, NPS, support surveys, and satisfaction forms.' },
            { icon: 'users', title: 'Events & outreach', description: 'Registrations, sign-ups, and on-the-spot feedback via QR at booths.' },
            { icon: 'qr-code', title: 'QR-first workflows', description: 'Print QR codes for posters or tables so people can open and submit in one tap.' },
          ],
        },
      },
      {
        type: 'testimonials',
        payload: {
          heading: 'Loved by individuals and teams',
          subheading: 'See how people use forms and QR codes in the real world.',
          layout: 'grid',
          testimonials: [
            { quote: 'We needed a simple way to get feedback at our pop-up. We put the QR code on the counter and got hundreds of responses in a week.', name: 'Priya M.', role: 'Small business owner' },
            { quote: 'The QR code feature is a game-changer. We use it at events and in our store — no more typing long URLs.', name: 'Alex Chen', role: 'Operations Lead' },
            { quote: 'Clean dashboard, easy to share forms with our team. We use it for surveys and feedback. Exactly what we needed.', name: 'Sam Williams', role: 'Customer Success, TechCo' },
          ],
        },
      },
      {
        type: 'pricing',
        payload: {
          heading: 'Simple pricing',
          subheading: 'Start free. Upgrade when you need more forms or submissions.',
          plans: [
            { name: 'Free', price: '$0', period: 'forever', features: ['Up to 3 forms', '100 submissions/month', 'Shareable link & QR code', 'Basic analytics'], cta: { label: 'Get started', href: '/signup' }, highlighted: false },
            { name: 'Pro', price: '$29', period: 'per month', features: ['Unlimited forms', 'Unlimited submissions', 'Custom branding', 'Advanced analytics', 'Priority support'], cta: { label: 'Start free trial', href: '/signup' }, highlighted: true },
            { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'SSO & API access', 'Dedicated success manager', 'SLA guarantee'], cta: { label: 'Contact sales', href: '/login' }, highlighted: false },
          ],
        },
      },
      {
        type: 'faq',
        payload: {
          heading: 'Frequently asked questions',
          subheading: 'Quick answers about forms, sharing, and QR codes.',
          items: [
            { question: 'How do I create my first form?', answer: 'Sign up, then go to Forms in your dashboard. Click "Create form" and add your questions. You can use text, multiple choice, ratings, and more. When you\'re done, share the link or download the QR code.' },
            { question: 'Can I share my form with a QR code?', answer: 'Yes. Every form has a unique link and a downloadable QR code. Print it or display it on a screen so people can open the form with their phone camera — no typing required.' },
            { question: 'Who can use this — only businesses?', answer: 'Anyone. Individuals, teams, and businesses use it for feedback, surveys, event sign-ups, and more. No coding or design skills needed.' },
            { question: 'Where are submissions stored?', answer: 'Submissions are stored securely in your dashboard. You can view, filter, and export them as CSV. We keep your data private and do not share it with third parties.' },
            { question: 'Can I use my own branding?', answer: 'Yes. On Pro and Enterprise plans you can set your logo, colors, and domain so forms match your brand.' },
          ],
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Create your first form in minutes. Share the link or QR code and start collecting responses.',
          ctaLabel: 'Sign up free',
          ctaHref: '/signup',
          secondaryCta: { label: 'Contact sales', href: '/login' },
          variant: 'banner',
        },
      },
    ],
  },
  {
    id: 'marketing-landing',
    label: 'Form-builder marketing',
    description: 'Full landing page for a form/survey platform: hero, how it works, use cases, and CTA.',
    iconName: 'Megaphone',
    category: MARKETING,
    defaultTitle: 'Form & feedback platform',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: 'Create forms. Share a link or QR code. Get responses in one place.',
          subheadline:
            'Whether you run a business, host events, or just need to collect feedback — build forms in minutes, share via link or printable QR code, and view all responses in your dashboard.',
          variant: 'split',
          style: 'default',
          mediaType: 'icon',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'Get started free', href: '/signup' },
          secondaryCta: { label: 'Log in', href: '/login' },
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'How it works' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 3,
          items: [
            { icon: 'file-text', title: 'Create your form', description: 'Add questions, choose field types, and set your branding. No coding needed.' },
            { icon: 'share2', title: 'Share link or QR code', description: 'Every form gets a unique link. Generate a QR code to print or display.' },
            { icon: 'bar-chart3', title: 'Collect responses', description: 'View submissions in your dashboard. Filter, export to CSV, and use the data.' },
          ],
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'Perfect for' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 3,
          items: [
            { icon: 'store', title: 'Businesses', description: 'Customer feedback, NPS, support surveys, and satisfaction forms.' },
            { icon: 'users', title: 'Events & outreach', description: 'Registrations, sign-ups, and on-the-spot feedback via QR at booths.' },
            { icon: 'qr-code', title: 'QR-first workflows', description: 'Print QR codes for posters or tables so people can open and submit in one tap.' },
          ],
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Create your first form in minutes. Share the link or QR code and start collecting responses.',
          ctaLabel: 'Sign up free',
          ctaHref: '/signup',
        },
      },
    ],
  },
  {
    id: 'simple-landing',
    label: 'Simple landing',
    description: 'Minimal one-screen page: hero and a single call-to-action.',
    iconName: 'Layout',
    category: SIMPLE,
    defaultTitle: 'Welcome',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: 'Welcome',
          subheadline: 'Add your message and a call-to-action below. Clean and simple.',
          variant: 'centered',
          style: 'minimal',
          mediaType: 'none',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'Get started', href: '/signup' },
          secondaryCta: { label: 'Learn more', href: '/#features' },
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Ready to get started?',
          ctaLabel: 'Sign up',
          ctaHref: '/signup',
        },
      },
    ],
  },
  {
    id: 'feedback-form-page',
    label: 'Feedback / form focus',
    description: 'Page built around a single form: hero, short intro, embedded form, and CTA.',
    iconName: 'FileText',
    category: FEEDBACK,
    defaultTitle: 'We\'d love your feedback',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: "We'd love your feedback",
          subheadline: 'Your input helps us improve. Fill out the form below — it only takes a minute.',
          variant: 'centered',
          style: 'default',
          mediaType: 'none',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'Go to form', href: '#form' },
          secondaryCta: { label: '', href: '' },
        },
      },
      {
        type: 'paragraph',
        payload: {
          text: 'Tell us what you think. All fields are optional except where marked.',
        },
      },
      {
        type: 'form',
        payload: { formId: '' },
      },
      {
        type: 'cta',
        payload: {
          text: 'Thank you for your feedback. Need help? Get in touch.',
          ctaLabel: 'Contact us',
          ctaHref: '/contact',
        },
      },
    ],
  },
  {
    id: 'blank',
    label: 'Blank page',
    description: 'Start with no blocks. Add sections manually.',
    iconName: 'Sparkles',
    category: SIMPLE,
    defaultTitle: 'New page',
    blocks: [],
  },
]

export const PAGE_TEMPLATE_CATEGORIES: { value: PageTemplateCategory; label: string; description: string }[] = [
  { value: 'marketing', label: 'Marketing', description: 'Full landing pages for products or platforms.' },
  { value: 'simple', label: 'Simple', description: 'Minimal pages with hero and CTA.' },
  { value: 'feedback', label: 'Feedback', description: 'Pages centered on a form or survey.' },
]
