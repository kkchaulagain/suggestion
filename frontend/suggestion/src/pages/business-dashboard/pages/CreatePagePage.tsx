import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileText,
  Grid3X3,
  Heading1,
  Image,
  Layout,
  LayoutGrid,
  Megaphone,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { feedbackFormsApi, pagesApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage, Input, Modal, Select, Textarea } from '../../../components/ui'
import { HeroSection, FeatureCard, CTASection } from '../../../components/landing'
import ImageUploadCropDialog from '../../../components/media/ImageUploadCropDialog'
import EmbeddedFormBlock from '../../feedback-form-render/EmbeddedFormBlock'
import {
  PAGE_TEMPLATES,
  PAGE_TEMPLATE_CATEGORIES,
  type PageTemplate,
  type PageTemplateIconName,
} from './pageTemplates'

type BlockType = 'heading' | 'paragraph' | 'form' | 'hero' | 'feature_card' | 'feature_grid' | 'image' | 'cta'

interface HeadingPayload {
  level: 1 | 2 | 3
  text: string
}

interface ParagraphPayload {
  text: string
}

interface FormBlockPayload {
  formId: string
}

interface HeroCta {
  label: string
  href: string
}

type HeroLayoutVariant = 'centered' | 'split' | 'splitReversed' | 'centeredWithMediaBelow'
type HeroStyleVariant = 'default' | 'minimal' | 'dark'

interface HeroPayload {
  headline: string
  subheadline: string
  variant?: HeroLayoutVariant
  style?: HeroStyleVariant
  mediaType?: 'none' | 'image' | 'icon'
  imageUrl?: string
  imageAlt?: string
  icon?: string
  primaryCta?: HeroCta
  secondaryCta?: HeroCta
}

interface FeatureCardPayload {
  title: string
  description: string
  icon: string
}

interface CTAPayload {
  text: string
  ctaLabel: string
  ctaHref: string
}

interface ImagePayload {
  imageUrl: string
  alt: string
  caption?: string
}

interface FeatureGridItem {
  icon: string
  title: string
  description: string
}

interface FeatureGridPayload {
  columns: 2 | 3
  items: FeatureGridItem[]
}

type BlockPayload =
  | HeadingPayload
  | ParagraphPayload
  | FormBlockPayload
  | HeroPayload
  | FeatureCardPayload
  | FeatureGridPayload
  | ImagePayload
  | CTAPayload

interface ApiBlock {
  _id?: string
  type: BlockType
  payload: BlockPayload
}

interface Block extends ApiBlock {
  clientId: string
}

interface FeedbackFormOption {
  _id: string
  title: string
}

interface CmsPageDoc {
  _id: string
  slug: string
  title: string
  metaTitle?: string
  metaDescription?: string
  status: 'draft' | 'published'
  blocks: ApiBlock[]
}

interface BlockOption {
  type: BlockType
  label: string
  description: string
  icon: LucideIcon
}

interface UploadTarget {
  blockClientId: string
  type: 'image' | 'hero_image'
}

const FEATURE_CARD_ICONS = [
  { value: 'file-text', label: 'Document' },
  { value: 'share2', label: 'Share' },
  { value: 'bar-chart3', label: 'Chart' },
] as const

const HERO_MEDIA_ICONS = [
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'file-text', label: 'Document' },
  { value: 'share2', label: 'Share' },
  { value: 'bar-chart3', label: 'Chart' },
] as const

const BLOCK_OPTIONS: BlockOption[] = [
  { type: 'heading', label: 'Heading', description: 'Section heading or title', icon: Heading1 },
  { type: 'paragraph', label: 'Paragraph', description: 'Body copy and supporting text', icon: Type },
  { type: 'form', label: 'Form', description: 'Embed a feedback form', icon: FileText },
  { type: 'hero', label: 'Hero', description: 'Landing hero with CTAs', icon: Layout },
  { type: 'feature_card', label: 'Feature Card', description: 'Single feature highlight', icon: LayoutGrid },
  { type: 'feature_grid', label: 'Feature Grid', description: 'List or grid of feature cards', icon: Grid3X3 },
  { type: 'image', label: 'Image', description: 'Photo, screenshot, or visual asset', icon: Image },
  { type: 'cta', label: 'CTA Banner', description: 'Call-to-action section', icon: Megaphone },
]

const FEATURE_ICON_MAP: Record<string, ReactNode> = {
  'file-text': <FileText className="h-6 w-6" />,
  share2: <Share2 className="h-6 w-6" />,
  'bar-chart3': <BarChart3 className="h-6 w-6" />,
}

