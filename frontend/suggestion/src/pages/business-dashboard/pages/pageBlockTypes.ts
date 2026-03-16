/**
 * Shared types, constants, and helpers for the page builder (CreatePagePage) and public page view (PublicPageView).
 */
import type { LucideIcon } from 'lucide-react'
import {
  BarChart2,
  CreditCard,
  FileText,
  Grid3X3,
  Heading1,
  HelpCircle,
  Image,
  Layout,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Type,
} from 'lucide-react'
import type { PageTemplate } from './pageTemplates'

export type BlockType =
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

export type TextAlign = 'left' | 'center' | 'right'

export interface HeadingPayload {
  level: 1 | 2 | 3
  text: string
  align?: TextAlign
}

export interface ParagraphPayload {
  text: string
  align?: TextAlign
}

export interface FormBlockPayload {
  formId: string
}

export interface HeroCta {
  label: string
  href: string
}

export type HeroLayoutVariant = 'centered' | 'split' | 'splitReversed' | 'centeredWithMediaBelow'
export type HeroStyleVariant = 'default' | 'minimal'

export interface HeroPayload {
  headline: string
  subheadline: string
  badge?: string
  variant?: HeroLayoutVariant
  style?: HeroStyleVariant
  mediaType?: 'none' | 'image' | 'icon'
  imageUrl?: string
  imageAlt?: string
  icon?: string
  primaryCta?: HeroCta
  secondaryCta?: HeroCta
}

export interface FeatureCardPayload {
  title: string
  description: string
  icon: string
}

export type CTAVariant = 'simple' | 'banner'

export interface CTAPayload {
  text: string
  ctaLabel: string
  ctaHref: string
  secondaryCta?: { label: string; href: string }
  variant?: CTAVariant
}

export interface StatsPayload {
  stats: { value: string; label: string }[]
  showDividers?: boolean
}

export interface TestimonialItemPayload {
  quote: string
  name: string
  role: string
}

export interface TestimonialsPayload {
  heading?: string
  subheading?: string
  layout?: 'grid' | 'single'
  testimonials: TestimonialItemPayload[]
}

export interface PricingPlanPayload {
  name: string
  price: string
  period?: string
  features: string[]
  cta: { label: string; href: string }
  highlighted?: boolean
}

export interface PricingPayload {
  heading?: string
  subheading?: string
  plans: PricingPlanPayload[]
}

export interface FAQItemPayload {
  question: string
  answer: string
}

export interface FAQPayload {
  heading?: string
  subheading?: string
  items: FAQItemPayload[]
}

export interface ImagePayload {
  imageUrl: string
  alt: string
  caption?: string
}

export interface FeatureGridItemPayload {
  icon: string
  title: string
  description: string
}

export interface FeatureGridPayload {
  columns: 2 | 3
  items: FeatureGridItemPayload[]
  heading?: string
  subheading?: string
}

export type BlockPayload =
  | HeadingPayload
  | ParagraphPayload
  | FormBlockPayload
  | HeroPayload
  | FeatureCardPayload
  | FeatureGridPayload
  | ImagePayload
  | CTAPayload
  | StatsPayload
  | TestimonialsPayload
  | PricingPayload
  | FAQPayload

export interface ApiBlock {
  _id?: string
  type: BlockType
  payload: BlockPayload
}

export interface Block extends ApiBlock {
  clientId: string
}

export interface FeedbackFormOption {
  _id: string
  title: string
}

export interface CmsPageDoc {
  _id: string
  slug: string
  title: string
  metaTitle?: string
  metaDescription?: string
  status: 'draft' | 'published'
  blocks: ApiBlock[]
}

export interface BlockOption {
  type: BlockType
  label: string
  description: string
  icon: LucideIcon
}

export interface UploadTarget {
  blockClientId: string
  type: 'image' | 'hero_image'
}

export const FEATURE_CARD_ICONS = [
  { value: 'file-text', label: 'Document' },
  { value: 'share2', label: 'Share' },
  { value: 'bar-chart3', label: 'Chart' },
  { value: 'store', label: 'Store' },
  { value: 'users', label: 'Users' },
  { value: 'qr-code', label: 'QR code' },
] as const

export const HERO_MEDIA_ICONS = [
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'file-text', label: 'Document' },
  { value: 'share2', label: 'Share' },
  { value: 'bar-chart3', label: 'Chart' },
] as const

export const BLOCK_OPTIONS: BlockOption[] = [
  { type: 'heading', label: 'Heading', description: 'Section heading or title', icon: Heading1 },
  { type: 'paragraph', label: 'Paragraph', description: 'Body copy and supporting text', icon: Type },
  { type: 'form', label: 'Form', description: 'Embed a feedback form', icon: FileText },
  { type: 'hero', label: 'Hero', description: 'Landing hero with CTAs', icon: Layout },
  { type: 'feature_card', label: 'Feature Card', description: 'Single feature highlight', icon: LayoutGrid },
  { type: 'feature_grid', label: 'Feature Grid', description: 'List or grid of feature cards', icon: Grid3X3 },
  { type: 'image', label: 'Image', description: 'Photo, screenshot, or visual asset', icon: Image },
  { type: 'cta', label: 'CTA Banner', description: 'Call-to-action section', icon: Megaphone },
  { type: 'stats', label: 'Stats', description: 'Stats bar with value/label pairs', icon: BarChart2 },
  { type: 'testimonials', label: 'Testimonials', description: 'Customer quotes and testimonials', icon: MessageSquare },
  { type: 'pricing', label: 'Pricing', description: 'Pricing plans and tiers', icon: CreditCard },
  { type: 'faq', label: 'FAQ', description: 'Frequently asked questions', icon: HelpCircle },
]

