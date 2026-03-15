import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ChevronDown, ChevronUp, Heading1, Type, FileText, Trash2, Layout, LayoutGrid, Megaphone, Plus, Grid3X3 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { pagesApi, feedbackFormsApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage, Input, Select, Textarea } from '../../../components/ui'

type BlockType = 'heading' | 'paragraph' | 'form' | 'hero' | 'feature_card' | 'feature_grid' | 'cta'

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

interface HeroPayload {
  headline: string
  subheadline: string
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
  | CTAPayload

interface Block {
  _id?: string
  type: BlockType
  payload: BlockPayload
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
  blocks: Block[]
}

function createBlock(type: BlockType, payload: BlockPayload): Block {
  return { type, payload }
}

const FEATURE_CARD_ICONS = [
  { value: 'file-text', label: 'Document' },
  { value: 'share2', label: 'Share' },
  { value: 'bar-chart3', label: 'Chart' },
] as const

function createEmptyBlock(type: BlockType): Block {
  switch (type) {
    case 'heading':
      return createBlock('heading', { level: 2, text: '' })
    case 'paragraph':
      return createBlock('paragraph', { text: '' })
    case 'form':
      return createBlock('form', { formId: '' })
    case 'hero':
      return createBlock('hero', { headline: '', subheadline: '', primaryCta: { label: '', href: '' }, secondaryCta: { label: '', href: '' } })
    case 'feature_card':
      return createBlock('feature_card', { title: '', description: '', icon: 'file-text' })
    case 'feature_grid':
      return createBlock('feature_grid', { columns: 3, items: [{ icon: 'file-text', title: '', description: '' }] })
    case 'cta':
      return createBlock('cta', { text: '', ctaLabel: '', ctaHref: '/signup' })
    default:
      return createBlock('paragraph', { text: '' })
  }
}

export default function CreatePagePage() {
  const { pageId } = useParams<{ pageId?: string }>()
  const id = pageId
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { getAuthHeaders } = useAuth()

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
        const p = res.data.page
        setTitle(p.title)
        setSlug(p.slug)
        setMetaTitle(p.metaTitle ?? '')
        setMetaDescription(p.metaDescription ?? '')
        setStatus(p.status)
        setBlocks(Array.isArray(p.blocks) ? p.blocks : [])
      } catch {
        setError('Failed to load page.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [isEdit, id, getAuthHeaders])

  const addBlock = useCallback((type: BlockType) => {
    setBlocks((prev) => [...prev, createEmptyBlock(type)])
  }, [])

  const updateBlock = useCallback((index: number, payload: BlockPayload) => {
    setBlocks((prev) => {
      const next = [...prev]
      if (next[index]) next[index] = { ...next[index], payload }
      return next
    })
  }, [])

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const next = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  const removeBlock = useCallback((index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Title is required.')
      return
    }
    const trimmedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || trimmedTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
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
        blocks,
      }
      if (isEdit && id) {
        await axios.put(`${pagesApi}/${id}`, payload, headers)
        navigate('/dashboard/pages')
      } else {
        await axios.post(pagesApi, payload, headers)
        navigate('/dashboard/pages')
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string } } })?.response?.data
      setError(data?.error ?? 'Failed to save page.')
    } finally {
      setSaving(false)
    }
  }, [title, slug, metaTitle, metaDescription, status, blocks, isEdit, id, navigate, getAuthHeaders])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stone-500 dark:text-stone-400">Loading page…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/pages" className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
          ← Back to Pages
        </Link>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Page details</h2>
        <div className="space-y-4">
          <Input
            id="page-title"
            label="Title"
            value={title}
            onChange={(value) => setTitle(value)}
            placeholder="e.g. Contact us"
            required
          />
          <Input
            id="page-slug"
            label="URL slug"
            value={slug}
            onChange={(value) => setSlug(value)}
            placeholder="e.g. contact-us (URL: /c/<page-id>/contact-us)"
          />
          <Input
            id="meta-title"
            label="Meta title (optional)"
            value={metaTitle}
            onChange={(value) => setMetaTitle(value)}
            placeholder="SEO title"
          />
          <Textarea
            id="meta-description"
            label="Meta description (optional)"
            value={metaDescription}
            onChange={(value) => setMetaDescription(value)}
            placeholder="SEO description"
            rows={2}
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
          />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Content blocks</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => addBlock('heading')}>
              <Heading1 className="h-4 w-4" />
              Heading
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => addBlock('paragraph')}>
              <Type className="h-4 w-4" />
              Paragraph
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => addBlock('form')}>
              <FileText className="h-4 w-4" />
              Form
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => addBlock('hero')}>
              <Layout className="h-4 w-4" />
              Hero
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => addBlock('feature_card')}>
              <LayoutGrid className="h-4 w-4" />
              Feature card
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => addBlock('cta')}>
              <Megaphone className="h-4 w-4" />
              CTA
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => addBlock('feature_grid')}>
              <Grid3X3 className="h-4 w-4" />
              Feature grid
            </Button>
          </div>
        </div>
        {blocks.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">No blocks yet. Add a heading, paragraph, form, hero, feature card, feature grid, or CTA above.</p>
        ) : (
          <ul className="space-y-4">
            {blocks.map((block, index) => (
              <li key={index} className="flex gap-2 rounded-lg border border-stone-200 bg-stone-50/50 p-3 dark:border-stone-700 dark:bg-stone-800/50">
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => moveBlock(index, 'up')}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => moveBlock(index, 'down')}
                    disabled={index === blocks.length - 1}
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  {block.type === 'heading' && (
                    <div>
                      <Select
                        id={`block-${index}-level`}
                        label="Level"
                        value={String((block.payload as HeadingPayload).level)}
                        onChange={(value) => updateBlock(index, { ...block.payload, level: Number(value) as 1 | 2 | 3 })}
                        options={[
                          { value: '1', label: 'Heading 1' },
                          { value: '2', label: 'Heading 2' },
                          { value: '3', label: 'Heading 3' },
                        ]}
                      />
                      <Input
                        id={`block-${index}-text`}
                        label="Text"
                        value={(block.payload as HeadingPayload).text}
                        onChange={(value) => updateBlock(index, { ...block.payload, text: value })}
                        placeholder="Heading text"
                      />
                    </div>
                  )}
                  {block.type === 'paragraph' && (
                    <Textarea
                      id={`block-${index}-text`}
                      label="Paragraph"
                      value={(block.payload as ParagraphPayload).text}
                      onChange={(value) => updateBlock(index, { ...block.payload, text: value })}
                      placeholder="Paragraph text"
                      rows={3}
                    />
                  )}
                  {block.type === 'form' && (
                    <Select
                      id={`block-${index}-form`}
                      label="Select form"
                      value={(block.payload as FormBlockPayload).formId}
                      onChange={(value) => updateBlock(index, { ...block.payload, formId: value })}
                      options={[
                        { value: '', label: '— Select a form —' },
                        ...forms.map((f) => ({ value: f._id, label: f.title })),
                      ]}
                    />
                  )}
                  {block.type === 'hero' && (
                    <div className="space-y-3">
                      <Input
                        id={`block-${index}-hero-headline`}
                        label="Headline"
                        value={(block.payload as HeroPayload).headline}
                        onChange={(value) => updateBlock(index, { ...block.payload, headline: value })}
                        placeholder="Main headline"
                      />
                      <Textarea
                        id={`block-${index}-hero-subheadline`}
                        label="Subheadline"
                        value={(block.payload as HeroPayload).subheadline}
                        onChange={(value) => updateBlock(index, { ...block.payload, subheadline: value })}
                        placeholder="Supporting text"
                        rows={2}
                      />
                      <Input
                        id={`block-${index}-hero-primary-label`}
                        label="Primary CTA label"
                        value={(block.payload as HeroPayload).primaryCta?.label ?? ''}
                        onChange={(value) => updateBlock(index, {
                          ...block.payload,
                          primaryCta: { ...(block.payload as HeroPayload).primaryCta, label: value, href: (block.payload as HeroPayload).primaryCta?.href ?? '/' },
                        })}
                        placeholder="e.g. Get started"
                      />
                      <Input
                        id={`block-${index}-hero-primary-href`}
                        label="Primary CTA link"
                        value={(block.payload as HeroPayload).primaryCta?.href ?? ''}
                        onChange={(value) => updateBlock(index, {
                          ...block.payload,
                          primaryCta: { ...(block.payload as HeroPayload).primaryCta, href: value, label: (block.payload as HeroPayload).primaryCta?.label ?? '' },
                        })}
                        placeholder="e.g. /signup"
                      />
                      <Input
                        id={`block-${index}-hero-secondary-label`}
                        label="Secondary CTA label"
                        value={(block.payload as HeroPayload).secondaryCta?.label ?? ''}
                        onChange={(value) => updateBlock(index, {
                          ...block.payload,
                          secondaryCta: { ...(block.payload as HeroPayload).secondaryCta, label: value, href: (block.payload as HeroPayload).secondaryCta?.href ?? '/' },
                        })}
                        placeholder="e.g. Log in"
                      />
                      <Input
                        id={`block-${index}-hero-secondary-href`}
                        label="Secondary CTA link"
                        value={(block.payload as HeroPayload).secondaryCta?.href ?? ''}
                        onChange={(value) => updateBlock(index, {
                          ...block.payload,
                          secondaryCta: { ...(block.payload as HeroPayload).secondaryCta, href: value, label: (block.payload as HeroPayload).secondaryCta?.label ?? '' },
                        })}
                        placeholder="e.g. /login"
                      />
                    </div>
                  )}
                  {block.type === 'feature_card' && (
                    <div className="space-y-3">
                      <Select
                        id={`block-${index}-feature-icon`}
                        label="Icon"
                        value={(block.payload as FeatureCardPayload).icon}
                        onChange={(value) => updateBlock(index, { ...block.payload, icon: value })}
                        options={FEATURE_CARD_ICONS.map((o) => ({ value: o.value, label: o.label }))}
                      />
                      <Input
                        id={`block-${index}-feature-title`}
                        label="Title"
                        value={(block.payload as FeatureCardPayload).title}
                        onChange={(value) => updateBlock(index, { ...block.payload, title: value })}
                        placeholder="Feature title"
                      />
                      <Textarea
                        id={`block-${index}-feature-desc`}
                        label="Description"
                        value={(block.payload as FeatureCardPayload).description}
                        onChange={(value) => updateBlock(index, { ...block.payload, description: value })}
                        placeholder="Short description"
                        rows={2}
                      />
                    </div>
                  )}
                  {block.type === 'cta' && (
                    <div className="space-y-3">
                      <Input
                        id={`block-${index}-cta-text`}
                        label="Text"
                        value={(block.payload as CTAPayload).text}
                        onChange={(value) => updateBlock(index, { ...block.payload, text: value })}
                        placeholder="e.g. Ready to start?"
                      />
                      <Input
                        id={`block-${index}-cta-label`}
                        label="Button label"
                        value={(block.payload as CTAPayload).ctaLabel}
                        onChange={(value) => updateBlock(index, { ...block.payload, ctaLabel: value })}
                        placeholder="e.g. Sign up free"
                      />
                      <Input
                        id={`block-${index}-cta-href`}
                        label="Button link"
                        value={(block.payload as CTAPayload).ctaHref}
                        onChange={(value) => updateBlock(index, { ...block.payload, ctaHref: value })}
                        placeholder="e.g. /signup"
                      />
                    </div>
                  )}
                  {block.type === 'feature_grid' && (
                    <div className="space-y-3">
                      <Select
                        id={`block-${index}-grid-cols`}
                        label="Columns"
                        value={String((block.payload as FeatureGridPayload).columns ?? 3)}
                        onChange={(value) => updateBlock(index, { ...block.payload, columns: Number(value) as 2 | 3 })}
                        options={[
                          { value: '2', label: '2 columns' },
                          { value: '3', label: '3 columns' },
                        ]}
                      />
                      <p className="text-xs font-medium text-stone-600 dark:text-stone-400">Items</p>
                      {((block.payload as FeatureGridPayload).items ?? []).map((item, itemIndex) => (
                        <div key={itemIndex} className="rounded border border-stone-200 bg-white p-3 dark:border-stone-600 dark:bg-stone-800">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs text-stone-500">Item {itemIndex + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-stone-500 hover:text-rose-600"
                              onClick={() => {
                                const p = block.payload as FeatureGridPayload
                                const newItems = (p.items ?? []).filter((_, i) => i !== itemIndex)
                                updateBlock(index, { ...p, items: newItems.length ? newItems : [{ icon: 'file-text', title: '', description: '' }] })
                              }}
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Select
                              id={`block-${index}-grid-item-${itemIndex}-icon`}
                              label="Icon"
                              value={item.icon ?? 'file-text'}
                              onChange={(value) => {
                                const p = block.payload as FeatureGridPayload
                                const newItems = [...(p.items ?? [])]
                                if (newItems[itemIndex]) newItems[itemIndex] = { ...newItems[itemIndex], icon: value }
                                updateBlock(index, { ...p, items: newItems })
                              }}
                              options={FEATURE_CARD_ICONS.map((o) => ({ value: o.value, label: o.label }))}
                            />
                            <Input
                              id={`block-${index}-grid-item-${itemIndex}-title`}
                              label="Title"
                              value={item.title ?? ''}
                              onChange={(value) => {
                                const p = block.payload as FeatureGridPayload
                                const newItems = [...(p.items ?? [])]
                                if (newItems[itemIndex]) newItems[itemIndex] = { ...newItems[itemIndex], title: value }
                                updateBlock(index, { ...p, items: newItems })
                              }}
                              placeholder="Title"
                            />
                            <Textarea
                              id={`block-${index}-grid-item-${itemIndex}-desc`}
                              label="Description"
                              value={item.description ?? ''}
                              onChange={(value) => {
                                const p = block.payload as FeatureGridPayload
                                const newItems = [...(p.items ?? [])]
                                if (newItems[itemIndex]) newItems[itemIndex] = { ...newItems[itemIndex], description: value }
                                updateBlock(index, { ...p, items: newItems })
                              }}
                              placeholder="Description"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const p = block.payload as FeatureGridPayload
                          const items = [...(p.items ?? []), { icon: 'file-text', title: '', description: '' }]
                          updateBlock(index, { ...p, items })
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add item
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-stone-500 hover:text-rose-600"
                  onClick={() => removeBlock(index)}
                  aria-label="Remove block"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex gap-2">
        <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Update page' : 'Create page'}
        </Button>
        <Link to="/dashboard/pages">
          <Button variant="secondary">Cancel</Button>
        </Link>
      </div>
    </div>
  )
}