const HERO_ICON_MAP: Record<string, ReactNode> = {
  sparkles: <Sparkles className="h-16 w-16" />,
  'file-text': <FileText className="h-16 w-16" />,
  share2: <Share2 className="h-16 w-16" />,
  'bar-chart3': <BarChart3 className="h-16 w-16" />,
}

const PAGE_TEMPLATE_ICONS: Record<PageTemplateIconName, LucideIcon> = {
  Layout,
  Megaphone,
  FileText,
  Sparkles,
}

let blockCounter = 0

function createClientId() {
  blockCounter += 1
  return `cms-block-${blockCounter}`
}

function createBlock(type: BlockType, payload: BlockPayload): Block {
  return { clientId: createClientId(), type, payload }
}

function createEmptyBlock(type: BlockType): Block {
  switch (type) {
    case 'heading':
      return createBlock('heading', { level: 2, text: '' })
    case 'paragraph':
      return createBlock('paragraph', { text: '' })
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
        items: [{ icon: 'file-text', title: '', description: '' }],
      })
    case 'image':
      return createBlock('image', { imageUrl: '', alt: '', caption: '' })
    case 'cta':
      return createBlock('cta', { text: '', ctaLabel: '', ctaHref: '/signup' })
    default:
      return createBlock('paragraph', { text: '' })
  }
}

function hydrateBlocks(blocks: ApiBlock[] | undefined): Block[] {
  return Array.isArray(blocks)
    ? blocks.map((block) => ({
        ...block,
        clientId: block._id ?? createClientId(),
      }))
    : []
}

function blocksFromTemplate(template: PageTemplate): Block[] {
  return template.blocks.map((b) => ({
    clientId: createClientId(),
    type: b.type as BlockType,
    payload: b.payload as unknown as BlockPayload,
  }))
}

function serializeBlocks(blocks: Block[]): ApiBlock[] {
  return blocks.map((block) => ({
    _id: block._id,
    type: block.type,
    payload: block.payload,
  }))
}

function getBlockOption(type: BlockType) {
  return BLOCK_OPTIONS.find((option) => option.type === type) ?? BLOCK_OPTIONS[0]
}

function getStatusClasses(status: 'draft' | 'published') {
  return status === 'published'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800'
}

function getBlockSummary(block: Block): string {
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
      const label = v === 'centered' ? 'Hero banner' : `Hero (${v === 'splitReversed' ? 'Split reversed' : v === 'centeredWithMediaBelow' ? 'Centered + media below' : 'Split'})`
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
      return payload.caption?.trim() || payload.alt?.trim() || payload.imageUrl?.trim() || 'Image block'
    }
    case 'cta': {
      const payload = block.payload as CTAPayload
      return payload.text.trim() || payload.ctaLabel.trim() || 'Call to action'
    }
    default:
      return 'Content block'
  }
}

