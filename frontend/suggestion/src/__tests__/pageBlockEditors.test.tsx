import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { renderBlockFields } from '../pages/business-dashboard/pages/pageBlockEditors'
import { createEmptyBlock } from '../pages/business-dashboard/pages/pageBlockTypes'
import type { Block } from '../pages/business-dashboard/pages/pageBlockTypes'

const defaultOptions = {
  updateBlock: jest.fn(),
  formOptions: [{ value: 'f1', label: 'Form 1' }],
  setUploadTarget: jest.fn(),
}

function renderFields(block: Block, index = 0) {
  return render(
    <div>
      {renderBlockFields(block, index, defaultOptions)}
    </div>,
  )
}

describe('pageBlockEditors', () => {
  beforeEach(() => {
    defaultOptions.updateBlock.mockClear()
    defaultOptions.setUploadTarget.mockClear()
  })

  describe('heading', () => {
    it('calls updateBlock for level, align, and text', () => {
      const block = createEmptyBlock('heading')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/^Level$/i), { target: { value: '1' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ level: 1 }))

      fireEvent.change(screen.getByLabelText(/^Alignment$/i), { target: { value: 'right' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ align: 'right' }))

      fireEvent.change(screen.getByLabelText(/^Text$/i), { target: { value: 'My Heading' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ text: 'My Heading' }))
    })
  })

  describe('paragraph', () => {
    it('calls updateBlock for align and text', () => {
      const block = createEmptyBlock('paragraph')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/^Alignment$/i), { target: { value: 'center' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ align: 'center' }))

      fireEvent.change(screen.getByLabelText(/^Paragraph$/i), { target: { value: 'Body text' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ text: 'Body text' }))
    })
  })

  describe('form', () => {
    it('calls updateBlock when form is selected', () => {
      const block = createEmptyBlock('form')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/select form/i), { target: { value: 'f1' } })
      expect(defaultOptions.updateBlock).toHaveBeenCalledWith(0, expect.objectContaining({ formId: 'f1' }))
    })
  })

  describe('hero', () => {
    it('calls updateBlock for headline, subheadline, badge, variant, style, mediaType', () => {
      const block = createEmptyBlock('hero')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/^Headline$/i), { target: { value: 'Welcome' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ headline: 'Welcome' }))

      fireEvent.change(screen.getByLabelText(/^Subheadline$/i), { target: { value: 'Sub' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ subheadline: 'Sub' }))

      fireEvent.change(screen.getByLabelText(/badge/i), { target: { value: 'New' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ badge: 'New' }))

      fireEvent.change(screen.getByLabelText(/^Layout$/i), { target: { value: 'splitReversed' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ variant: 'splitReversed' }))

      fireEvent.change(screen.getByLabelText(/^Style$/i), { target: { value: 'minimal' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ style: 'minimal' }))

      fireEvent.change(screen.getByLabelText(/hero media/i), { target: { value: 'image' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ mediaType: 'image' }))
    })

    it('when mediaType is image: URL, placeholder button, upload button, alt', () => {
      const block = createEmptyBlock('hero')
      ;(block.payload as { mediaType?: string }).mediaType = 'image'
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/hero image url/i), { target: { value: 'https://example.com/h.png' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ imageUrl: 'https://example.com/h.png' }))

      fireEvent.click(screen.getByRole('button', { name: /use placeholder image/i }))
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ imageUrl: expect.any(String) }))

      fireEvent.click(screen.getByRole('button', { name: /upload.*crop.*hero/i }))
      expect(defaultOptions.setUploadTarget).toHaveBeenCalledWith({ blockClientId: block.clientId, type: 'hero_image' })

      fireEvent.change(screen.getByLabelText(/hero image alt/i), { target: { value: 'Hero alt' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ imageAlt: 'Hero alt' }))
    })

    it('when mediaType is icon: icon select', () => {
      const block = createEmptyBlock('hero')
      ;(block.payload as { mediaType?: string }).mediaType = 'icon'
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/hero icon/i), { target: { value: 'share2' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ icon: 'share2' }))
    })

    it('calls updateBlock for primaryCta and secondaryCta label/href', () => {
      const block = createEmptyBlock('hero')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/primary CTA label/i), { target: { value: 'Get started' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        primaryCta: expect.objectContaining({ label: 'Get started' }),
      }))

      fireEvent.change(screen.getByLabelText(/primary CTA link/i), { target: { value: '/signup' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        primaryCta: expect.objectContaining({ href: '/signup' }),
      }))

      fireEvent.change(screen.getByLabelText(/secondary CTA label/i), { target: { value: 'Log in' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        secondaryCta: expect.objectContaining({ label: 'Log in' }),
      }))

      fireEvent.change(screen.getByLabelText(/secondary CTA link/i), { target: { value: '/login' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        secondaryCta: expect.objectContaining({ href: '/login' }),
      }))
    })
  })

  describe('feature_card', () => {
    it('calls updateBlock for icon, title, description', () => {
      const block = createEmptyBlock('feature_card')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/^Icon$/i), { target: { value: 'share2' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ icon: 'share2' }))

      fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: 'Feature' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ title: 'Feature' }))

      fireEvent.change(screen.getByLabelText(/^Description$/i), { target: { value: 'Desc' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ description: 'Desc' }))
    })
  })

  describe('cta', () => {
    it('calls updateBlock for variant, text, ctaLabel, ctaHref, secondaryCta', () => {
      const block = createEmptyBlock('cta')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/^Variant$/i), { target: { value: 'banner' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ variant: 'banner' }))

      fireEvent.change(screen.getByLabelText(/^Text$/i), { target: { value: 'Sign up now' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ text: 'Sign up now' }))

      fireEvent.change(screen.getByLabelText('Button label'), { target: { value: 'Go' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ ctaLabel: 'Go' }))

      fireEvent.change(screen.getByLabelText('Button link'), { target: { value: '/go' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ ctaHref: '/go' }))

      fireEvent.change(screen.getByLabelText(/Secondary button label/), { target: { value: 'Contact' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        secondaryCta: expect.objectContaining({ label: 'Contact' }),
      }))

      fireEvent.change(screen.getByLabelText('Secondary button link'), { target: { value: '/contact' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        secondaryCta: expect.objectContaining({ href: '/contact' }),
      }))
    })
  })

  describe('stats', () => {
    it('calls updateBlock for showDividers, stat value/label, add stat, remove stat', () => {
      const block = createEmptyBlock('stats')
      renderFields(block)

      const checkbox = screen.getByLabelText(/show dividers/i)
      fireEvent.click(checkbox)
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ showDividers: false }))

      fireEvent.change(screen.getByLabelText(/^Value$/i), { target: { value: '10k' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        stats: expect.arrayContaining([expect.objectContaining({ value: '10k' })]),
      }))

      fireEvent.change(screen.getByLabelText(/^Label$/i), { target: { value: 'Users' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        stats: expect.arrayContaining([expect.objectContaining({ label: 'Users' })]),
      }))

      fireEvent.click(screen.getByRole('button', { name: /add stat/i }))
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        stats: expect.any(Array),
      }))

      fireEvent.click(screen.getByRole('button', { name: /remove stat/i }))
      expect(defaultOptions.updateBlock).toHaveBeenCalled()
    })
  })

  describe('testimonials', () => {
    it('calls updateBlock for heading, subheading, layout, quote, name, role, add/remove', () => {
      const block = createEmptyBlock('testimonials')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/^Heading$/i), { target: { value: 'Testimonials' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ heading: 'Testimonials' }))

      fireEvent.change(screen.getByLabelText(/^Subheading$/i), { target: { value: 'Sub' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ subheading: 'Sub' }))

      fireEvent.change(screen.getByLabelText(/^Layout$/i), { target: { value: 'single' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ layout: 'single' }))

      fireEvent.change(screen.getByLabelText(/^Quote$/i), { target: { value: 'Great product' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        testimonials: expect.arrayContaining([expect.objectContaining({ quote: 'Great product' })]),
      }))

      fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: 'Alice' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        testimonials: expect.arrayContaining([expect.objectContaining({ name: 'Alice' })]),
      }))

      fireEvent.change(screen.getByLabelText(/^Role$/i), { target: { value: 'CEO' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        testimonials: expect.arrayContaining([expect.objectContaining({ role: 'CEO' })]),
      }))

      fireEvent.click(screen.getByRole('button', { name: /add testimonial/i }))
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        testimonials: expect.any(Array),
      }))

      fireEvent.click(screen.getByRole('button', { name: /remove/i }))
      expect(defaultOptions.updateBlock).toHaveBeenCalled()
    })
  })

  describe('pricing', () => {
    it('calls updateBlock for heading, subheading, plan name/price/period/features/cta/highlighted, add/remove plan', () => {
      const block = createEmptyBlock('pricing')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/^Heading$/i), { target: { value: 'Pricing' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ heading: 'Pricing' }))

      fireEvent.change(screen.getByLabelText(/^Subheading$/i), { target: { value: 'Plans' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ subheading: 'Plans' }))

      fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: 'Pro' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        plans: expect.arrayContaining([expect.objectContaining({ name: 'Pro' })]),
      }))

      fireEvent.change(screen.getByLabelText(/^Price$/i), { target: { value: '$29' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        plans: expect.arrayContaining([expect.objectContaining({ price: '$29' })]),
      }))

      fireEvent.change(screen.getByLabelText(/^Period$/i), { target: { value: 'per month' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        plans: expect.arrayContaining([expect.objectContaining({ period: 'per month' })]),
      }))

      fireEvent.change(screen.getByLabelText(/features/i), { target: { value: 'Feature 1\nFeature 2' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        plans: expect.arrayContaining([expect.objectContaining({ features: ['Feature 1', 'Feature 2'] })]),
      }))

      fireEvent.change(screen.getByLabelText(/CTA label/i), { target: { value: 'Get started' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        plans: expect.arrayContaining([expect.objectContaining({ cta: expect.objectContaining({ label: 'Get started' }) })]),
      }))

      fireEvent.change(screen.getByLabelText(/CTA href/i), { target: { value: '/signup' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        plans: expect.arrayContaining([expect.objectContaining({ cta: expect.objectContaining({ href: '/signup' }) })]),
      }))

      fireEvent.click(screen.getByLabelText(/highlight/i))
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        plans: expect.arrayContaining([expect.objectContaining({ highlighted: true })]),
      }))

      fireEvent.click(screen.getByRole('button', { name: /add plan/i }))
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        plans: expect.any(Array),
      }))

      fireEvent.click(screen.getByRole('button', { name: /remove/i }))
      expect(defaultOptions.updateBlock).toHaveBeenCalled()
    })
  })

  describe('faq', () => {
    it('calls updateBlock for heading, subheading, question, answer, add/remove item', () => {
      const block = createEmptyBlock('faq')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/^Heading$/i), { target: { value: 'FAQ' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ heading: 'FAQ' }))

      fireEvent.change(screen.getByLabelText(/^Subheading$/i), { target: { value: 'Answers' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ subheading: 'Answers' }))

      fireEvent.change(screen.getByLabelText(/^Question$/i), { target: { value: 'What is it?' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ question: 'What is it?' })]),
      }))

      fireEvent.change(screen.getByLabelText(/^Answer$/i), { target: { value: 'Something' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ answer: 'Something' })]),
      }))

      fireEvent.click(screen.getByRole('button', { name: /add question/i }))
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        items: expect.any(Array),
      }))

      fireEvent.click(screen.getByRole('button', { name: /remove/i }))
      expect(defaultOptions.updateBlock).toHaveBeenCalled()
    })
  })

  describe('image', () => {
    it('calls updateBlock for imageUrl, alt, caption; placeholder and setUploadTarget for buttons', () => {
      const block = createEmptyBlock('image')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/image url/i), { target: { value: 'https://example.com/img.png' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ imageUrl: 'https://example.com/img.png' }))

      fireEvent.click(screen.getByRole('button', { name: /use placeholder image/i }))
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ imageUrl: expect.any(String) }))

      fireEvent.click(screen.getByRole('button', { name: /upload.*crop.*image/i }))
      expect(defaultOptions.setUploadTarget).toHaveBeenCalledWith({ blockClientId: block.clientId, type: 'image' })

      fireEvent.change(screen.getByLabelText(/alt text/i), { target: { value: 'Alt' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ alt: 'Alt' }))

      fireEvent.change(screen.getByLabelText(/caption/i), { target: { value: 'Caption' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ caption: 'Caption' }))
    })
  })

  describe('feature_grid', () => {
    it('calls updateBlock for heading, subheading, columns, item icon/title/description, add/remove item', () => {
      const block = createEmptyBlock('feature_grid')
      renderFields(block)

      fireEvent.change(screen.getByLabelText(/^Heading$/i), { target: { value: 'Features' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ heading: 'Features' }))

      fireEvent.change(screen.getByLabelText(/^Subheading$/i), { target: { value: 'Sub' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ subheading: 'Sub' }))

      fireEvent.change(screen.getByLabelText(/^Columns$/i), { target: { value: '2' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({ columns: 2 }))

      fireEvent.change(screen.getByLabelText(/^Icon$/i), { target: { value: 'share2' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ icon: 'share2' })]),
      }))

      fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: 'Item 1' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ title: 'Item 1' })]),
      }))

      fireEvent.change(screen.getByLabelText(/^Description$/i), { target: { value: 'Desc' } })
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ description: 'Desc' })]),
      }))

      fireEvent.click(screen.getByRole('button', { name: /add item/i }))
      expect(defaultOptions.updateBlock).toHaveBeenLastCalledWith(0, expect.objectContaining({
        items: expect.any(Array),
      }))

      fireEvent.click(screen.getByRole('button', { name: /remove item 1/i }))
      expect(defaultOptions.updateBlock).toHaveBeenCalled()
    })
  })
})
