import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { pagesApi } from '../../utils/apipath'
import { imageDisplayUrl } from '../../utils/placeholderImage'
import { EmptyState, PublicLayout } from '../../components/layout'
import { HeroSection, FeatureCard, FeatureGrid, CTASection, StatsBar, TestimonialSection, PricingSection, FAQSection } from '../../components/landing'
import EmbeddedFormBlock from '../feedback-form-render/EmbeddedFormBlock'
import type { ApiBlock } from '../business-dashboard/pages/pageBlockTypes'
import { FEATURE_ICON_MAP, HERO_ICON_MAP } from '../business-dashboard/pages/pageBlockRenderers'
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
} from '../business-dashboard/pages/pageBlockTypes'

/** Block as returned from API (no clientId). */
type Block = ApiBlock

type RenderNode =
  | { kind: 'single'; index: number; block: Block }
  | { kind: 'feature_card_grid'; indices: number[]; blocks: Block[] }

function buildRenderNodes(blocks: Block[]): RenderNode[] {
  const nodes: RenderNode[] = []
  let i = 0
  while (i < blocks.length) {
    if (blocks[i].type === 'feature_card') {
      const group: Block[] = []
      const indices: number[] = []
      while (i < blocks.length && blocks[i].type === 'feature_card') {
        group.push(blocks[i])
        indices.push(i)
        i++
      }
      nodes.push({ kind: 'feature_card_grid', indices, blocks: group })
    } else {
      nodes.push({ kind: 'single', index: i, block: blocks[i] })
      i++
    }
  }
  return nodes
}

function renderBlock(block: Block, index: number): React.ReactNode {
  if (block.type === 'heading') {
    const payload = block.payload as HeadingPayload
    const text = payload?.text?.trim()
    if (!text) return null
    const Tag = payload?.level === 1 ? 'h1' : payload?.level === 3 ? 'h3' : 'h2'
    const sizeClass =
      Tag === 'h1'
        ? 'text-2xl font-bold sm:text-3xl'
        : Tag === 'h2'
          ? 'text-xl font-semibold sm:text-2xl'
          : 'text-lg font-semibold sm:text-xl'
    const align = payload?.align ?? 'center'
    const alignClass = align === 'right' ? 'text-right' : align === 'left' ? 'text-left' : 'text-center'
    return (
      <Tag key={index} className={`${sizeClass} ${alignClass}`}>
        {text}
      </Tag>
    )
  }
  if (block.type === 'paragraph') {
    const payload = block.payload as ParagraphPayload
    const text = payload?.text?.trim()
    if (!text) return null
    const align = payload?.align ?? 'left'
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
    return (
      <p key={index} className={`leading-relaxed text-stone-700 dark:text-stone-300 ${alignClass}`}>
        {text}
      </p>
    )
  }
  if (block.type === 'form') {
    const formId = (block.payload as FormBlockPayload)?.formId
    if (!formId) return null
    return (
      <div key={index}>
        <EmbeddedFormBlock formId={formId} />
      </div>
    )
  }
  if (block.type === 'hero') {
    const p = block.payload as HeroPayload
    const headline = p?.headline?.trim()
    const subheadline = p?.subheadline?.trim()
    if (!headline && !subheadline) return null
    const mediaType = p?.mediaType ?? 'none'
    const media = mediaType === 'image'
      ? (
        <img
          src={imageDisplayUrl(p?.imageUrl)}
          alt={p?.imageAlt?.trim() || 'Hero image'}
          className="w-full rounded-xl object-cover"
          loading="lazy"
        />
      )
      : mediaType === 'icon'
        ? (
          <div className="flex min-h-56 items-center justify-center text-emerald-600 dark:text-emerald-400">
            {HERO_ICON_MAP[(p?.icon ?? '').toLowerCase()] ?? HERO_ICON_MAP.sparkles}
          </div>
        )
        : undefined
    const effectiveVariant = p?.variant ?? (media ? 'split' : 'centered')
    const effectiveStyle = p?.style ?? 'default'
    return (
      <div key={index}>
        <HeroSection
          headline={headline || ''}
          subheadline={subheadline || ''}
          badge={p?.badge?.trim() || undefined}
          media={media}
          variant={effectiveVariant}
          style={effectiveStyle}
          primaryCta={p?.primaryCta?.label && p?.primaryCta?.href ? { label: p.primaryCta.label, href: p.primaryCta.href } : undefined}
          secondaryCta={p?.secondaryCta?.label && p?.secondaryCta?.href ? { label: p.secondaryCta.label, href: p.secondaryCta.href } : undefined}
        />
      </div>
    )
  }
  if (block.type === 'feature_card') {
    const p = block.payload as FeatureCardPayload
    const title = p?.title?.trim()
    const description = p?.description?.trim()
    if (!title && !description) return null
    const icon = FEATURE_ICON_MAP[(p?.icon ?? '').toLowerCase()] ?? FEATURE_ICON_MAP['file-text']
    return (
      <FeatureCard key={index} icon={icon} title={title || ''} description={description || ''} />
    )
  }
  if (block.type === 'feature_grid') {
    const p = block.payload as FeatureGridPayload
    const items = p?.items ?? []
    const columns = (p?.columns ?? 3) as 2 | 3
    if (items.length === 0) return null
    const gridItems = items.map((item) => ({
      icon: FEATURE_ICON_MAP[(item?.icon ?? '').toLowerCase()] ?? FEATURE_ICON_MAP['file-text'],
      title: item?.title ?? '',
      description: item?.description ?? '',
    }))
    return (
      <div key={index}>
        <FeatureGrid
          items={gridItems}
          columns={columns}
          heading={p?.heading?.trim() || undefined}
          subheading={p?.subheading?.trim() || undefined}
        />
      </div>
    )
  }
  if (block.type === 'cta') {
    const p = block.payload as CTAPayload
    const text = p?.text?.trim()
    const ctaLabel = p?.ctaLabel?.trim()
    const ctaHref = p?.ctaHref?.trim()
    const secondaryCta = p?.secondaryCta?.label && p?.secondaryCta?.href ? p.secondaryCta : undefined
    if (!text && !ctaLabel) return null
    return (
      <div key={index}>
        <CTASection
          text={text || ''}
          ctaLabel={ctaLabel || 'Learn more'}
          ctaHref={ctaHref || '#'}
          secondaryCta={secondaryCta}
          variant={p?.variant ?? 'simple'}
        />
      </div>
    )
  }
  if (block.type === 'stats') {
    const p = block.payload as StatsPayload
    const stats = p?.stats ?? []
    if (stats.length === 0) return null
    return (
      <div key={index}>
        <StatsBar stats={stats} showDividers={p?.showDividers ?? true} />
      </div>
    )
  }
  if (block.type === 'testimonials') {
    const p = block.payload as TestimonialsPayload
    const testimonials = p?.testimonials ?? []
    if (testimonials.length === 0) return null
    return (
      <div key={index}>
        <TestimonialSection
          testimonials={testimonials}
          heading={p?.heading}
          subheading={p?.subheading}
          layout={p?.layout ?? 'grid'}
        />
      </div>
    )
  }
  if (block.type === 'pricing') {
    const p = block.payload as PricingPayload
    const plans = p?.plans ?? []
    if (plans.length === 0) return null
    return (
      <div key={index}>
        <PricingSection
          plans={plans}
          heading={p?.heading}
          subheading={p?.subheading}
        />
      </div>
    )
  }
  if (block.type === 'faq') {
    const p = block.payload as FAQPayload
    const items = p?.items ?? []
    if (items.length === 0) return null
    return (
      <div key={index}>
        <FAQSection
          items={items}
          heading={p?.heading}
          subheading={p?.subheading}
        />
      </div>
    )
  }
  if (block.type === 'image') {
    const p = block.payload as ImagePayload
    const src = imageDisplayUrl(p?.imageUrl)
    const alt = p?.alt?.trim() || 'Page image'
    const caption = p?.caption?.trim()
    return (
      <figure key={index} className="space-y-3">
        <img
          src={src}
          alt={alt}
          className="w-full rounded-2xl border border-stone-200 object-cover shadow-sm dark:border-stone-700"
          loading="lazy"
        />
        {caption ? (
          <figcaption className="text-sm text-stone-500 dark:text-stone-400">{caption}</figcaption>
        ) : null}
      </figure>
    )
  }
  return null
}

