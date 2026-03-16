/**
 * Block preview renderers and icon maps for the page builder.
 */
import type { ReactNode } from 'react'
import { BarChart3, FileText, QrCode, Share2, Sparkles, Store, Users } from 'lucide-react'
import type { Block } from './pageBlockTypes'
import type {
  CTAPayload,
  FAQPayload,
  FeatureCardPayload,
  FeatureGridPayload,
  FormBlockPayload,
  HeadingPayload,
  HeroPayload,
  ImagePayload,
  ParagraphPayload,
  PricingPayload,
  StatsPayload,
  TestimonialsPayload,
} from './pageBlockTypes'
import { HeroSection, FeatureCard, FeatureGrid, CTASection, StatsBar, TestimonialSection, PricingSection, FAQSection } from '../../../components/landing'
import EmbeddedFormBlock from '../../feedback-form-render/EmbeddedFormBlock'
import { imageDisplayUrl } from '../../../utils/placeholderImage'

export const FEATURE_ICON_MAP: Record<string, ReactNode> = {
  'file-text': <FileText className="h-6 w-6" />,
  share2: <Share2 className="h-6 w-6" />,
  'bar-chart3': <BarChart3 className="h-6 w-6" />,
  store: <Store className="h-6 w-6" />,
  users: <Users className="h-6 w-6" />,
  'qr-code': <QrCode className="h-6 w-6" />,
  qrcode: <QrCode className="h-6 w-6" />,
}

export const HERO_ICON_MAP: Record<string, ReactNode> = {
  sparkles: <Sparkles className="h-16 w-16" />,
  'file-text': <FileText className="h-16 w-16" />,
  share2: <Share2 className="h-16 w-16" />,
  'bar-chart3': <BarChart3 className="h-16 w-16" />,
}

