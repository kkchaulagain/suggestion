/**
 * Template definition for the current landing page.
 * Defines section order, wrapper options, and headings. Content comes from landingMarketingTemplate.
 */
import type { MarketingTemplateConfig } from './landingMarketingTemplate'

export type LandingSectionType =
  | 'hero'
  | 'stats'
  | 'feature_grid'
  | 'testimonials'
  | 'pricing'
  | 'faq'
  | 'cta'

export interface LandingSectionDef {
  type: LandingSectionType
  /** Optional id for anchor links (e.g. #pricing). */
  id?: string
  /** Section wrapper background. */
  background?: 'default' | 'muted' | 'accent'
  /** Extra class names for SectionWrapper (e.g. pt-12 sm:pt-20). */
  className?: string
  /** Key in MarketingTemplateConfig for section content. */
  configKey: keyof MarketingTemplateConfig
  /** Section heading (for feature_grid, testimonials, pricing, faq). */
  heading?: string
  /** Section subheading. */
  subheading?: string
  /** Number of columns for feature_grid. */
  columns?: 2 | 3
  /** Layout for testimonials (e.g. grid). */
  layout?: 'grid'
  /** Variant for cta (e.g. banner). */
  variant?: 'banner'
}

export const LANDING_PAGE_SECTIONS: LandingSectionDef[] = [
  {
    type: 'hero',
    configKey: 'hero',
    className: 'pt-12 sm:pt-20',
  },
  {
    type: 'stats',
    configKey: 'stats',
    background: 'muted',
  },
  {
    type: 'feature_grid',
    id: 'how-it-works',
    configKey: 'howItWorks',
    heading: 'How it works',
    subheading:
      'Create your form, share the link or QR code, and collect responses in your dashboard.',
    columns: 3,
  },
  {
    type: 'feature_grid',
    id: 'use-cases',
    configKey: 'useCases',
    background: 'muted',
    heading: 'Perfect for',
    subheading: 'From small feedback forms to events and in-person QR campaigns.',
    columns: 3,
  },
  {
    type: 'testimonials',
    id: 'testimonials',
    configKey: 'testimonials',
    heading: 'Loved by individuals and teams',
    subheading: 'See how people use forms and QR codes in the real world.',
    layout: 'grid',
  },
  {
    type: 'pricing',
    id: 'pricing',
    configKey: 'pricing',
    background: 'muted',
    heading: 'Simple pricing',
    subheading: 'Start free. Upgrade when you need more forms or submissions.',
  },
  {
    type: 'faq',
    id: 'faq',
    configKey: 'faq',
    heading: 'Frequently asked questions',
    subheading: 'Quick answers about forms, sharing, and QR codes.',
  },
  {
    type: 'cta',
    configKey: 'ctaFinal',
    background: 'muted',
    className: 'pb-24 sm:pb-32',
    variant: 'banner',
  },
]
