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
            { icon: 'file-text', title: 'Businesses', description: 'Customer feedback, NPS, support surveys, and satisfaction forms.' },
            { icon: 'share2', title: 'Events & outreach', description: 'Registrations, sign-ups, and on-the-spot feedback via QR at booths.' },
            { icon: 'bar-chart3', title: 'QR-first workflows', description: 'Print QR codes for posters or tables so people can open and submit in one tap.' },
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