interface CmsPage {
  _id: string
  slug: string
  title: string
  metaTitle?: string
  metaDescription?: string
  status: string
  blocks: Block[]
}

export default function PublicPageView() {
  const { id } = useParams<{ id: string; slug?: string }>()
  const [page, setPage] = useState<CmsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await axios.get<{ page: CmsPage }>(`${pagesApi}/public/${id}`)
        if (!cancelled) setPage(res.data.page)
      } catch (err: unknown) {
        if (!cancelled) {
          const status = (err as { response?: { status?: number } })?.response?.status
          setError(status === 404 ? 'Page not found.' : 'Failed to load page.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const pageTitle = page?.metaTitle || page?.title || null
  useEffect(() => {
    if (pageTitle) document.title = pageTitle
    return () => {
      document.title = 'Suggestion'
    }
  }, [pageTitle])

  const blocks = page?.blocks ?? []

  return (
    <PublicLayout mainClassName="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading…</p>
      ) : error || !page ? (
        <EmptyState type="error" message={error || 'Page not found.'} />
      ) : (
        <article className="space-y-16 sm:space-y-20">
          {buildRenderNodes(blocks).map((node) => {
            if (node.kind === 'feature_card_grid') {
              const gridClass = node.blocks.length >= 3
                ? 'grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                : node.blocks.length === 2
                  ? 'grid gap-10 sm:grid-cols-2'
                  : 'grid gap-10'
              return (
                <div key={`grid-${node.indices[0]}`} className={gridClass}>
                  {node.blocks.map((block, i) => {
                    const p = block.payload as FeatureCardPayload
                    const title = p?.title?.trim()
                    const description = p?.description?.trim()
                    if (!title && !description) return null
                    const icon = FEATURE_ICON_MAP[(p?.icon ?? '').toLowerCase()] ?? FEATURE_ICON_MAP['file-text']
                    return (
                      <FeatureCard
                        key={node.indices[i]}
                        icon={icon}
                        title={title || ''}
                        description={description || ''}
                      />
                    )
                  })}
                </div>
              )
            }
            return (
              <div key={`block-${node.index}`}>
                {renderBlock(node.block, node.index)}
              </div>
            )
          })}
        </article>
      )}
    </PublicLayout>
  )
}
