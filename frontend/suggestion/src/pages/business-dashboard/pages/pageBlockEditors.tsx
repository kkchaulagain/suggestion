/**
 * Block editor forms for the page builder.
 */
import type { ReactNode } from 'react'
import { Image, Plus, Trash2 } from 'lucide-react'
import type { Block, BlockPayload, UploadTarget } from './pageBlockTypes'
import {
  FEATURE_CARD_ICONS,
  HERO_MEDIA_ICONS,
  type CTAPayload,
  type FAQPayload,
  type FeatureCardPayload,
  type FeatureGridPayload,
  type FormBlockPayload,
  type HeadingPayload,
  type HeroPayload,
  type ImagePayload,
  type ParagraphPayload,
  type PricingPayload,
  type StatsPayload,
  type TestimonialsPayload,
} from './pageBlockTypes'
import { Button, Input, Select, Textarea } from '../../../components/ui'
import { imageDisplayUrl, PLACEHOLDER_IMAGE_URL } from '../../../utils/placeholderImage'

const inputClass =
  'rounded-2xl border-stone-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-stone-700 dark:focus:border-violet-400 dark:focus:ring-violet-400/20'

export interface RenderBlockFieldsOptions {
  updateBlock: (index: number, payload: BlockPayload) => void
  formOptions: { value: string; label: string }[]
  setUploadTarget: (target: UploadTarget | null) => void
}

