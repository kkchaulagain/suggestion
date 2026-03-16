/**
 * Page (landing) template definitions for the create-page flow.
 * Same idea as form templates: choose a template or start from scratch.
 */

export type PageTemplateCategory = 'marketing' | 'business' | 'portfolio' | 'event' | 'simple'

export type PageTemplateIconName =
  | 'Layout'
  | 'Megaphone'
  | 'FileText'
  | 'Sparkles'
  | 'Briefcase'
  | 'Image'
  | 'Calendar'
  | 'Package'

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
const BUSINESS: PageTemplateCategory = 'business'
const PORTFOLIO: PageTemplateCategory = 'portfolio'
const EVENT: PageTemplateCategory = 'event'
const SIMPLE: PageTemplateCategory = 'simple'

export const PAGE_TEMPLATES: PageTemplate[] = [
  // --- Marketing ---
  {
    id: 'landing-page',
    label: 'Landing page',
    description: 'Full marketing page: hero, stats, features, testimonials, pricing, FAQ, and CTA.',
    iconName: 'Layout',
    category: MARKETING,
    defaultTitle: 'Landing',
    blocks: [
      {
        type: 'hero',
        payload: {
          badge: 'Welcome',
          headline: 'Build something people love.',
          subheadline:
            'Tell your story, showcase your product or service, and connect with your audience. Customize every section to match your brand.',
          variant: 'split',
          style: 'default',
          mediaType: 'icon',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'Get started', href: '/signup' },
          secondaryCta: { label: 'Learn more', href: '/#features' },
        },
      },
      {
        type: 'stats',
        payload: {
          stats: [
            { value: '10k+', label: 'Happy customers' },
            { value: '99%', label: 'Satisfaction' },
            { value: '24/7', label: 'Support' },
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
            { icon: 'file-text', title: 'Step one', description: 'Describe your first step. Add your own copy and icon.' },
            { icon: 'share2', title: 'Step two', description: 'Describe your second step. Customize to fit your process.' },
            { icon: 'bar-chart3', title: 'Step three', description: 'Describe your third step. Keep it clear and concise.' },
          ],
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'Why choose us', align: 'center' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 3,
          heading: 'Why choose us',
          subheading: '',
          items: [
            { icon: 'store', title: 'Reliable', description: 'Edit this to highlight your strengths and differentiators.' },
            { icon: 'users', title: 'Support', description: 'Mention your support options and commitment to customers.' },
            { icon: 'qr-code', title: 'Flexible', description: 'Add a third benefit or value proposition here.' },
          ],
        },
      },
      {
        type: 'testimonials',
        payload: {
          heading: 'What people say',
          subheading: 'Add testimonials from customers or clients.',
          layout: 'grid',
          testimonials: [
            { quote: 'Replace with a real testimonial. Short and genuine works best.', name: 'Customer name', role: 'Title or company' },
            { quote: 'Another testimonial. Focus on outcomes and satisfaction.', name: 'Customer name', role: 'Title or company' },
            { quote: 'A third quote. Keep tone consistent with your brand.', name: 'Customer name', role: 'Title or company' },
          ],
        },
      },
      {
        type: 'pricing',
        payload: {
          heading: 'Pricing',
          subheading: 'Choose the plan that fits your needs.',
          plans: [
            { name: 'Starter', price: '$0', period: 'forever', features: ['Basic features', 'Community support', 'Up to 3 projects'], cta: { label: 'Get started', href: '/signup' }, highlighted: false },
            { name: 'Pro', price: '$29', period: 'per month', features: ['All Starter features', 'Priority support', 'Unlimited projects', 'Advanced analytics'], cta: { label: 'Start trial', href: '/signup' }, highlighted: true },
            { name: 'Enterprise', price: 'Custom', period: '', features: ['All Pro features', 'Dedicated support', 'Custom integrations', 'SLA'], cta: { label: 'Contact us', href: '/contact' }, highlighted: false },
          ],
        },
      },
      {
        type: 'faq',
        payload: {
          heading: 'Frequently asked questions',
          subheading: 'Common questions and answers.',
          items: [
            { question: 'How do I get started?', answer: 'Replace with your answer. Keep it helpful and concise.' },
            { question: 'What payment methods do you accept?', answer: 'List your accepted payment methods and billing cycle.' },
            { question: 'Can I change my plan later?', answer: 'Explain upgrade, downgrade, or cancellation policy.' },
            { question: 'Do you offer support?', answer: 'Describe your support channels and response times.' },
            { question: 'Is there a free trial?', answer: 'Clarify trial length and what is included.' },
          ],
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Ready to get started? Customize this message and link to your signup or contact page.',
          ctaLabel: 'Get started',
          ctaHref: '/signup',
          secondaryCta: { label: 'Contact us', href: '/contact' },
          variant: 'banner',
        },
      },
    ],
  },
  {
    id: 'product-showcase',
    label: 'Product showcase',
    description: 'Hero with image, features, stats, testimonials, pricing, and CTA.',
    iconName: 'Package',
    category: MARKETING,
    defaultTitle: 'Our Product',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: 'Introducing our product',
          subheadline: 'A short tagline or value proposition. Add an image in the editor to make it stand out.',
          variant: 'split',
          style: 'default',
          mediaType: 'image',
          imageUrl: '',
          imageAlt: 'Product',
          icon: 'sparkles',
          primaryCta: { label: 'Try it free', href: '/signup' },
          secondaryCta: { label: 'Watch demo', href: '/demo' },
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'Features', align: 'center' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 3,
          heading: 'Features',
          subheading: '',
          items: [
            { icon: 'file-text', title: 'Feature one', description: 'Describe your key feature and benefit.' },
            { icon: 'share2', title: 'Feature two', description: 'Another feature. Keep descriptions scannable.' },
            { icon: 'bar-chart3', title: 'Feature three', description: 'Third feature. Use consistent tone.' },
          ],
        },
      },
      {
        type: 'stats',
        payload: {
          stats: [
            { value: '50k+', label: 'Users' },
            { value: '4.9', label: 'Rating' },
            { value: '99.9%', label: 'Uptime' },
          ],
          showDividers: true,
        },
      },
      {
        type: 'testimonials',
        payload: {
          heading: 'Loved by teams',
          subheading: 'What our customers say.',
          layout: 'grid',
          testimonials: [
            { quote: 'Add a product testimonial here.', name: 'Customer', role: 'Company' },
            { quote: 'Another quote about results or experience.', name: 'Customer', role: 'Company' },
          ],
        },
      },
      {
        type: 'pricing',
        payload: {
          heading: 'Simple pricing',
          subheading: 'Pick the plan that works for you.',
          plans: [
            { name: 'Free', price: '$0', period: 'forever', features: ['Core features'], cta: { label: 'Get started', href: '/signup' }, highlighted: false },
            { name: 'Pro', price: '$29', period: '/month', features: ['All features', 'Priority support'], cta: { label: 'Start trial', href: '/signup' }, highlighted: true },
          ],
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Start your free trial today. No credit card required.',
          ctaLabel: 'Get started',
          ctaHref: '/signup',
          variant: 'banner',
        },
      },
    ],
  },
  // --- Business ---
  {
    id: 'about-us',
    label: 'About us',
    description: 'Hero, intro, team or values grid, testimonials, and CTA.',
    iconName: 'Briefcase',
    category: BUSINESS,
    defaultTitle: 'About us',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: 'About us',
          subheadline: 'Share your mission, vision, and what makes you different. Customize this section to tell your story.',
          variant: 'centered',
          style: 'default',
          mediaType: 'none',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'Get in touch', href: '/contact' },
          secondaryCta: { label: '', href: '' },
        },
      },
      {
        type: 'paragraph',
        payload: {
          text: 'Add a longer introduction here. Who you are, what you do, and why it matters. You can edit or remove this block.',
          align: 'center',
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'Our values', align: 'center' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 3,
          heading: 'Our values',
          subheading: '',
          items: [
            { icon: 'store', title: 'Value one', description: 'Describe your first value or principle.' },
            { icon: 'users', title: 'Value two', description: 'Describe your second value.' },
            { icon: 'qr-code', title: 'Value three', description: 'Describe your third value.' },
          ],
        },
      },
      {
        type: 'testimonials',
        payload: {
          heading: 'What people say about us',
          subheading: '',
          layout: 'grid',
          testimonials: [
            { quote: 'Add a testimonial from a client or partner.', name: 'Name', role: 'Title' },
          ],
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Want to work with us? Get in touch.',
          ctaLabel: 'Contact us',
          ctaHref: '/contact',
          variant: 'simple',
        },
      },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    description: 'Hero, services grid, pricing, testimonials, and CTA.',
    iconName: 'Briefcase',
    category: BUSINESS,
    defaultTitle: 'Our Services',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: 'Our services',
          subheadline: 'Outline what you offer. Edit the sections below to list your services, pricing, and social proof.',
          variant: 'centered',
          style: 'default',
          mediaType: 'none',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'Request a quote', href: '/contact' },
          secondaryCta: { label: '', href: '' },
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'What we offer', align: 'center' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 3,
          heading: 'What we offer',
          subheading: '',
          items: [
            { icon: 'file-text', title: 'Service one', description: 'Describe your first service or offering.' },
            { icon: 'share2', title: 'Service two', description: 'Describe your second service.' },
            { icon: 'bar-chart3', title: 'Service three', description: 'Describe your third service.' },
          ],
        },
      },
      {
        type: 'pricing',
        payload: {
          heading: 'Pricing',
          subheading: 'Optional pricing or packages.',
          plans: [
            { name: 'Basic', price: 'From $X', period: '', features: ['Feature A', 'Feature B'], cta: { label: 'Get started', href: '/contact' }, highlighted: false },
            { name: 'Premium', price: 'From $Y', period: '', features: ['Everything in Basic', 'Feature C', 'Feature D'], cta: { label: 'Contact us', href: '/contact' }, highlighted: true },
          ],
        },
      },
      {
        type: 'testimonials',
        payload: {
          heading: 'Client feedback',
          subheading: '',
          layout: 'grid',
          testimonials: [
            { quote: 'Add a client testimonial here.', name: 'Client name', role: 'Company' },
          ],
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Ready to get started? We’d love to hear from you.',
          ctaLabel: 'Contact us',
          ctaHref: '/contact',
          variant: 'banner',
        },
      },
    ],
  },
  {
    id: 'feedback-form-page',
    label: 'Feedback / form focus',
    description: 'Page built around a single form: hero, short intro, embedded form, and CTA.',
    iconName: 'FileText',
    category: BUSINESS,
    defaultTitle: "We'd love your feedback",
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
    id: 'contact-us',
    label: 'Contact us',
    description: 'Contact page: hero, intro, embedded form, and CTA.',
    iconName: 'FileText',
    category: BUSINESS,
    defaultTitle: 'Contact us',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: 'Contact us',
          subheadline: "Have a question or feedback? Send us a message and we'll get back to you as soon as we can.",
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
          text: "Fill out the form below and we'll be in touch. For urgent requests, please note it in your message.",
          align: 'center',
        },
      },
      {
        type: 'form',
        payload: { formId: '' },
      },
      {
        type: 'cta',
        payload: {
          text: 'Prefer email? Add your contact details or help center link here.',
          ctaLabel: 'Back to home',
          ctaHref: '/',
          variant: 'simple',
        },
      },
    ],
  },
  // --- Portfolio ---
  {
    id: 'portfolio',
    label: 'Portfolio',
    description: 'Showcase work: hero, image, project grid, and CTA.',
    iconName: 'Image',
    category: PORTFOLIO,
    defaultTitle: 'Our Work',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: 'Our work',
          subheadline: 'A selection of projects and case studies. Replace the blocks below with your own work.',
          variant: 'centered',
          style: 'default',
          mediaType: 'none',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'View projects', href: '#projects' },
          secondaryCta: { label: '', href: '' },
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'Featured projects', align: 'center' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 3,
          heading: 'Featured projects',
          subheading: '',
          items: [
            { icon: 'file-text', title: 'Project one', description: 'Short description of the project, client, and outcome.' },
            { icon: 'share2', title: 'Project two', description: 'Another project. Add links or details in the editor.' },
            { icon: 'bar-chart3', title: 'Project three', description: 'Third project. Keep descriptions concise.' },
          ],
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Have a project in mind? Let’s talk.',
          ctaLabel: 'Get in touch',
          ctaHref: '/contact',
          variant: 'simple',
        },
      },
    ],
  },
  // --- Event ---
  {
    id: 'event-page',
    label: 'Event page',
    description: 'Event info: hero, stats (date/location), schedule grid, FAQ, and CTA.',
    iconName: 'Calendar',
    category: EVENT,
    defaultTitle: 'Event Name',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: 'Event name',
          subheadline: 'Short description of the event. Add date, venue, and a call to register or learn more.',
          variant: 'centered',
          style: 'default',
          mediaType: 'none',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'Register', href: '/register' },
          secondaryCta: { label: 'Add to calendar', href: '#' },
        },
      },
      {
        type: 'stats',
        payload: {
          stats: [
            { value: 'TBD', label: 'Date' },
            { value: 'Venue', label: 'Location' },
            { value: '9:00 AM', label: 'Time' },
          ],
          showDividers: true,
        },
      },
      {
        type: 'heading',
        payload: { level: 2, text: 'Schedule', align: 'center' },
      },
      {
        type: 'feature_grid',
        payload: {
          columns: 2,
          heading: 'Schedule',
          subheading: '',
          items: [
            { icon: 'file-text', title: 'Session one', description: 'Time and title. Add speaker or topic details.' },
            { icon: 'users', title: 'Session two', description: 'Another session. Edit in the page builder.' },
            { icon: 'file-text', title: 'Session three', description: 'Third session or break.' },
          ],
        },
      },
      {
        type: 'faq',
        payload: {
          heading: 'Event FAQ',
          subheading: '',
          items: [
            { question: 'Where is the event?', answer: 'Add venue address and directions.' },
            { question: 'What should I bring?', answer: 'List any requirements or recommendations.' },
            { question: 'How do I register?', answer: 'Link to registration or explain the process.' },
          ],
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Ready to join? Register now or contact us with questions.',
          ctaLabel: 'Register',
          ctaHref: '/register',
          variant: 'banner',
        },
      },
    ],
  },
  // --- Simple ---
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
    id: 'coming-soon',
    label: 'Coming soon',
    description: 'Minimal page: hero with message and CTA for email signup or notification.',
    iconName: 'Sparkles',
    category: SIMPLE,
    defaultTitle: 'Coming soon',
    blocks: [
      {
        type: 'hero',
        payload: {
          headline: 'Coming soon',
          subheadline: "We're working on something new. Leave your email to be the first to know.",
          variant: 'centered',
          style: 'minimal',
          mediaType: 'none',
          imageUrl: '',
          imageAlt: '',
          icon: 'sparkles',
          primaryCta: { label: 'Notify me', href: '/signup' },
          secondaryCta: { label: '', href: '' },
        },
      },
      {
        type: 'cta',
        payload: {
          text: 'Follow us for updates or contact us with questions.',
          ctaLabel: 'Get in touch',
          ctaHref: '/contact',
          variant: 'simple',
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
  { value: 'business', label: 'Business', description: 'About us, contact, services, and form-focused pages.' },
  { value: 'portfolio', label: 'Portfolio', description: 'Showcase work, projects, and case studies.' },
  { value: 'event', label: 'Event', description: 'Event pages with schedule, FAQ, and registration.' },
  { value: 'simple', label: 'Simple', description: 'Minimal pages, coming soon, or blank.' },
]