let blockCounter = 0

export function createClientId(): string {
  blockCounter += 1
  return `cms-block-${blockCounter}`
}

export function createBlock(type: BlockType, payload: BlockPayload): Block {
  return { clientId: createClientId(), type, payload }
}

export function createEmptyBlock(type: BlockType): Block {
  switch (type) {
    case 'heading':
      return createBlock('heading', { level: 2, text: '', align: 'center' })
    case 'paragraph':
      return createBlock('paragraph', { text: '', align: 'left' })
    case 'form':
      return createBlock('form', { formId: '' })
    case 'hero':
      return createBlock('hero', {
        headline: '',
        subheadline: '',
        variant: 'centered',
        style: 'default',
        mediaType: 'none',
        imageUrl: '',
        imageAlt: '',
        icon: 'sparkles',
        primaryCta: { label: '', href: '' },
        secondaryCta: { label: '', href: '' },
      })
    case 'feature_card':
      return createBlock('feature_card', { title: '', description: '', icon: 'file-text' })
    case 'feature_grid':
      return createBlock('feature_grid', {
        columns: 3,
        heading: '',
        subheading: '',
        items: [{ icon: 'file-text', title: '', description: '' }],
      })
    case 'image':
      return createBlock('image', { imageUrl: '', alt: '', caption: '' })
    case 'cta':
      return createBlock('cta', { text: '', ctaLabel: '', ctaHref: '/signup', variant: 'simple' })
    case 'stats':
      return createBlock('stats', { stats: [{ value: '', label: '' }], showDividers: true })
    case 'testimonials':
      return createBlock('testimonials', {
        heading: '',
        subheading: '',
        layout: 'grid',
        testimonials: [{ quote: '', name: '', role: '' }],
      })
    case 'pricing':
      return createBlock('pricing', {
        heading: '',
        subheading: '',
        plans: [{ name: '', price: '', period: '', features: [], cta: { label: '', href: '' }, highlighted: false }],
      })
    case 'faq':
      return createBlock('faq', { heading: '', subheading: '', items: [{ question: '', answer: '' }] })
    default:
      return createBlock('paragraph', { text: '' })
  }
}

export function hydrateBlocks(blocks: ApiBlock[] | undefined): Block[] {
  return Array.isArray(blocks)
    ? blocks.map((block) => ({
        ...block,
        clientId: block._id ?? createClientId(),
      }))
    : []
}

export function blocksFromTemplate(template: PageTemplate): Block[] {
  return template.blocks.map((b) => ({
    clientId: createClientId(),
    type: b.type as BlockType,
    payload: b.payload as unknown as BlockPayload,
  }))
}

export function serializeBlocks(blocks: Block[]): ApiBlock[] {
  return blocks.map((block) => ({
    _id: block._id,
    type: block.type,
    payload: block.payload,
  }))
}

export function getBlockOption(type: BlockType): BlockOption {
  return BLOCK_OPTIONS.find((option) => option.type === type) ?? BLOCK_OPTIONS[0]
}

export function getStatusClasses(status: 'draft' | 'published'): string {
  return status === 'published'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800'
}

export function getBlockSummary(block: Block): string {
  switch (block.type) {
    case 'heading': {
      const payload = block.payload as HeadingPayload
      return payload.text.trim() || `Heading ${payload.level}`
    }
    case 'paragraph':
      return (block.payload as ParagraphPayload).text.trim() || 'Body copy'
    case 'form':
      return (block.payload as FormBlockPayload).formId || 'Embedded feedback form'
    case 'hero': {
      const payload = block.payload as HeroPayload
      const v = payload.variant ?? 'centered'
      const label =
        v === 'centered'
          ? 'Hero banner'
          : `Hero (${v === 'splitReversed' ? 'Split reversed' : v === 'centeredWithMediaBelow' ? 'Centered + media below' : 'Split'})`
      return payload.headline.trim() || label
    }
    case 'feature_card':
      return (block.payload as FeatureCardPayload).title.trim() || 'Single feature card'
    case 'feature_grid': {
      const payload = block.payload as FeatureGridPayload
      return `${payload.items?.length ?? 0} item${payload.items?.length === 1 ? '' : 's'}`
    }
    case 'image': {
      const payload = block.payload as ImagePayload
      return payload.caption?.trim() || payload.alt?.trim() || 'Image block'
    }
    case 'cta': {
      const payload = block.payload as CTAPayload
      return payload.text.trim() || payload.ctaLabel.trim() || 'Call to action'
    }
    case 'stats': {
      const payload = block.payload as StatsPayload
      const n = payload.stats?.length ?? 0
      return n ? `Stats (${n} item${n === 1 ? '' : 's'})` : 'Stats'
    }
    case 'testimonials': {
      const payload = block.payload as TestimonialsPayload
      const n = payload.testimonials?.length ?? 0
      return n ? `Testimonials (${n})` : 'Testimonials'
    }
    case 'pricing': {
      const payload = block.payload as PricingPayload
      const n = payload.plans?.length ?? 0
      return n ? `Pricing (${n} plan${n === 1 ? '' : 's'})` : 'Pricing'
    }
    case 'faq': {
      const payload = block.payload as FAQPayload
      const n = payload.items?.length ?? 0
      return n ? `FAQ (${n} question${n === 1 ? '' : 's'})` : 'FAQ'
    }
    default:
      return 'Content block'
  }
}