export function renderBlockFields(
  block: Block,
  index: number,
  { updateBlock, formOptions, setUploadTarget }: RenderBlockFieldsOptions,
): ReactNode {
  if (block.type === 'heading') {
    const payload = block.payload as HeadingPayload
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          id={`block-${block.clientId}-level`}
          label="Level"
          value={String(payload.level)}
          onChange={(value) =>
            updateBlock(index, {
              ...payload,
              level: Number(value) as 1 | 2 | 3,
            })
          }
          options={[
            { value: '1', label: 'Heading 1' },
            { value: '2', label: 'Heading 2' },
            { value: '3', label: 'Heading 3' },
          ]}
          className={inputClass}
        />
        <Select
          id={`block-${block.clientId}-align`}
          label="Alignment"
          value={payload.align ?? 'center'}
          onChange={(value) => updateBlock(index, { ...payload, align: value as 'left' | 'center' | 'right' })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
          className={inputClass}
        />
        <Input
          id={`block-${block.clientId}-text`}
          label="Text"
          value={payload.text}
          onChange={(value) => updateBlock(index, { ...payload, text: value })}
          placeholder="Heading text"
          className={`md:col-span-2 ${inputClass}`}
        />
      </div>
    )
  }

  if (block.type === 'paragraph') {
    const payload = block.payload as ParagraphPayload
    return (
      <div className="space-y-4">
        <Select
          id={`block-${block.clientId}-align`}
          label="Alignment"
          value={payload.align ?? 'left'}
          onChange={(value) => updateBlock(index, { ...payload, align: value as 'left' | 'center' | 'right' })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
          className={inputClass}
        />
        <Textarea
          id={`block-${block.clientId}-paragraph`}
          label="Paragraph"
          value={payload.text}
          onChange={(value) => updateBlock(index, { ...payload, text: value })}
          placeholder="Paragraph text"
          rows={4}
          className={inputClass}
        />
      </div>
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
        className={inputClass}
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
          className={inputClass}
        />
        <Textarea
          id={`block-${block.clientId}-hero-subheadline`}
          label="Subheadline"
          value={payload.subheadline}
          onChange={(value) => updateBlock(index, { ...payload, subheadline: value })}
          placeholder="Supporting text"
          rows={3}
          className={inputClass}
        />
        <Input
          id={`block-${block.clientId}-hero-badge`}
          label="Badge (optional)"
          value={payload.badge ?? ''}
          onChange={(value) => updateBlock(index, { ...payload, badge: value || undefined })}
          placeholder="e.g. No code required"
          className={inputClass}
        />
        <Select
          id={`block-${block.clientId}-hero-variant`}
          label="Layout"
          value={payload.variant ?? 'centered'}
          onChange={(value) =>
            updateBlock(index, { ...payload, variant: value as 'centered' | 'split' | 'splitReversed' | 'centeredWithMediaBelow' })
          }
          options={[
            { value: 'centered', label: 'Centered' },
            { value: 'split', label: 'Split (text left, media right)' },
            { value: 'splitReversed', label: 'Split reversed (media left)' },
            { value: 'centeredWithMediaBelow', label: 'Centered with media below' },
          ]}
          className={inputClass}
        />
        <Select
          id={`block-${block.clientId}-hero-style`}
          label="Style"
          value={payload.style ?? 'default'}
          onChange={(value) => updateBlock(index, { ...payload, style: value as 'default' | 'minimal' })}
          options={[
            { value: 'default', label: 'Default' },
            { value: 'minimal', label: 'Minimal' },
          ]}
          className={inputClass}
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
          className={inputClass}
        />
        {payload.mediaType === 'image' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id={`block-${block.clientId}-hero-image-url`}
              label="Hero image URL"
              value={payload.imageUrl ?? ''}
              onChange={(value) => updateBlock(index, { ...payload, imageUrl: value })}
              placeholder="https://example.com/hero.png or use placeholder below"
              className={inputClass}
            />
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full border-stone-200 px-4 dark:border-stone-700"
                onClick={() => updateBlock(index, { ...payload, imageUrl: PLACEHOLDER_IMAGE_URL })}
              >
                Use placeholder image
              </Button>
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
            <Input
              id={`block-${block.clientId}-hero-image-alt`}
              label="Hero image alt text"
              value={payload.imageAlt ?? ''}
              onChange={(value) => updateBlock(index, { ...payload, imageAlt: value })}
              placeholder="Describe the hero image"
              className={inputClass}
            />
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/40 md:col-span-2">
              <img
                src={imageDisplayUrl(payload.imageUrl)}
                alt={payload.imageAlt || 'Hero preview'}
                className="max-h-48 w-full object-cover"
              />
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
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
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
          className={inputClass}
        />
        <Input
          id={`block-${block.clientId}-feature-title`}
          label="Title"
          value={payload.title}
          onChange={(value) => updateBlock(index, { ...payload, title: value })}
          placeholder="Feature title"
          className={inputClass}
        />
        <Textarea
          id={`block-${block.clientId}-feature-description`}
          label="Description"
          value={payload.description}
          onChange={(value) => updateBlock(index, { ...payload, description: value })}
          placeholder="Short description"
          rows={3}
          className={inputClass}
        />
      </div>
    )
  }

  if (block.type === 'cta') {
    const payload = block.payload as CTAPayload
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          id={`block-${block.clientId}-cta-variant`}
          label="Variant"
          value={payload.variant ?? 'simple'}
          onChange={(value) => updateBlock(index, { ...payload, variant: value as 'simple' | 'banner' })}
          options={[
            { value: 'simple', label: 'Simple' },
            { value: 'banner', label: 'Banner' },
          ]}
          className={inputClass}
        />
        <div className="md:col-span-2">
          <Input
            id={`block-${block.clientId}-cta-text`}
            label="Text"
            value={payload.text}
            onChange={(value) => updateBlock(index, { ...payload, text: value })}
            placeholder="e.g. Ready to start?"
            className={inputClass}
          />
        </div>
        <Input
          id={`block-${block.clientId}-cta-label`}
          label="Button label"
          value={payload.ctaLabel}
          onChange={(value) => updateBlock(index, { ...payload, ctaLabel: value })}
          placeholder="e.g. Sign up free"
          className={inputClass}
        />
        <Input
          id={`block-${block.clientId}-cta-href`}
          label="Button link"
          value={payload.ctaHref}
          onChange={(value) => updateBlock(index, { ...payload, ctaHref: value })}
          placeholder="e.g. /signup"
          className={inputClass}
        />
        <Input
          id={`block-${block.clientId}-cta-secondary-label`}
          label="Secondary button label (optional)"
          value={payload.secondaryCta?.label ?? ''}
          onChange={(value) =>
            updateBlock(index, {
              ...payload,
              secondaryCta: value.trim()
                ? { ...(payload.secondaryCta ?? { href: '' }), label: value, href: payload.secondaryCta?.href ?? '' }
                : undefined,
            })
          }
          placeholder="e.g. Contact sales"
          className={inputClass}
        />
        <Input
          id={`block-${block.clientId}-cta-secondary-href`}
          label="Secondary button link"
          value={payload.secondaryCta?.href ?? ''}
          onChange={(value) =>
            updateBlock(index, {
              ...payload,
              secondaryCta:
                payload.secondaryCta?.label || value
                  ? { label: payload.secondaryCta?.label ?? '', href: value }
                  : undefined,
            })
          }
          placeholder="e.g. /login"
          className={inputClass}
        />
      </div>
    )
  }

  if (block.type === 'stats') {
    const payload = block.payload as StatsPayload
    const stats = payload.stats ?? []
    return (
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={payload.showDividers ?? true}
            onChange={(e) => updateBlock(index, { ...payload, showDividers: e.target.checked })}
          />
          Show dividers between stats
        </label>
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Stats</p>
        {stats.map((stat, i) => (
          <div
            key={i}
            className="flex gap-2 rounded-2xl border border-stone-200 bg-stone-50/60 p-3 dark:border-stone-700 dark:bg-stone-800/50"
          >
            <Input
              id={`block-${block.clientId}-stat-${i}-value`}
              label="Value"
              value={stat.value}
              onChange={(value) => {
                const next = stats.map((s, j) => (j === i ? { ...s, value } : s))
                updateBlock(index, { ...payload, stats: next })
              }}
              placeholder="e.g. 10k+"
              className="rounded-2xl border-stone-200 dark:border-stone-700"
            />
            <Input
              id={`block-${block.clientId}-stat-${i}-label`}
              label="Label"
              value={stat.label}
              onChange={(value) => {
                const next = stats.map((s, j) => (j === i ? { ...s, label: value } : s))
                updateBlock(index, { ...payload, stats: next })
              }}
              placeholder="e.g. Forms created"
              className="rounded-2xl border-stone-200 dark:border-stone-700"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() =>
                updateBlock(index, {
                  ...payload,
                  stats: stats.length > 1 ? stats.filter((_, j) => j !== i) : [{ value: '', label: '' }],
                })
              }
              aria-label="Remove stat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full"
          onClick={() => updateBlock(index, { ...payload, stats: [...stats, { value: '', label: '' }] })}
        >
          <Plus className="h-4 w-4" /> Add stat
        </Button>
      </div>
    )
  }

  if (block.type === 'testimonials') {
    const payload = block.payload as TestimonialsPayload
    return (
      <div className="space-y-4">
        <Input
          id={`block-${block.clientId}-test-heading`}
          label="Heading"
          value={payload.heading ?? ''}
          onChange={(v) => updateBlock(index, { ...payload, heading: v })}
          placeholder="Section heading"
          className="rounded-2xl border-stone-200 dark:border-stone-700"
        />
        <Input
          id={`block-${block.clientId}-test-subheading`}
          label="Subheading"
          value={payload.subheading ?? ''}
          onChange={(v) => updateBlock(index, { ...payload, subheading: v })}
          placeholder="Optional"
          className="rounded-2xl border-stone-200 dark:border-stone-700"
        />
        <Select
          id={`block-${block.clientId}-test-layout`}
          label="Layout"
          value={payload.layout ?? 'grid'}
          onChange={(v) => updateBlock(index, { ...payload, layout: v as 'grid' | 'single' })}
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'single', label: 'Single' },
          ]}
          className="rounded-2xl border-stone-200 dark:border-stone-700"
        />
        <div className="space-y-3">
          {(payload.testimonials ?? []).map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-700 dark:bg-stone-800/50"
            >
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium">Testimonial {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateBlock(index, {
                      ...payload,
                      testimonials:
                        (payload.testimonials ?? []).length > 1
                          ? (payload.testimonials ?? []).filter((_, j) => j !== i)
                          : [{ quote: '', name: '', role: '' }],
                    })
                  }
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                id={`block-${block.clientId}-test-${i}-quote`}
                label="Quote"
                value={t.quote}
                onChange={(v) => {
                  const next = [...(payload.testimonials ?? [])]
                  if (next[i]) next[i] = { ...next[i], quote: v }
                  updateBlock(index, { ...payload, testimonials: next })
                }}
                rows={2}
                className="rounded-2xl border-stone-200 dark:border-stone-700"
              />
              <Input
                id={`block-${block.clientId}-test-${i}-name`}
                label="Name"
                value={t.name}
                onChange={(v) => {
                  const next = [...(payload.testimonials ?? [])]
                  if (next[i]) next[i] = { ...next[i], name: v }
                  updateBlock(index, { ...payload, testimonials: next })
                }}
                className="rounded-2xl border-stone-200 dark:border-stone-700"
              />
              <Input
                id={`block-${block.clientId}-test-${i}-role`}
                label="Role"
                value={t.role}
                onChange={(v) => {
                  const next = [...(payload.testimonials ?? [])]
                  if (next[i]) next[i] = { ...next[i], role: v }
                  updateBlock(index, { ...payload, testimonials: next })
                }}
                className="rounded-2xl border-stone-200 dark:border-stone-700"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() =>
              updateBlock(index, {
                ...payload,
                testimonials: [...(payload.testimonials ?? []), { quote: '', name: '', role: '' }],
              })
            }
          >
            <Plus className="h-4 w-4" /> Add testimonial
          </Button>
        </div>
      </div>
    )
  }

  if (block.type === 'pricing') {
    const payload = block.payload as PricingPayload
    return (
      <div className="space-y-4">
        <Input
          id={`block-${block.clientId}-pricing-heading`}
          label="Heading"
          value={payload.heading ?? ''}
          onChange={(v) => updateBlock(index, { ...payload, heading: v })}
          className="rounded-2xl border-stone-200 dark:border-stone-700"
        />
        <Input
          id={`block-${block.clientId}-pricing-subheading`}
          label="Subheading"
          value={payload.subheading ?? ''}
          onChange={(v) => updateBlock(index, { ...payload, subheading: v })}
          className="rounded-2xl border-stone-200 dark:border-stone-700"
        />
        <div className="space-y-3">
          {(payload.plans ?? []).map((plan, i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-700 dark:bg-stone-800/50"
            >
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium">Plan {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateBlock(index, {
                      ...payload,
                      plans:
                        (payload.plans ?? []).length > 1
                          ? (payload.plans ?? []).filter((_, j) => j !== i)
                          : [
                              {
                                name: '',
                                price: '',
                                period: '',
                                features: [],
                                cta: { label: '', href: '' },
                                highlighted: false,
                              },
                            ],
                    })
                  }
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id={`block-${block.clientId}-plan-${i}-name`}
                label="Name"
                value={plan.name}
                onChange={(v) => {
                  const next = [...(payload.plans ?? [])]
                  if (next[i]) next[i] = { ...next[i], name: v }
                  updateBlock(index, { ...payload, plans: next })
                }}
                placeholder="e.g. Pro"
                className="rounded-2xl border-stone-200 dark:border-stone-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id={`block-${block.clientId}-plan-${i}-price`}
                  label="Price"
                  value={plan.price}
                  onChange={(v) => {
                    const next = [...(payload.plans ?? [])]
                    if (next[i]) next[i] = { ...next[i], price: v }
                    updateBlock(index, { ...payload, plans: next })
                  }}
                  placeholder="$29"
                  className="rounded-2xl border-stone-200 dark:border-stone-700"
                />
                <Input
                  id={`block-${block.clientId}-plan-${i}-period`}
                  label="Period"
                  value={plan.period ?? ''}
                  onChange={(v) => {
                    const next = [...(payload.plans ?? [])]
                    if (next[i]) next[i] = { ...next[i], period: v }
                    updateBlock(index, { ...payload, plans: next })
                  }}
                  placeholder="per month"
                  className="rounded-2xl border-stone-200 dark:border-stone-700"
                />
              </div>
              <Textarea
                id={`block-${block.clientId}-plan-${i}-features`}
                label="Features (one per line)"
                value={(plan.features ?? []).join('\n')}
                onChange={(v) => {
                  const next = [...(payload.plans ?? [])]
                  if (next[i]) next[i] = { ...next[i], features: v.split('\n').filter(Boolean) }
                  updateBlock(index, { ...payload, plans: next })
                }}
                rows={3}
                className="rounded-2xl border-stone-200 dark:border-stone-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id={`block-${block.clientId}-plan-${i}-cta-label`}
                  label="CTA label"
                  value={plan.cta?.label ?? ''}
                  onChange={(v) => {
                    const next = [...(payload.plans ?? [])]
                    if (next[i]) next[i] = { ...next[i], cta: { ...(next[i].cta ?? { href: '' }), label: v } }
                    updateBlock(index, { ...payload, plans: next })
                  }}
                  placeholder="Get started"
                  className="rounded-2xl border-stone-200 dark:border-stone-700"
                />
                <Input
                  id={`block-${block.clientId}-plan-${i}-cta-href`}
                  label="CTA href"
                  value={plan.cta?.href ?? ''}
                  onChange={(v) => {
                    const next = [...(payload.plans ?? [])]
                    if (next[i]) next[i] = { ...next[i], cta: { ...(next[i].cta ?? { label: '' }), href: v } }
                    updateBlock(index, { ...payload, plans: next })
                  }}
                  placeholder="/signup"
                  className="rounded-2xl border-stone-200 dark:border-stone-700"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={plan.highlighted ?? false}
                  onChange={(e) => {
                    const next = [...(payload.plans ?? [])]
                    if (next[i]) next[i] = { ...next[i], highlighted: e.target.checked }
                    updateBlock(index, { ...payload, plans: next })
                  }}
                />
                Highlight (Popular)
              </label>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() =>
              updateBlock(index, {
                ...payload,
                plans: [
                  ...(payload.plans ?? []),
                  { name: '', price: '', period: '', features: [], cta: { label: '', href: '' }, highlighted: false },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" /> Add plan
          </Button>
        </div>
      </div>
    )
  }

  if (block.type === 'faq') {
    const payload = block.payload as FAQPayload
    return (
      <div className="space-y-4">
        <Input
          id={`block-${block.clientId}-faq-heading`}
          label="Heading"
          value={payload.heading ?? ''}
          onChange={(v) => updateBlock(index, { ...payload, heading: v })}
          className="rounded-2xl border-stone-200 dark:border-stone-700"
        />
        <Input
          id={`block-${block.clientId}-faq-subheading`}
          label="Subheading"
          value={payload.subheading ?? ''}
          onChange={(v) => updateBlock(index, { ...payload, subheading: v })}
          className="rounded-2xl border-stone-200 dark:border-stone-700"
        />
        <div className="space-y-3">
          {(payload.items ?? []).map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-700 dark:bg-stone-800/50"
            >
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium">Question {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateBlock(index, {
                      ...payload,
                      items:
                        (payload.items ?? []).length > 1
                          ? (payload.items ?? []).filter((_, j) => j !== i)
                          : [{ question: '', answer: '' }],
                    })
                  }
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id={`block-${block.clientId}-faq-${i}-question`}
                label="Question"
                value={item.question}
                onChange={(v) => {
                  const next = [...(payload.items ?? [])]
                  if (next[i]) next[i] = { ...next[i], question: v }
                  updateBlock(index, { ...payload, items: next })
                }}
                className="rounded-2xl border-stone-200 dark:border-stone-700"
              />
              <Textarea
                id={`block-${block.clientId}-faq-${i}-answer`}
                label="Answer"
                value={item.answer}
                onChange={(v) => {
                  const next = [...(payload.items ?? [])]
                  if (next[i]) next[i] = { ...next[i], answer: v }
                  updateBlock(index, { ...payload, items: next })
                }}
                rows={3}
                className="rounded-2xl border-stone-200 dark:border-stone-700"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() =>
              updateBlock(index, { ...payload, items: [...(payload.items ?? []), { question: '', answer: '' }] })
            }
          >
            <Plus className="h-4 w-4" /> Add question
          </Button>
        </div>
      </div>
    )
  }

  if (block.type === 'image') {
    const payload = block.payload as ImagePayload
    const previewSrc = imageDisplayUrl(payload.imageUrl)
    return (
      <div className="space-y-4">
        <Input
          id={`block-${block.clientId}-image-url`}
          label="Image URL"
          value={payload.imageUrl}
          onChange={(value) => updateBlock(index, { ...payload, imageUrl: value })}
          placeholder="https://example.com/image.jpg or use placeholder below"
          className={inputClass}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full border-stone-200 px-4 dark:border-stone-700"
            onClick={() => updateBlock(index, { ...payload, imageUrl: PLACEHOLDER_IMAGE_URL })}
          >
            Use placeholder image
          </Button>
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
        </div>
        <Input
          id={`block-${block.clientId}-image-alt`}
          label="Alt text"
          value={payload.alt}
          onChange={(value) => updateBlock(index, { ...payload, alt: value })}
          placeholder="Describe the image for accessibility"
          className={inputClass}
        />
        <Textarea
          id={`block-${block.clientId}-image-caption`}
          label="Caption (optional)"
          value={payload.caption ?? ''}
          onChange={(value) => updateBlock(index, { ...payload, caption: value })}
          placeholder="Optional caption below the image"
          rows={2}
          className={inputClass}
        />
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/40">
          <img src={previewSrc} alt={payload.alt || 'Preview'} className="max-h-80 w-full object-cover" />
        </div>
      </div>
    )
  }

  if (block.type === 'feature_grid') {
    const payload = block.payload as FeatureGridPayload
    return (
      <div className="space-y-4">
        <Input
          id={`block-${block.clientId}-grid-heading`}
          label="Heading"
          value={payload.heading ?? ''}
          onChange={(value) => updateBlock(index, { ...payload, heading: value })}
          placeholder="e.g. How it works"
          className={inputClass}
        />
        <Input
          id={`block-${block.clientId}-grid-subheading`}
          label="Subheading"
          value={payload.subheading ?? ''}
          onChange={(value) => updateBlock(index, { ...payload, subheading: value })}
          placeholder="Optional section subtitle"
          className={inputClass}
        />
        <Select
          id={`block-${block.clientId}-grid-columns`}
          label="Columns"
          value={String(payload.columns ?? 3)}
          onChange={(value) => updateBlock(index, { ...payload, columns: Number(value) as 2 | 3 })}
          options={[
            { value: '2', label: '2 columns' },
            { value: '3', label: '3 columns' },
          ]}
          className={inputClass}
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
                  options={FEATURE_CARD_ICONS.map((option) => ({ value: option.value, label: option.label }))}
                  className={inputClass}
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
                  className={inputClass}
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
                    className={inputClass}
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
