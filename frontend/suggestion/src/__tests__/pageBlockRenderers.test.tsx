import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { renderBlockPreview } from '../pages/business-dashboard/pages/pageBlockRenderers'
import type { Block } from '../pages/business-dashboard/pages/pageBlockTypes'

jest.mock('../pages/feedback-form-render/EmbeddedFormBlock', () => {
  return function MockEmbeddedFormBlock({ formId }: { formId: string }) {
    return <span data-testid="embedded-form">Form: {formId}</span>
  }
})

function renderPreview(block: Block) {
  return render(
    <MemoryRouter>
      <div>{renderBlockPreview(block)}</div>
    </MemoryRouter>,
  )
}

describe('pageBlockRenderers', () => {
  const clientId = 'test-block'

  describe('renderBlockPreview', () => {
    describe('paragraph', () => {
      it('applies align right class when align is right', () => {
        renderPreview({
          clientId,
          type: 'paragraph',
          payload: { text: 'Some text', align: 'right' },
        })
        const p = screen.getByText('Some text')
        expect(p).toHaveClass('text-right')
      })

      it('applies align center class when align is center', () => {
        renderPreview({
          clientId,
          type: 'paragraph',
          payload: { text: 'Centered', align: 'center' },
        })
        const p = screen.getByText('Centered')
        expect(p).toHaveClass('text-center')
      })

      it('applies text-left when align is left', () => {
        renderPreview({
          clientId,
          type: 'paragraph',
          payload: { text: 'Left', align: 'left' },
        })
        const p = screen.getByText('Left')
        expect(p).toHaveClass('text-left')
      })
    })

    describe('hero', () => {
      it('passes secondaryCta when label and href present', () => {
        renderPreview({
          clientId,
          type: 'hero',
          payload: {
            headline: 'Hero',
            subheadline: 'Sub',
            primaryCta: { label: 'Primary', href: '/a' },
            secondaryCta: { label: 'Secondary', href: '/b' },
          },
        })
        expect(screen.getByRole('heading', { name: /hero/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /secondary/i })).toHaveAttribute('href', '/b')
      })
    })

    describe('stats', () => {
      it('renders StatsBar with showDividers false', () => {
        renderPreview({
          clientId,
          type: 'stats',
          payload: {
            stats: [{ value: '10k', label: 'Users' }],
            showDividers: false,
          },
        })
        expect(screen.getByText('10k')).toBeInTheDocument()
        expect(screen.getByText('Users')).toBeInTheDocument()
      })

      it('shows empty state when no stats', () => {
        renderPreview({
          clientId,
          type: 'stats',
          payload: { stats: [] },
        })
        expect(screen.getByText(/add stats/i)).toBeInTheDocument()
      })
    })

    describe('testimonials', () => {
      it('shows empty state when no testimonials', () => {
        renderPreview({
          clientId,
          type: 'testimonials',
          payload: { testimonials: [] },
        })
        expect(screen.getByText(/add testimonials/i)).toBeInTheDocument()
      })

      it('renders TestimonialSection with layout', () => {
        renderPreview({
          clientId,
          type: 'testimonials',
          payload: {
            heading: 'Testimonials',
            layout: 'grid',
            testimonials: [{ quote: 'Great', name: 'Alice', role: 'User' }],
          },
        })
        expect(screen.getByText(/Great/)).toBeInTheDocument()
        expect(screen.getByText('Alice')).toBeInTheDocument()
      })
    })

    describe('pricing', () => {
      it('shows empty state when no plans', () => {
        renderPreview({
          clientId,
          type: 'pricing',
          payload: { plans: [] },
        })
        expect(screen.getByText(/add pricing plans/i)).toBeInTheDocument()
      })

      it('renders PricingSection when plans present', () => {
        renderPreview({
          clientId,
          type: 'pricing',
          payload: {
            heading: 'Pricing',
            plans: [{ name: 'Pro', price: '$9', features: [], cta: { label: 'Get', href: '#' } }],
          },
        })
        expect(screen.getByText('Pro')).toBeInTheDocument()
      })
    })

    describe('faq', () => {
      it('shows empty state when no items', () => {
        renderPreview({
          clientId,
          type: 'faq',
          payload: { items: [] },
        })
        expect(screen.getByText(/add faq items/i)).toBeInTheDocument()
      })

      it('renders FAQSection when items present', () => {
        renderPreview({
          clientId,
          type: 'faq',
          payload: {
            heading: 'FAQ',
            items: [{ question: 'Q?', answer: 'A' }],
          },
        })
        expect(screen.getByText('Q?')).toBeInTheDocument()
        expect(screen.getByText('A')).toBeInTheDocument()
      })
    })

    describe('image', () => {
      it('renders figcaption when caption is present', () => {
        renderPreview({
          clientId,
          type: 'image',
          payload: { imageUrl: 'https://example.com/img.png', alt: 'Alt', caption: 'A caption' },
        })
        expect(screen.getByText('A caption')).toBeInTheDocument()
        const fig = document.querySelector('figcaption')
        expect(fig).toHaveTextContent('A caption')
      })
    })
  })
})