export function renderBlockPreview(block: Block): ReactNode {
  if (block.type === 'heading') {
    const payload = block.payload as HeadingPayload
    const text = payload?.text?.trim()
    if (!text) return <p className="text-sm text-stone-400 dark:text-stone-500">Heading</p>
    const Tag = payload?.level === 1 ? 'h1' : payload?.level === 3 ? 'h3' : 'h2'
    const align = payload?.align ?? 'center'
    const alignClass = align === 'right' ? 'text-right' : align === 'left' ? 'text-left' : 'text-center'
    return (
      <Tag
        className={`${Tag === 'h1' ? 'text-2xl font-bold sm:text-3xl' : Tag === 'h2' ? 'text-xl font-semibold sm:text-2xl' : 'text-lg font-semibold sm:text-xl'} ${alignClass}`}
      >
        {text}
      </Tag>
    )
  }
  if (block.type === 'paragraph') {
    const payload = block.payload as ParagraphPayload
    const text = payload?.text?.trim()
    if (!text) return <p className="text-sm text-stone-400 dark:text-stone-500">Paragraph</p>
    const align = payload?.align ?? 'left'
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
    return <p className={`leading-relaxed text-stone-700 dark:text-stone-300 ${alignClass}`}>{text}</p>
  }
  if (block.type === 'form') {
    const formId = (block.payload as FormBlockPayload)?.formId
    if (!formId) return <p className="text-sm text-stone-400 dark:text-stone-500">Select a form</p>
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-4 dark:border-stone-600">
        <EmbeddedFormBlock formId={formId} />
      </div>
    )
  }
  if (block.type === 'hero') {
    const p = block.payload as HeroPayload
    const headline = p?.headline?.trim()
    const subheadline = p?.subheadline?.trim()
    const mediaType = p?.mediaType ?? 'none'
    const media =
      mediaType === 'image' ? (
        <img
          src={imageDisplayUrl(p?.imageUrl)}
          alt={p?.imageAlt?.trim() || 'Hero'}
          className="w-full rounded-xl object-cover"
        />
      ) : mediaType === 'icon' ? (
        <div className="flex min-h-40 items-center justify-center text-emerald-600 dark:text-emerald-400">
          {HERO_ICON_MAP[(p?.icon ?? '').toLowerCase()] ?? HERO_ICON_MAP.sparkles}
        </div>
      ) : undefined
    const effectiveVariant = p?.variant ?? (media ? 'split' : 'centered')
    const effectiveStyle = p?.style ?? 'default'
    return (
      <HeroSection
        headline={headline || 'Headline'}
        subheadline={subheadline || 'Subheadline'}
        badge={p?.badge?.trim() || undefined}
        media={media}
        variant={effectiveVariant}
        style={effectiveStyle}
        primaryCta={
          p?.primaryCta?.label && p?.primaryCta?.href ? { label: p.primaryCta.label, href: p.primaryCta.href } : undefined
        }
        secondaryCta={
          p?.secondaryCta?.label && p?.secondaryCta?.href
            ? { label: p.secondaryCta.label, href: p.secondaryCta.href }
            : undefined
        }
      />
    )
  }
  if (block.type === 'feature_card') {
    const p = block.payload as FeatureCardPayload
    const title = p?.title?.trim()
    const description = p?.description?.trim()
    const icon = FEATURE_ICON_MAP[(p?.icon ?? '').toLowerCase()] ?? FEATURE_ICON_MAP['file-text']
    return <FeatureCard icon={icon} title={title || 'Title'} description={description || 'Description'} />
  }
  if (block.type === 'feature_grid') {
    const p = block.payload as FeatureGridPayload
    const items = p?.items ?? []
    const columns = p?.columns ?? 3
    const heading = p?.heading?.trim() || undefined
    const subheading = p?.subheading?.trim() || undefined
    if (items.length === 0) return <p className="text-sm text-stone-400 dark:text-stone-500">Add items to the grid</p>
    const gridItems = items.map((item) => ({
      icon: FEATURE_ICON_MAP[(item?.icon ?? '').toLowerCase()] ?? FEATURE_ICON_MAP['file-text'],
      title: item?.title ?? '',
      description: item?.description ?? '',
    }))
    return <FeatureGrid items={gridItems} columns={columns} heading={heading} subheading={subheading} />
  }
  if (block.type === 'cta') {
    const p = block.payload as CTAPayload
    return (
      <CTASection
        text={p?.text?.trim() || 'CTA text'}
        ctaLabel={p?.ctaLabel?.trim() || 'Button'}
        ctaHref={p?.ctaHref?.trim() || '#'}
        secondaryCta={p?.secondaryCta?.label && p?.secondaryCta?.href ? p.secondaryCta : undefined}
        variant={p?.variant ?? 'simple'}
      />
    )
  }
  if (block.type === 'stats') {
    const p = block.payload as StatsPayload
    const stats = p?.stats?.filter((s) => s?.value?.trim() || s?.label?.trim()) ?? []
    if (stats.length === 0) return <p className="text-sm text-stone-400 dark:text-stone-500">Add stats</p>
    return <StatsBar stats={stats} showDividers={p?.showDividers ?? true} />
  }
  if (block.type === 'testimonials') {
    const p = block.payload as TestimonialsPayload
    const testimonials = p?.testimonials?.filter((t) => t?.quote?.trim() || t?.name?.trim()) ?? []
    if (testimonials.length === 0) return <p className="text-sm text-stone-400 dark:text-stone-500">Add testimonials</p>
    return (
      <TestimonialSection
        testimonials={testimonials}
        heading={p?.heading}
        subheading={p?.subheading}
        layout={p?.layout ?? 'grid'}
      />
    )
  }
  if (block.type === 'pricing') {
    const p = block.payload as PricingPayload
    const plans = p?.plans?.filter((plan) => plan?.name?.trim()) ?? []
    if (plans.length === 0) return <p className="text-sm text-stone-400 dark:text-stone-500">Add pricing plans</p>
    return (
      <PricingSection plans={plans} heading={p?.heading} subheading={p?.subheading} />
    )
  }
  if (block.type === 'faq') {
    const p = block.payload as FAQPayload
    const items = p?.items?.filter((i) => i?.question?.trim() || i?.answer?.trim()) ?? []
    if (items.length === 0) return <p className="text-sm text-stone-400 dark:text-stone-500">Add FAQ items</p>
    return <FAQSection items={items} heading={p?.heading} subheading={p?.subheading} />
  }
  if (block.type === 'image') {
    const p = block.payload as ImagePayload
    const src = imageDisplayUrl(p?.imageUrl)
    return (
      <figure className="space-y-2">
        <img
          src={src}
          alt={p?.alt?.trim() || 'Image'}
          className="w-full rounded-2xl border border-stone-200 object-cover dark:border-stone-700"
        />
        {p?.caption?.trim() ? (
          <figcaption className="text-sm text-stone-500 dark:text-stone-400">{p.caption}</figcaption>
        ) : null}
      </figure>
    )
  }
  return null
}