function renderBlockPreview(block: Block): ReactNode {
  if (block.type === 'heading') {
    const payload = block.payload as HeadingPayload
    const text = payload?.text?.trim()
    if (!text) return <p className="text-sm text-stone-400 dark:text-stone-500">Heading</p>
    const Tag = payload?.level === 1 ? 'h1' : payload?.level === 3 ? 'h3' : 'h2'
    return (
      <Tag className={Tag === 'h1' ? 'text-2xl font-bold sm:text-3xl' : Tag === 'h2' ? 'text-xl font-semibold sm:text-2xl' : 'text-lg font-semibold sm:text-xl'}>
        {text}
      </Tag>
    )
  }
  if (block.type === 'paragraph') {
    const text = (block.payload as ParagraphPayload)?.text?.trim()
    if (!text) return <p className="text-sm text-stone-400 dark:text-stone-500">Paragraph</p>
    return <p className="leading-relaxed text-stone-700 dark:text-stone-300">{text}</p>
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
    const media = mediaType === 'image' && p?.imageUrl?.trim()
      ? (
        <img src={p.imageUrl!.trim()} alt={p.imageAlt?.trim() || 'Hero'} className="w-full rounded-xl object-cover" />
      )
      : mediaType === 'icon'
        ? (
          <div className="flex min-h-40 items-center justify-center text-emerald-600 dark:text-emerald-400">
            {HERO_ICON_MAP[(p?.icon ?? '').toLowerCase()] ?? HERO_ICON_MAP.sparkles}
          </div>
        )
        : undefined
    const effectiveVariant = p?.variant ?? (media ? 'split' : 'centered')
    const effectiveStyle = p?.style ?? 'default'
    return (
      <HeroSection
        headline={headline || 'Headline'}
        subheadline={subheadline || 'Subheadline'}
        media={media}
        variant={effectiveVariant}
        style={effectiveStyle}
        primaryCta={p?.primaryCta?.label && p?.primaryCta?.href ? { label: p.primaryCta.label, href: p.primaryCta.href } : undefined}
        secondaryCta={p?.secondaryCta?.label && p?.secondaryCta?.href ? { label: p.secondaryCta.label, href: p.secondaryCta.href } : undefined}
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
    if (items.length === 0) return <p className="text-sm text-stone-400 dark:text-stone-500">Add items to the grid</p>
    const gridClass = columns === 2 ? 'grid gap-6 sm:grid-cols-2' : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
    return (
      <div className={gridClass}>
        {items.map((item, i) => {
          const icon = FEATURE_ICON_MAP[(item?.icon ?? '').toLowerCase()] ?? FEATURE_ICON_MAP['file-text']
          return (
            <FeatureCard
              key={i}
              icon={icon}
              title={item?.title ?? ''}
              description={item?.description ?? ''}
            />
          )
        })}
      </div>
    )
  }
  if (block.type === 'cta') {
    const p = block.payload as CTAPayload
    return (
      <CTASection
        text={p?.text?.trim() || 'CTA text'}
        ctaLabel={p?.ctaLabel?.trim() || 'Button'}
        ctaHref={p?.ctaHref?.trim() || '#'}
      />
    )
  }
  if (block.type === 'image') {
    const p = block.payload as ImagePayload
    const imageUrl = p?.imageUrl?.trim()
    if (!imageUrl) return <p className="text-sm text-stone-400 dark:text-stone-500">Add an image URL</p>
    return (
      <figure className="space-y-2">
        <img src={imageUrl} alt={p.alt?.trim() || 'Image'} className="w-full rounded-2xl border border-stone-200 object-cover dark:border-stone-700" />
        {p.caption?.trim() ? <figcaption className="text-sm text-stone-500 dark:text-stone-400">{p.caption}</figcaption> : null}
      </figure>
    )
  }
  return null
}

export default function CreatePagePage() {
  const { pageId } = useParams<{ pageId?: string }>()
  const id = pageId
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { getAuthHeaders } = useAuth()

  const [step, setStep] = useState<'select' | 'build'>(isEdit ? 'build' : 'select')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [forms, setForms] = useState<FeedbackFormOption[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeInsertIndex, setActiveInsertIndex] = useState<number | null>(null)
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null)
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null)

  const handleSelectPageTemplate = useCallback((template: PageTemplate | null) => {
    if (template) {
      setBlocks(blocksFromTemplate(template))
      setTitle(template.defaultTitle ?? '')
      setSlug(
        (template.defaultTitle ?? '')
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') || '',
      )
    } else {
      setBlocks([])
      setTitle('')
      setSlug('')
    }
    setStep('build')
  }, [])

  const pageStatusLabel = status === 'published' ? 'Published' : 'Draft'
  const pageLabel = isEdit ? 'Edit Page' : 'Create Page'
  const displaySlug =
    slug.trim() || title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const formOptions = useMemo(
    () => [
      { value: '', label: '— Select a form —' },
      ...forms.map((form) => ({ value: form._id, label: form.title })),
    ],
    [forms],
  )

  useEffect(() => {
    const loadForms = async () => {
      try {
        const headers = { withCredentials: true, headers: getAuthHeaders() }
        const res = await axios.get<{ feedbackForms: FeedbackFormOption[] }>(feedbackFormsApi, headers)
        setForms(res.data.feedbackForms ?? [])
      } catch {
        setForms([])
      }
    }
    void loadForms()
  }, [getAuthHeaders])

  useEffect(() => {
    if (!isEdit || !id) return
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const headers = { withCredentials: true, headers: getAuthHeaders() }
        const res = await axios.get<{ page: CmsPageDoc }>(`${pagesApi}/${id}`, headers)
        const page = res.data.page
        setTitle(page.title)
        setSlug(page.slug)
        setMetaTitle(page.metaTitle ?? '')
        setMetaDescription(page.metaDescription ?? '')
        setStatus(page.status)
        setBlocks(hydrateBlocks(page.blocks))
      } catch {
        setError('Failed to load page.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [getAuthHeaders, id, isEdit])

  const addBlock = useCallback((type: BlockType, insertAt = blocks.length) => {
    const nextBlock = createEmptyBlock(type)
    setBlocks((prev) => {
      const next = [...prev]
      next.splice(insertAt, 0, nextBlock)
      return next
    })
    setActiveInsertIndex(null)
  }, [blocks.length])

  const updateBlock = useCallback((index: number, payload: BlockPayload) => {
    setBlocks((prev) => {
      const next = [...prev]
      if (next[index]) next[index] = { ...next[index], payload }
      return next
    })
  }, [])

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= blocks.length) return
    setEditingBlockIndex((prev) => {
      if (prev == null) return null
      if (prev === index) return target
      if (direction === 'up' && prev === target) return prev + 1
      if (direction === 'down' && prev === target) return prev - 1
      return prev
    })
    setBlocks((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [blocks.length])

  const removeBlock = useCallback((index: number) => {
    setEditingBlockIndex((current) => (current === index ? null : current != null && current > index ? current - 1 : current))
    setBlocks((prev) => prev.filter((_, i) => i !== index))
    setActiveInsertIndex(null)
  }, [])

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Title is required.')
      return
    }

    const trimmedSlug =
      slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ||
      trimmedTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    if (!trimmedSlug) {
      setError('Slug is required.')
      return
    }

    try {
      setSaving(true)
      setError('')
      const headers = { withCredentials: true, headers: getAuthHeaders() }
      const payload = {
        title: trimmedTitle,
        slug: trimmedSlug,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        status,
        blocks: serializeBlocks(blocks),
      }
      if (isEdit && id) {
        await axios.put(`${pagesApi}/${id}`, payload, headers)
      } else {
        await axios.post(pagesApi, payload, headers)
      }
      navigate('/dashboard/pages')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string } } })?.response?.data
      setError(data?.error ?? 'Failed to save page.')
    } finally {
      setSaving(false)
    }
  }, [blocks, getAuthHeaders, id, isEdit, metaDescription, metaTitle, navigate, slug, status, title])

  const renderInsertControl = (insertIndex: number) => {
    const isActive = activeInsertIndex === insertIndex

    return (
      <div className="relative py-2" key={`insert-${insertIndex}`}>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-stone-200 dark:border-stone-700" />
        <div className="relative flex justify-center">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:text-stone-100"
            onClick={() => setActiveInsertIndex((current) => (current === insertIndex ? null : insertIndex))}
            aria-label={`Insert block at position ${insertIndex + 1}`}
            aria-expanded={isActive}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {isActive ? (
          <div className="mt-3 rounded-3xl border border-stone-200/80 bg-white p-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] dark:border-stone-700 dark:bg-stone-900">
            <p className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-100">Insert block</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {BLOCK_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.type}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-auto justify-start rounded-2xl border-stone-200 px-3 py-3 text-left shadow-none hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                    onClick={() => addBlock(option.type, insertIndex)}
                    aria-label={`Add ${option.label} block`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {option.label}
                      </span>
                      <span className="block text-xs font-normal text-stone-500 dark:text-stone-400">
                        {option.description}
                      </span>
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const renderBlockFields = (block: Block, index: number) => {
    if (block.type === 'heading') {
      return (
        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <Select
            id={`block-${block.clientId}-level`}
            label="Level"
            value={String((block.payload as HeadingPayload).level)}
            onChange={(value) =>
              updateBlock(index, {
                ...(block.payload as HeadingPayload),
                level: Number(value) as 1 | 2 | 3,
              })
            }
            options={[
              { value: '1', label: 'Heading 1' },
              { value: '2', label: 'Heading 2' },
              { value: '3', label: 'Heading 3' },
            ]}
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Input
            id={`block-${block.clientId}-text`}
            label="Text"
            value={(block.payload as HeadingPayload).text}
            onChange={(value) => updateBlock(index, { ...(block.payload as HeadingPayload), text: value })}
            placeholder="Heading text"
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
        </div>
      )
    }

    if (block.type === 'paragraph') {
      return (
        <Textarea
          id={`block-${block.clientId}-paragraph`}
          label="Paragraph"
          value={(block.payload as ParagraphPayload).text}
          onChange={(value) => updateBlock(index, { ...(block.payload as ParagraphPayload), text: value })}
          placeholder="Paragraph text"
          rows={4}
          className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
        />
      )
    }

    if (block.type === 'form') {
      return (
        <Select
          id={`block-${block.clientId}-form`}
          label="Select form"
          value={(block.payload as FormBlockPayload).formId}
          onChange={(value) => updateBlock(index, { ...(block.payload as FormBlockPayload), formId: value })}
          options={formOptions}
          className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
        />
      )
    }

    if (block.type === 'hero') {
      const payload = block.payload as HeroPayload
      return (
        <div className="space-y-4">
          <Input
            id={`block-${block.clientId}-hero-headline`}
            label="Headline"
            value={payload.headline}
            onChange={(value) => updateBlock(index, { ...payload, headline: value })}
            placeholder="Main headline"
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Textarea
            id={`block-${block.clientId}-hero-subheadline`}
            label="Subheadline"
            value={payload.subheadline}
            onChange={(value) => updateBlock(index, { ...payload, subheadline: value })}
            placeholder="Supporting text"
            rows={3}
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Select
            id={`block-${block.clientId}-hero-variant`}
            label="Layout"
            value={payload.variant ?? 'centered'}
            onChange={(value) =>
              updateBlock(index, { ...payload, variant: value as HeroLayoutVariant })
            }
            options={[
              { value: 'centered', label: 'Centered' },
              { value: 'split', label: 'Split (text left, media right)' },
              { value: 'splitReversed', label: 'Split reversed (media left)' },
              { value: 'centeredWithMediaBelow', label: 'Centered with media below' },
            ]}
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Select
            id={`block-${block.clientId}-hero-style`}
            label="Style"
            value={payload.style ?? 'default'}
            onChange={(value) =>
              updateBlock(index, { ...payload, style: value as HeroStyleVariant })
            }
            options={[
              { value: 'default', label: 'Default' },
              { value: 'minimal', label: 'Minimal' },
              { value: 'dark', label: 'Dark' },
            ]}
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Select
            id={`block-${block.clientId}-hero-media-type`}
            label="Hero media"
            value={payload.mediaType ?? 'none'}
            onChange={(value) =>
              updateBlock(index, {
                ...payload,
                mediaType: value as 'none' | 'image' | 'icon',
              })
            }
            options={[
              { value: 'none', label: 'No media' },
              { value: 'image', label: 'Image' },
              { value: 'icon', label: 'Icon' },
            ]}
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          {payload.mediaType === 'image' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id={`block-${block.clientId}-hero-image-url`}
                label="Hero image URL"
                value={payload.imageUrl ?? ''}
                onChange={(value) => updateBlock(index, { ...payload, imageUrl: value })}
                placeholder="https://example.com/hero.png"
                className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
              />
              <Input
                id={`block-${block.clientId}-hero-image-alt`}
                label="Hero image alt text"
                value={payload.imageAlt ?? ''}
                onChange={(value) => updateBlock(index, { ...payload, imageAlt: value })}
                placeholder="Describe the hero image"
                className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
              />
              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full border-stone-200 px-4 dark:border-stone-700"
                  onClick={() => setUploadTarget({ blockClientId: block.clientId, type: 'hero_image' })}
                >
                  <Image className="h-4 w-4" />
                  Upload & Crop Hero Image
                </Button>
              </div>
            </div>
          ) : null}
          {payload.mediaType === 'icon' ? (
            <Select
              id={`block-${block.clientId}-hero-icon`}
              label="Hero icon"
              value={payload.icon ?? 'sparkles'}
              onChange={(value) => updateBlock(index, { ...payload, icon: value })}
              options={HERO_MEDIA_ICONS.map((option) => ({ value: option.value, label: option.label }))}
              className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
            />
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id={`block-${block.clientId}-hero-primary-label`}
              label="Primary CTA label"
              value={payload.primaryCta?.label ?? ''}
              onChange={(value) =>
                updateBlock(index, {
                  ...payload,
                  primaryCta: {
                    ...(payload.primaryCta ?? { href: '/' }),
                    label: value,
                    href: payload.primaryCta?.href ?? '/',
                  },
                })
              }
              placeholder="e.g. Get started"
              className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
            />
            <Input
              id={`block-${block.clientId}-hero-primary-href`}
              label="Primary CTA link"
              value={payload.primaryCta?.href ?? ''}
              onChange={(value) =>
                updateBlock(index, {
                  ...payload,
                  primaryCta: {
                    ...(payload.primaryCta ?? { label: '' }),
                    label: payload.primaryCta?.label ?? '',
                    href: value,
                  },
                })
              }
              placeholder="e.g. /signup"
              className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
            />
            <Input
              id={`block-${block.clientId}-hero-secondary-label`}
              label="Secondary CTA label"
              value={payload.secondaryCta?.label ?? ''}
              onChange={(value) =>
                updateBlock(index, {
                  ...payload,
                  secondaryCta: {
                    ...(payload.secondaryCta ?? { href: '/' }),
                    label: value,
                    href: payload.secondaryCta?.href ?? '/',
                  },
                })
              }
              placeholder="e.g. Log in"
              className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
            />
            <Input
              id={`block-${block.clientId}-hero-secondary-href`}
              label="Secondary CTA link"
              value={payload.secondaryCta?.href ?? ''}
              onChange={(value) =>
                updateBlock(index, {
                  ...payload,
                  secondaryCta: {
                    ...(payload.secondaryCta ?? { label: '' }),
                    label: payload.secondaryCta?.label ?? '',
                    href: value,
                  },
                })
              }
              placeholder="e.g. /login"
              className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
            />
          </div>
        </div>
      )
    }

    if (block.type === 'feature_card') {
      const payload = block.payload as FeatureCardPayload
      return (
        <div className="space-y-4">
          <Select
            id={`block-${block.clientId}-feature-icon`}
            label="Icon"
            value={payload.icon}
            onChange={(value) => updateBlock(index, { ...payload, icon: value })}
            options={FEATURE_CARD_ICONS.map((option) => ({ value: option.value, label: option.label }))}
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Input
            id={`block-${block.clientId}-feature-title`}
            label="Title"
            value={payload.title}
            onChange={(value) => updateBlock(index, { ...payload, title: value })}
            placeholder="Feature title"
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Textarea
            id={`block-${block.clientId}-feature-description`}
            label="Description"
            value={payload.description}
            onChange={(value) => updateBlock(index, { ...payload, description: value })}
            placeholder="Short description"
            rows={3}
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
        </div>
      )
    }

    if (block.type === 'cta') {
      const payload = block.payload as CTAPayload
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              id={`block-${block.clientId}-cta-text`}
              label="Text"
              value={payload.text}
              onChange={(value) => updateBlock(index, { ...payload, text: value })}
              placeholder="e.g. Ready to start?"
              className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
            />
          </div>
          <Input
            id={`block-${block.clientId}-cta-label`}
            label="Button label"
            value={payload.ctaLabel}
            onChange={(value) => updateBlock(index, { ...payload, ctaLabel: value })}
            placeholder="e.g. Sign up free"
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Input
            id={`block-${block.clientId}-cta-href`}
            label="Button link"
            value={payload.ctaHref}
            onChange={(value) => updateBlock(index, { ...payload, ctaHref: value })}
            placeholder="e.g. /signup"
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
        </div>
      )
    }

    if (block.type === 'image') {
      const payload = block.payload as ImagePayload
      return (
        <div className="space-y-4">
          <Input
            id={`block-${block.clientId}-image-url`}
            label="Image URL"
            value={payload.imageUrl}
            onChange={(value) => updateBlock(index, { ...payload, imageUrl: value })}
            placeholder="https://example.com/image.jpg"
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Input
            id={`block-${block.clientId}-image-alt`}
            label="Alt text"
            value={payload.alt}
            onChange={(value) => updateBlock(index, { ...payload, alt: value })}
            placeholder="Describe the image for accessibility"
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Textarea
            id={`block-${block.clientId}-image-caption`}
            label="Caption (optional)"
            value={payload.caption ?? ''}
            onChange={(value) => updateBlock(index, { ...payload, caption: value })}
            placeholder="Optional caption below the image"
            rows={2}
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full border-stone-200 px-4 dark:border-stone-700"
            onClick={() => setUploadTarget({ blockClientId: block.clientId, type: 'image' })}
          >
            <Image className="h-4 w-4" />
            Upload & Crop Image
          </Button>
          {payload.imageUrl?.trim() ? (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/40">
              <img
                src={payload.imageUrl}
                alt={payload.alt || 'Preview image'}
                className="max-h-80 w-full object-cover"
              />
            </div>
          ) : null}
        </div>
      )
    }

    if (block.type === 'feature_grid') {
      const payload = block.payload as FeatureGridPayload
      return (
        <div className="space-y-4">
          <Select
            id={`block-${block.clientId}-grid-columns`}
            label="Columns"
            value={String(payload.columns ?? 3)}
            onChange={(value) => updateBlock(index, { ...payload, columns: Number(value) as 2 | 3 })}
            options={[
              { value: '2', label: '2 columns' },
              { value: '3', label: '3 columns' },
            ]}
            className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Grid items</p>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {payload.items.length} item{payload.items.length === 1 ? '' : 's'}
              </span>
            </div>
            {payload.items.map((item, itemIndex) => (
              <div
                key={`${block.clientId}-item-${itemIndex}`}
                className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 dark:border-stone-700 dark:bg-stone-800/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Item {itemIndex + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400"
                    onClick={() => {
                      const newItems = payload.items.filter((_, currentIndex) => currentIndex !== itemIndex)
                      updateBlock(index, {
                        ...payload,
                        items: newItems.length ? newItems : [{ icon: 'file-text', title: '', description: '' }],
                      })
                    }}
                    aria-label={`Remove item ${itemIndex + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select
                    id={`block-${block.clientId}-grid-item-${itemIndex}-icon`}
                    label="Icon"
                    value={item.icon ?? 'file-text'}
                    onChange={(value) => {
                      const newItems = [...payload.items]
                      if (newItems[itemIndex]) newItems[itemIndex] = { ...newItems[itemIndex], icon: value }
                      updateBlock(index, { ...payload, items: newItems })
                    }}
                    options={FEATURE_CARD_ICONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                  />
                  <Input
                    id={`block-${block.clientId}-grid-item-${itemIndex}-title`}
                    label="Title"
                    value={item.title ?? ''}
                    onChange={(value) => {
                      const newItems = [...payload.items]
                      if (newItems[itemIndex]) newItems[itemIndex] = { ...newItems[itemIndex], title: value }
                      updateBlock(index, { ...payload, items: newItems })
                    }}
                    placeholder="Title"
                    className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                  />
                  <div className="md:col-span-2">
                    <Textarea
                      id={`block-${block.clientId}-grid-item-${itemIndex}-description`}
                      label="Description"
                      value={item.description ?? ''}
                      onChange={(value) => {
                        const newItems = [...payload.items]
                        if (newItems[itemIndex]) newItems[itemIndex] = { ...newItems[itemIndex], description: value }
                        updateBlock(index, { ...payload, items: newItems })
                      }}
                      placeholder="Description"
                      rows={3}
                      className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full border-stone-200 px-4 dark:border-stone-700"
            onClick={() =>
              updateBlock(index, {
                ...payload,
                items: [...payload.items, { icon: 'file-text', title: '', description: '' }],
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      )
    }

    return null
  }

  if (step === 'select') {
    return (
      <section className="mx-auto max-w-4xl" aria-label="Choose page template">
        <div className="mb-4 flex justify-start">
          <Link
            to="/dashboard/pages"
            className="inline-flex items-center gap-1 rounded border border-stone-200 bg-transparent px-2 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Pages
          </Link>
        </div>
        <Card className="rounded-xl sm:p-8">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Choose a template</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Start with a pre-built landing page or build your own from scratch.
          </p>
          {PAGE_TEMPLATE_CATEGORIES.map((category) => {
            const templates = PAGE_TEMPLATES.filter((t) => t.category === category.value)
            if (templates.length === 0) return null
            return (
              <div key={category.value} className="mt-6">
                <h3 className="text-sm font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {category.label}
                </h3>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{category.description}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {templates.map((template) => {
                    const Icon = PAGE_TEMPLATE_ICONS[template.iconName]
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelectPageTemplate(template)}
                        className="flex items-start gap-3 rounded-xl border border-stone-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-stone-700 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/20"
                      >
                        <Icon className="h-5 w-5 shrink-0 text-stone-500 dark:text-stone-400" />
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-stone-900 dark:text-stone-100">{template.label}</span>
                          <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">{template.description}</p>
                          <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                            {template.blocks.length} block{template.blocks.length !== 1 ? 's' : ''}
                            {template.blocks.length > 0
                              ? ` · ${template.blocks.slice(0, 2).map((b) => b.type).join(', ')}${template.blocks.length > 2 ? '…' : ''}`
                              : ''}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <div className="mt-6 border-t border-stone-200 pt-6 dark:border-stone-700">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleSelectPageTemplate(null)}
              className="w-full sm:w-auto"
            >
              <Layout className="h-4 w-4" />
              Start from scratch
            </Button>
          </div>
        </Card>
      </section>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stone-500 dark:text-stone-400">Loading page…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-4 border-b border-stone-200/80 bg-stone-50/95 px-4 py-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90 sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            {!isEdit ? (
              <button
                type="button"
                onClick={() => setStep('select')}
                className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Back to templates
              </button>
            ) : (
              <Link
                to="/dashboard/pages"
                className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Back to Pages
              </Link>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
                {pageLabel}
              </h1>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(status)}`}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-75" />
                {pageStatusLabel}
              </span>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Structure your page with reusable blocks, then publish it at `/c/&lt;page-id&gt;/{displaySlug || 'page-slug'}`.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard/pages">
              <Button variant="secondary" size="sm" className="rounded-full border-stone-200 px-4 dark:border-stone-700">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-emerald-600 to-violet-600 px-5 text-white shadow-[0_18px_40px_-18px_rgba(16,185,129,0.55)] hover:from-emerald-500 hover:to-violet-500 dark:from-emerald-500 dark:to-violet-500"
            >
              <Sparkles className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        {error ? <ErrorMessage message={error} /> : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">Content blocks</h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  Add sections where you want them. Collapse larger blocks to keep the page easy to scan.
                </p>
              </div>
            </div>

            {blocks.length === 0 ? (
              <Card className="rounded-[28px] border-stone-200/80 bg-white/90 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] dark:border-stone-800 dark:bg-stone-900/80">
                <div className="space-y-4 py-4">
                  <div>
                    <h3 className="text-base font-semibold text-stone-950 dark:text-stone-50">Start with your first block</h3>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      Choose a section below to begin building the page.
                    </p>
                  </div>
                  {renderInsertControl(0)}
                </div>
              </Card>
            ) : (
              <div className="space-y-1">
                {renderInsertControl(0)}
                {blocks.map((block, index) => {
                  const option = getBlockOption(block.type)
                  const Icon = option.icon

                  return (
                    <div key={block.clientId} className="space-y-1">
                      <Card className="rounded-[28px] border-stone-200/80 bg-white/95 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.4)] dark:border-stone-800 dark:bg-stone-900/80" padding="md">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                                <Icon className="h-5 w-5" />
                              </span>
                              <span className="truncate text-sm font-medium text-stone-500 dark:text-stone-400">
                                {getBlockSummary(block)}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 rounded-full p-0 text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                                onClick={() => setEditingBlockIndex(index)}
                                aria-label={`Edit ${option.label} block`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 rounded-full p-0 text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                                onClick={() => moveBlock(index, 'up')}
                                disabled={index === 0}
                                aria-label={`Move ${option.label} block up`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 rounded-full p-0 text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                                onClick={() => moveBlock(index, 'down')}
                                disabled={index === blocks.length - 1}
                                aria-label={`Move ${option.label} block down`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 rounded-full p-0 text-stone-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                                onClick={() => removeBlock(index)}
                                aria-label={`Remove ${option.label} block`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-800/30">
                            {renderBlockPreview(block)}
                          </div>
                        </div>
                      </Card>
                      {renderInsertControl(index + 1)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[28px] border-stone-200/80 bg-white/95 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.4)] dark:border-stone-800 dark:bg-stone-900/80">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">Page details</h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Manage metadata, publishing state, and the page URL.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    id="page-title"
                    label="Title"
                    value={title}
                    onChange={(value) => setTitle(value)}
                    placeholder="e.g. Contact us"
                    required
                    className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                  />
                  <Input
                    id="page-slug"
                    label="Slug"
                    value={slug}
                    onChange={(value) => setSlug(value)}
                    placeholder="contact-us"
                    className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                  />
                  <Input
                    id="meta-title"
                    label="Meta title"
                    value={metaTitle}
                    onChange={(value) => setMetaTitle(value)}
                    placeholder="SEO title"
                    className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                  />
                  <Textarea
                    id="meta-description"
                    label="Meta description"
                    value={metaDescription}
                    onChange={(value) => setMetaDescription(value)}
                    placeholder="SEO description"
                    rows={3}
                    className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                  />
                  <Select
                    id="page-status"
                    label="Status"
                    value={status}
                    onChange={(value) => setStatus(value as 'draft' | 'published')}
                    options={[
                      { value: 'draft', label: 'Draft' },
                      { value: 'published', label: 'Published' },
                    ]}
                    className="rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                  />
                </div>

                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 p-4 dark:border-stone-700 dark:bg-stone-800/40">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    Preview URL
                  </p>
                  <p className="mt-2 break-all text-sm text-stone-700 dark:text-stone-200">
                    {isEdit && id ? `/c/${id}/${displaySlug || 'page-slug'}` : '/c/<page-id>/' + (displaySlug || 'page-slug')}
                  </p>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {editingBlockIndex !== null && blocks[editingBlockIndex] && (
        <Modal
          isOpen
          onClose={() => setEditingBlockIndex(null)}
          title={`Edit ${getBlockOption(blocks[editingBlockIndex].type).label} block`}
          size="xl"
        >
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            {renderBlockFields(blocks[editingBlockIndex], editingBlockIndex)}
          </div>
          <div className="mt-4 flex justify-end border-t border-stone-200 pt-4 dark:border-stone-700">
            <Button type="button" variant="primary" onClick={() => setEditingBlockIndex(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* Rendered after block-edit Modal; elevated so it appears on top when opened from block edit dialog */}
      <ImageUploadCropDialog
        isOpen={Boolean(uploadTarget)}
        onClose={() => setUploadTarget(null)}
        elevated
        title={
          uploadTarget?.type === 'hero_image'
            ? 'Upload and crop hero image'
            : 'Upload and crop image'
        }
        aspect={uploadTarget?.type === 'hero_image' ? 16 / 9 : 4 / 3}
        onUploaded={(url) => {
          if (!uploadTarget) return
          setBlocks((prev) =>
            prev.map((block) => {
              if (block.clientId !== uploadTarget.blockClientId) return block
              if (uploadTarget.type === 'hero_image' && block.type === 'hero') {
                const payload = block.payload as HeroPayload
                return {
                  ...block,
                  payload: {
                    ...payload,
                    mediaType: 'image',
                    imageUrl: url,
                  },
                }
              }
              if (uploadTarget.type === 'image' && block.type === 'image') {
                const payload = block.payload as ImagePayload
                return {
                  ...block,
                  payload: {
                    ...payload,
                    imageUrl: url,
                  },
                }
              }
              return block
            }),
          )
          setUploadTarget(null)
        }}
      />
    </div>
  )
}
